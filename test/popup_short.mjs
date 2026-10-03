#!/usr/bin/env node
/**
 * Short click info + Descripción in the details panel: clicking an ECM pin, a cavity or a card leaves ONE short
 * line in the details panel (#info, under the ECM grid: pin or cavity, colour, destination) and, below it in the
 * same panel, a "Descripción / Description / 説明" block with the long text (circuit title + notes, F102 line,
 * route tags, pin note). No ficha card and no F102 panel may ever render the description inline.
 * Sweeps one pin per connector type (ECM, F102, every intermediate, OBD/DLC, IPDM, fuses, feeds, sensors,
 * actuators, coils, injectors, pedals, body cards) in es / en / ja, checks nothing is lost (every circuit note of
 * the selection and the pin note are in the description) and that deselecting removes the block.
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
const FIXED = [
  { kind: 'pin', pin: 85 }, { kind: 'pin', pin: 113 }, { kind: 'pin', pin: 13 }, { kind: 'pin', pin: 94 },
  { kind: 'cav', conn: 'ix_f102_m72', cav: '6H' }, { kind: 'cav', conn: 'ix_f102_m72', cav: '4H' },
  { kind: 'cav', conn: 'ipdm_e8', cav: '40' }, { kind: 'cav', conn: 'ix_e12_f3', cav: '2' },
  { kind: 'cav', conn: 'ix_b1_m12', cav: '42J' }, { kind: 'cav', conn: 'ix_e108_m15', cav: '2G' },
  { kind: 'cav', conn: 'dlc', cav: '7' }, { kind: 'cav', conn: 'body_medidores', cav: 'FUEL' },
  { kind: 'conn', conn: 'dlc' }, { kind: 'conn', conn: 'ix_f102_m72' },
];
/* plus one clickable cavity (with a circuit or an ECM pin) per card sub-type and per intermediate connector */
const AUTO = await page.evaluate(() => {
  const out = []; const seenSub = new Set();
  Object.entries(CONN).forEach(([cid, conf]) => {
    const key = conf.sub === 'intermedias' ? 'ix:' + cid : conf.sub;
    if (seenSub.has(key) || cid === 'ix_f102_m72') return;
    const q = (conf.pins || []).find((x) => (x.circ || (x.ecm != null && x.ecm !== '')) && document.querySelector(`.cav-hit[data-conn="${CSS.escape(cid)}"][data-cav="${CSS.escape(String(x.id))}"]`));
    if (!q) return;
    seenSub.add(key); out.push({ kind: 'cav', conn: cid, cav: String(q.id), sub: conf.sub });
  });
  return out;
});
ok('auto sweep covers ipdm, fuses, intermedias, sensors, actuators, bobinas, body cards', ['ipdm', 'fuses', 'intermedias', 'sensors', 'actuators', 'bobinas', 'carroceria'].every((s) => AUTO.some((c) => c.sub === s)), AUTO.map((c) => c.sub).join(' '));
const CASES = [...FIXED, ...AUTO];
for (const lang of ['es', 'en', 'ja']) {
  await page.select('#lang', lang);
  for (const [rgnd, rpow, rdat] of [[1, 0, 1], [1, 1, 1]]) {
    await page.evaluate((g, pw, d) => {
      const set = (id, v) => { const el = document.getElementById(id); if (el && el.checked !== !!v) { el.checked = !!v; el.dispatchEvent(new Event('change', { bubbles: true })); } };
      set('railRelGnd', g); set('railRelPower', pw); set('railRelData', d);
    }, rgnd, rpow, rdat);
    for (const c of CASES) {
      if (lang !== 'es' && rpow && !FIXED.includes(c)) continue;
      const r = await page.evaluate((c) => {
        clearSelection();
        document.querySelectorAll('details').forEach((d) => { d.open = true; });
        if (c.kind === 'pin') document.querySelector(`#blocks .pin[data-pin="${c.pin}"]`).click();
        else if (c.kind === 'conn') selectConn(c.conn);
        else if (c.conn === 'ix_f102_m72') { const el = f102PinEl(c.cav); if (el) el.click(); }
        else document.querySelector(`.cav-hit[data-conn="${c.conn}"][data-cav="${c.cav}"]`).dispatchEvent(new MouseEvent('click', { bubbles: true }));
        const info = document.getElementById('info');
        const short = info.querySelector(':scope > .info-short');
        const descs = [...document.querySelectorAll('.sel-desc')];
        const inPanel = descs.filter((d) => d.parentElement === info);
        const inCard = descs.filter((d) => d.closest('.ficha, .ficha-wrap, #fichas, #f102Panel, .f102-panel')).length
          + document.querySelectorAll('#fichas .info-long, #f102Panel .info-long, #fichas .info-short, #f102Panel .info-short').length;
        const want = (lastCircIds || []).map((id) => CIRCUITS.find((x) => x.id === id)).filter(Boolean).map((x) => circuitNotes(x));
        if (c.kind === 'cav') {
          const conf = CONN[c.conn]; const q = conf && conf.pins.find((x) => String(x.id) === c.cav);
          const pn = q ? pinNote(q) : ''; if (pn && pn !== '—') want.push(pn);
        }
        const dt = inPanel[0] ? inPanel[0].textContent : '';
        const missing = c.kind === 'conn' ? [] : want.filter((w) => w && !dt.includes(w.replace(/<[^>]+>/g, '')));
        const kids = [...info.children].map((e) => e.className);
        return { shortTxt: short ? short.textContent : null, shortLen: short ? short.textContent.length : 0, kids, nDesc: descs.length, nPanel: inPanel.length, inCard,
          head: inPanel[0] ? (inPanel[0].querySelector('.sel-desc-h') || {}).textContent : null, missing, hasLong: want.length > 0 };
      }, c);
      const name = `${lang} T${rgnd}A${rpow}D${rdat} ${c.kind === 'pin' ? 'ECM ' + c.pin : c.kind === 'conn' ? 'card ' + c.conn : c.conn + '·' + c.cav}`;
      ok(`${name}: details panel = one short line (+ Descripción)`, r.shortTxt && r.shortLen <= 140 && r.kids[0] === 'info-short' && r.kids.slice(1).every((k) => k === 'sel-desc') && r.kids.length <= 2, JSON.stringify(r).slice(0, 300));
      ok(`${name}: description never inside a ficha / F102 panel`, r.inCard === 0 && r.nDesc === r.nPanel, JSON.stringify(r).slice(0, 300));
      if (r.hasLong) ok(`${name}: "${HEAD[lang]}" in the details panel, nothing lost`, r.nPanel === 1 && r.head === HEAD[lang] && r.missing.length === 0, (r.missing.join(' | ') || JSON.stringify(r)).slice(0, 300));
    }
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
