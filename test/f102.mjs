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

console.log('\nECM grounds 1/115/116 → F103/F151 cav 3/2/4 → F152 (EC-169), never E17');
async function cavState(cid, cav) {
  return page.evaluate((cid, cav) => {
    const els = [...document.querySelectorAll(`.cav-hit[data-conn="${cid}"][data-cav="${cav}"]`)];
    return {
      n: els.length,
      hl: els.some((el) => el.classList.contains('hl')),
      marked: els.some((el) => el.classList.contains('hl') || el.classList.contains('hl-group') || el.classList.contains('hl-end')),
    };
  }, cid, cav);
}
for (const [pin, cav] of [[116, '4'], [115, '2'], [1, '3']]) {
  await page.evaluate(() => { if (typeof clearSelection === 'function') clearSelection(); });
  await clickPin(pin);
  const ids = await hlConns();
  ok(ids.includes('gnd4') && ids.includes('f152'), `pin ${pin} opens F103/gnd4 + F152 (${ids.join(',')})`);
  ok(!ids.includes('e17'), `pin ${pin} does NOT mark E17 (${ids.join(',')})`);
  const c = await cavState('gnd4', cav);
  ok(c.n > 0 && c.hl, `pin ${pin} → gnd4 cav ${cav} yellow (n=${c.n})`);
  const c1 = await cavState('gnd4', '1');
  ok(c1.n > 0 && !c1.marked, `pin ${pin} → gnd4 cav 1 (F3·6/E17 link) not marked`);
  const r = await cavState('f152', 'ring');
  ok(r.marked, `pin ${pin} → F152 ring marked`);
  const e = await cavState('e17', 'ring');
  ok(!e.marked, `pin ${pin} → E17 ring not marked`);
  for (const other of ['1', '2', '3', '4'].filter((x) => x !== cav)) {
    const o = await cavState('gnd4', other);
    ok(!o.marked, `pin ${pin} → gnd4 cav ${other} not marked`);
  }
}
{
  const ids = await page.evaluate(() => [...document.querySelectorAll('.cav-hit[data-conn="gnd4"]')].map((el) => el.dataset.cav));
  ok(ids.length > 0 && ids.every((x) => ['1', '2', '3', '4'].includes(x)), `gnd4 rendered cavities are 1-4 only (${[...new Set(ids)].join(',')})`);
}
await page.evaluate(() => { if (typeof clearSelection === 'function') clearSelection(); });
await page.evaluate(() => { if (typeof selectConnPin === 'function') selectConnPin('gnd4', '1'); });
{
  const ids = await hlConns();
  ok(ids.includes('e17') && ids.includes('f152') && ids.includes('ix_e12_f3'), `gnd4 cav 1 → F152 ↔ F3·6 ↔ E17 bond (${ids.join(',')})`);
  ok(!(await pinMarked(1)) && !(await pinMarked(115)) && !(await pinMarked(116)), 'gnd4 cav 1 bond marks no ECM ground pin');
}
await page.evaluate(() => { if (typeof clearSelection === 'function') clearSelection(); });
await page.evaluate(() => {
  const sel = document.getElementById('loomView');
  sel.value = 'motor';
  sel.dispatchEvent(new Event('change', { bubbles: true }));
});
{
  const vis = await page.evaluate(() => {
    const el = document.querySelector('#fichas [data-conn="f152"]');
    return !!el && el.getClientRects().length > 0;
  });
  ok(vis, 'F152 ficha visible in Arnès motor view');
  await clickPin(116);
  const ids = await hlConns();
  ok(ids.includes('f152') && !ids.includes('e17'), `Arnès motor: pin 116 → F152, not E17 (${ids.join(',')})`);
}
{
  /* Body/rear items stay out of Arnès motor: IPDM, E108, JB fuses, and the tank-side EVAP/fuel fichas
     (T21 EVAP pressure, T20 vent: Tail harness PG-63 · B27 fuel pump: body). E11/F2 is a PG-55 battery-tray
     mate (LOOM_MOTOR_KEEP) and stays. */
  const shown = await page.evaluate(() => [...document.querySelectorAll('#fichas [data-conn]')]
    .filter((el) => el.getClientRects().length > 0).map((el) => el.dataset.conn));
  const hidden = ['evap_press', 'evap_vent', 'fuel_pump', 'fuel_tank_temp', 'ix_t2_b44', 'ix_b1_m12',
    'ipdm_e7', 'ipdm_e8', 'ix_e108_m15', 'jb_10a_inj', 'jb_15a_ht'];
  const leak = hidden.filter((id) => shown.includes(id));
  ok(leak.length === 0, `Arnès motor hides body/rear fichas incl. EVAP T21/T20 + fuel pump (leak: ${leak.join(',') || 'none'})`);
  ok(shown.includes('ix_e11_f2') && shown.includes('evap_purge'), 'Arnès motor keeps E11/F2 and F5 EVAP purge (engine loom)');
  await page.evaluate(() => { if (typeof clearSelection === 'function') clearSelection(); });
  await clickPin(32);
  const ids = await hlConns();
  ok(await pinMarked(32), 'Arnès motor: ECM 32 (EVAP press SIG) still selectable on the ECM side');
  ok(!ids.includes('evap_press') && !ids.includes('ix_t2_b44') && !ids.includes('ix_b1_m12'),
    `Arnès motor: ECM 32 lights no rear EVAP ficha (${ids.join(',')})`);
  await page.evaluate(() => { if (typeof clearSelection === 'function') clearSelection(); });
}
await page.evaluate(() => {
  const sel = document.getElementById('loomView');
  sel.value = 'all';
  sel.dispatchEvent(new Event('change', { bubbles: true }));
});
await page.evaluate(() => { if (typeof clearSelection === 'function') clearSelection(); });
await clickPin(32);
{
  const ids = await hlConns();
  ok(ids.includes('evap_press') && ids.includes('ix_t2_b44') && ids.includes('ix_b1_m12'),
    `Completo: ECM 32 still lights T21 EVAP press + T2/B44 + B1/M12 path (${ids.join(',')})`);
}
await page.evaluate(() => { if (typeof clearSelection === 'function') clearSelection(); });

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

