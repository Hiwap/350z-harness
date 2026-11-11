#!/usr/bin/env node
/**
 * DTC search: P0183 / p0183 / 0183 and other EC-index codes select the
 * FSM circuit pins and fichas (P2127/P2138 APP, P1564 ASCD, P1111 IVT B1).
 */
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { createRequire } from 'module';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const require = createRequire(import.meta.url);

let failed = 0;
function ok(cond, msg) {
  if (cond) console.log('  ok  ' + msg);
  else { console.log('  FAIL ' + msg); failed++; }
}

console.log('DTC table + parser');
const ctx = {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'data/dtc.js'), 'utf8'), ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'js/dtc_search.js'), 'utf8'), ctx);

ok(ctx.DTC_LIST && ctx.DTC_LIST.length >= 150, 'DTC_LIST covers the EC index (' + (ctx.DTC_LIST && ctx.DTC_LIST.length) + ')');
ok(ctx.parseDtcQuery('P0183')[0] === 'P0183', 'parse P0183');
ok(ctx.parseDtcQuery('p0183')[0] === 'P0183', 'parse p0183');
ok(ctx.parseDtcQuery('0183')[0] === 'P0183', 'parse 0183');
ok(ctx.parseDtcQuery('P2127')[0] === 'P2127', 'parse P2127');
ok(JSON.stringify(ctx.parseDtcQuery('1000')) === JSON.stringify(['U1000']), 'parse 1000 → U1000 (no P1000)');
ok(ctx.parseDtcQuery('106').length === 0, '3-digit 106 is not a DTC (ECM pin)');

const p0183 = ctx.DTC_BY_CODE.P0183;
ok(p0183 && p0183.ecm && p0183.ecm.includes(107) && p0183.consult === 'FTT SEN/CIRCUIT', 'P0183 FTT maps ECM 107');
ok(p0183 && p0183.circ && p0183.circ.includes('ftt_gnd'), 'P0183 also maps the FSM ground path (term 5 → M49·36)');
ok(!(p0183.ecm || []).includes(111) && !(p0183.ecm || []).includes(18), 'P0183 is not routed through IPDM control pins');

const p2127 = ctx.DTC_BY_CODE.P2127;
ok(p2127 && p2127.ecm.includes(98) && p2127.ecm.includes(91) && p2127.ecm.includes(83), 'P2127 APP SEN 2: ECM 98, 91, 83');
ok(!(p2127.ecm || []).includes(106), 'P2127 does not treat APP 1 signal 106 as its own circuit');
const p2138 = ctx.DTC_BY_CODE.P2138;
ok(p2138 && p2138.ecm.includes(106) && p2138.ecm.includes(98), 'P2138 APP correlation includes 106 and 98');
ok(ctx.DTC_BY_CODE.P1564 && ctx.DTC_BY_CODE.P1564.ecm.includes(99), 'P1564 ASCD SW: ECM 99');
ok(ctx.DTC_BY_CODE.P1111 && ctx.DTC_BY_CODE.P1111.ecm.includes(11) && !ctx.DTC_BY_CODE.P1111.ecm.includes(10), 'P1111 IVT B1: ECM 11, not B2 pin 10');
ok(ctx.DTC_BY_CODE.P1136 && ctx.DTC_BY_CODE.P1136.ecm.includes(10), 'P1136 IVT B2: ECM 10');

const es = ctx.collectDtcSearch('P0183', { lang: 'es' })[0];
const en = ctx.collectDtcSearch('P0183', { lang: 'en' })[0];
const ja = ctx.collectDtcSearch('P0183', { lang: 'ja' })[0];
ok(es && /P0183/.test(es.label) && /FTT SEN\/CIRCUIT/.test(es.label) && /tanque/.test(es.label), 'ES result shows code, CONSULT term and Spanish name');
ok(en && /Fuel tank temperature/.test(en.label), 'EN result shows FSM trouble name');
ok(ja && /燃料タンク温度/.test(ja.label), 'JA result shows Japanese name');
ok(ctx.collectDtcSearch('0183', { lang: 'es' })[0].id === 'P0183', 'collectSearch-style 0183 hits P0183');

