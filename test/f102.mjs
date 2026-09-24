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

console.log('\nA/F pin 16 shows only the sensor ficha (not heater path)');
async function hlConns() {
  return page.evaluate(() => {
    const ids = new Set();
    document.querySelectorAll('.ficha.hl[data-conn], .ficha-wrap.hl[data-conn]').forEach((el) => {
      if (el.dataset.conn) ids.add(el.dataset.conn);
    });
    document.querySelectorAll('.ficha.hl').forEach((el) => {
      if (el.dataset.conn) ids.add(el.dataset.conn);
    });
    return [...ids].sort();
  });
}
await page.evaluate(() => { if (typeof clearSelection === 'function') clearSelection(); });
await clickPin(16);
{
  const ids = await hlConns();
  ok(ids.includes('af_b1'), `pin 16 includes A/F B1 (${ids.join(',')})`);
  ok(!ids.includes('ix_e108_m15') && !ids.includes('ix_e12_f3'), `pin 16 no heater intermediates (${ids.join(',')})`);
  ok(ids.filter((id) => !id.startsWith('feed_') && id !== 'jb_15a_ht').length === 1, `pin 16 one ficha (${ids.join(',')})`);
}
await page.evaluate(() => {
  const pwr = document.getElementById('railRelPower');
  pwr.checked = true;
  pwr.dispatchEvent(new Event('change', { bubbles: true }));
});
{
  const ids = await hlConns();
  ok(ids.includes('af_b1') && ids.includes('ix_e108_m15') && ids.includes('ix_e12_f3'), `pin 16 + Alim. heater path (${ids.join(',')})`);
}
await page.evaluate(() => {
  const pwr = document.getElementById('railRelPower');
  pwr.checked = false;
  pwr.dispatchEvent(new Event('change', { bubbles: true }));
});
{
  const ids = await hlConns();
  ok(ids.includes('af_b1') && !ids.includes('ix_e108_m15') && !ids.includes('ix_e12_f3'), `pin 16 Alim. off drops path (${ids.join(',')})`);
}
await page.evaluate(() => { if (typeof clearSelection === 'function') clearSelection(); });
await clickPin(2);
{
  const ids = await hlConns();
  ok(ids.includes('af_b1') && !ids.includes('ix_e12_f3'), `pin 2 heater control only (${ids.join(',')})`);
}
await page.evaluate(() => {
  const pwr = document.getElementById('railRelPower');
  pwr.checked = true;
  pwr.dispatchEvent(new Event('change', { bubbles: true }));
});
{
  const ids = await hlConns();
  ok(ids.includes('ix_e12_f3') || ids.includes('ix_e108_m15'), `pin 2 + Alim. 12V (${ids.join(',')})`);
}
await page.evaluate(() => {
  const pwr = document.getElementById('railRelPower');
  pwr.checked = false;
  pwr.dispatchEvent(new Event('change', { bubbles: true }));
});
await page.evaluate(() => { if (typeof clearSelection === 'function') clearSelection(); });
await clickPin(2);
{
  const ids = await hlConns();
  ok(ids.includes('af_b1'), `pin 2 still A/F (${ids.join(',')})`);
}

console.log('\nECM 116 opens F103 4-pin grounds (not BATT)');
await page.evaluate(() => {
  const g = document.getElementById('railRelGnd');
  if (g && !g.checked) { g.checked = true; g.dispatchEvent(new Event('change', { bubbles: true })); }
});
await page.evaluate(() => { if (typeof clearSelection === 'function') clearSelection(); });
await clickPin(116);
{
  const ids = await hlConns();
  ok(ids.includes('gnd4'), `pin 116 includes F103/gnd4 (${ids.join(',')})`);
  ok(!ids.includes('batt_feed'), `pin 116 is not BATT feed (${ids.join(',')})`);
  ok(await pinMarked(116), '116 marked');
  /* afc4143: 1/115/116 are separate F103 wires — 116 must not pull 1/115 into the selection */
  ok(!(await pinMarked(1)) && !(await pinMarked(115)), '1 and 115 stay isolated from 116 pack');
}

