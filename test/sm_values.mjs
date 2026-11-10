#!/usr/bin/env node
/* FSM expected-value section: schema, required first-batch cards, collapsed-by-default,
   expands on click, and language switch updates all text. */
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { createRequire } from 'module';
import { fileURLToPath, pathToFileURL } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const htmlFile = path.join(root, 'index.html');
const require = createRequire(import.meta.url);

let failed = 0;
function ok(cond, msg) {
  if (cond) console.log('  ok  ' + msg);
  else { console.log('  FAIL ' + msg); failed++; }
}

function loadSm() {
  const src = fs.readFileSync(path.join(root, 'data', 'sm_values.js'), 'utf8');
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(src + '\n; this._out = { SM_VALUES, SM_NONE };', ctx);
  return ctx._out;
}

const LANGS = ['es', 'en', 'ja'];
/* Every motor-harness sensor, switch and output/actuator card. */
const REQUIRED = [
  'app', 'etc', 'maf',
  'ckp', 'cmp_b1', 'cmp_b2', 'f38_evtc_b1', 'f42_evtc_b2',
  'knock', 'ect', 'af_b1', 'af_b2', 'ho2s_b1', 'ho2s_b2',
  'evap_press', 'psp', 'ac_press', 'f21_oilp',
  'fuel_tank_temp', 'fuel_level_sub',
  'f35_pnp', 'backup_sw', 'stop_lamp', 'ascd_brake', 'ascd_clutch', 'clock_spring',
  'coil1', 'coil2', 'coil3', 'coil4', 'coil5', 'coil6',
  'inj1', 'inj2', 'inj3', 'inj4', 'inj5', 'inj6',
  'vtc_b1', 'vtc_b2', 'vtc_ex_b1', 'vtc_ex_b2',
  'evap_purge', 'evap_vent', 'fuel_pump', 'f16_cond',
  'f9_starter', 'f20_alt', 'alt_b', 'alt_e', 'f24_comp', 'f6_at', 'f242_eot'
];

const { SM_VALUES, SM_NONE } = loadSm();
ok(!!SM_VALUES && !!SM_NONE, 'SM_VALUES and SM_NONE load');

function checkEntry(id, e, idx) {
  const tag = id + '[' + idx + ']';
  if (e.none) {
    LANGS.forEach((l) => {
      ok(e[l] && e[l].value, tag + ' none-marker has ' + l + ' value');
    });
    ok(e.es.value === 'Sin dato en el SM', tag + ' es none text');
    ok(e.en.value === 'No value in the SM', tag + ' en none text');
    ok(e.ja.value === 'SMに規定値なし', tag + ' ja none text');
    return;
  }
  ok(typeof e.pins === 'string' && e.pins.length > 0, tag + ' has pins');
  ok(typeof e.src === 'string' && /^(EC|PG|SC|DI|AT|ATC|LT|MT|LAN|EM)-/.test(e.src), tag + ' has FSM src page (' + (e.src || '') + ')');
  LANGS.forEach((l) => {
    ok(e[l] && typeof e[l].value === 'string' && e[l].value.length > 0, tag + ' has ' + l + ' value');
    ok(e[l] && typeof e[l].cond === 'string' && e[l].cond.length > 0, tag + ' has ' + l + ' condition');
  });
  ok(e.es.value !== e.en.value || e.es.cond !== e.en.cond, tag + ' es and en text are not identical');
  ok(e.en.value !== e.ja.value || e.en.cond !== e.ja.cond, tag + ' en and ja text are not identical');
}

REQUIRED.forEach((id) => {
  const rows = SM_VALUES[id];
  ok(!!rows && (rows.none || (Array.isArray(rows) && rows.length > 0)), id + ' has SM entries');
  if (rows && rows.none) checkEntry(id, rows, 0);
  else if (Array.isArray(rows)) rows.forEach((e, i) => checkEntry(id, e, i));
});

ok(SM_VALUES.maf && SM_VALUES.maf.some((e) => e.pins.includes('F25·2') && e.src === 'EC-210'),
  'MAF F25·2 supply cites EC-210');
ok(SM_VALUES.maf && SM_VALUES.maf.some((e) => /F25·2/.test(e.pins) && /R\/W/.test(e.pins)),
  'MAF supply pin keeps colour code R/W');
