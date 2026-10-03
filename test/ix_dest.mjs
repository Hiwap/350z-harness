#!/usr/bin/env node
/**
 * Intermediate connectors (ix_* cards and the "intermedias" group, F102 included): every used cavity shows a
 * destination on its first label line (ECM pin, or src = where the wire goes), like normal pins do.
 *  - data: every transmission × equipment combination (variantGatePin, live pin for dimmed/empty cavities)
 *  - DOM: default view plus each selector option on its own; the drawn first line is never "—"
 * A cavity may stay blank only when the FSM names no end for it. Those are listed in BLANK with the reason and
 * the condition (vif expression) under which they are blank; the list must match the data exactly, so a new
 * blank fails and a filled one must be removed from the list.
 */
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const require = createRequire(import.meta.url);

let pass = 0; const fails = [];
const ok = (name, cond, detail = '') => { if (cond) { pass++; console.log('  ok  ' + name); } else { fails.push(name + (detail ? ' — ' + detail : '')); console.log('  FAIL ' + name + (detail ? ' — ' + detail : '')); } };
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

/* Cavities left without a destination: the FSM does not name the far end. when = vif expression ('' = always). */
const BLANK = {
  'ix_e108_m15·5G':  { when: '', why: 'front wiper: WW-12 continues on another page without naming the ends' },
  'ix_e108_m15·63G': { when: '', why: 'A/T shift lock: AT-240 names no end terminal' },
  'ix_e108_m15·64G': { when: '', why: 'A/T shift lock: AT-240 names no end terminal (only the M15-side colour)' },
  'ix_e106_b2·15':   { when: '', why: 'Bose: AV-15 / AV-22 do not name the end terminals' },
  'ix_e106_b2·16':   { when: '', why: 'Bose: AV-15 / AV-22 do not name the end terminals' },
  'ix_b1_m12·5J':    { when: '', why: 'Bose: AV-15 / AV-22 do not name the end terminals' },
  'ix_b1_m12·9J':    { when: '', why: 'heated seat: SE-61 / SE-64 do not name the end terminal' },
  'ix_b1_m12·10J':   { when: '', why: 'heated seat: SE-61 / SE-64 do not name the end terminal' },
  'ix_b1_m12·60J':   { when: '', why: 'rear defogger: GW-61 / GW-65 show the wire with no end pin' },
  'ix_b1_m12·46J':   { when: '', why: 'Roadster soft top: ends are on RF-26/27 and SE-29/31, not in the data' },
  'ix_b1_m12·49J':   { when: '', why: 'Roadster soft top: ends are on RF-26/27 and SE-29/31, not in the data' },
  'ix_b1_m12·50J':   { when: '', why: 'Roadster soft top: ends are on RF-26/27 and SE-29/31, not in the data' },
  'ix_b1_m12·51J':   { when: '', why: 'Roadster soft top: ends are on RF-26/27 and SE-29/31, not in the data' },
  'ix_e106_b2·7':    { when: '', why: 'Roadster power seat: SE-29 does not detail the ends in this view' },
  'ix_b1_m12·52J':   { when: '', why: 'Roadster power seat: SE-29 does not detail the ends in this view' },
  'ix_b1_m12·66J':   { when: '', why: 'Roadster fuel lid opener: BL-55 names no end pin' },
  'ix_b1_m12·15J':   { when: 'body=roadster', why: 'luggage lamp: only the Coupe end (T13·1, LT-220) is known; the Roadster LT-224 end is not in the data' },
  'ix_b43_t1·5':     { when: 'body=roadster', why: 'fuel lid actuator T19·1 is the Coupe circuit (BL-54); no Roadster end in the data' },
  'ix_e12_f3·1':     { when: 'trans=mt', why: 'battery feed for the TCM F6 (AT-186); the FSM names no M/T end' },
};

const puppeteer = loadPuppeteer();
const browser = await puppeteer.launch({ headless: true, executablePath: findChrome(), args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1400, height: 1000 });
const errs = []; page.on('pageerror', (e) => errs.push(e.message));
await page.goto(pathToFileURL(path.join(root, 'index.html')).href, { waitUntil: 'networkidle0' });
await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
await page.reload({ waitUntil: 'networkidle0' });