console.log('\nECM 117 vent control vs 12V path');
await page.evaluate(() => {
  const pwr = document.getElementById('railRelPower');
  if (pwr && pwr.checked) { pwr.checked = false; pwr.dispatchEvent(new Event('change', { bubbles: true })); }
});
await page.evaluate(() => { if (typeof clearSelection === 'function') clearSelection(); });
await clickPin(117);
{
  const ids = await hlConns();
  ok(ids.includes('evap_vent') && ids.includes('ix_t2_b44') && ids.includes('ix_b1_m12'), `pin 117 control path (${ids.join(',')})`);
  ok(await f102Open(), 'pin 117 opens F102 (29H)');
  ok(!ids.includes('ipdm_e7') && !ids.includes('ix_e106_b2') && !ids.includes('ix_b43_t1'), `pin 117 no 12V intermediates (${ids.join(',')})`);
}
await page.evaluate(() => {
  const pwr = document.getElementById('railRelPower');
  pwr.checked = true;
  pwr.dispatchEvent(new Event('change', { bubbles: true }));
});
{
  const ids = await hlConns();
  ok(ids.includes('ipdm_e7') && ids.includes('ix_e106_b2'), `pin 117 + Alim. 12V path (${ids.join(',')})`);
}

console.log('\nECM 6 HO2S B2 heater control vs 12V');
await page.evaluate(() => {
  const pwr = document.getElementById('railRelPower');
  if (pwr && pwr.checked) { pwr.checked = false; pwr.dispatchEvent(new Event('change', { bubbles: true })); }
});
await page.evaluate(() => { if (typeof clearSelection === 'function') clearSelection(); });
await clickPin(6);
{
  const ids = await hlConns();
  ok(ids.includes('ho2s_b2'), `pin 6 includes HO2S B2 (${ids.join(',')})`);
  ok(!ids.includes('ix_e108_m15') && !ids.includes('ix_e12_f3'), `pin 6 no 12V intermediates (${ids.join(',')})`);
}
await page.evaluate(() => {
  const pwr = document.getElementById('railRelPower');
  pwr.checked = true;
  pwr.dispatchEvent(new Event('change', { bubbles: true }));
});
{
  const ids = await hlConns();
  ok(ids.includes('ix_e12_f3') || ids.includes('ix_e108_m15'), `pin 6 + Alim. 12V path (${ids.join(',')})`);
}
await page.evaluate(() => {
  const pwr = document.getElementById('railRelPower');
  pwr.checked = false;
  pwr.dispatchEvent(new Event('change', { bubbles: true }));
});
await page.evaluate(() => {
  const pwr = document.getElementById('railRelPower');
  pwr.checked = false;
  pwr.dispatchEvent(new Event('change', { bubbles: true }));
});

console.log('\nVB 119/120 are separate wires (not one IGN feed)');
await page.evaluate(() => {
  const pwr = document.getElementById('railRelPower');
  if (pwr && pwr.checked) { pwr.checked = false; pwr.dispatchEvent(new Event('change', { bubbles: true })); }
});
await page.evaluate(() => { if (typeof clearSelection === 'function') clearSelection(); });
await clickPin(119);
ok(await pinMarked(119), 'pin 119 marked');
ok(!(await pinMarked(120)), 'pin 120 not grouped with 119');
{
  const ids = await hlConns();
  ok(ids.includes('ix_e12_f3'), `pin 119 includes F3 (${ids.join(',')})`);
  ok(!ids.includes('ipdm_e7'), `pin 119 no IPDM E7 without Alim. (${ids.join(',')})`);
}
await page.evaluate(() => {
  const pwr = document.getElementById('railRelPower');
  pwr.checked = true;
  pwr.dispatchEvent(new Event('change', { bubbles: true }));
});
{
  const ids = await hlConns();
  ok(ids.includes('ipdm_e7'), `pin 119 + Alim. E7-18 (${ids.join(',')})`);
}
await page.evaluate(() => {
  const pwr = document.getElementById('railRelPower');
  pwr.checked = false;
  pwr.dispatchEvent(new Event('change', { bubbles: true }));
});
await page.evaluate(() => { if (typeof clearSelection === 'function') clearSelection(); });
await clickPin(120);
ok(await pinMarked(120), 'pin 120 marked');
ok(!(await pinMarked(119)), 'pin 119 not grouped with 120');