ok(SM_VALUES.maf && SM_VALUES.maf.some((e) => e.en && /Battery voltage/.test(e.en.value) && !/marr[oó]n/i.test(JSON.stringify(e))),
  'MAF F25·2 value is "Battery voltage"; no mislabelled brown wire');
ok(SM_VALUES.maf && SM_VALUES.maf.some((e) => /ECM 51/.test(e.pins) && e.src === 'EC-212'),
  'MAF signal ECM 51 cites EC-212');
ok(SM_VALUES.maf && SM_VALUES.maf.some((e) => /F25·5/.test(e.pins) && /IAT/.test(e.pins) && e.src === 'EC-226'),
  'IAT resistance F25·5–6 cites EC-226');
ok(SM_VALUES.app && SM_VALUES.app.some((e) => /ECM 106/.test(e.pins) && e.src === 'EC-670'),
  'APP1 ECM 106 cites EC-670');
ok(SM_VALUES.etc && SM_VALUES.etc.some((e) => /ECM 50/.test(e.pins) && e.src === 'EC-240'),
  'TPS1 ECM 50 cites EC-240');

ok(SM_VALUES.ckp && SM_VALUES.ckp.some((e) => /F10·1/.test(e.pins) && /R\/W/.test(e.pins) && e.src === 'EC-326'),
  'CKP F10·1 supply keeps R/W and cites EC-326');
ok(SM_VALUES.ckp && SM_VALUES.ckp.some((e) => e.en && /Battery voltage/.test(e.en.value)),
  'CKP F10·1 value is "Battery voltage"');
ok(SM_VALUES.clock_spring && SM_VALUES.clock_spring.some((e) => /M203·14/.test(e.pins) && e.src === 'EC-623'),
  'ASCD steering resistance is measured at M203·14–15, EC-623');
ok(SM_VALUES.clock_spring && SM_VALUES.clock_spring.every((e) => !/M23·34\/33/.test(e.pins) || e.src !== 'EC-623'),
  'resistance entry does not claim M23·34/33 as the EC-623 measurement point');
ok(SM_VALUES.fuel_pump && SM_VALUES.fuel_pump.some((e) => /B27·2/.test(e.pins) && /B27·5/.test(e.pins) && e.src === 'DI-24'),
  'main fuel level resistance is on the fuel_pump card at B27·2–5, DI-24');
ok(SM_VALUES.f16_cond && SM_VALUES.f16_cond.some((e) => e.src === 'EC-700'),
  'ignition condenser cites EC-700, not the fuel-pump condenser page');
ok(SM_VALUES.f242_eot && SM_VALUES.f242_eot.none, 'oil temp F242 is explicit SM_NONE');
ok(SM_VALUES.f6_at && SM_VALUES.f6_at.none, 'F6 A/T assembly is explicit SM_NONE');
ok(SM_VALUES.alt_e && SM_VALUES.alt_e.none, 'alternator E ground is explicit SM_NONE');

const html = fs.readFileSync(htmlFile, 'utf8');
ok(html.includes('data/sm_values.js'), 'index.html loads data/sm_values.js');
ok(/smTitle: 'Rangos'/.test(fs.readFileSync(path.join(root, 'data', 'i18n.js'), 'utf8')), 'I18N es smTitle is Rangos');
ok(/smTitle: 'Values'/.test(fs.readFileSync(path.join(root, 'data', 'i18n.js'), 'utf8')), 'I18N en smTitle is Values');
ok(/smTitle: '値'/.test(fs.readFileSync(path.join(root, 'data', 'i18n.js'), 'utf8')), 'I18N ja smTitle is 値');

