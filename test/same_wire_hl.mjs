#!/usr/bin/env node
/**
 * Same-wire highlight: selecting a pin lights the matching pin in yellow (.hl)
 * on every ficha of that wire (device, intermediate, F102 panel).
 *
 * Relacionados (default Tierras + Datos) must not demote those same-wire pins
 * to the related style (.hl-group). Partner circuits stay .hl-group.
 *
 * Shared sensor grounds (ECM 66/67/78…): a ground click on one component lights
 * only that component's own ground path, not every other sensor on the net.
 * Clicking the ECM ground pin itself may light the whole net.
 *
 * Source of truth: test/fsm_ecm_routes.json, limited to cavities that exist
 * in the rendered default car (VQ35DE, M/T, Completo).
 */
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const require = createRequire(import.meta.url);

function loadPuppeteer() {
  const candidates = [
    path.join(root, 'node_modules/puppeteer-core'),
    path.join(process.env.TEMP || '/tmp', 'z33-verify/node_modules/puppeteer-core'),
    '/tmp/z33-verify/node_modules/puppeteer-core',
  ];
  for (const dir of candidates) {
    try { return require(dir); } catch (e) { /* next */ }
  }
  return require('puppeteer-core');
}
function findChrome() {
  for (const p of [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ].filter(Boolean)) if (fs.existsSync(p)) return p;
  throw new Error('Chrome/Edge not found');
}

const routes = JSON.parse(fs.readFileSync(path.join(root, 'test/fsm_ecm_routes.json'), 'utf8'));
const pinsTable = routes.pins || routes;

function routeWires() {
  const wires = [];
  for (const [ecm, rec] of Object.entries(pinsTable)) {
    if (!rec || typeof rec !== 'object' || !Array.isArray(rec.branches)) continue;
    const branches = rec.branches.map((br, i) => {
      const stops = [];
      const add = (map, cav) => {
        if (map && cav != null && cav !== '') stops.push({ cid: String(map), cav: String(cav) });
      };
      for (const hop of br.route || []) add(hop.map, hop.cav);
      if (br.end) add(br.end.map, br.end.cav);
      const seen = new Set();
      const uniq = [];
      for (const s of stops) {
        const k = s.cid + '·' + s.cav;
        if (seen.has(k)) continue;
        seen.add(k);
        uniq.push(s);
      }
      const endCid = br.end && br.end.map ? String(br.end.map) : null;
      const endIsDevice = !!(br.end && (br.end.type === 'device' || (endCid && !String(endCid).startsWith('ix_') && endCid !== 'ix_f102_m72')));
      const applies = br.applies || (br.end && br.end.applies) || rec.applies || 'all';
      return { i, stops: uniq, endCid, endCav: br.end && br.end.cav != null ? String(br.end.cav) : null, endIsDevice, applies };
    });
    const all = [];
    const seen = new Set();
    for (const br of branches) {
      for (const s of br.stops) {
        const k = s.cid + '·' + s.cav;
        if (seen.has(k)) continue;
        seen.add(k);
        all.push(s);
      }
    }
    const deviceEnds = branches.filter((b) => b.endIsDevice && b.endCid && b.endCav).map((b) => ({ cid: b.endCid, cav: b.endCav }));
    wires.push({
      ecm: String(ecm),
      rail: rec.rail || null,
      sensorReturn: !!rec.sensor_return,
      sharedGnd: (rec.rail === 'gnd' || rec.sensor_return) && new Set(deviceEnds.map((d) => d.cid + '·' + d.cav)).size > 1,
      function: rec.function || '',
      branches,
      stops: all,
      deviceEnds,
    });
  }
  return wires;
}

let pass = 0;
const fails = [];
const ok = (name, cond, detail = '') => {
  if (cond) { pass++; console.log('  ok  ' + name); }
  else { fails.push(name + (detail ? ' — ' + detail : '')); console.log('  FAIL ' + name + (detail ? ' — ' + detail : '')); }
};

