#!/usr/bin/env node
/**
 * FSM route gate (browser), check (d): clicking an ECM SIG pin with default toggles must not
 * light any rail-only (gnd / 12V) cavity. The rail-only set comes from test/fsm_ecm_routes.json
 * (ground-point feeds, supply feeds, and the routes of ECM ground/power terminals), plus map cavities
 * that carry a gnd/12v rail and no ECM pin. Cavities on the clicked pin's own FSM route are exempt
 * (e.g. F102·17H is both ECM 109 and the injector feed). Documented exception: the knock shield on
 * the knock signal path (ECM 15 → F14/F229·1 → ECM 116 line → F103·4), EC-317 (table sig_click_allowlist).
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

const K = (c, v) => `${c}·${v}`;
// rail-only set from the FSM table
const railOnly = new Map(); // key -> reason
const addRail = (k, why) => { if (!railOnly.has(k)) railOnly.set(k, why); };
for (const [g, gp] of Object.entries(TABLE.ground_points)) {
  if (gp.map) addRail(K(gp.map, 'ring'), `ground point ${g}`);
  for (const s of gp.feeds || []) if (s.map) addRail(K(s.map, s.cav), `feeds ground ${g} (${gp.cite.join('/')})`);
}
for (const f of TABLE.supply_feeds) for (const s of f.cavities) if (s.map) addRail(K(s.map, s.cav), `${f.source} (${f.cite.join('/')})`);
for (const [p, e] of Object.entries(TABLE.pins)) {
  if (e.status === 'pending' || e.sensor_return || !['gnd', '12v'].includes(e.rail)) continue;
  for (const b of e.branches) {
    for (const s of b.route) if (s.map) addRail(K(s.map, s.cav), `ECM ${p} ${e.rail} route (${e.cite.ec.join('/')})`);
    if (b.end.map) addRail(K(b.end.map, b.end.cav), `ECM ${p} ${e.rail} end (${e.cite.ec.join('/')})`);
  }
}
const ownRoute = (p) => {
  const e = TABLE.pins[String(p)]; const set = new Set();
  for (const b of e.branches) { for (const s of b.route) if (s.map) set.add(K(s.map, s.cav)); if (b.end.map) set.add(K(b.end.map, b.end.cav)); }
  return set;
};
const allow = new Map();
for (const a of TABLE.sig_click_allowlist || []) {
  if (!allow.has(a.pin)) allow.set(a.pin, new Set());
  allow.get(a.pin).add(K(a.map, a.cav));
}

const puppeteer = loadPuppeteer();
const browser = await puppeteer.launch({ executablePath: findChrome(), headless: true, args: ['--no-sandbox', '--disable-gpu'] });
const page = await browser.newPage();
await page.goto(pathToFileURL(path.join(root, 'index.html')).href, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('#blocks .pin[data-pin="66"]');
await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForSelector('#blocks .pin[data-pin="66"]');
// map cavities with a gnd/12v rail and no ECM pin are rail-only too
const mapRail = await page.evaluate(() => {
  const out = [];
  for (const [cid, c] of Object.entries(CONN_BASE)) for (const p of c.pins || []) {
    if ((p.ecm == null || p.ecm === '') && (p.rail === 'gnd' || p.rail === '12v')) out.push([cid + '·' + p.id, 'map ' + p.rail + ' cavity without ECM pin']);
  }
  return out;
});
for (const [k, why] of mapRail) addRail(k, why);

let pass = 0; const fails = [];
const ok = (name, cond, detail = '') => { if (cond) pass++; else { fails.push(name + (detail ? ' — ' + detail : '')); console.log('  FAIL ' + name + (detail ? ' — ' + detail : '')); } };

const sigPins = Object.entries(TABLE.pins).filter(([, e]) => e.rail === 'sig' && e.status !== 'pending').map(([p, e]) => [Number(p), e]);
const scenarios = [
  { model: 'de_early', trans: 'mt', pins: sigPins.filter(([, e]) => e.applies !== 'revup' && e.applies !== 'at') },
  { model: 'de_early', trans: 'at', pins: sigPins.filter(([, e]) => e.applies === 'at' || e.branches.some((b) => b.applies === 'at')) },
  { model: 'de_revup', trans: 'mt', pins: sigPins.filter(([, e]) => e.applies === 'revup') },
];
let clicked = 0;
for (const sc of scenarios) {
  await page.select('#model', sc.model);
  await page.select('#transView', sc.trans);
  await page.waitForFunction((t) => typeof transView === 'function' && transView() === t, {}, sc.trans);
  for (const [p] of sc.pins) {
    await page.evaluate(() => { if (typeof clearSelection === 'function') clearSelection(); });
    const present = await page.$(`#blocks .pin[data-pin="${p}"]:not(.unused)`);
    ok(`ECM ${p} (${sc.model}/${sc.trans}) is clickable`, !!present);
    if (!present) continue;
    await page.click(`#blocks .pin[data-pin="${p}"]`);
    await page.waitForFunction((n) => { const el = document.querySelector(`#blocks .pin[data-pin="${n}"]`); return el && (el.classList.contains('hl') || el.classList.contains('hl-group')); }, { timeout: 3000 }, p).catch(() => {});
    const lit = await page.evaluate(() => [...new Set([...document.querySelectorAll('.cav-hit.hl, .cav-hit.hl-group, .cav-hit.hl-end')].map((c) => c.dataset.conn + '·' + c.dataset.cav))]);
    const own = ownRoute(p); const al = allow.get(String(p)) || new Set();
    const bad = lit.filter((k) => railOnly.has(k) && !own.has(k) && !al.has(k));
    clicked++;
    ok(`ECM ${p} SIG click (${sc.model}/${sc.trans}) lights no rail-only cavity`, bad.length === 0, bad.map((k) => `${k} [${railOnly.get(k)}]`).join('; '));
    if (al.size) ok(`ECM ${p}: allowlisted cavities are real FSM citations`, (TABLE.sig_click_allowlist || []).filter((a) => a.pin === String(p)).every((a) => a.cite && a.cite.length));
  }
}
// CAN (LAN-31/119): on A/T, ECM 94 reaches the TCM via F6·3 and the unified meter M48·1.
await page.select('#model', 'de_early');
await page.select('#transView', 'at');
await page.evaluate(() => { if (typeof clearSelection === 'function') clearSelection(); });
await page.click('#blocks .pin[data-pin="94"]');
{
  const lit = await page.evaluate(() => [...document.querySelectorAll('.cav-hit.hl, .cav-hit.hl-group, .cav-hit.hl-end')].map((c) => c.dataset.conn + '·' + c.dataset.cav));
  ok('A/T ECM 94 CAN-H lights F6·3 (TCM) + M48·1 + E9·48 + DLC·6 (LAN-31/32)', ['f6_at·3', 'comb_meter·1', 'ipdm_e9·48', 'dlc·6'].every((k) => lit.includes(k)), lit.join(','));
}
await page.select('#transView', 'mt');
// Positive control: with "related power" on, the coil 12V feed (E7·17 → E12/F3·5) still lights (EC-689).
await page.select('#model', 'de_early');
await page.evaluate(() => { const el = document.getElementById('railRelPower'); if (el && !el.checked) { el.checked = true; el.dispatchEvent(new Event('change', { bubbles: true })); } if (typeof clearSelection === 'function') clearSelection(); });
await page.click('#blocks .pin[data-pin="62"]');
{
  const lit = await page.evaluate(() => [...document.querySelectorAll('.cav-hit.hl, .cav-hit.hl-group, .cav-hit.hl-end')].map((c) => c.dataset.conn + '·' + c.dataset.cav));
  ok('ECM 62 with related power on lights the E12/F3·5 coil feed (EC-689)', lit.includes('ix_e12_f3·5'), lit.join(','));
}
await page.evaluate(() => { const el = document.getElementById('railRelPower'); if (el) { el.checked = false; el.dispatchEvent(new Event('change', { bubbles: true })); } try { localStorage.clear(); } catch (e) {} });
await browser.close();
console.log(`---\nfsm_sig_click: ${pass} passed, ${fails.length} failed · ${clicked} SIG clicks · rail-only set ${railOnly.size} cavities`);
if (fails.length) { console.log('FAILED:\n' + fails.join('\n')); process.exit(1); }
console.log('FSM SIG CLICK OK');
