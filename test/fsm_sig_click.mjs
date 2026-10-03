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
const MC = (s) => (s.cav == null && s.map_cav ? s.map_cav : s.cav); // map label where the FSM publishes no cavity number
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
    for (const s of b.route) if (s.map) addRail(K(s.map, MC(s)), `ECM ${p} ${e.rail} route (${e.cite.ec.join('/')})`);
    if (b.end.map) addRail(K(b.end.map, MC(b.end)), `ECM ${p} ${e.rail} end (${e.cite.ec.join('/')})`);
  }
}
const ownRoute = (p) => {
  const e = TABLE.pins[String(p)]; const set = new Set();
  for (const b of e.branches) { for (const s of b.route) if (s.map) set.add(K(s.map, MC(s))); if (b.end.map) set.add(K(b.end.map, MC(b.end))); }
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
  { model: 'de_early', trans: 'mt', pins: sigPins.filter(([, e]) => !['revup', 'revup+mt', 'at'].includes(e.applies)) },
  { model: 'de_early', trans: 'at', pins: sigPins.filter(([, e]) => e.applies === 'at' || e.branches.some((b) => b.applies === 'at')) },
  { model: 'de_revup', trans: 'mt', pins: sigPins.filter(([, e]) => e.applies === 'revup' || e.applies === 'revup+mt') },
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
// Engine oil temperature sensor F242 (EC-123 (3M) = 35th Anniversary M/T; PG-55 *1; 2006 EC-110 (M)):
// ECM 54 + F242 exist only on Rev-Up + Manual; the 54 click shows the signal only; the F242 ground reaches ECM 67.
{
  const eot = TABLE.pins['54'];
  const gndBr = TABLE.pins['67'].branches.find((b) => b.end.map === 'f242_eot');
  ok('table: ECM 54 is revup+mt, cites EC-123 + PG-55', eot && eot.applies === 'revup+mt' && eot.cite.ec.includes('EC-123') && eot.cite.pg.includes('PG-55'));
  ok('table: ECM 67 has the F242 ground splice branch (revup+mt, EC-123)', !!gndBr && gndBr.applies === 'revup+mt' && TABLE.pins['67'].cite.ec.includes('EC-123'));
  const sigKey = K('f242_eot', MC(eot.branches[0].end)); const gndKey = K('f242_eot', MC(gndBr.end));
  for (const [model, trans] of [['de_revup', 'mt'], ['de_revup', 'at'], ['de_early', 'mt'], ['de_early', 'at']]) {
    await page.select('#model', model);
    await page.select('#transView', trans);
    await page.waitForFunction((t) => transView() === t, {}, trans);
    await page.evaluate(() => clearSelection());
    const want = model === 'de_revup' && trans === 'mt';
    const pin = !!(await page.$('#blocks .pin[data-pin="54"]:not(.unused)'));
    const card = !!(await page.$('#fichas [data-conn="f242_eot"]'));
    ok(`ECM 54 ${want ? 'shown' : 'hidden'} on ${model}/${trans} (EC-123 3M)`, pin === want, `pin active=${pin}`);
    ok(`F242 card ${want ? 'shown' : 'hidden'} on ${model}/${trans}`, card === want, `card=${card}`);
  }
  await page.select('#model', 'de_revup');
  await page.select('#transView', 'mt');
  await page.waitForFunction(() => transView() === 'mt');
  const litNow = () => page.evaluate(() => [...new Set([...document.querySelectorAll('.cav-hit.hl, .cav-hit.hl-group, .cav-hit.hl-end')].map((c) => c.dataset.conn + '·' + c.dataset.cav))]);
  await page.evaluate(() => clearSelection());
  await page.click('#blocks .pin[data-pin="54"]');
  let lit = await litNow();
  ok(`ECM 54 click lights ${sigKey} and not the ground ${gndKey}`, lit.includes(sigKey) && !lit.includes(gndKey), lit.join(','));
  const gndLit = await page.evaluate(() => [...document.querySelectorAll('.cav-hit.hl, .cav-hit.hl-group, .cav-hit.hl-end')].filter((c) => c.dataset.rail === 'gnd' || c.dataset.rail === '12v').map((c) => c.dataset.conn + '·' + c.dataset.cav));
  ok('ECM 54 click lights no gnd/12V cavity', gndLit.length === 0, gndLit.join(','));
  await page.evaluate(() => clearSelection());
  await page.click('#blocks .pin[data-pin="67"]');
  lit = await litNow();
  ok(`ECM 67 click lights the oil temp ground ${gndKey} (splice, EC-123) with ECT ect·2`, lit.includes(gndKey) && lit.includes('ect·2'), lit.join(','));
  await page.evaluate(() => clearSelection());
  await page.evaluate((k) => { const [c, v] = k.split('·'); document.querySelector(`.cav-hit[data-conn="${c}"][data-cav="${v}"]`).dispatchEvent(new MouseEvent('click', { bubbles: true })); }, gndKey);
  const e67 = await page.evaluate(() => { const el = document.querySelector('#blocks .pin[data-pin="67"]'); return !!el && (el.classList.contains('hl') || el.classList.contains('hl-group')); });
  ok(`clicking ${gndKey} selects ECM 67`, e67);
  await page.evaluate(() => { clearSelection(); toggleRail('gnd'); });
  const railG = await page.evaluate((k) => { const [c, v] = k.split('·'); return [...document.querySelectorAll(`.cav-hit[data-conn="${c}"][data-cav="${v}"]`)].some((el) => el.classList.contains('hl-rail') || el.classList.contains('hl-rail-rel-gnd')); }, gndKey);
  ok(`GND rail shows ${gndKey}`, railG);
  await page.evaluate(() => { toggleRail('gnd'); clearSelection(); });
}
// Dimmed optional-equipment cells: default car (no heated seats) shows HS-PWR G dimmed with a tooltip; selecting heated seats = full strength.
{
  const cell = () => page.evaluate(() => {
    const g = document.querySelector('.cav-hit[data-conn="body_asientos"][data-cav="HS-PWR"]');
    if (!g) return null;
    return { off: g.classList.contains('cav-opt-off'), op: g.getAttribute('opacity'), tip: (g.querySelector('title') || {}).textContent || '', code: (g.querySelector('.cav-code') || {}).textContent || '' };
  });
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await page.reload({ waitUntil: 'networkidle0' });
  const off = await cell();
  ok('dimmed: HS-PWR without heated seats shows FSM colour G, dimmed, tooltip "solo con asientos calefactables"',
    !!off && off.off && Number(off.op) < 1 && off.tip === 'solo con asientos calefactables' && off.code.replace(/\s/g, '') === 'G', JSON.stringify(off));
  const nOff = await page.evaluate(() => document.querySelectorAll('.cav-hit.cav-opt-off').length);
  ok('dimmed: optional-equipment cells across all fichas are dimmed on the default car', nOff >= 20, `${nOff}`);
  // Dimmed pin is clickable: lights its circuit (heated_seat: B1/M12·2J) like a live pin, stays dimmed, info names the option.
  await page.evaluate(() => { const g = document.querySelector('.cav-hit[data-conn="body_asientos"][data-cav="HS-PWR"]'); g.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
  const clk = await page.evaluate(() => {
    const g = document.querySelector('.cav-hit[data-conn="body_asientos"][data-cav="HS-PWR"]');
    const m12 = document.querySelector('.cav-hit[data-conn="ix_b1_m12"][data-cav="2J"]');
    const top = (g.querySelector('.cav-ecm') || {}).textContent || '';
    return { hl: g.classList.contains('hl'), op: Number(getComputedStyle(g).opacity), m12: !!m12 && (m12.classList.contains('hl') || m12.classList.contains('hl-group')),
      info: document.getElementById('info').textContent, top };
  });
  ok('dimmed: clicking HS-PWR (no heated seats) lights its path B1/M12·2J, stays dimmed, info "solo con asientos calefactables", top line B37·3',
    clk.hl && clk.op < 1 && clk.m12 && /solo con asientos calefactables/.test(clk.info) && clk.top === 'B37·3', JSON.stringify(clk).slice(0, 300));
  await page.evaluate(() => clearSelection());
  // F102·28H (A/T only) on M/T: dimmed, top line shows ECM 102, clickable.
  const f28 = await page.evaluate(() => { const el = f102PinEl('28H'); if (!el) return null; el.click(); return { opt: el.classList.contains('opt-off'), top: (el.querySelector('.pn') || {}).textContent, hl: el.classList.contains('hl'), op: Number(getComputedStyle(el).opacity) }; });
  ok('dimmed: F102·28H on M/T shows top line 102, dimmed, clickable (lights)', !!f28 && f28.opt && f28.top === '102' && f28.hl && f28.op < 1, JSON.stringify(f28));
  await page.evaluate(() => clearSelection());
  await page.select('#hseatView', 'yes');
  const on = await cell();
  ok('dimmed: with heated seats selected HS-PWR is full strength (no dimming, no tooltip)', !!on && !on.off && on.op === null && on.code.replace(/\s/g, '') === 'G', JSON.stringify(on));
  await page.select('#hseatView', 'no');
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
}
// Fuse boxes behave like the IPDM cover: J/B 15 lights its heater path (E108/M15·65G), J/B 7 (no harness circuit) opens its description.
{
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} clearSelection(); document.querySelectorAll('details').forEach((d) => { d.open = true; }); });
  const clickFuse = (cid, cav) => page.evaluate((c, v) => {
    clearSelection();
    const g = document.querySelector(`.cav-hit[data-conn="${c}"][data-cav="${v}"]`);
    if (!g) return null;
    g.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    const lit = [...document.querySelectorAll('.cav-hit.hl, .cav-hit.hl-group, .cav-hit.hl-end')].map((e) => e.dataset.conn + '·' + e.dataset.cav);
    return { self: g.classList.contains('hl'), lit, info: document.getElementById('info').textContent };
  }, cid, cav);
  const f15 = await clickFuse('jb_fuse_block', '15');
  ok('fuse box: J/B 15 click lights itself + E108/M15·65G heater path', !!f15 && f15.self && f15.lit.includes('ix_e108_m15·65G'), JSON.stringify(f15 && f15.lit).slice(0, 200));
  const f7 = await clickFuse('jb_fuse_block', '7');
  ok('fuse box: J/B 7 (no circuit) opens its description (WW-P/SCKT)', !!f7 && f7.self && /WW-P\/SCKT/.test(f7.info), (f7 && f7.info || '').slice(0, 200));
  const f36 = await clickFuse('fuse_link_box', '36');
  ok('fuse box: E21 fuse 36 lights the alternator S path (F20·3)', !!f36 && f36.self && f36.lit.some((k) => k.startsWith('f20_alt·')), JSON.stringify(f36 && f36.lit).slice(0, 200));
  await page.evaluate(() => clearSelection());
}
await page.select('#model', 'de_early');
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
