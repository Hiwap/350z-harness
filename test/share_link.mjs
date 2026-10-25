/* ?pin= / ?cav= opens that ECM pin or cavity. cav wins when both are set.
   A bad id selects nothing. A card off the chosen car keeps the query and says so.
   A click or a second click updates the query and keeps lang. Canonical stays the language URL.
   Fusibles auto-open is not written to localStorage. F102·9H / ECM 88 stay unwired. */
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath, pathToFileURL } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);

function loadPuppeteer() {
  const candidates = [
    path.join(root, 'node_modules/puppeteer-core'),
    path.join(process.env.TEMP || '/tmp', 'z33-verify/node_modules/puppeteer-core'),
    '/tmp/z33-verify/node_modules/puppeteer-core',
  ];
  const errs = [];
  for (const dir of candidates) {
    try { return require(dir); } catch (e) { errs.push(dir + ': ' + e.message); }
  }
  try { return require('puppeteer-core'); } catch (e) { errs.push('resolve: ' + e.message); }
  throw new Error('puppeteer-core not found\n' + errs.join('\n'));
}
function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ].filter(Boolean);
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error('Chrome/Edge not found');
}

const puppeteer = loadPuppeteer();
const browser = await puppeteer.launch({
  executablePath: findChrome(),
  headless: true,
  args: ['--no-sandbox', '--disable-gpu'],
});
const base = pathToFileURL(path.join(root, 'index.html')).href;

let failed = 0;
function ok(cond, msg) {
  if (cond) console.log('  ok  ' + msg);
  else { console.log('  FAIL ' + msg); failed++; }
}