const unmapped = ctx.DTC_LIST.filter((d) => d.kind === 'unmapped' && !(d.ecm && d.ecm.length) && !(d.circ && d.circ.length));
ok(ctx.DTC_BY_CODE.P0700 && ctx.DTC_BY_CODE.P0700.kind === 'logic' && ctx.DTC_BY_CODE.P0700.note === 'sinCircuito', 'P0700 TCM is logic without a pin circuit (AT-115)');
ok(unmapped.some((d) => d.code === 'P0705') && ctx.DTC_BY_CODE.P0705.note === 'atInternal', 'P0705 PNP stays unmapped: TCM F505/F503 are not on the map');
ok(unmapped.some((d) => d.code === 'P1614') && ctx.DTC_BY_CODE.P1614.note === 'natsAmp', 'P1614 NATS antenna amp M27 is not on the map');
ok(unmapped.some((d) => d.code === 'P1613') && ctx.DTC_BY_CODE.P1613.note === 'natsMissing', 'P1613 is unmapped: BL-170 does not assign a procedure');
ok(unmapped.some((d) => d.code === 'P0000'), 'P0000 stays sin DTC');
ok(ctx.DTC_BY_CODE.P0420 && ctx.DTC_BY_CODE.P0420.note === 'sinCircuito', 'P0420 is logic without a specific circuit');

const u1000 = ctx.DTC_BY_CODE.U1000;
ok(u1000 && u1000.kind === 'circuit' && u1000.ecm.includes(86) && u1000.ecm.includes(94) && u1000.circ.includes('can'), 'U1000 maps ECM 86/94 and circuit can (LAN)');
ok(ctx.DTC_BY_CODE.U1001 && ctx.DTC_BY_CODE.U1001.ecm.includes(94), 'U1001 maps the same CAN terminals');
ok(ctx.parseDtcQuery('U1000')[0] === 'U1000', 'parse U1000');
const p0500 = ctx.DTC_BY_CODE.P0500;
ok(p0500 && p0500.ecm.includes(86) && p0500.ecm.includes(94) && p0500.circ.includes('can'), 'P0500 VSS is the CAN path (no dedicated ECM VSS pin)');
ok(ctx.DTC_BY_CODE.P1212 && ctx.DTC_BY_CODE.P1212.circ.includes('can'), 'P1212 TCS communication is the CAN line');
ok(ctx.DTC_BY_CODE.P1574 && ctx.DTC_BY_CODE.P1574.circ.includes('can') && ctx.DTC_BY_CODE.P1574.circ.includes('can_tcm'), 'P1574 ASCD compares meter and TCM speed on CAN');
const p0462 = ctx.DTC_BY_CODE.P0462;
ok(p0462 && p0462.kind === 'circuit' && p0462.circ.includes('fuel_level') && p0462.circ.includes('ftt_gnd') && !(p0462.ecm && p0462.ecm.length), 'P0462 fuel level maps M49/B28 path, no ECM pin');
ok(ctx.DTC_BY_CODE.P0725 && ctx.DTC_BY_CODE.P0725.ecm.includes(94) && ctx.DTC_BY_CODE.P0725.circ.includes('can_tcm'), 'P0725 engine speed TCM is CAN ECM↔TCM');
ok(ctx.DTC_BY_CODE.P1705 && ctx.DTC_BY_CODE.P1705.circ.includes('can'), 'P1705 TP to TCM is CAN');
ok(ctx.DTC_BY_CODE.P1612 && ctx.DTC_BY_CODE.P1612.circ.includes('can') && ctx.DTC_BY_CODE.P1612.ecm.includes(86), 'P1612 CHAIN OF ECM-IMMU maps CAN');
ok(ctx.DTC_BY_CODE.P1610 && ctx.DTC_BY_CODE.P1610.kind === 'logic' && ctx.DTC_BY_CODE.P1610.note === 'natsInit', 'P1610 lock mode is NATS init/logic');
ok(ctx.dtcNoteText(ctx.DTC_BY_CODE.P0000, (k) => ({ dtcSinDtc: 'sin DTC' }[k] || k)) === 'sin DTC', 'P0000 note is sin DTC');
ok(ctx.dtcNoteText(ctx.DTC_BY_CODE.P0705, (k) => ({ dtcAtInternal: 'F502' }[k] || k)) === 'F502', 'P0705 note mentions missing A/T internal fichas');

if (process.env.HARNESS_SKIP_BROWSER === '1') {
  if (failed) { console.log(`\n${failed} failed`); process.exit(1); }
  console.log('\nDTC table/parser passed (browser skipped)');
  process.exit(0);
}

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