console.log('\nInjectors/coils: F3/F102 only with Alim.');
await page.evaluate(() => { if (typeof clearSelection === 'function') clearSelection(); });
await clickPin(21);
{
  const ids = await hlConns();
  ok(ids.includes('inj5') && ids.includes('ix_f221_f33'), `pin 21 inj5+F33 (${ids.join(',')})`);
  ok(!ids.includes('ix_e12_f3'), `pin 21 no F3 (${ids.join(',')})`);
  ok(!(await f102Open()), 'pin 21 F102 collapsed');
}
await page.evaluate(() => {
  const pwr = document.getElementById('railRelPower');
  pwr.checked = true;
  pwr.dispatchEvent(new Event('change', { bubbles: true }));
});
ok(await f102Open(), 'pin 21 + Alim. opens F102 17H');
await page.evaluate(() => {
  const pwr = document.getElementById('railRelPower');
  pwr.checked = false;
  pwr.dispatchEvent(new Event('change', { bubbles: true }));
});
await page.evaluate(() => { if (typeof clearSelection === 'function') clearSelection(); });
await clickPin(62);
{
  const ids = await hlConns();
  ok(ids.includes('coil1'), `pin 62 coil1 (${ids.join(',')})`);
  ok(!ids.includes('ix_e12_f3'), `pin 62 no F3 (${ids.join(',')})`);
}
await page.evaluate(() => {
  const pwr = document.getElementById('railRelPower');
  pwr.checked = true;
  pwr.dispatchEvent(new Event('change', { bubbles: true }));
});
{
  const ids = await hlConns();
  ok(ids.includes('ix_e12_f3'), `pin 62 + Alim. F3 (${ids.join(',')})`);
}
await page.evaluate(() => {
  const pwr = document.getElementById('railRelPower');
  pwr.checked = false;
  pwr.dispatchEvent(new Event('change', { bubbles: true }));
});