/* ---------- data: every combination ---------- */
const data = await page.evaluate((BLANK) => {
  const isIx = (id, c) => /^ix_/.test(id) || (c && c.sub === 'intermedias');
  const dims = [['trans', ['mt', 'at']]].concat(Object.keys(VARIANT_DIMS).map((k) => [k, VARIANT_DIMS[k].vals]));
  let combos = [{}];
  dims.forEach(([k, vals]) => { combos = combos.flatMap((c) => vals.map((v) => Object.assign({}, c, { [k]: v }))); });
  const bad = []; const seenBlank = new Set(); let used = 0; let checked = 0; const badKeys = [];
  const known = (expr) => !expr || String(expr).split('|').every((g) => g.split('&').every((t) => { const ix = t.indexOf('='); if (ix < 0) return false; const k = t.slice(0, ix).trim(); const vals = k === 'trans' ? ['mt', 'at'] : (VARIANT_DIMS[k] || {}).vals; return !!vals && t.slice(ix + 1).split(',').every((x) => vals.includes(x.trim())); }));
  for (const id of Object.keys(CONN_BASE)) {
    const c = CONN_BASE[id]; if (!isIx(id, c)) continue;
    for (const p of (c.pins || [])) {
      if (!known(p.srcIf) || !known(p.altSrcIf) || (p.altSrcIf && !p.altSrc)) badKeys.push(id + '·' + p.id);
      for (const v of combos) {
        const g = variantGatePin(p, v); const pin = g && g.live ? g.live : g;
        if (!pin) continue;
        checked++;
        const isUsed = !isPseudoWireCode(pin.code) || pin.ecm != null || !!pin.src;
        if (!isUsed) continue;
        used++;
        const key = id + '·' + p.id; const top = cavTopLabel(pin);
        const exp = BLANK[key]; const expBlank = !!exp && (!exp.when || vifMatch(exp.when, v));
        if (top === '—') seenBlank.add(key);
        if ((top === '—') !== expBlank) bad.push(key + ' ' + JSON.stringify(v) + ' top=' + top);
      }
    }
  }
  return { combos: combos.length, checked, used, bad: bad.slice(0, 12), nBad: bad.length, seenBlank: [...seenBlank], badKeys };
}, BLANK);
ok(`data: srcIf / altSrcIf use known selector keys and values (altSrc set)`, data.badKeys.length === 0, data.badKeys.join(', '));
ok(`data: every used intermediate cavity has a destination line in all ${data.combos} transmission × equipment combinations (${data.used} used cavity checks); blanks only where listed`, data.nBad === 0, data.nBad + ' · ' + data.bad.join(' | '));
const stale = Object.keys(BLANK).filter((k) => !data.seenBlank.includes(k));
ok('data: BLANK list has no stale entries (each listed cavity is really blank somewhere)', stale.length === 0, stale.join(', '));

/* ---------- DOM: default + each option on its own ---------- */
const sels = await page.evaluate(() => ['model', 'loomView', 'transView', 'bodyView', 'brakeView', 'audioView', 'navView', 'pseatView', 'hseatView']
  .map((id) => { const s = document.getElementById(id); return [id, s.value, [...s.options].map((o) => o.value)]; }));