console.log('\nPNP per transmission (EC-646 M/T F35 → F103·3 → F152; EC-644 A/T via F102·28H)');
async function setTrans(v) {
  await page.select('#transView', v);
  await page.waitForFunction((v) => typeof transView === 'function' && transView() === v, {}, v);
}
async function routeTags() {
  return page.$$eval('#info .path-route', (els) => els.map((e) => ({ rail: e.dataset.rail, text: e.innerText.replace(/\s+/g, ' ') })));
}
await setTrans('mt');
await page.evaluate(() => { if (typeof clearSelection === 'function') clearSelection(); });
{
  const st = await page.evaluate(() => {
    const p28 = f102PinEl('28H');
    const p23 = f102PinEl('23H');
    return {
      f35: !!document.querySelector('#fichas [data-conn="f35_pnp"]'),
      f6: !!document.querySelector('#fichas [data-conn="f6_at"]'),
      p28Empty: !!p28 && p28.classList.contains('empty') && !p28.dataset.ecm,
      p23Empty: !!p23 && p23.classList.contains('empty'),
      circs: CIRCUITS.filter((c) => /^pnp/.test(c.id)).map((c) => c.id),
    };
  });
  ok(st.f35 && !st.f6, `Manual: F35 PNP ficha shown, F6 A/T hidden (f35=${st.f35}, f6=${st.f6})`);
  ok(st.p28Empty, 'Manual: F102·28H empty (ECM 102 does not use F102 on M/T, EC-646)');
  ok(st.p23Empty, 'Manual: F102·23H empty (START GY/R is A/T only, EC-644)');
  ok(JSON.stringify(st.circs) === JSON.stringify(['pnp_mt', 'pnp_mt_gnd']), `Manual: only pnp_mt + pnp_mt_gnd circuits (${st.circs.join(',')})`);
}
await clickPin(102);
{
  ok(!(await f102Open()), 'Manual: pin 102 → F102 collapsed');
  const tags = await routeTags();
  ok(!tags.some((x) => x.rail === 'gnd' || x.rail === '12v'), `Manual: pin 102 route has no GND/12V tag (${JSON.stringify(tags)})`);
  ok(tags.some((x) => x.rail === 'sig' && /F35·1/.test(x.text)), `Manual: pin 102 route tagged signal F35·1 (${JSON.stringify(tags)})`);
  const lit = await page.evaluate(() => [...document.querySelectorAll('.cav-hit.hl, .cav-hit.hl-group, .cav-hit.hl-end')].map((c) => c.dataset.conn + '·' + c.dataset.cav));
  ok(lit.includes('f35_pnp·1'), `Manual: F35·1 lit for ECM 102 (${lit.join(',')})`);
  ok(!lit.includes('f35_pnp·2') && !lit.some((x) => /^gnd4·|^f152·/.test(x)), `Manual: pin 102 does not mark F35·2 / F103 / F152 (${lit.join(',')})`);
  const fichHl = await page.evaluate(() => ['f35_pnp', 'gnd4', 'f152'].map((c) => {
    const el = document.querySelector(`#fichas [data-conn="${c}"]`);
    return !!el && !el.classList.contains('dim') && (el.classList.contains('hl') || el.classList.contains('sel') || el.classList.contains('hl-group'));
  }));
  ok(fichHl[0] && !fichHl[1] && !fichHl[2], `Manual: pin 102 → F35 card on, F103/F152 cards off (${JSON.stringify(fichHl)})`);
}
await page.evaluate(() => { clearSelection(); selectConnPin('f35_pnp', '2'); });
{
  const tags = await routeTags();
  ok(tags.some((x) => x.rail === 'gnd' && /F35·2/.test(x.text) && /F103·3/.test(x.text) && /F152/.test(x.text) && !/E17/.test(x.text)),
    `Manual: F35·2 click → GND F35·2 → F103·3 → F152 (${JSON.stringify(tags)})`);
  const lit = await page.evaluate(() => [...document.querySelectorAll('.cav-hit.hl, .cav-hit.hl-group, .cav-hit.hl-end')].map((c) => c.dataset.conn + '·' + c.dataset.cav));
  ok(lit.includes('gnd4·3') && lit.includes('f152·ring'), `Manual: F35·2 click marks F103·3 + F152 (${lit.join(',')})`);
  ok(!(await page.$eval('#blocks .pin[data-pin="102"]', (el) => el.classList.contains('hl'))), 'Manual: F35·2 click does not focus ECM 102 (related data sibling only)');
}
await page.evaluate(() => { clearSelection(); toggleRail('gnd'); });
{
  const st = await page.evaluate(() => {
    const cls = (cid, cav) => [...document.querySelectorAll(`.cav-hit[data-conn="${cid}"][data-cav="${cav}"]`)]
      .some((el) => el.classList.contains('hl-rail') || el.classList.contains('hl-rail-rel-gnd'));
    return { f35_2: cls('f35_pnp', '2'), f35_1: cls('f35_pnp', '1'), g3: cls('gnd4', '3'), f152: cls('f152', 'ring') };
  });
  ok(st.f35_2 && st.g3 && st.f152 && !st.f35_1, `Manual + Masa: F35·2 → F103·3 → F152 shown, F35·1 SIG not (${JSON.stringify(st)})`);
}
await page.evaluate(() => { toggleRail('gnd'); clearSelection(); });
await setTrans('at');
await page.evaluate(() => { if (typeof clearSelection === 'function') clearSelection(); });
{
  const st = await page.evaluate(() => ({
    f35: !!document.querySelector('#fichas [data-conn="f35_pnp"]'),
    f6: !!document.querySelector('#fichas [data-conn="f6_at"]'),
    p28: f102PinEl('28H')?.dataset.ecm || null,
    circs: CIRCUITS.filter((c) => /^pnp/.test(c.id)).map((c) => c.id),
  }));
  ok(!st.f35 && st.f6, `Automático: F35 hidden, F6 A/T shown (f35=${st.f35}, f6=${st.f6})`);
  ok(st.p28 === '102', `Automático: F102·28H → ECM 102 (${st.p28})`);
  ok(JSON.stringify(st.circs) === JSON.stringify(['pnp_at']), `Automático: only pnp_at circuit (${st.circs.join(',')})`);
}
await clickPin(102);
{
  ok(await f102Open(), 'Automático: pin 102 → F102 open (28H)');
  const hl28 = await page.evaluate(() => { const p = f102PinEl('28H'); return !!p && (p.classList.contains('hl') || p.classList.contains('hl-group')); });
  ok(hl28, 'Automático: F102·28H highlighted for ECM 102');
  const tags = await routeTags();
  ok(!tags.some((x) => x.rail === 'gnd' || x.rail === '12v'), `Automático: PNP route is not tagged GND/12V (${JSON.stringify(tags)})`);
  ok(tags.some((x) => x.rail === 'sig' && /28H/.test(x.text)), 'Automático: PNP route tagged signal via F102·28H');
}
await setTrans('mt');
await page.evaluate(() => { if (typeof clearSelection === 'function') clearSelection(); });