const skipBrowser = process.env.HARNESS_SKIP_BROWSER === '1';
if (skipBrowser) {
  ok(true, 'browser checks skipped (HARNESS_SKIP_BROWSER=1)');
} else {
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

  const puppeteer = loadPuppeteer();
  const chrome = findChrome();
  const browser = await puppeteer.launch({
    executablePath: chrome,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu'],
  });
  try {
    const page = await browser.newPage();
    await page.goto(pathToFileURL(htmlFile).href, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => typeof SM_VALUES === 'object' && typeof renderFichas === 'function');

    const initial = await page.evaluate(() => {
      const ficha = document.querySelector('.ficha[data-conn="maf"]');
      const det = ficha && ficha.querySelector('details.ficha-sm');
      return {
        hasFicha: !!ficha,
        hasDetails: !!det,
        open: !!(det && det.open),
        summary: det ? (det.querySelector('summary') || {}).textContent : '',
        values: det ? [...det.querySelectorAll('.sm-value')].map((n) => n.textContent) : [],
        srcs: det ? [...det.querySelectorAll('.sm-src')].map((n) => n.textContent) : [],
      };
    });
    ok(initial.hasFicha, 'MAF card is in the DOM');
    ok(initial.hasDetails, 'MAF card has a .ficha-sm details section');
    ok(initial.open === false, 'Rangos section is collapsed by default');
    ok(initial.summary === 'Rangos', 'default language summary is Rangos');
    ok(initial.srcs.includes('EC-210') && initial.srcs.includes('EC-212') && initial.srcs.includes('EC-226'),
      'MAF section cites EC-210, EC-212 and EC-226');

    const afterClick = await page.evaluate(() => {
      const det = document.querySelector('.ficha[data-conn="maf"] details.ficha-sm');
      const sum = det && det.querySelector('summary');
      if (sum) sum.click();
      return !!(det && det.open);
    });
    ok(afterClick === true, 'clicking the summary expands the section');

    async function textsFor(langCode) {
      return page.evaluate((L) => {
        const sel = document.getElementById('lang');
        if (sel) sel.value = L;
        if (typeof applyLang === 'function') applyLang();
        const det = document.querySelector('.ficha[data-conn="maf"] details.ficha-sm');
        if (det && !det.open) {
          const sum = det.querySelector('summary');
          if (sum) sum.click();
        }
        const app = document.querySelector('.ficha[data-conn="app"] details.ficha-sm');
        return {
          smTitle: det ? (det.querySelector('summary') || {}).textContent : '',
          mafValues: det ? [...det.querySelectorAll('.sm-value')].map((n) => n.textContent) : [],
          mafConds: det ? [...det.querySelectorAll('.sm-cond')].map((n) => n.textContent) : [],
          appTitle: app ? (app.querySelector('summary') || {}).textContent : '',
        };
      }, langCode);
    }

    const es = await textsFor('es');
    const en = await textsFor('en');
    const ja = await textsFor('ja');
    ok(es.smTitle === 'Rangos' && en.smTitle === 'Values' && ja.smTitle === '値',
      'section title switches Rangos / Values / 値 (got ' + [es.smTitle, en.smTitle, ja.smTitle].join(' / ') + ')');
    ok(es.mafValues.some((v) => /Tensión de batería/.test(v)), 'es MAF supply value is Tensión de batería');
    ok(en.mafValues.some((v) => /Battery voltage/.test(v)), 'en MAF supply value is Battery voltage');
    ok(ja.mafValues.some((v) => /バッテリー電圧/.test(v)), 'ja MAF supply value is バッテリー電圧');
    ok(JSON.stringify(es.mafValues) !== JSON.stringify(en.mafValues), 'switching to en changes MAF value text');
    ok(JSON.stringify(en.mafValues) !== JSON.stringify(ja.mafValues), 'switching to ja changes MAF value text');
    ok(JSON.stringify(es.mafConds) !== JSON.stringify(en.mafConds), 'switching to en changes MAF condition text');
    ok(JSON.stringify(en.mafConds) !== JSON.stringify(ja.mafConds), 'switching to ja changes MAF condition text');

    const extraCards = await page.evaluate(() => {
      const sel = document.getElementById('lang');
      if (sel) sel.value = 'es';
      if (typeof applyLang === 'function') applyLang();
      const ckp = document.querySelector('.ficha[data-conn="ckp"] details.ficha-sm');
      const none = document.querySelector('.ficha[data-conn="alt_e"] details.ficha-sm');
      return {
        ckpSrcs: ckp ? [...ckp.querySelectorAll('.sm-src')].map((n) => n.textContent) : [],
        noneText: none ? (none.querySelector('.sm-none') || {}).textContent : '',
        noneOpen: !!(none && none.open),
      };
    });
    ok(extraCards.ckpSrcs.includes('EC-326') && extraCards.ckpSrcs.includes('EC-328'),
      'CKP section cites EC-326 and EC-328');
    ok(extraCards.noneText === 'Sin dato en el SM', 'alt_e none card shows Sin dato en el SM');
    ok(extraCards.noneOpen === false, 'alt_e Rangos section is collapsed by default');
  } finally {
    await browser.close();
  }
}

if (failed) {
  console.error(failed + ' sm_values test(s) failed');
  process.exit(1);
}
console.log('sm_values.mjs ok');
