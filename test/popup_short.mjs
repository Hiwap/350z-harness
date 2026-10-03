#!/usr/bin/env node
/**
 * Short click info: clicking a pin / cavity leaves ONE short line under the ECM grid (pin or cavity, colour,
 * destination); the long text (circuit title + notes, F102 line, route tags, pin note, option note) is moved
 * unchanged into a "Descripción / Description / 説明" block inside the card (ECM pin: the card carrying that pin;
 * F102 cavity: the F102 panel). Checks es / en / ja, that nothing is lost (every circuit note of the selection and
 * the pin note are in the description) and that deselecting removes the block.
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

const HEAD = { es: 'Descripción', en: 'Description', ja: '説明' };
const CASES = [
  { kind: 'cav', conn: 'ipdm_e8', cav: '40', host: 'ipdm_e8' },   /* FPR: long circuit note + route + pin note */
  { kind: 'cav', conn: 'ix_e12_f3', cav: '2', host: 'ix_e12_f3' }, /* A/C clutch pin note */
  { kind: 'pin', pin: 113 },
  { kind: 'pin', pin: 13, host: 'ckp' },
  { kind: 'cav', conn: 'ix_f102_m72', cav: '6H', host: 'f102' },
];
for (const lang of ['es', 'en', 'ja']) {
  await page.select('#lang', lang);
  for (const c of CASES) {
    const r = await page.evaluate((c) => {
      clearSelection();
      document.querySelectorAll('details').forEach((d) => { d.open = true; });
      if (c.kind === 'pin') document.querySelector(`#blocks .pin[data-pin="${c.pin}"]`).click();
      else if (c.conn === 'ix_f102_m72') { const el = f102PinEl(c.cav); if (el) el.click(); }
      else document.querySelector(`.cav-hit[data-conn="${c.conn}"][data-cav="${c.cav}"]`).dispatchEvent(new MouseEvent('click', { bubbles: true }));
      const info = document.getElementById('info');
      const short = info.querySelector('.info-short');
      const descs = [...document.querySelectorAll('.sel-desc')];
      const d = descs[0];
      const host = d ? (d.closest('.ficha') ? d.closest('.ficha').dataset.conn : (d.closest('#f102Panel') ? 'f102' : 'other')) : null;
      /* nothing lost: every circuit note of the selection + the clicked pin's note are in the description */
      const want = (lastCircIds || []).map((id) => CIRCUITS.find((x) => x.id === id)).filter(Boolean).map((x) => circuitNotes(x));
      if (c.kind === 'cav') {
        const conf = CONN[c.conn]; const q = conf && conf.pins.find((x) => String(x.id) === c.cav);
        const pn = q ? pinNote(q) : ''; if (pn && pn !== '—') want.push(pn);
      }
      const dt = d ? d.textContent : '';
      const missing = want.filter((w) => w && !dt.includes(w.replace(/<[^>]+>/g, '')));
      return { shortTxt: short ? short.textContent : null, infoChildren: info.children.length, infoLen: (info.textContent || '').length,
        head: d ? (d.querySelector('.sel-desc-h') || {}).textContent : null, host, missing, nDesc: descs.length };
    }, c);
    const name = `${lang} ${c.kind === 'pin' ? 'ECM ' + c.pin : c.conn + '·' + c.cav}`;
    ok(`${name}: info is one short line`, r.shortTxt && r.infoChildren === 1 && r.infoLen <= 140, JSON.stringify(r).slice(0, 300));
    ok(`${name}: description "${HEAD[lang]}" in the card${c.host ? ' ' + c.host : ''}`, r.head === HEAD[lang] && (!c.host || r.host === c.host), JSON.stringify(r).slice(0, 300));
    ok(`${name}: nothing lost (circuit notes + pin note in the description)`, r.missing.length === 0, r.missing.join(' | ').slice(0, 300));
  }
}
await page.select('#lang', 'es');
const cleared = await page.evaluate(() => { clearSelection(); return document.querySelectorAll('.sel-desc').length; });
ok('deselect removes the description block', cleared === 0, String(cleared));
const reclick = await page.evaluate(() => {
  const g = () => document.querySelector('.cav-hit[data-conn="ipdm_e8"][data-cav="40"]');
  g().dispatchEvent(new MouseEvent('click', { bubbles: true }));
  g().dispatchEvent(new MouseEvent('click', { bubbles: true }));
  return { desc: document.querySelectorAll('.sel-desc').length, sel: selKey };
});
ok('second click on the same cavity deselects and drops the description', reclick.desc === 0 && !reclick.sel, JSON.stringify(reclick));
await browser.close();
console.log(`---\npopup_short: ${pass} passed, ${fails.length} failed`);
if (fails.length) process.exit(1);