console.log('\nRoute tag follows circuit rail (ECM 116 = GND, coil = 12V) + knock shield text');
for (const [lang, gndTxt, pwrTxt] of [['es', 'Masa', 'Alim. 12V'], ['en', 'Ground', 'Power 12V'], ['ja', 'アース', '電源 12V']]) {
  await page.select('#lang', lang);
  await page.evaluate(() => { if (typeof clearSelection === 'function') clearSelection(); });
  await clickPin(116);
  const t116 = await routeTags();
  ok(t116.length > 0 && t116.every((x) => x.rail === 'gnd') && t116[0].text.startsWith(gndTxt) && /F103·4/.test(t116[0].text) && /F152/.test(t116[0].text),
    `${lang}: pin 116 route tag "${gndTxt}" F103·4 → F152 (${JSON.stringify(t116)})`);
  ok(!t116.some((x) => x.text.includes(pwrTxt)), `${lang}: pin 116 has no "${pwrTxt}" tag`);
  await page.evaluate(() => { if (typeof clearSelection === 'function') clearSelection(); });
  await clickPin(62);
  const t62 = await routeTags();
  ok(t62.some((x) => x.rail === '12v' && x.text.startsWith(pwrTxt)), `${lang}: coil pin 62 keeps "${pwrTxt}" tag`);
  await page.evaluate(() => { if (typeof clearSelection === 'function') clearSelection(); });
  await clickPin(15);
  const info15 = await page.$eval('#info', (el) => el.innerText);
  ok(!/SNS GND/.test(info15) && /116/.test(info15) && /F152/.test(info15), `${lang}: knock (15) shield → ECM 116 B/R → F152, no SNS GND`);
}
await page.select('#lang', 'es');
await page.evaluate(() => { if (typeof clearSelection === 'function') clearSelection(); });

