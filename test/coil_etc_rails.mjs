#!/usr/bin/env node
/**
 * Coil and ETC rails against the FSM (EC-689/691/693, EC-235/472).
 * Each coil: pin 1 = ECM signal, pin 2 = ground (B) to F23, pin 3 = 12V (W/L) from IPDM E7·17 via E12/F3·5.
 * Coil 1 gets its 12V through F18/F201·6, coil 3 through F18/F201·5, coils 2/4/5/6 directly; coils 1/3 ground
 * through F18/F201·1. Clicking a coil (ECM pin or signal cavity) with Tierras + Alim. (the modes where 12V is lit) lights exactly one 12V route
 * and its own ground route, never another coil's. ETC F31: 3/6 are the motor (ECM 4/5), powered through VMOT
 * (ECM 3, IPDM E8·42 → E12/F3·8); no 5V / sensor ground of their own. TPS 4/2 get 5V (1, ECM 47) and ground (5, ECM 66).
 */
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const require = createRequire(import.meta.url);
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
const ok = (name, cond, detail = '') => { if (cond) { pass++; console.log('  ok  ' + name); } else { fails.push(name + (detail ? ' — ' + detail : '')); console.log('  FAIL ' + name + (detail ? ' — ' + detail : '')); } };

const puppeteer = loadPuppeteer();
const browser = await puppeteer.launch({ executablePath: findChrome(), headless: true, args: ['--no-sandbox', '--disable-gpu'] });
const page = await browser.newPage();
await page.goto(pathToFileURL(path.join(root, 'index.html')).href, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('#blocks .pin[data-pin="66"]');
await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForSelector('#blocks .pin[data-pin="66"]');


const setRel = (g, pw, d, grp) => page.evaluate((g, pw, d, grp) => {
  const set = (id, v) => { const el = document.getElementById(id); if (el && el.checked !== !!v) { el.checked = !!v; el.dispatchEvent(new Event('change', { bubbles: true })); } };
  set('railRelGnd', g); set('railRelPower', pw); set('railRelData', d);
  const rg = document.getElementById('relGroup'); if (rg && rg.value !== grp) { rg.value = grp; rg.dispatchEvent(new Event('change', { bubbles: true })); }
}, g, pw, d, grp);
const lit = (click) => page.evaluate((click) => {
  clearSelection();
  if (click.pin != null) document.querySelector(`#blocks .pin[data-pin="${click.pin}"]`).click();
  else document.querySelector(`.cav-hit[data-conn="${click.conn}"][data-cav="${click.cav}"]`).dispatchEvent(new MouseEvent('click', { bubbles: true }));
  return [...new Set([...document.querySelectorAll('.cav-hit.hl, .cav-hit.hl-group, .cav-hit.hl-end')].map((e) => e.dataset.conn + '·' + e.dataset.cav))];
}, click);
const COILS = { coil1: [62, '6', true], coil3: [61, '5', true], coil5: [60, null, false], coil2: [81, null, false], coil4: [80, null, false], coil6: [79, null, false] };
for (const grp of ['sensor', 'ficha']) {
  await setRel(1, 1, 1, grp);
  for (const [coil, [ecm, f18v, f18g]] of Object.entries(COILS)) {
    for (const click of [{ pin: ecm }, { conn: coil, cav: '1' }]) {
      const L = new Set(await lit(click));
      const tag = `${grp} ${coil} (${click.pin != null ? 'ECM ' + ecm : coil + '·1'})`;
      const v12 = [...L].filter((k) => /^coil\d·3$/.test(k) || k === 'ix_f18_f201·5' || k === 'ix_f18_f201·6');
      const want12 = [coil + '·3', ...(f18v ? ['ix_f18_f201·' + f18v] : [])];
      ok(`${tag}: exactly one 12V (${want12.join(' + ')})`, v12.length === want12.length && want12.every((k) => L.has(k)) && L.has('ipdm_e7·17') && L.has('ix_e12_f3·5'), v12.join(' '));
      const gnd = [...L].filter((k) => /^coil\d·2$/.test(k));
      ok(`${tag}: own ground ${coil}·2 → ${f18g ? 'F18/F201·1 → ' : ''}F23 lit, no other coil ground`, gnd.length === 1 && gnd[0] === coil + '·2' && L.has('f23_gnd·ring') && L.has('ix_f18_f201·1') === f18g, [...L].join(' '));
    }
    const G = new Set(await lit({ conn: coil, cav: '2' }));
    ok(`${grp} ${coil}·2 click: ground route to F23, no other coil`, G.has('f23_gnd·ring') && [...G].filter((k) => /^coil\d·2$/.test(k)).length === 1, [...G].join(' '));
  }
  await setRel(1, 0, 1, grp);
  const L0 = new Set(await lit({ pin: 62 }));
  ok(`${grp} ECM 62 with Tierras, no Alim.: signal only (ground and 12V dark, like other SIG clicks)`, !L0.has('coil1·2') && !L0.has('coil1·3'), [...L0].join(' '));
}
/* VTC intake bank 1 (F204): 12V only through F18/F201·5 (EC-455), both engines */
for (const model of ['de_early', 'de_revup']) {
  await page.evaluate((m) => { const el = document.getElementById('model'); if (el.value !== m) { el.value = m; el.dispatchEvent(new Event('change', { bubbles: true })); } }, model);
  for (const grp of ['sensor', 'ficha']) {
    await setRel(1, 1, 1, grp);
    for (const click of [{ pin: 11 }, { conn: 'vtc_b1', cav: '1' }]) {
      const L = new Set(await lit(click));
      ok(`${model} ${grp} VTC B1 (${click.pin != null ? 'ECM 11' : 'vtc_b1·1'}): 12V via F18/F201·5 only, not ·6 (EC-455)`, L.has('vtc_b1·2') && L.has('ix_f18_f201·5') && !L.has('ix_f18_f201·6'), [...L].join(' '));
    }
  }
}
await page.evaluate(() => { const el = document.getElementById('model'); el.value = 'de_early'; el.dispatchEvent(new Event('change', { bubbles: true })); });
/* ETC (F31) */
for (const grp of ['sensor', 'ficha']) {
  await setRel(1, 1, 1, grp);
  for (const click of [{ conn: 'etc', cav: '3' }, { conn: 'etc', cav: '6' }, { pin: 4 }, { pin: 5 }]) {
    const L = new Set(await lit(click));
    const tag = `${grp} ETC ${click.pin != null ? 'ECM ' + click.pin : 'etc·' + click.cav}`;
    ok(`${tag}: motor pair + VMOT (ECM 3: IPDM E8·42 → E12/F3·8) lit with Alim.`, L.has('etc·3') && L.has('etc·6') && L.has('ipdm_e8·42') && L.has('ix_e12_f3·8'), [...L].join(' '));
    if (grp === 'sensor') ok(`${tag}: no TPS 5V / sensor ground on the motor pins (sensor mode)`, !L.has('etc·1') && !L.has('etc·5'), [...L].join(' '));
  }
  for (const click of [{ conn: 'etc', cav: '4' }, { conn: 'etc', cav: '2' }]) {
    const L = new Set(await lit(click));
    ok(`${grp} ETC etc·${click.cav} (TPS): 5V etc·1 (ECM 47) + sensor ground etc·5 (ECM 66) lit`, L.has('etc·1') && L.has('etc·5'), [...L].join(' '));
  }
}
await browser.close();
console.log(`---\ncoil_etc_rails: ${pass} passed, ${fails.length} failed`);
if (fails.length) process.exit(1);
