#!/usr/bin/env node
/**
 * Colour search: FSM codes (W/L, l\w, L.W, LW) and es/en/ja names
 * (azul con blanco, 青と白) list and highlight matching cavities.
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

console.log('color search parser');
const ctx = {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'js/color_search.js'), 'utf8'), ctx);

const parseCases = [
  ['W/L', [['W'], ['L']]],
  ['w/l', [['W'], ['L']]],
  ['l\\w', [['L'], ['W']]],
  ['L\\W', [['L'], ['W']]],
  ['L.W', [['L'], ['W']]],
  ['L W', [['L'], ['W']]],
  ['LW', [['L'], ['W']]],
  ['WL', [['W'], ['L']]],
  ['azul con blanco', [['L'], ['W']]],
  ['celeste y blanco', [['L', 'SB'], ['W']]],
  ['blue and white', [['L'], ['W']]],
  ['blue with white', [['L'], ['W']]],
  ['青と白', [['L'], ['W']]],
  ['白/青', [['W'], ['L']]],
  ['P', [['P']]],
  ['PU', [['PU']]],
  ['LG', [['LG']]],
  ['light green', [['LG']]],
  ['APP', null],
  ['F101', null],
];
for (const [q, exp] of parseCases) {
  const got = ctx.parseColorQuery(q);
  const slots = got && got.slots;
  ok(JSON.stringify(slots) === JSON.stringify(exp), `parseColorQuery(${JSON.stringify(q)}) = ${JSON.stringify(slots)}`);
}
ok(ctx.colorMatchRank('W/L', ctx.parseColorQuery('W/L')) === 0, 'W/L exact rank 0');
ok(ctx.colorMatchRank('L/W', ctx.parseColorQuery('W/L')) === 1, 'L/W is swapped W/L');
ok(ctx.colorMatchRank('P', ctx.parseColorQuery('P')) === 0, 'P matches solid P');
ok(ctx.colorMatchRank('P/B', ctx.parseColorQuery('P')) === 0, 'P matches P/B');
ok(ctx.colorMatchRank('PU', ctx.parseColorQuery('P')) === -1, 'P does not match PU');
ok(ctx.colorMatchRank('PU/W', ctx.parseColorQuery('P')) === -1, 'P does not match PU/W');
ok(ctx.colorMatchRank('W/L', ctx.parseColorQuery('azul con blanco')) === 1, 'azul con blanco matches W/L swapped');
ok(ctx.colorMatchRank('L/W', ctx.parseColorQuery('azul con blanco')) === 0, 'azul con blanco exact L/W');
ok(ctx.colorMatchRank('W/L', ctx.parseColorQuery('l\\w')) === 1, 'l\\w matches W/L swapped');

if (process.env.HARNESS_SKIP_BROWSER === '1') {
  if (failed) { console.log(`\n${failed} failed`); process.exit(1); }
  console.log('\ncolor search parser passed (browser skipped)');
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
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
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

const EXPECTED_WL = [
  ['ix_f18_f201', '5'],
  ['ix_f18_f201', '6'],
  ['vtc_b1', '2'],
  ['coil1', '3'],
  ['coil2', '3'],
  ['coil3', '3'],
  ['coil4', '3'],
  ['coil5', '3'],
  ['coil6', '3'],
  ['ix_e12_f3', '5'],
  ['ipdm_e7', '17'],
];

function missingExpected(rows, pairs) {
  const have = new Set((rows || []).map((r) => r.id + '·' + r.cav));
  return pairs.filter(([id, cav]) => !have.has(id + '·' + cav)).map(([id, cav]) => id + '·' + cav);
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
await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForSelector('#blocks .pin[data-pin="66"]');

console.log('\ncolor search collectSearch + highlight');

const queries = [
  { q: 'W/L', expectExact: true },
  { q: 'azul con blanco', expectExact: false },
  { q: 'l\\w', expectExact: false },
  { q: '青と白', expectExact: false },
  { q: '白/青', expectExact: true },
];

for (const { q, expectExact } of queries) {
  const report = await page.evaluate((q) => {
    const rows = collectSearch(q);
    const cavs = rows.filter((r) => r.kind === 'cav').map((r) => ({ id: r.id, cav: r.cav, code: r.code, rank: r.rank, label: r.label }));
    const all = rows.find((r) => r.kind === 'colorAll');
    return {
      n: rows.length,
      all: all ? { label: all.label, n: (all.hits || []).length, code: all.code } : null,
      cavs,
      pins: rows.filter((r) => r.kind === 'pin').map((r) => ({ id: r.id, code: r.code })),
    };
  }, q);
  const miss = missingExpected(report.cavs, EXPECTED_WL);
  ok(miss.length === 0, `collectSearch(${JSON.stringify(q)}) includes F18·5/6, F204·2, coil·3, E12/F3·5, E7·17` + (miss.length ? ` (missing ${miss.join(', ')})` : ''));
  ok(report.all && report.all.n >= EXPECTED_WL.length, `collectSearch(${JSON.stringify(q)}) has highlight-all (${report.all && report.all.n})`);
  const wl = (report.cavs || []).filter((r) => r.id === 'ix_f18_f201' && r.cav === '5')[0];
  if (expectExact) ok(wl && wl.rank === 0, `${JSON.stringify(q)} ranks F18·5 (W/L) first` + (wl ? ` (rank ${wl.rank})` : ' (missing)'));
  else ok(wl && (wl.rank === 0 || wl.rank === 1), `${JSON.stringify(q)} still lists F18·5` + (wl ? ` (rank ${wl.rank})` : ' (missing)'));
}

const pReport = await page.evaluate(() => {
  const rows = collectSearch('P');
  return rows.filter((r) => r.kind !== 'colorAll').map((r) => r.code);
});
ok(pReport.length > 0, `collectSearch('P') returns solid/striped P wires (${pReport.length})`);
ok(pReport.every((c) => !/(^|\/)PU(\/|$)/.test(String(c))), `collectSearch('P') does not match PU (${pReport.filter((c) => /PU/.test(String(c))).join(', ')})`);

const puReport = await page.evaluate(() => collectSearch('PU').filter((r) => r.kind !== 'colorAll').map((r) => r.code));
ok(puReport.some((c) => c === 'PU' || String(c).startsWith('PU/')), `collectSearch('PU') finds PU wires (${puReport.slice(0, 6).join(', ')})`);

/* Highlight all W/L cavities */
const hl = await page.evaluate(() => {
  if (typeof clearSelection === 'function') clearSelection();
  const rows = collectSearch('W/L');
  qRows = rows;
  const i = rows.findIndex((r) => r.kind === 'colorAll');
  if (i >= 0) pickSearchRow(i);
  const lit = (cid, cav) => {
    const cavEl = document.querySelector(`.cav-hit[data-conn="${cid}"][data-cav="${cav}"]`);
    const f102 = cid === 'ix_f102_m72' ? document.querySelector(`#f102Panel .pin[data-cav="${cav}"]`) : null;
    const el = cavEl || f102;
    return !!(el && (el.classList.contains('hl') || el.classList.contains('hl-group')));
  };
  const missing = [];
  for (const [id, cav] of [['ix_f18_f201','5'],['ix_f18_f201','6'],['vtc_b1','2'],['coil1','3'],['coil3','3'],['ix_e12_f3','5'],['ipdm_e7','17']]) {
    if (!lit(id, cav)) missing.push(id + '·' + cav);
  }
  const info = (typeof selectionInfoText === 'function' ? selectionInfoText() : (document.getElementById('info') || {}).textContent) || '';
  return { missing, info, allLabel: rows.find((r) => r.kind === 'colorAll') && rows.find((r) => r.kind === 'colorAll').label };
});
ok(hl.missing.length === 0, 'Highlight all W/L lights F18·5/6, VTC B1·2, coil·3, E12/F3·5, E7·17' + (hl.missing.length ? ` (missing ${hl.missing.join(', ')})` : ''));

