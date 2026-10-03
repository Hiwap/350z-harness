#!/usr/bin/env node
/**
 * Selection sweep: every ECM pin × every view-option combination, plus every ficha cavity.
 *  ECM pins (FSM table, non-pending, per model / transmission) × Relacionados Tierras/Alim./Datos (8 combos)
 *  × grouping Ficha / Sensor (2):
 *   1. the pin's own FSM route (test/fsm_ecm_routes.json) is lit
 *   2. the circuit data: every path cavity of the pin's circuits is lit; 12V/GND rail-only path cavities only
 *      with Alim. (knock shield excepted, EC-317)
 *   3. rail partners of the device at the route end (12V feed cavity of a sensor / actuator, e.g. VTC B2 F26·2,
 *      coil ·3, injector ·1, EVAP F5·1, CKP F10·1): lit with Alim. (Ficha: always; Sensor: same channel) and
 *      connected to a lit IPDM / fuse / feed card when the circuit draws one; dark without Alim.
 *   4. ECM siblings on that device: lit when their kind (Tierras / Alim. / Datos) is on (Ficha), never when off
 *  Every wired cavity of every visible ficha: clickable, lights itself and the whole path of its circuit; rail
 *  partners (12V / GND without ECM pin) included. Chassis grounds stay off ECM SIG clicks (fsm_sig_click gate d).
 *  Every circuit cavity click reaches another real connector (ECM / F102 pin or a non-pseudo card).
 *  Every cavity click leaves one short info line (≤ 140 chars, no extra blocks); the long text is in the card.
 */
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const require = createRequire(import.meta.url);
const TABLE = JSON.parse(fs.readFileSync(path.join(__dirname, 'fsm_ecm_routes.json'), 'utf8'));
function loadPuppeteer() {
  for (const dir of [path.join(root, 'node_modules/puppeteer-core'), path.join(process.env.TEMP || '/tmp', 'z33-verify/node_modules/puppeteer-core'), '/tmp/z33-verify/node_modules/puppeteer-core']) {
    try { return require(dir); } catch (e) { /* next */ }
  }
  return require('puppeteer-core');
}
function findChrome() {
  for (const p of [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser'].filter(Boolean)) if (fs.existsSync(p)) return p;
  throw new Error('Chrome/Edge not found');
}
let pass = 0; const fails = [];
const ok = (name, cond, detail = '') => { if (cond) pass++; else { fails.push(name + (detail ? ' — ' + detail : '')); console.log('  FAIL ' + name + (detail ? ' — ' + detail : '')); } };

const puppeteer = loadPuppeteer();
const browser = await puppeteer.launch({ executablePath: findChrome(), headless: true, args: ['--no-sandbox', '--disable-gpu'] });
const UNCONNECTED = [
  'fuel_pump·3',                                                    /* ground point D105 not drawn (EC-710) */
  'ix_b1_m12·14J', 'ix_t2_b44·2', 'ix_t2_b44·4', 'ix_e108_m15·60G',  /* door / back door: switch, motor, BCM not drawn */
  'ix_b1_m12·17J', 'ix_b1_m12·18J', 'ix_b1_m12·21J', 'ix_b1_m12·22J', /* audio: radio M40/M41, speakers, amp not drawn */
  'ix_b1_m12·23J', 'ix_b1_m12·24J', 'ix_b1_m12·26J', 'ix_b1_m12·27J',
  'ix_b1_m12·29J', 'ix_b1_m12·30J', 'ix_b1_m12·31J', 'ix_b1_m12·32J', 'ix_e108_m15·1G',
  'ix_b1_m12·34J', 'ix_b1_m12·35J', 'ix_b1_m12·43J',                 /* seat belt buckles B8 / B11, airbag unit not drawn */
  'ix_b1_m12·44J', 'ix_e108_m15·9G',                                 /* parking brake B47 / brake fluid E44 switch, meter M19 not drawn */
  'ix_b1_m12·67J',                                                   /* power socket B36 not drawn */
  'ix_e108_m15·32G', 'ix_e108_m15·33G',                              /* ambient sensor E34 / A/C amp not drawn */
  'ix_e108_m15·5G', 'ix_e108_m15·8G',                                /* wiper / rear washer: FSM page names no end pin / not drawn */
  'ix_e108_m15·63G', 'ix_e108_m15·64G',                              /* A/T shift lock: AT-240 names no end terminal */
];
const t0 = Date.now();
let pinClicks = 0; let cavClicks = 0;
const SCEN = [['de_early', 'mt'], ['de_early', 'at'], ['de_revup', 'mt'], ['de_revup', 'at']].filter(([m, t]) => !process.env.REL_SWEEP_SCEN || process.env.REL_SWEEP_SCEN === m + '/' + t);
async function runScenario(model, trans) {
  const page = await browser.newPage();
  await page.goto(pathToFileURL(path.join(root, 'index.html')).href, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#blocks .pin[data-pin="66"]');
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#blocks .pin[data-pin="66"]');
  await page.evaluate(() => document.querySelectorAll('details').forEach((d) => { d.open = true; }));
  await page.select('#model', model);
  await page.select('#transView', trans);
  await page.waitForFunction((t) => transView() === t, {}, trans);
  const r = await page.evaluate((TABLE, model, trans, UNCONNECTED) => {
    const out = []; let nPin = 0; let nCav = 0; let nChecks = 0;
    const MC = (s) => (s.cav == null && s.map_cav ? s.map_cav : s.cav);
    const appl = (a) => !a || a === 'all' || (a === 'revup' && model === 'de_revup') || a === trans || (a === 'revup+mt' && model === 'de_revup' && trans === 'mt');
    const setChk = (id, v) => { const el = document.getElementById(id); if (el.checked !== !!v) { el.checked = !!v; el.dispatchEvent(new Event('change', { bubbles: true })); } };
    const setGrp = (v) => { const s = document.getElementById('relGroup'); if (s.value !== v) { s.value = v; s.dispatchEvent(new Event('change', { bubbles: true })); } };
    const lit = () => new Set([...document.querySelectorAll('.cav-hit.hl, .cav-hit.hl-group, .cav-hit.hl-end')].map((c) => c.dataset.conn + '·' + c.dataset.cav));
    const cavEl = (k) => { const i = k.indexOf('·'); return document.querySelector(`.cav-hit[data-conn="${k.slice(0, i)}"][data-cav="${CSS.escape(k.slice(i + 1))}"]`); };
    const pinOf = (cid, id) => ((CONN[cid] || CONN_BASE[cid] || {}).pins || []).find((x) => String(x.id) === String(id));
    const railOnly = (cid, id) => { const q = pinOf(cid, id); if (!q) return true; const r = (q.ecm != null && q.ecm !== '') ? (PIN_RAIL[Number(q.ecm)] || null) : q.rail; return (q.ecm == null || q.ecm === '') && (r === '12v' || r === 'gnd' || r === '5v'); };
    const DEVICE_SUB = new Set(['sensors', 'actuators', 'bobinas', 'inyectores', 'pedals']);
    /* list / note cards that are not a physical connector: body circuit lists, feed notes, legend, ECM excerpt */
    const NOT_CONN = (c2) => /^(body_|feed_)/.test(c2) || c2 === 'ipdm_legend' || c2 === 'ecm_f101_can';
    /* Known gaps: the far end of these body wires is a module / ground the map does not draw as a connector card
       yet (only the body circuit list names it). The list must match the data: a new gap fails, a fixed one must go. */
    const GAP = new Set(UNCONNECTED);
    const gapSeen = new Set();
    const fail = (m) => { out.push(m); };
    const check = (cond, m) => { nChecks++; if (!cond) fail(m); };
    /* ---- ECM pins × options ---- */
    for (const [p, e] of Object.entries(TABLE.pins)) {
      if (e.status === 'pending' || !appl(e.applies)) continue;
      const el = document.querySelector(`#blocks .pin[data-pin="${p}"]:not(.unused):not(.opt-off)`);
      if (!el) continue;
      const own = new Set(); const devs = new Set();
      for (const br of e.branches) {
        if (!appl(br.applies)) continue;
        for (const s of br.route) if (s.map && appl(s.applies)) own.add(s.map + '·' + MC(s));
        if (br.end.map && appl(br.end.applies) && !br.end.optional) { own.add(br.end.map + '·' + MC(br.end)); if (br.end.type === 'device' && DEVICE_SUB.has((CONN[br.end.map] || {}).sub)) devs.add(br.end.map); }
      }
      const circs = (pinToCirc[p] || []).map((id) => CIRCUITS.find((c) => c.id === id)).filter(Boolean);
      const chans = new Set(circs.map((c) => c.chan).filter(Boolean));
      const isSig = !PIN_RAIL[Number(p)];
      /* Sensor grouping only differs from Ficha when a circuit of the pin has a channel (powerRelatedCircuits /
         attachDataRelatedEcm); without one both modes run the same code path, so Sensor is clicked only when it can differ */
      const modes = chans.size ? ['ficha', 'sensor'] : ['ficha'];
      for (const g of [0, 1]) for (const pw of [0, 1]) for (const d of [0, 1]) for (const mode of modes) {
        setChk('railRelGnd', g); setChk('railRelPower', pw); setChk('railRelData', d); setGrp(mode);
        clearSelection(); el.click(); nPin++;
        const L = lit();
        const tag = `${model}/${trans} ECM ${p} [${g ? 'T' : '-'}${pw ? 'A' : '-'}${d ? 'D' : '-'} ${mode}]`;
        const missOwn = [...own].filter((k) => cavEl(k) && !L.has(k));
        check(!missOwn.length, `${tag}: FSM route not lit: ${missOwn.join(' ')}`);
        for (const cir of circs) for (const [cid, cavs] of Object.entries(cir.path || {})) for (const c of cavs) {
          const k = cid + '·' + c; if (!cavEl(k) || own.has(k)) continue;
          const ro = pathStepRailOnly(cid, c);
          const want = !(isSig && ro && !pw && !cir.shieldPath);
          if (want) check(L.has(k), `${tag}: ${cir.id} path cavity ${k} not lit`);
        }
        for (const D of (isSig ? devs : [])) { /* sensor-ground / supply pins (67, 78, 119…) fan out to many devices: partners not required */
          for (const q of ((CONN[D] || {}).pins || [])) {
            const k = D + '·' + q.id; if (own.has(k) || !cavEl(k) || !cavHasWire(q) || q.vifOff || q.transOff) continue;
            const isEcm = q.ecm != null && q.ecm !== '';
            const r = isEcm ? (PIN_RAIL[Number(q.ecm)] || null) : q.rail;
            const kind = r === 'gnd' ? 'gnd' : (r === '12v' || r === '5v') ? 'power' : 'data';
            if (!isEcm && kind !== 'power') continue; /* chassis grounds: Masa filter / own click (gate d) */
            const qc = q.circ ? CIRCUITS.find((c) => c.id === q.circ) : CIRCUITS.find((c) => c.path && (c.path[D] || []).map(String).includes(String(q.id)));
            const sameChan = !chans.size || !!(qc && qc.chan && chans.has(qc.chan));
            const on = kind === 'gnd' ? g : kind === 'power' ? pw : d;
            if (!isEcm) {
              if (on && (mode === 'ficha' || sameChan)) {
                check(L.has(k), `${tag}: 12V partner ${k} not lit with Alim.`);
                if (qc && L.has(k)) {
                  const missP = Object.entries(qc.path || {}).flatMap(([c2, cv]) => cv.map((x) => c2 + '·' + x)).filter((k2) => cavEl(k2) && !L.has(k2));
                  check(!missP.length, `${tag}: 12V partner ${k} route (${qc.id}) not connected: ${missP.join(' ')}`);
                }
              }
              if (!on && isSig) check(!L.has(k), `${tag}: 12V partner ${k} lit without Alim.`);
            } else if (mode === 'ficha') {
              const sibEl = cavEl(k);
              const asSib = sibEl && sibEl.classList.contains('hl-group');
              if (on && circs.some((c) => (c.ecm || []).map(Number).includes(Number(q.ecm)))) check(L.has(k), `${tag}: ECM sibling ${k} (${kind}) not lit`);
              if (!on) check(!asSib, `${tag}: ECM sibling ${k} (${kind}) lit while ${kind} is off`);
            }
          }
        }
      }
    }
    setChk('railRelGnd', 1); setChk('railRelPower', 0); setChk('railRelData', 1); setGrp('ficha');
    /* ---- every ficha cavity (default options) ---- */
    const seen = new Set();
    for (const g of document.querySelectorAll('#fichas .cav-hit')) {
      const cid = g.dataset.conn; const id = g.dataset.cav; const k = cid + '·' + id;
      if (seen.has(k)) continue; seen.add(k);
      const q = pinOf(cid, id);
      if (!q || !cavHasWire(q) || q.unknown) continue;
      const conf = CONN[cid] || CONN_BASE[cid];
      const isEcm = q.ecm != null && q.ecm !== '';
      const onCirc = isEcm || q.circ || CIRCUITS.some((c) => c.path && (c.path[cid] || []).map(String).includes(String(id)));
      const device = conf && ['sensors', 'actuators', 'bobinas', 'inyectores', 'pedals'].includes(conf.sub);
      if (device && !q.vifOff && !q.transOff) check(cavClickable(cid, q), `${model}/${trans} ${k}: wired device cavity not clickable`);
      if (!cavClickable(cid, q)) continue;
      clearSelection();
      g.dispatchEvent(new MouseEvent('click', { bubbles: true })); nCav++;
      const self = cavEl(k);
      check(!!self && (self.classList.contains('hl') || self.classList.contains('hl-group')), `${model}/${trans} ${k}: click does not light the cavity`);
      {
        const info = document.getElementById('info');
        const sh = info.querySelector('.info-short');
        const extra = [...info.children].filter((c) => !c.classList.contains('info-short'));
        check(!!sh && sh.textContent.length <= 140 && extra.length === 0, `${model}/${trans} ${k}: click info is not one short line (${(info.textContent || '').length} chars, ${extra.length} extra blocks)`);
      }
      if (q.vifOff || q.transOff || !onCirc) continue;
      {
        /* the click must reach at least one other real connector: an ECM pin, an F102 pin, or a cavity on another
           card that is an FSM connector (pseudo cards — feed notes, body circuit lists — do not count) */
        const ecmLit = !!document.querySelector('#blocks .pin.hl, #blocks .pin.hl-group');
        const f102Lit = cid !== 'ix_f102_m72' && !!document.querySelector('#f102Blocks .pin.hl, #f102Blocks .pin.hl-group');
        const other = [...lit()].map((x) => x.slice(0, x.indexOf('·'))).filter((c2) => c2 !== cid && !NOT_CONN(c2));
        const conn = ecmLit || f102Lit || other.length > 0;
        if (GAP.has(k)) { gapSeen.add(k); check(!conn, `${model}/${trans} ${k}: now connects — remove it from UNCONNECTED in rel_sweep.mjs`); }
        else check(conn, `${model}/${trans} ${k}: click connects to no other connector (lit: ${[...lit()].join(' ')})`);
      }
      if (isEcm) {
        const pe = document.querySelector(`#blocks .pin[data-pin="${Number(q.ecm)}"]:not(.unused)`);
        if (pe) check(pe.classList.contains('hl') || pe.classList.contains('hl-group'), `${model}/${trans} ${k}: ECM ${q.ecm} not lit`);
      } else {
        const cir = q.circ ? CIRCUITS.find((c) => c.id === q.circ) : null;
        if (cir && railOnly(cid, id)) {
          const L = lit();
          const missP = Object.entries(cir.path || {}).flatMap(([c2, cv]) => cv.map((x) => c2 + '·' + x)).filter((k2) => cavEl(k2) && !L.has(k2));
          check(!missP.length, `${model}/${trans} ${k}: rail partner click does not light its route (${cir.id}): ${missP.join(' ')}`);
        }
      }
    }
    clearSelection();
    return { out, nPin, nCav, nChecks, gapSeen: [...gapSeen] };
  }, TABLE, model, trans, UNCONNECTED);
  await page.close();
  return r;
}
/* one tab per model / transmission, run in parallel (each tab has its own renderer; localStorage is shared, so the
   options are set explicitly before every click and never read back from storage) */
const results = await Promise.all(SCEN.map(([m, t]) => runScenario(m, t)));
{
  const seenAny = new Set(results.flatMap((r) => r.gapSeen));
  const stale = UNCONNECTED.filter((k) => !seenAny.has(k));
  ok('UNCONNECTED list: every entry is a clickable cavity in some scenario', stale.length === 0, stale.join(' '));
}
SCEN.forEach(([model, trans], i) => {
  const r = results[i];
  pinClicks += r.nPin; cavClicks += r.nCav;
  ok(`${model}/${trans}: ${r.nPin} ECM pin×option clicks, ${r.nCav} ficha cavity clicks, ${r.nChecks} checks`, r.out.length === 0, (process.env.REL_SWEEP_ALL ? r.out : r.out.slice(0, 40)).join('\n    ') + (!process.env.REL_SWEEP_ALL && r.out.length > 40 ? `\n    … ${r.out.length - 40} more` : ''));
});
await browser.close();
console.log(`---\nrel_sweep: ${pass} passed, ${fails.length} failed (${pinClicks} pin clicks, ${cavClicks} cavity clicks, ${Math.round((Date.now() - t0) / 1000)} s)`);
if (fails.length) process.exit(1);