console.log('\nBrowser rail stay-in-selection (click hl-rail stays in rail mode)');
await page.evaluate(() => { if (typeof clearSelection === 'function') clearSelection(); });
/* Prefer 5V — several ECM pins tagged PIN_RAIL 5v with clear hl-rail. */
await page.click('#rail5v');
await page.waitForFunction(() => {
  const btn = document.getElementById('rail5v');
  return btn && btn.classList.contains('on')
    && typeof activeRails !== 'undefined' && activeRails.has('5v')
    && document.querySelectorAll('#blocks .pin.hl-rail').length >= 2;
});
{
  const before = await page.evaluate(() => ({
    activeRails: typeof activeRails !== 'undefined' ? activeRails.size : 0,
    hlRail: document.querySelectorAll('#blocks .pin.hl-rail').length,
    railOn: document.getElementById('rail5v')?.classList.contains('on') || false,
    railPins: [...document.querySelectorAll('#blocks .pin.hl-rail')].map((el) => el.dataset.pin),
  }));
  ok(before.activeRails > 0, `5V rail active (activeRails=${before.activeRails})`);
  ok(before.hlRail >= 2, `≥2 hl-rail pins after 5V filter (${before.hlRail})`);
  ok(before.railOn, 'rail5v button .on');
  const pinA = before.railPins[0];
  const pinB = before.railPins.find((p) => p !== pinA);
  ok(!!pinA && !!pinB, `two distinct rail pins ${pinA} / ${pinB}`);

  await page.click(`#blocks .pin[data-pin="${pinA}"]`);
  await page.waitForFunction((n) => {
    const el = document.querySelector(`#blocks .pin[data-pin="${n}"]`);
    return el && el.classList.contains('hl');
  }, {}, pinA);

  const after1 = await page.evaluate((n) => ({
    activeRails: typeof activeRails !== 'undefined' ? activeRails.size : 0,
    has5v: typeof activeRails !== 'undefined' && activeRails.has('5v'),
    hlRail: document.querySelectorAll('#blocks .pin.hl-rail').length,
    focusHl: document.querySelector(`#blocks .pin[data-pin="${n}"]`)?.classList.contains('hl') || false,
    focusStillRail: document.querySelector(`#blocks .pin[data-pin="${n}"]`)?.classList.contains('hl-rail') || false,
    railOn: document.getElementById('rail5v')?.classList.contains('on') || false,
    railMode: document.getElementById('info')?.dataset.railMode === '1',
  }), pinA);
  ok(after1.activeRails > 0 && after1.has5v, `after click ${pinA}: activeRails still set (${after1.activeRails}, has5v=${after1.has5v})`);
  ok(after1.hlRail >= 2, `after click ${pinA}: multiple .pin.hl-rail still present (${after1.hlRail})`);
  ok(after1.focusHl, `after click ${pinA}: focus pin has .hl (yellow)`);
  ok(after1.railOn, `after click ${pinA}: rail5v still .on`);
  ok(after1.railMode || after1.focusStillRail, `after click ${pinA}: still rail mode (railMode=${after1.railMode}, focusStillRail=${after1.focusStillRail})`);

  await page.click(`#blocks .pin[data-pin="${pinB}"]`);
  await page.waitForFunction((n) => {
    const el = document.querySelector(`#blocks .pin[data-pin="${n}"]`);
    return el && el.classList.contains('hl');
  }, {}, pinB);

  const after2 = await page.evaluate((a, b) => ({
    activeRails: typeof activeRails !== 'undefined' ? activeRails.size : 0,
    has5v: typeof activeRails !== 'undefined' && activeRails.has('5v'),
    hlRail: document.querySelectorAll('#blocks .pin.hl-rail').length,
    focusB: document.querySelector(`#blocks .pin[data-pin="${b}"]`)?.classList.contains('hl') || false,
    aStillYellow: document.querySelector(`#blocks .pin[data-pin="${a}"]`)?.classList.contains('hl') || false,
    railOn: document.getElementById('rail5v')?.classList.contains('on') || false,
  }), pinA, pinB);
  ok(after2.activeRails > 0 && after2.has5v, `after click ${pinB}: activeRails still set (${after2.activeRails})`);
  ok(after2.hlRail >= 2, `after click ${pinB}: multiple .pin.hl-rail still present (${after2.hlRail})`);
  ok(after2.focusB, `after click ${pinB}: focus moved (pin ${pinB} has .hl)`);
  ok(!after2.aStillYellow, `after click ${pinB}: previous focus ${pinA} no longer sole yellow (.hl=${after2.aStillYellow})`);
  ok(after2.railOn, `after click ${pinB}: rail5v still .on`);
}
await page.evaluate(() => { if (typeof clearSelection === 'function') clearSelection(); });
/* turn 5V off so later suites are not affected if this file gains more tests */
await page.evaluate(() => {
  if (typeof activeRails !== 'undefined' && activeRails.has('5v')) {
    const btn = document.getElementById('rail5v');
    if (btn) btn.click();
  }
});

await browser.close();
if (failed) {
  console.log(`\n${failed} failed`);
  process.exit(1);
}
console.log('\nall F102 collapse checks passed');