/* Clicking a colour row selects that cavity like a pin click */
const clickOne = await page.evaluate(() => {
  if (typeof clearSelection === 'function') clearSelection();
  const rows = collectSearch('W/L');
  qRows = rows;
  const i = rows.findIndex((r) => r.kind === 'cav' && r.id === 'vtc_b1' && r.cav === '2');
  if (i >= 0) pickSearchRow(i);
  const el = document.querySelector('.cav-hit[data-conn="vtc_b1"][data-cav="2"]');
  return {
    found: i >= 0,
    lit: !!(el && (el.classList.contains('hl') || el.classList.contains('hl-group') || el.classList.contains('sel'))),
  };
});
ok(clickOne.found && clickOne.lit, 'clicking the F204·2 / vtc_b1·2 colour row highlights that cavity' + (clickOne.found ? '' : ' (row missing)'));

/* Placeholder follows language */
const ph = await page.evaluate(async () => {
  const out = {};
  for (const lg of ['es', 'en', 'ja']) {
    const sel = document.getElementById('lang');
    if (sel) { sel.value = lg; sel.dispatchEvent(new Event('change', { bubbles: true })); }
    if (typeof applyLang === 'function') applyLang();
    out[lg] = document.getElementById('q') && document.getElementById('q').placeholder;
  }
  const sel = document.getElementById('lang');
  if (sel) { sel.value = 'es'; sel.dispatchEvent(new Event('change', { bubbles: true })); }
  if (typeof applyLang === 'function') applyLang();
  return out;
});
ok(ph.es && /azul con blanco/.test(ph.es), 'es placeholder mentions azul con blanco');
ok(ph.en && /blue and white/.test(ph.en), 'en placeholder mentions blue and white');
ok(ph.ja && /青と白/.test(ph.ja), 'ja placeholder mentions 青と白');

await browser.close();
if (failed) {
  console.log(`\n${failed} failed`);
  process.exit(1);
}
console.log('\nall color search checks passed');
