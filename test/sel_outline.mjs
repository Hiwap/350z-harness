#!/usr/bin/env node
/**
 * Selected outline with Relacionados on: only the clicked thing gets the yellow selected outline (.hl).
 * ECM pin click: only the device cavity carrying that ECM pin; route cavities, intermediates (F102, E108/M15, …)
 * carrying the same wire and partner circuits (12V / ground / data) use the related style (.hl-group).
 * Cavity click: only the clicked cavity. Regression: ECM 85 (K-line) lit DLC 5/8/16, IPDM E7·25, E108/M15 and F102
 * cavities in yellow. Also checks the description lands in the details panel, not on the DLC card.
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


const setRel = (g, pw, d) => page.evaluate((g, pw, d) => {
  const set = (id, v) => { const el = document.getElementById(id); if (el && el.checked !== !!v) { el.checked = !!v; el.dispatchEvent(new Event('change', { bubbles: true })); } };
  set('railRelGnd', g); set('railRelPower', pw); set('railRelData', d);
}, g, pw, d);
const probe = (click) => page.evaluate((click) => {
  clearSelection();
  if (click.pin != null) document.querySelector(`#blocks .pin[data-pin="${click.pin}"]`).click();
  else document.querySelector(`.cav-hit[data-conn="${click.conn}"][data-cav="${click.cav}"]`).dispatchEvent(new MouseEvent('click', { bubbles: true }));
  const key = (e) => e.dataset.conn + '·' + e.dataset.cav;
  const yellow = [...new Set([...document.querySelectorAll('.cav-hit.hl')].map(key))];
  const related = [...new Set([...document.querySelectorAll('.cav-hit.hl-group')].map(key))];
  const f102Yellow = [...document.querySelectorAll('#f102Blocks .pin.hl')].map((e) => e.dataset.cav);
  const f102Rel = [...document.querySelectorAll('#f102Blocks .pin.hl-group')].map((e) => e.dataset.cav);
  const ecmYellow = [...document.querySelectorAll('#blocks .pin.hl')].map((e) => e.dataset.pin);
  const info = document.getElementById('info');
  const descPanel = [...info.querySelectorAll(':scope > .sel-desc')].length;
  const descCard = document.querySelectorAll('#fichas .sel-desc, #f102Panel .sel-desc').length;
  const ixYellow = yellow.filter((k) => { const cid = k.split('·')[0]; return cid === 'ix_f102_m72' || (CONN[cid] || {}).sub === 'intermedias'; });
  const badYellow = click.pin != null ? yellow.filter((k) => { const [cid, cav] = k.split('·'); const q = ((CONN[cid] || {}).pins || []).find((x) => String(x.id) === cav); return !q || Number(q.ecm) !== Number(click.pin); }) : yellow.filter((k) => k !== click.conn + '·' + click.cav);
  return { yellow, related, f102Yellow, f102Rel, ecmYellow, descPanel, descCard, ixYellow, badYellow };
}, click);

for (const [g, pw, d] of [[1, 0, 1], [1, 1, 1], [0, 1, 0]]) {
  await setRel(g, pw, d);
  const tag = `T${g}A${pw}D${d}`;
  const r = await probe({ pin: 85 });
  ok(`${tag} ECM 85: exactly one cavity selected (DLC·7)`, r.yellow.length === 1 && r.yellow[0] === 'dlc·7' && r.f102Yellow.length === 0, JSON.stringify(r).slice(0, 400));
  ok(`${tag} ECM 85: only ECM pin 85 yellow in the grid`, r.ecmYellow.join() === '85', r.ecmYellow.join());
  ok(`${tag} ECM 85: F102·4H and the rest styled as related`, r.f102Rel.includes('4H') && (pw ? ['dlc·8', 'dlc·16', 'ipdm_e7·25'].every((k) => r.related.includes(k)) : true), JSON.stringify(r).slice(0, 400));
  ok(`${tag} ECM 85: description in the details panel, not on the DLC card`, r.descPanel === 1 && r.descCard === 0, JSON.stringify(r));
  const c = await probe({ conn: 'dlc', cav: '16' });
  ok(`${tag} DLC·16 click: only the clicked cavity yellow`, c.yellow.length === 1 && c.yellow[0] === 'dlc·16' && c.f102Yellow.length === 0, JSON.stringify(c).slice(0, 400));
}
/* every ECM pin, Relacionados default and all on: yellow only on device cavities carrying the clicked pin */
const pins = await page.evaluate(() => [...document.querySelectorAll('#blocks .pin[data-pin]')].map((e) => Number(e.dataset.pin)));
for (const [g, pw, d] of [[1, 0, 1], [1, 1, 1]]) {
  await setRel(g, pw, d);
  const bad = [];
  for (const n of pins) {
    const r = await probe({ pin: n });
    if (r.badYellow.length || r.ixYellow.length || r.f102Yellow.length || r.descCard) bad.push(`${n}: ${[...r.badYellow, ...r.ixYellow, ...r.f102Yellow.map((x) => 'F102·' + x)].join(' ')}${r.descCard ? ' desc-in-card' : ''}`);
  }
  ok(`T${g}A${pw}D${d} all ${pins.length} ECM pins: yellow only on the device cavity carrying the pin, route / partners related`, bad.length === 0, bad.slice(0, 12).join(' | '));
}
await browser.close();
console.log(`---\nsel_outline: ${pass} passed, ${fails.length} failed`);
if (fails.length) process.exit(1);