console.log('\nEVT position sensors F38/F42 (Rev-Up only, EC-445/447)');
{
  const evtState = () => page.evaluate(() => ({
    p53: !document.querySelector('#blocks .pin[data-pin="53"]').classList.contains('unused'),
    p72: !document.querySelector('#blocks .pin[data-pin="72"]').classList.contains('unused'),
    f38: !!document.querySelector('#fichas [data-conn="f38_evtc_b1"]'),
    f42: !!document.querySelector('#fichas [data-conn="f42_evtc_b2"]'),
  }));
  const e0 = await evtState();
  ok(!e0.p53 && !e0.p72 && !e0.f38 && !e0.f42, `sin VTC escape: ECM 53/72 unused, F38/F42 hidden (${JSON.stringify(e0)})`);
  await page.select('#model', 'de_revup');
  await page.waitForSelector('#fichas [data-conn="f38_evtc_b1"]');
  const e1 = await evtState();
  ok(e1.p53 && e1.p72 && e1.f38 && e1.f42, `Rev-Up: ECM 53/72 active, F38/F42 shown (${JSON.stringify(e1)})`);
  for (const [n, cid] of [[53, 'f38_evtc_b1'], [72, 'f42_evtc_b2']]) {
    await page.evaluate(() => { if (typeof clearSelection === 'function') clearSelection(); });
    await clickPin(n);
    const lit = await page.evaluate(() => [...new Set([...document.querySelectorAll('.cav-hit.hl, .cav-hit.hl-group, .cav-hit.hl-end')].map((c) => c.dataset.conn + '·' + c.dataset.cav))]);
    ok(lit.includes(cid + '·2') && !lit.includes(cid + '·1') && !lit.includes(cid + '·3') && !lit.some((x) => /^gnd4·|^f152·/.test(x)),
      `ECM ${n} lights only ${cid}·2 SIG (no ·1 GND / F103 / F152) (${lit.join(',')})`);
    const tags = await routeTags();
    ok(!tags.some((x) => x.rail === 'gnd' || x.rail === '12v'), `ECM ${n} route has no GND/12V tag (${JSON.stringify(tags)})`);
    await page.evaluate((cid) => { clearSelection(); selectConnPin(cid, '1'); }, cid);
    const tg = await routeTags();
    ok(tg.some((x) => x.rail === 'gnd' && /F103·3/.test(x.text) && /F152/.test(x.text)), `${cid}·1 click → GND F103·3 → F152 (${JSON.stringify(tg)})`);
    ok(!(await page.$eval(`#blocks .pin[data-pin="${n}"]`, (el) => el.classList.contains('hl'))), `${cid}·1 click does not focus ECM ${n}`);
  }
  await page.evaluate(() => { clearSelection(); toggleRail('gnd'); });
  {
    const st = await page.evaluate(() => {
      const on = (cid, cav) => [...document.querySelectorAll(`.cav-hit[data-conn="${cid}"][data-cav="${cav}"]`)]
        .some((el) => el.classList.contains('hl-rail') || el.classList.contains('hl-rail-rel-gnd'));
      return { b1g: on('f38_evtc_b1', '1'), b2g: on('f42_evtc_b2', '1'), b1s: on('f38_evtc_b1', '2'), b1p: on('f38_evtc_b1', '3') };
    });
    ok(st.b1g && st.b2g && !st.b1s && !st.b1p, `Rev-Up + Masa: F38·1/F42·1 ground returns shown, SIG/12V cavities not (${JSON.stringify(st)})`);
  }
  await page.evaluate(() => { toggleRail('gnd'); clearSelection(); });
  {
    const oil = await page.evaluate(() => ({
      f242: !!document.querySelector('#fichas [data-conn="f242_eot"]'),
      f232: !!document.querySelector('#fichas [data-conn="f232_eot"]'),
    }));
    ok(oil.f242 && !oil.f232, `Rev-Up: oil temp card is F242 (not F232) (${JSON.stringify(oil)})`);
  }
  await page.evaluate(() => { clearSelection(); selectConnPin('f38_evtc_b1', '3'); });
  const t3 = await routeTags();
  ok(t3.some((x) => x.rail === '12v' && /E7·18/.test(x.text) && /F3·7/.test(x.text)), `F38·3 → 12V E7·18 → E12/F3·7 (${JSON.stringify(t3)})`);
  await page.select('#loomView', 'motor');
  await new Promise((r) => setTimeout(r, 100));
  const e2 = await evtState();
  ok(e2.f38 && e2.f42, 'Rev-Up + Arnès motor: F38/F42 stay on the engine loom');
  await page.select('#loomView', 'all');
  await page.select('#model', 'de_early');
  await page.evaluate(() => { if (typeof clearSelection === 'function') clearSelection(); });
  ok(!(await page.$('#fichas [data-conn="f242_eot"]')), 'sin VTC escape: F242 oil temp card hidden');
}