const views = [['default', {}]];
for (const [id, def, opts] of sels) for (const o of opts) if (o !== def) views.push([`${id}=${o}`, { [id]: o }]);
for (const [name, set] of views) {
  await page.evaluate((sels, set) => { for (const [id, def] of sels) { const s = document.getElementById(id); const v = set[id] || def; if (s.value !== v) { s.value = v; s.dispatchEvent(new Event('change', { bubbles: true })); } } }, sels, set);
  const r = await page.evaluate((BLANK) => {
    const v = variantView(); const out = []; let n = 0;
    const isIx = (id, c) => /^ix_/.test(id) || (c && c.sub === 'intermedias');
    for (const id of Object.keys(CONN)) {
      const c = CONN[id]; if (!isIx(id, c)) continue;
      for (const g of (c.pins || [])) {
        const pin = g.live || g;
        if (isPseudoWireCode(pin.code) && pin.ecm == null && !pin.src) continue;
        const key = id + '·' + g.id; const exp = BLANK[key];
        if (exp && (!exp.when || vifMatch(exp.when, v))) continue;
        let top = null;
        if (id === 'ix_f102_m72') { const d = [...document.querySelectorAll('#f102Panel .pin')].find((e) => e.dataset.cav === String(g.id)); top = d && d.querySelector('.pn') ? d.querySelector('.pn').textContent.trim() : null; }
        else { const t = document.querySelector(`.cav-hit[data-conn="${id}"][data-cav="${CSS.escape(String(g.id))}"] text.cav-ecm`); top = t ? t.textContent.trim() : null; }
        if (top === null) {
          const drawn = id === 'ix_f102_m72' ? !!document.querySelector('#f102Panel .pin') : !!document.querySelector(`.ficha[data-conn="${id}"]`);
          if (drawn) out.push(key + ' (cavity not drawn)');
          continue; /* card not drawn in this view (loom / model filter) */
        }
        n++;
        if (!top || top === '—') out.push(key);
      }
    }
    return { n, out };
  }, BLANK);
  ok(`DOM ${name}: every drawn used intermediate cavity shows its destination (${r.n} cells)`, r.n > 0 && r.out.length === 0, r.out.join(', '));
}
/* Spot checks: equipment swaps the destination where the FSM names a different end */
await page.evaluate((sels) => { for (const [id, def] of sels) { const s = document.getElementById(id); if (s.value !== def) { s.value = def; s.dispatchEvent(new Event('change', { bubbles: true })); } } }, sels);
const top = (cid, cav) => page.evaluate((c, v) => { const t = document.querySelector(`.cav-hit[data-conn="${c}"][data-cav="${v}"] text.cav-ecm`); return t ? t.textContent.trim() : null; }, cid, cav);
const setSel = (id, v) => page.evaluate((id, v) => { const s = document.getElementById(id); s.value = v; s.dispatchEvent(new Event('change', { bubbles: true })); }, id, v);
const mt = [await top('ix_t2_b44', '12'), await top('ix_b1_m12', '64J'), await top('ix_b1_m12', '61J'), await top('ix_e12_f3', '1')];
await setSel('transView', 'at');
const at = [await top('ix_t2_b44', '12'), await top('ix_b1_m12', '64J'), await top('ix_b1_m12', '61J'), await top('ix_e12_f3', '1')];
await setSel('transView', 'mt');
ok('trans: back-up lamp T2/B44·12 + B1/M12·64J = F102·22H on M/T, relay E19·5 on A/T; stop B1/M12·61J = E112·2 / E111·2; E12/F3·1 = F6 on A/T only',
  JSON.stringify(mt) === JSON.stringify(['F102·22H', 'F102·22H', 'E112·2', '—']) && JSON.stringify(at) === JSON.stringify(['E19·5', 'E19·5', 'E111·2', 'F6']), JSON.stringify({ mt, at }));
const base17 = await top('ix_b1_m12', '17J');
await setSel('audioView', 'bose');
const bose17 = await top('ix_b1_m12', '17J'); const bose21 = await top('ix_b1_m12', '21J');
await setSel('audioView', 'base');
ok('audio: B1/M12·17J goes to door speaker D34·1 (base) or amplifier T7·25 (Bose); 21J stays audio unit M40·4', base17 === 'D34·1' && bose17 === 'T7·25' && bose21 === 'M40·4', JSON.stringify({ base17, bose17, bose21 }));
ok('no page errors', errs.length === 0, errs.join(' | '));
await browser.close();
console.log(`ix_dest: ${pass} passed, ${fails.length} failed · BLANK ${Object.keys(BLANK).length}`);
if (fails.length) { console.log('FAILED:'); fails.forEach((f) => console.log('  ' + f)); process.exit(1); }
console.log('all intermediate destination checks passed');