function litSel(sel) {
  return `(() => {
    const el = document.querySelector(${JSON.stringify(sel)});
    return !!(el && (el.classList.contains('hl') || el.classList.contains('hl-end') || el.classList.contains('hl-group') || el.classList.contains('sel')));
  })()`;
}

const puppeteer = loadPuppeteer();
const browser = await puppeteer.launch({
  executablePath: findChrome(),
  headless: true,
  args: ['--no-sandbox', '--disable-gpu'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1400, height: 900 });
await page.goto(pathToFileURL(path.join(root, 'index.html')).href, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('#blocks .pin[data-pin="107"]');
await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForSelector('#blocks .pin[data-pin="107"]');

console.log('\nDTC search + highlight');

const list0183 = await page.evaluate(() => {
  const rows = collectSearch('P0183');
  return rows.filter((r) => r.kind === 'dtc').map((r) => ({ id: r.id, label: r.label }));
});
ok(list0183.length >= 1 && list0183[0].id === 'P0183', 'collectSearch(P0183) returns the DTC first');
ok(list0183[0] && /FTT SEN\/CIRCUIT/.test(list0183[0].label), 'P0183 result shows FTT SEN/CIRCUIT');

const typo = await page.evaluate(() => collectSearch('p0183').filter((r) => r.kind === 'dtc').map((r) => r.id));
const bare = await page.evaluate(() => collectSearch('0183').filter((r) => r.kind === 'dtc').map((r) => r.id));
ok(typo[0] === 'P0183' && bare[0] === 'P0183', 'p0183 and 0183 also list P0183');

const hl0183 = await page.evaluate(() => {
  if (typeof clearSelection === 'function') clearSelection();
  const rows = collectSearch('P0183');
  qRows = rows;
  const i = rows.findIndex((r) => r.kind === 'dtc' && r.id === 'P0183');
  if (i >= 0) pickSearchRow(i);
  const pinLit = (n) => {
    const el = document.querySelector('#blocks .pin[data-pin="' + n + '"]');
    return !!(el && (el.classList.contains('hl') || el.classList.contains('hl-end') || el.classList.contains('hl-group') || el.classList.contains('sel')));
  };
  const cavLit = (cid, cav) => {
    const el = document.querySelector('.cav-hit[data-conn="' + cid + '"][data-cav="' + CSS.escape(String(cav)) + '"]')
      || (cid === 'ix_f102_m72' ? document.querySelector('#f102Panel .pin[data-cav="' + CSS.escape(String(cav)) + '"]') : null);
    return !!(el && (el.classList.contains('hl') || el.classList.contains('hl-end') || el.classList.contains('hl-group') || el.classList.contains('sel')));
  };
  const info = (document.getElementById('info') || {}).textContent || '';
  const qList = document.getElementById('qList');
  const shown = qList && !qList.hidden && qList.innerText;
  return {
    found: i >= 0,
    pin107: pinLit(107),
    cav4: cavLit('fuel_tank_temp', '4'),
    cav5: cavLit('fuel_tank_temp', '5'),
    f102: cavLit('ix_f102_m72', '25H'),
    b1sig: cavLit('ix_b1_m12', '36J'),
    b1gnd: cavLit('ix_b1_m12', '41J'),
    m49: cavLit('unified_m49', '36'),
    info,
    listText: shown || '',
  };
});
ok(hl0183.found, 'pickSearchRow finds P0183');
ok(hl0183.pin107, 'P0183 highlights ECM 107');
ok(hl0183.cav4, 'P0183 highlights fuel level / FTT unit term 4');
ok(hl0183.f102, 'P0183 highlights F102·25H (path intermediate)');
ok(hl0183.b1sig, 'P0183 highlights B1/M12·36J (path intermediate)');
ok(hl0183.cav5 && hl0183.b1gnd && hl0183.m49, 'P0183 also highlights the FSM ground path term 5 → B1/M12·41J → M49·36' +
  (hl0183.cav5 && hl0183.b1gnd && hl0183.m49 ? '' : ` (4=${hl0183.cav4} 5=${hl0183.cav5} f102=${hl0183.f102} 36J=${hl0183.b1sig} 41J=${hl0183.b1gnd} M49=${hl0183.m49})`));
ok(/P0183/.test(hl0183.info) && /FTT/.test(hl0183.info), 'info panel names P0183 / FTT');

/* Names follow the language pack */
const names = await page.evaluate(async () => {
  const out = {};
  for (const lg of ['es', 'en', 'ja']) {
    const sel = document.getElementById('lang');
    if (sel) { sel.value = lg; sel.dispatchEvent(new Event('change', { bubbles: true })); }
    if (typeof applyLang === 'function') applyLang();
    const row = collectSearch('P0183').find((r) => r.kind === 'dtc' && r.id === 'P0183');
    out[lg] = row && row.label;
  }
  const sel = document.getElementById('lang');
  if (sel) { sel.value = 'es'; sel.dispatchEvent(new Event('change', { bubbles: true })); }
  if (typeof applyLang === 'function') applyLang();
  return out;
});
ok(names.es && /tanque/.test(names.es), 'ES list name mentions tanque');
ok(names.en && /Fuel tank temperature/.test(names.en), 'EN list name is the FSM trouble name');
ok(names.ja && /燃料タンク温度/.test(names.ja), 'JA list name is in Japanese');

const hlApp = await page.evaluate(() => {
  if (typeof clearSelection === 'function') clearSelection();
  const rows = collectSearch('P2127');
  qRows = rows;
  const i = rows.findIndex((r) => r.kind === 'dtc' && r.id === 'P2127');
  if (i >= 0) pickSearchRow(i);
  const pinLit = (n) => {
    const el = document.querySelector('#blocks .pin[data-pin="' + n + '"]');
    return !!(el && (el.classList.contains('hl') || el.classList.contains('hl-end') || el.classList.contains('hl-group') || el.classList.contains('sel')));
  };
  const cavLit = (cid, cav) => {
    const el = document.querySelector('.cav-hit[data-conn="' + cid + '"][data-cav="' + CSS.escape(String(cav)) + '"]');
    return !!(el && (el.classList.contains('hl') || el.classList.contains('hl-end') || el.classList.contains('hl-group') || el.classList.contains('sel')));
  };
  return {
    found: i >= 0,
    pin98: pinLit(98),
    pin91: pinLit(91),
    pin83: pinLit(83),
    app2: cavLit('app', '2'),
    app4: cavLit('app', '4'),
    app1: cavLit('app', '1'),
    info: (document.getElementById('info') || {}).textContent || '',
  };
});
ok(hlApp.found && hlApp.pin98, 'P2127 highlights ECM 98 (APP SEN 2)');
ok(hlApp.app2 && hlApp.app4 && hlApp.app1, 'P2127 highlights APP E113 terms 2 / 4 / 1' +
  (hlApp.app2 && hlApp.app4 && hlApp.app1 ? '' : ` (2=${hlApp.app2} 4=${hlApp.app4} 1=${hlApp.app1})`));
ok(/P2127/.test(hlApp.info) && /APP/.test(hlApp.info), 'info panel names P2127 APP');

const hl1564 = await page.evaluate(() => {
  if (typeof clearSelection === 'function') clearSelection();
  const rows = collectSearch('P1564');
  qRows = rows;
  const i = rows.findIndex((r) => r.kind === 'dtc' && r.id === 'P1564');
  if (i >= 0) pickSearchRow(i);
  const el = document.querySelector('#blocks .pin[data-pin="99"]');
  return { found: i >= 0, pin99: !!(el && (el.classList.contains('hl') || el.classList.contains('hl-end') || el.classList.contains('hl-group') || el.classList.contains('sel'))) };
});
ok(hl1564.found && hl1564.pin99, 'P1564 highlights ECM 99 (ASCD SW)');

const hl1111 = await page.evaluate(() => {
  if (typeof clearSelection === 'function') clearSelection();
  const rows = collectSearch('P1111');
  qRows = rows;
  const i = rows.findIndex((r) => r.kind === 'dtc' && r.id === 'P1111');
  if (i >= 0) pickSearchRow(i);
  const pinLit = (n) => {
    const el = document.querySelector('#blocks .pin[data-pin="' + n + '"]');
    return !!(el && (el.classList.contains('hl') || el.classList.contains('hl-end') || el.classList.contains('hl-group') || el.classList.contains('sel')));
  };
  return { found: i >= 0, pin11: pinLit(11), pin10: pinLit(10) };
});
ok(hl1111.found && hl1111.pin11, 'P1111 highlights ECM 11 (IVT B1)');
ok(!hl1111.pin10, 'P1111 does not highlight ECM 10 (IVT B2)');

const hlCan = await page.evaluate(() => {
  if (typeof clearSelection === 'function') clearSelection();
  const rows = collectSearch('U1000');
  qRows = rows;
  const i = rows.findIndex((r) => r.kind === 'dtc' && r.id === 'U1000');
  if (i >= 0) pickSearchRow(i);
  const pinLit = (n) => {
    const el = document.querySelector('#blocks .pin[data-pin="' + n + '"]');
    return !!(el && (el.classList.contains('hl') || el.classList.contains('hl-end') || el.classList.contains('hl-group') || el.classList.contains('sel')));
  };
  const info = (document.getElementById('info') || {}).textContent || '';
  return { found: i >= 0, pin86: pinLit(86), pin94: pinLit(94), info };
});
ok(hlCan.found && hlCan.pin86 && hlCan.pin94, 'U1000 highlights ECM 86 and 94 (CAN-L / CAN-H)');
ok(/U1000/.test(hlCan.info) && /CAN/.test(hlCan.info), 'info panel names U1000 CAN');

const hlFuel = await page.evaluate(() => {
  if (typeof clearSelection === 'function') clearSelection();
  const rows = collectSearch('P0462');
  qRows = rows;
  const i = rows.findIndex((r) => r.kind === 'dtc' && r.id === 'P0462');
  if (i >= 0) pickSearchRow(i);
  const cavLit = (cid, cav) => {
    const el = document.querySelector('.cav-hit[data-conn="' + cid + '"][data-cav="' + CSS.escape(String(cav)) + '"]');
    return !!(el && (el.classList.contains('hl') || el.classList.contains('hl-end') || el.classList.contains('hl-group') || el.classList.contains('sel')));
  };
  const info = (document.getElementById('info') || {}).textContent || '';
  return {
    found: i >= 0,
    b28_1: cavLit('fuel_level_sub', '1'),
    m49_28: cavLit('unified_m49', '28'),
    b27_5: cavLit('fuel_tank_temp', '5'),
    m49_36: cavLit('unified_m49', '36'),
    info,
  };
});
ok(hlFuel.found && hlFuel.b28_1 && hlFuel.m49_28, 'P0462 highlights fuel level B28·1 and M49·28' +
  (hlFuel.b28_1 && hlFuel.m49_28 ? '' : ` (B28·1=${hlFuel.b28_1} M49·28=${hlFuel.m49_28})`));
ok(hlFuel.b27_5 && hlFuel.m49_36, 'P0462 highlights fuel-level ground B27·5 and M49·36');
ok(/P0462/.test(hlFuel.info) && /M49/.test(hlFuel.info), 'info panel names P0462 and the meter path');

const hlAt = await page.evaluate(() => {
  if (typeof clearSelection === 'function') clearSelection();
  const rows = collectSearch('P0705');
  qRows = rows;
  const i = rows.findIndex((r) => r.kind === 'dtc' && r.id === 'P0705');
  if (i >= 0) pickSearchRow(i);
  const info = (document.getElementById('info') || {}).textContent || '';
  return { found: i >= 0, info };
});
ok(hlAt.found && /F502|F503|conjunto A\/T|A\/T assembly/.test(hlAt.info),
  'P0705 note says the A/T internal fichas are not on the map (got: ' + JSON.stringify(hlAt.info).slice(0, 220) + ')');

const logic = await page.evaluate(() => {
  if (typeof clearSelection === 'function') clearSelection();
  const rows = collectSearch('P0420');
  qRows = rows;
  const i = rows.findIndex((r) => r.kind === 'dtc' && r.id === 'P0420');
  if (i >= 0) pickSearchRow(i);
  const info = (document.getElementById('info') || {}).textContent || '';
  return { found: i >= 0, info, label: rows[i] && rows[i].label };
});
ok(logic.found && /sin circuito específico|no specific circuit|特定の回路なし/.test(logic.info),
  'P0420 shows sin circuito específico (got: ' + JSON.stringify(logic.info).slice(0, 180) + ')');

await browser.close();
if (failed) {
  console.log(`\n${failed} failed`);
  process.exit(1);
}
console.log('\nall DTC search checks passed');
