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
  ];
  for (const dir of candidates) {
    try { return require(dir); } catch { /* next */ }
  }
  throw new Error('puppeteer-core not found');
}
function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
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
const page = await browser.newPage();
await page.goto(pathToFileURL(path.join(root, 'index.html')).href, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('#blocks .pin[data-pin="66"]');

let failed = 0;
function ok(cond, msg) {
  if (cond) console.log('  ok  ' + msg);
  else { console.log('  FAIL ' + msg); failed++; }
}

async function clickPin(n) {
  await page.click(`#blocks .pin[data-pin="${n}"]`);
  await page.waitForFunction((n) => {
    const el = document.querySelector(`#blocks .pin[data-pin="${n}"]`);
    return el && (el.classList.contains('hl') || el.classList.contains('hl-group'));
  }, {}, n);
}

async function f102Open() {
  return page.$eval('#f102Panel', (el) => el.open);
}

console.log('F102 collapses when the clicked ECM pin is not on the SMJ');
for (const n of [66, 70, 12, 50, 4]) {
  await page.evaluate(() => { if (typeof clearSelection === 'function') clearSelection(); });
  await clickPin(n);
  const open = await f102Open();
  ok(!open, `pin ${n} → F102 collapsed` + (open ? ' (still open)' : ''));
}

console.log('\nF102 opens when the clicked ECM pin is on F102');
for (const n of [67, 32, 101, 109]) {
  await page.evaluate(() => { if (typeof clearSelection === 'function') clearSelection(); });
  await clickPin(n);
  const open = await f102Open();
  ok(open, `pin ${n} → F102 open` + (open ? '' : ' (collapsed)'));
}

console.log('\nidle / clear → F102 open');
await page.evaluate(() => { if (typeof clearSelection === 'function') clearSelection(); });
ok(await f102Open(), 'clearSelection opens F102');

console.log('\nCMP B1/B2 are separate (14 does not light 33)');
await page.evaluate(() => {
  const d = document.getElementById('railRelData');
  if (d && !d.checked) { d.checked = true; d.dispatchEvent(new Event('change', { bubbles: true })); }
});
await page.evaluate(() => { if (typeof clearSelection === 'function') clearSelection(); });
async function pinMarked(n) {
  return page.$eval(`#blocks .pin[data-pin="${n}"]`, (el) =>
    el.classList.contains('hl') || el.classList.contains('hl-group') || el.classList.contains('hl-end'));
}
await clickPin(14);
ok(await pinMarked(14), 'pin 14 marked');
ok(!(await pinMarked(33)), 'pin 33 not marked with 14');
await page.evaluate(() => { if (typeof clearSelection === 'function') clearSelection(); });
await clickPin(33);
ok(await pinMarked(33), 'pin 33 marked');
ok(!(await pinMarked(14)), 'pin 14 not marked with 33');

console.log('\nSNS 66 not grouped with 67/78; HO2S banks stay split; APP same ficha still paired');
await page.evaluate(() => {
  const g = document.getElementById('railRelGnd');
  const d = document.getElementById('railRelData');
  if (g && !g.checked) { g.checked = true; g.dispatchEvent(new Event('change', { bubbles: true })); }
  if (d && !d.checked) { d.checked = true; d.dispatchEvent(new Event('change', { bubbles: true })); }
});
await page.evaluate(() => { if (typeof clearSelection === 'function') clearSelection(); });
await clickPin(66);
ok(await pinMarked(66), 'pin 66 marked');
ok(!(await pinMarked(67)), 'pin 67 not sibling of 66');
ok(!(await pinMarked(78)), 'pin 78 not sibling of 66');
await page.evaluate(() => { if (typeof clearSelection === 'function') clearSelection(); });
await clickPin(74);
ok(await pinMarked(74), 'pin 74 HO2S B1 marked');
ok(!(await pinMarked(55)), 'pin 55 HO2S B2 not sibling of 74');
await page.evaluate(() => { if (typeof clearSelection === 'function') clearSelection(); });
await clickPin(106);
ok(await pinMarked(106), 'pin 106 APS1 marked');
ok(await pinMarked(98), 'pin 98 APS2 still sibling (same APP ficha)');

console.log('\nToggling Datos keeps pin 15 selection');
await page.evaluate(() => { if (typeof clearSelection === 'function') clearSelection(); });
await clickPin(15);
ok(await pinMarked(15), 'pin 15 selected');
await page.evaluate(() => {
  const d = document.getElementById('railRelData');
  d.checked = false;
  d.dispatchEvent(new Event('change', { bubbles: true }));
});
ok(await pinMarked(15), 'pin 15 still selected after Datos off');
const infoAfter = await page.$eval('#info', (el) => el.dataset.locked === '1' && (el.textContent || '').length > 10);
ok(infoAfter, 'info panel still locked after Datos off');
await page.evaluate(() => {
  const d = document.getElementById('railRelData');
  d.checked = true;
  d.dispatchEvent(new Event('change', { bubbles: true }));
});
ok(await pinMarked(15), 'pin 15 still selected after Datos on');

console.log('\nClick sibling keeps group; only yellow moves');
await page.evaluate(() => {
  const g = document.getElementById('railRelGnd');
  const d = document.getElementById('railRelData');
  if (g && !g.checked) { g.checked = true; g.dispatchEvent(new Event('change', { bubbles: true })); }
  if (d && !d.checked) { d.checked = true; d.dispatchEvent(new Event('change', { bubbles: true })); }
});
await page.evaluate(() => { if (typeof clearSelection === 'function') clearSelection(); });
await clickPin(15);
ok(await pinMarked(15), 'knock 15 selected');
ok(await pinMarked(116), 'knock shield 116 in group');
await clickPin(116);
ok(await pinMarked(15), '15 still in group after clicking 116');
ok(await pinMarked(116), '116 still marked (now yellow)');
ok(!(await pinMarked(1)), 'ECM ground 1 not added (did not switch to gnd_ecm)');
ok(!(await pinMarked(115)), 'ECM ground 115 not added');
await page.click('#blocks .pin[data-pin="116"]');
const infoEmpty = await page.$eval('#info', (el) => el.dataset.locked !== '1');
ok(!(await pinMarked(15)) && infoEmpty, 'second click on yellow 116 clears');

await page.evaluate(() => { if (typeof clearSelection === 'function') clearSelection(); });
await clickPin(32);
ok(await pinMarked(32) && await pinMarked(67), 'EVAP 32+67');
await clickPin(67);
ok(await pinMarked(32), '32 still in group after clicking 67');
ok(!(await pinMarked(70)), 'A/C 70 not added (did not switch to ac_press)');

await browser.close();
if (failed) {
  console.log(`\n${failed} failed`);
  process.exit(1);
}
console.log('\nall F102 collapse checks passed');