async function open(qs) {
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(qs ? base + '?' + qs : base, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#blocks .pin[data-pin="106"]');
  return { page, errors, ctx };
}
function qOf(url) {
  return new URL(url).searchParams;
}

console.log('?pin=106 selects that ECM pin and keeps the query');
{
  const { page, errors } = await open('pin=106');
  const r = await page.evaluate(() => {
    const el = document.querySelector('#blocks .pin[data-pin="106"]');
    const sec = document.querySelector('#fichas .ficha[data-conn="ix_e11_f2"]')
      && document.querySelector('#fichas .ficha[data-conn="ix_e11_f2"]').closest('details.ficha-sec');
    return {
      hl: !!(el && el.classList.contains('hl')),
      key: window.selKey,
      info: (document.getElementById('info') || {}).textContent || '',
      secOpen: !!(sec && sec.open),
    };
  });
  const q = qOf(page.url());
  ok(errors.length === 0, 'pin=106 no pageerror ' + errors.join(' | '));
  ok(r.hl && r.key === 'pin:106' && /106/.test(r.info) && r.secOpen, `pin 106 lit, described, pedal group open (${JSON.stringify(r)})`);
  ok(q.get('pin') === '106' && !q.has('cav'), `query keeps pin=106 (${page.url()})`);
  await page.browserContext().close();
}

console.log('\n?pin=106&lang=en keeps English and the language canonical');
{
  const { page, errors } = await open('pin=106&lang=en');
  const r = await page.evaluate(() => ({
    lang: document.documentElement.lang,
    canon: document.getElementById('canonicalLink').href,
    hl: document.querySelector('#blocks .pin[data-pin="106"]').classList.contains('hl'),
  }));
  const q = qOf(page.url());
  ok(errors.length === 0 && r.lang === 'en' && r.hl, `lang en, pin lit (${JSON.stringify(r)})`);
  ok(q.get('pin') === '106' && q.get('lang') === 'en', `query keeps pin and lang (${page.url()})`);
  ok(!/pin=/.test(r.canon) && /lang=en/.test(r.canon), `canonical stays the language URL (${r.canon})`);
  await page.browserContext().close();
}

console.log('\n?cav= wins over ?pin=, and a click moves the query to the new cavity');
{
  const { page, errors } = await open('pin=106&cav=ix_e11_f2:10');
  const r = await page.evaluate(() => {
    const cav = document.querySelector('#fichas details.ficha-sec:not(.sel-top) .cav-hit[data-conn="ix_e11_f2"][data-cav="10"]');
    return { key: window.selKey, hl: !!(cav && cav.classList.contains('hl')), info: document.getElementById('info').textContent };
  });
  const q = qOf(page.url());
  ok(errors.length === 0 && r.key === 'cav:ix_e11_f2:10' && r.hl && !q.has('pin') && q.get('cav') === 'ix_e11_f2:10',
    `cav wins (${r.key}, hl ${r.hl}, ${page.url()})`);
  await page.evaluate(() => {
    const el = document.querySelector('#fichas details.ficha-sec:not(.sel-top) .cav-hit[data-conn="ix_e11_f2"][data-cav="5"]');
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  });
  const q2 = qOf(page.url());
  const key2 = await page.evaluate(() => window.selKey);
  ok(key2 === 'cav:ix_e11_f2:5' && q2.get('cav') === 'ix_e11_f2:5' && !q2.has('pin'),
    `click cavity 5 rewrites cav (${key2}, ${page.url()})`);
  await page.browserContext().close();
}

console.log('\nsecond click clears the pin from the page and from the query');
{
  const { page } = await open('pin=90');
  await page.click('#blocks .pin[data-pin="90"]');
  const r = await page.evaluate(() => ({
    key: window.selKey,
    hl: document.querySelector('#blocks .pin[data-pin="90"]').classList.contains('hl'),
  }));
  const q = qOf(page.url());
  ok(r.key == null && !r.hl && !q.has('pin') && !q.has('cav'), `cleared (${JSON.stringify(r)}, ${page.url()})`);
  await page.browserContext().close();
}

console.log('\na choice on a clean page writes ?cav=');
{
  const { page } = await open('');
  await page.evaluate(() => {
    const el = document.querySelector('#fichas details.ficha-sec:not(.sel-top) .cav-hit[data-conn="ix_e11_f2"][data-cav="10"]');
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  });
  const q = qOf(page.url());
  const key = await page.evaluate(() => window.selKey);
  ok(key === 'cav:ix_e11_f2:10' && q.get('cav') === 'ix_e11_f2:10', `clean click writes cav (${key}, ${page.url()})`);
  await page.browserContext().close();
}

console.log('\n?cav=top_b66:1 on the coupe says the card is off this car');
{
  const { page, errors } = await open('cav=top_b66:1');
  const r = await page.evaluate(() => ({
    info: document.getElementById('info').textContent,
    card: !!document.querySelector('.ficha[data-conn="top_b66"]'),
    key: window.selKey,
    hl: document.querySelectorAll('.hl, .hl-group, .hl-end').length,
  }));
  const q = qOf(page.url());
  ok(errors.length === 0 && !r.card && r.key == null && r.hl === 0 && /No está en el auto elegido/.test(r.info) && q.get('cav') === 'top_b66:1',
    `off-car message, query kept (${JSON.stringify(r)}, ${page.url()})`);
  await page.browserContext().close();
}

console.log('\nbad ids select nothing and do not throw');
{
  const { page, errors } = await open('pin=999&cav=no_such:1');
  const r = await page.evaluate(() => ({
    key: window.selKey,
    hl: document.querySelectorAll('#blocks .pin.hl, .cav-hit.hl').length,
  }));
  ok(errors.length === 0 && r.key == null && r.hl === 0, `bad cav ignored, pin not used as fallback (${JSON.stringify(r)})`);
  await page.close();
  const bad = await open('pin=abc');
  const r2 = await bad.page.evaluate(() => window.selKey);
  ok(bad.errors.length === 0 && r2 == null && qOf(bad.page.url()).get('pin') === 'abc', `pin=abc ignored (${bad.page.url()})`);
  await bad.page.browserContext().close();
}

console.log('\n?cav=jb_fuse_block:1 opens Fusibles without storing it');
{
  const { page, errors } = await open('cav=jb_fuse_block:1');
  const r = await page.evaluate(() => {
    const sec = document.querySelector('#fichas details.ficha-sec[data-sub="fuses"]');
    const cell = document.querySelector('#fichas details.ficha-sec:not(.sel-top) .cav-hit[data-conn="jb_fuse_block"][data-cav="1"]');
    return {
      open: !!(sec && sec.open),
      hl: !!(cell && (cell.classList.contains('hl') || cell.classList.contains('hl-end') || cell.classList.contains('hl-group'))),
      stored: localStorage.getItem('z33_sub_fuses'),
      key: window.selKey,
    };
  });
  ok(errors.length === 0 && r.open && r.hl && r.stored == null && r.key === 'cav:jb_fuse_block:1',
    `fuse group open, not stored (${JSON.stringify(r)})`);
  await page.browserContext().close();
}

console.log('\nF102·9H does not become the ECM 88 wire');
{
  const { page, errors } = await open('cav=ix_f102_m72:9H');
  const r = await page.evaluate(() => {
    const h = document.querySelector('#f102Blocks .pin[data-cav="9H"]');
    const p = document.querySelector('#blocks .pin[data-pin="88"]');
    return {
      key: window.selKey,
      hCls: h ? h.className : 'missing',
      pHl: !!(p && p.classList.contains('hl')),
      info: document.getElementById('info').textContent,
    };
  });
  const q = qOf(page.url());
  ok(errors.length === 0 && r.key == null && !/hl/.test(r.hCls) && !r.pHl && !/9H/.test(r.info) && q.get('cav') === 'ix_f102_m72:9H',
    `9H stays empty (${JSON.stringify(r)})`);
  await page.browserContext().close();
}

await browser.close();
if (failed) {
  console.error(failed + ' failed');
  process.exit(1);
}
console.log('share_link ok');