console.log('\nF33/F221 cavity layout = male face as in the photo (EC-279 T.S.), independent of ECM orient');
for (const o of ['invertida', 'fsm']) {
  await page.select('#ecmOrient', o);
  await new Promise((r) => setTimeout(r, 150));
  const r = await page.evaluate(() => {
    const card = document.querySelector('#fichas [data-conn="ix_f221_f33"]');
    if (!card) return null;
    const seen = new Set();
    const cavs = [...card.querySelectorAll('[data-cav]')].filter((e) => !seen.has(e.dataset.cav) && seen.add(e.dataset.cav))
      .map((e) => { const bb = e.getBoundingClientRect(); return { id: e.dataset.cav, x: bb.x, y: Math.round(bb.y) }; });
    const rows = {}; cavs.forEach((c) => (rows[c.y] = rows[c.y] || []).push(c));
    const order = Object.keys(rows).sort((a, b) => a - b).map((y) => rows[y].sort((a, b) => a.x - b.x).map((c) => c.id).join(' '));
    const pins = Object.fromEntries((CONN.ix_f221_f33.pins || []).map((p) => [p.id, `${p.code}>${p.ecm ?? p.src ?? '-'}`]));
    return { order, pins };
  });
  ok(r && JSON.stringify(r.order) === JSON.stringify(['4 3 2 1', '8 7 6 5']),
    `${o}: F33 ficha rows 4-3-2-1 / 8-7-6-5 like the male-face photo (${JSON.stringify(r && r.order)})`);
  ok(r && JSON.stringify(r.pins) === JSON.stringify({ 1: 'SB>21', 2: 'R/Y>22', 3: 'W/B>41', 4: 'B/R>42', 5: 'W/B>JB·10A', 6: 'R/B>23', 7: 'LG>40', 8: '—>-' }),
    `${o}: F33 cavities keep their wire/ECM (EC-702) (${JSON.stringify(r && r.pins)})`);
}
await page.select('#ecmOrient', 'invertida');

await browser.close();
if (failed) {
  console.log(`\n${failed} failed`);
  process.exit(1);
}
console.log('\nall F102 collapse checks passed');