const puppeteer = loadPuppeteer();
const browser = await puppeteer.launch({
  executablePath: findChrome(),
  headless: true,
  args: ['--no-sandbox', '--disable-gpu'],
});
const page = await browser.newPage();
await page.goto(pathToFileURL(path.join(root, 'index.html')).href, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('#blocks .pin[data-pin="82"]');
await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForSelector('#blocks .pin[data-pin="82"]');
await page.evaluate(() => {
  const set = (id, v) => {
    const el = document.getElementById(id);
    if (el && el.checked !== !!v) { el.checked = !!v; el.dispatchEvent(new Event('change', { bubbles: true })); }
  };
  set('railRelGnd', true);
  set('railRelPower', false);
  set('railRelData', true);
  const g = document.getElementById('relGroup');
  if (g && g.value !== 'ficha') { g.value = 'ficha'; g.dispatchEvent(new Event('change', { bubbles: true })); }
});

const present = await page.evaluate(() => {
  const hasCav = (cid, cav) => {
    if (cid === 'ix_f102_m72') {
      if (document.querySelector(`#f102Blocks .pin[data-cav="${CSS.escape(String(cav))}"]`)) return true;
    }
    return !!document.querySelector(`.cav-hit[data-conn="${CSS.escape(String(cid))}"][data-cav="${CSS.escape(String(cav))}"]`);
  };
  const ecmPins = new Set([...document.querySelectorAll('#blocks .pin[data-pin]')].map((e) => String(e.dataset.pin)));
  return { hasCav, ecmPins: [...ecmPins] };
});
/* hasCav cannot be returned from the page; re-query per wire in Node via evaluate. */
const ecmPresent = new Set(present.ecmPins);

async function pinEcmOf(cid, cav) {
  return page.evaluate((cid, cav) => {
    const conf = (typeof CONN !== 'undefined' && CONN[cid]) || (typeof CONN_BASE !== 'undefined' && CONN_BASE[cid]);
    const pin = (conf && conf.pins || []).find((p) => String(p.id) === String(cav));
    return (pin && pin.ecm != null && pin.ecm !== '') ? String(pin.ecm) : null;
  }, cid, cav);
}

async function stopExists(cid, cav) {
  return page.evaluate((cid, cav) => {
    const conf = (typeof CONN !== 'undefined' && CONN[cid]) || (typeof CONN_BASE !== 'undefined' && CONN_BASE[cid]);
    const pin = (conf && conf.pins || []).find((p) => String(p.id) === String(cav));
    if (pin && (pin.transOff || pin.vifOff)) return false;
    if (cid === 'ix_f102_m72') {
      const fp = document.querySelector(`#f102Blocks .pin[data-cav="${CSS.escape(String(cav))}"]`);
      if (fp && (fp.classList.contains('opt-off') || fp.dataset.transOff || fp.dataset.optOff)) return false;
      if (fp) return true;
    }
    const el = document.querySelector(`.cav-hit[data-conn="${CSS.escape(String(cid))}"][data-cav="${CSS.escape(String(cav))}"]`);
    if (!el) return false;
    if (el.classList.contains('opt-off') || el.classList.contains('cav-opt-off') || el.dataset.transOff || el.dataset.optOff) return false;
    return true;
  }, cid, cav);
}

async function clickAndRead(target) {
  return page.evaluate((target) => {
    if (typeof clearSelection === 'function') clearSelection();
    if (target.kind === 'ecm') {
      const el = document.querySelector(`#blocks .pin[data-pin="${target.ecm}"]`);
      if (!el) return { missing: true };
      el.click();
    } else if (target.cid === 'ix_f102_m72') {
      const fp = document.querySelector(`#f102Blocks .pin[data-cav="${CSS.escape(String(target.cav))}"]`);
      if (fp) fp.click();
      else {
        const cav = document.querySelector(`.cav-hit[data-conn="ix_f102_m72"][data-cav="${CSS.escape(String(target.cav))}"]`);
        if (!cav) return { missing: true };
        cav.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      }
    } else {
      const cav = document.querySelector(`.cav-hit[data-conn="${CSS.escape(String(target.cid))}"][data-cav="${CSS.escape(String(target.cav))}"]`);
      if (!cav) return { missing: true };
      cav.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    }
    const key = (e) => e.dataset.conn + '·' + e.dataset.cav;
    const yellow = new Set([...document.querySelectorAll('.cav-hit.hl')].map(key));
    const related = new Set([...document.querySelectorAll('.cav-hit.hl-group, .cav-hit.hl-end')].map(key));
    for (const fp of document.querySelectorAll('#f102Blocks .pin[data-cav]')) {
      const k = 'ix_f102_m72·' + fp.dataset.cav;
      if (fp.classList.contains('hl')) yellow.add(k);
      else if (fp.classList.contains('hl-group') || fp.classList.contains('hl-end')) related.add(k);
    }
    const ecmYellow = [...document.querySelectorAll('#blocks .pin.hl')].map((e) => e.dataset.pin);
    return { yellow: [...yellow], related: [...related], ecmYellow };
  }, target);
}

const allWires = routeWires();
const usable = [];
for (const w of allWires) {
  if (!ecmPresent.has(w.ecm)) continue;
  const visibleStops = [];
  for (const s of w.stops) {
    if (await stopExists(s.cid, s.cav)) visibleStops.push(s);
  }
  const visBranches = [];
  for (const br of w.branches) {
    if (br.applies && br.applies !== 'all' && br.applies !== 'mt') continue;
    const stops = [];
    for (const s of br.stops) {
      if (await stopExists(s.cid, s.cav)) stops.push(s);
    }
    visBranches.push({ ...br, stops });
  }
  const visStops = [];
  const seenV = new Set();
  for (const br of visBranches) {
    for (const s of br.stops) {
      const k = s.cid + '·' + s.cav;
      if (seenV.has(k)) continue;
      seenV.add(k);
      visStops.push(s);
    }
  }
  const tagged = [];
  for (const s of visStops) {
    const e = await pinEcmOf(s.cid, s.cav);
    tagged.push({ ...s, pinEcm: e });
  }
  /* Require yellow only on cavities that carry this ECM pin (or have no ECM tag).
     A shared splice tagged to another pin (IPDM E7·18 = ECM 119, also feeds 120) is not required. */
  const required = tagged.filter((s) => !s.pinEcm || s.pinEcm === w.ecm);
  const visBranchesTagged = [];
  for (const br of visBranches) {
    const stops = [];
    for (const s of br.stops) {
      const e = await pinEcmOf(s.cid, s.cav);
      const rec = { ...s, pinEcm: e };
      if (!rec.pinEcm || rec.pinEcm === w.ecm) stops.push(rec);
    }
    visBranchesTagged.push({ ...br, stops });
  }
  if (required.length < 2) continue;
  const multiBranch = visBranchesTagged.filter((b) => b.stops.length).length > 1;
  usable.push({ ...w, stops: required, branches: visBranchesTagged, multiBranch });
}

function branchesForStop(w, cid, cav) {
  return w.branches.filter((br) => br.stops.some((s) => s.cid === cid && s.cav === cav));
}

function expectedForClick(w, click) {
  if (click.kind === 'ecm') return w.stops;
  if (!(w.sharedGnd || w.multiBranch)) return w.stops;
  const brs = branchesForStop(w, click.cid, click.cav);
  const seen = new Set();
  const out = [];
  for (const br of brs.length ? brs : []) {
    for (const s of br.stops) {
      const k = s.cid + '·' + s.cav;
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(s);
    }
  }
  /* Ficha grouping: other cavities on the same clicked ficha that belong to this ECM ground may also light. */
  if (click.kind !== 'ecm') {
    for (const s of w.stops) {
      if (s.cid === click.cid) {
        const k = s.cid + '·' + s.cav;
        if (!seen.has(k)) { seen.add(k); out.push(s); }
      }
    }
  }
  return out.length ? out : w.stops;
}

function forbiddenDeviceEnds(w, click, expected) {
  if (!w.sharedGnd || click.kind === 'ecm') return [];
  const exp = new Set(expected.map((s) => s.cid + '·' + s.cav));
  return w.deviceEnds.filter((d) => {
    if (d.cid === click.cid) return false;
    return !exp.has(d.cid + '·' + d.cav);
  });
}

const clickCases = [];
for (const w of usable) {
  clickCases.push({ w, click: { kind: 'ecm', ecm: w.ecm }, label: `ECM ${w.ecm}` });
  for (const s of w.stops) {
    clickCases.push({ w, click: { kind: 'cav', cid: s.cid, cav: s.cav, ecm: w.ecm }, label: `${s.cid}·${s.cav} (ECM ${w.ecm})` });
  }
}

const failedClicks = [];
const failedWires = new Set();
const passedClicks = [];
for (const { w, click, label } of clickCases) {
  const r = await clickAndRead(click);
  if (r.missing) {
    failedClicks.push({ label, reason: 'click target missing' });
    failedWires.add(w.ecm);
    continue;
  }
  if (click.kind === 'cav') {
    const ecmLit = (r.ecmYellow || []).includes(w.ecm);
    const other = (r.ecmYellow || []).filter((n) => n !== w.ecm);
    if (!ecmLit && other.length) {
      /* Shared splice (IPDM E7·18 feeds both ECM 119 and 120): the page picked the other pin. */
      const sharedWithOther = usable.some((w2) => w2.ecm !== w.ecm && other.includes(w2.ecm)
        && w2.stops.some((s) => s.cid === click.cid && s.cav === click.cav));
      if (sharedWithOther) continue;
    }
  }
  const expected = expectedForClick(w, click);
  const yellow = new Set(r.yellow);
  const missing = expected.filter((s) => !yellow.has(s.cid + '·' + s.cav));
  const forbidden = forbiddenDeviceEnds(w, click, expected).filter((d) => yellow.has(d.cid + '·' + d.cav) || (r.related || []).includes(d.cid + '·' + d.cav));
  const ecmLit = (r.ecmYellow || []).includes(w.ecm);
  const problems = [];
  if (missing.length) problems.push('not yellow: ' + missing.map((s) => s.cid + '·' + s.cav).join(', '));
  if (forbidden.length) problems.push('shared-gnd leak: ' + forbidden.map((s) => s.cid + '·' + s.cav).join(', '));
  if (!ecmLit) problems.push('ECM ' + w.ecm + ' not yellow');
  if (problems.length) {
    failedClicks.push({ label, problems, yellow: r.yellow, ecmYellow: r.ecmYellow });
    failedWires.add(w.ecm);
  } else {
    passedClicks.push(label);
  }
}

console.log(`Same-wire highlight: ${usable.length} wires with 2+ fichas, ${clickCases.length} click cases`);
ok(
  'every same-wire click lights the pin on every ficha of that wire (yellow .hl)',
  failedClicks.length === 0,
  failedClicks.length
    ? `${failedClicks.length}/${clickCases.length} clicks failed on ECM pins ${[...failedWires].join(',')}. First: ${JSON.stringify(failedClicks[0]).slice(0, 400)}`
    : `${passedClicks.length} clicks`
);

/* Explicit APP E113 ↔ ECM pairs (both directions) plus one non-APP control. */
const APP_PAIRS = [
  { ecm: '90', app: '6', ix: '10', name: 'APP1 5V' },
  { ecm: '82', app: '3', ix: '4', name: 'APP1 GND' },
  { ecm: '106', app: '5', ix: '5', name: 'APP1 SIG' },
  { ecm: '91', app: '4', ix: '9', name: 'APP2 5V' },
  { ecm: '83', app: '1', ix: '2', name: 'APP2 GND' },
  { ecm: '98', app: '2', ix: '3', name: 'APP2 SIG' },
];
for (const p of APP_PAIRS) {
  for (const click of [
    { kind: 'ecm', ecm: p.ecm, label: `ECM ${p.ecm}` },
    { kind: 'cav', cid: 'app', cav: p.app, ecm: p.ecm, label: `app·${p.app}` },
    { kind: 'cav', cid: 'ix_e11_f2', cav: p.ix, ecm: p.ecm, label: `E11/F2·${p.ix}` },
  ]) {
    const r = await clickAndRead(click);
    const yellow = new Set(r.yellow || []);
    const need = [`app·${p.app}`, `ix_e11_f2·${p.ix}`];
    const miss = need.filter((k) => !yellow.has(k));
    const ecmLit = (r.ecmYellow || []).includes(p.ecm);
    ok(
      `${p.name}: ${click.label} → yellow on E113·${p.app} and E11/F2·${p.ix} and ECM ${p.ecm}`,
      !r.missing && miss.length === 0 && ecmLit,
      r.missing ? 'missing' : (`miss ${miss.join(',') || 'none'}; ecmY=${(r.ecmYellow || []).join(',')}; y=${[...yellow].join(',')}`)
    );
  }
}

const ctrl = await clickAndRead({ kind: 'cav', cid: 'etc', cav: '5', ecm: '66' });
ok(
  'control (ETC ground): etc·5 click yellows ECM 66 and does not light other sensor grounds (ect·2 / maf·3)',
  !ctrl.missing
    && (ctrl.ecmYellow || []).includes('66')
    && (ctrl.yellow || []).includes('etc·5')
    && !(ctrl.yellow || []).includes('ect·2')
    && !(ctrl.yellow || []).includes('maf·3')
    && !(ctrl.related || []).includes('ect·2')
    && !(ctrl.related || []).includes('maf·3'),
  JSON.stringify(ctrl).slice(0, 400)
);

await browser.close();

const summary = {
  wires: usable.length,
  clickCases: clickCases.length,
  passedClicks: passedClicks.length,
  failedClicks: failedClicks.length,
  failedWires: [...failedWires],
  failed: failedClicks,
};
fs.writeFileSync('/tmp/same_wire_hl_result.json', JSON.stringify(summary, null, 2));
console.log(`---\nsame_wire_hl: ${pass} passed, ${fails.length} failed`);
console.log(`click cases: ${passedClicks.length} ok, ${failedClicks.length} failed, wires failed: ${[...failedWires].join(',') || 'none'}`);
if (fails.length) process.exit(1);
