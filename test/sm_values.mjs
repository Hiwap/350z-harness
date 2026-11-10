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
const BODY_REQUIRED = [
  'abs_e51', 'abs_t5', 'vdc_e118', 'vdc_off_m9', 'vdc_m22', 'vdc_m51',
  'rke_m78', 'tpms_m79', 'sec_m34', 'key_m25', 'bcm_m90', 'bcm_b83', 'bcm_m91',
  'comb_sw_m29', 'hazard_m153', 'turn_e40', 'turn_e41', 'turn_t10', 'turn_e24', 'turn_e25', 'turn_t18',
  'stop_t9', 'stop_t17', 'stop_t202', 'stop_d103', 'map_r52', 'map_r53', 'lug_t13', 'dtrl_e14', 'dtrl_e15',
  'door_lock_d40', 'mirror_d2', 'mirror_d32', 'pw_d7', 'mirror_sw_d6', 'pw_motor_d9', 'key_cyl_d12',
  'pw_sub_d37', 'pw_motor_d38', 'ix_d1_m11', 'ix_d31_m74', 'door_sw_b17', 'door_sw_b23', 'door_lock_d11',
  'back_door_t12', 'back_opener_t103', 'trunk_cancel_b71', 'back_opener_t11',
  'fuel_lid_m59', 'fuel_lid_m13', 'fuel_lid_t19',
  'defog_b34', 'defog_d104', 'defog_b202',
  'socket_b36', 'socket_m38',
  'seat_b37', 'seat_m154', 'seat_m155', 'belt_b8', 'belt_b11',
  'audio_m40', 'audio_m41', 'audio_m39',
  'spk_d4', 'spk_d5', 'spk_d3', 'spk_d34', 'spk_d35', 'spk_d33', 'spk_b40', 'spk_b42',
  'meter_m19', 'brake_fluid_e44', 'pkb_b47',
  'amb_e34', 'blower_m62',
  'wiper_e52', 'washer_e29', 'washer_e28', 'wiper_d106',
  'cb_b55', 'top_b66', 'top_b67', 'top_b68', 'top_m14',
  'atdev_m47'
];
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
  'f9_starter', 'f20_alt', 'alt_b', 'alt_e', 'f24_comp', 'f6_at', 'f242_eot',
  ...BODY_REQUIRED
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
  ok(typeof e.src === 'string' && /^(EC|PG|SC|DI|AT|ATC|LT|MT|LAN|EM|BRC|BCS|WW|SE|AV|GW|BL|WT|SRS|RF)-/.test(e.src), tag + ' has FSM src page (' + (e.src || '') + ')');
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
ok(BODY_REQUIRED.length === 87, 'all 87 carrocería cards are in the required list');
ok(SM_VALUES.amb_e34 && SM_VALUES.amb_e34.some((e) => /E34·1/.test(e.pins) && /E34·2/.test(e.pins) && e.src === 'ATC-99'),
  'ambient sensor resistance E34·1–2 cites ATC-99');
ok(SM_VALUES.vdc_off_m9 && SM_VALUES.vdc_off_m9.some((e) => /M9/.test(e.pins) && e.src === 'BRC-138'),
  'VDC/TCS OFF switch M9 cites BRC-138');
ok(SM_VALUES.abs_e51 && SM_VALUES.abs_e51.some((e) => /E51·1/.test(e.pins) && e.src === 'BRC-33'),
  'ABS E51·1 actuator-relay supply cites BRC-33');
ok(SM_VALUES.socket_b36 && SM_VALUES.socket_b36.none, 'luggage power socket is explicit SM_NONE');
ok(SM_VALUES.spk_d4 && SM_VALUES.spk_d4.none, 'door speaker is explicit SM_NONE');
ok(SM_VALUES.meter_m19 && SM_VALUES.meter_m19.some((e) => /M19·24/.test(e.pins) && e.src === 'DI-16'),
  'combination meter M19·24 supply cites DI-16');
ok(SM_VALUES.atdev_m47 && SM_VALUES.atdev_m47.some((e) => e.src === 'AT-177'),
  'A/T device manual-mode switch cites AT-177');

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

    const bodyCards = await page.evaluate(() => {
      const amb = document.querySelector('.ficha[data-conn="amb_e34"] details.ficha-sm');
      const off = document.querySelector('.ficha[data-conn="abs_e51"] details.ficha-sm');
      const sock = document.querySelector('.ficha[data-conn="socket_b36"] details.ficha-sm');
      return {
        ambSrcs: amb ? [...amb.querySelectorAll('.sm-src')].map((n) => n.textContent) : [],
        ambOpen: !!(amb && amb.open),
        offSrcs: off ? [...off.querySelectorAll('.sm-src')].map((n) => n.textContent) : [],
        sockText: sock ? (sock.querySelector('.sm-none') || {}).textContent : '',
        sockOpen: !!(sock && sock.open),
        sockTitle: sock ? (sock.querySelector('summary') || {}).textContent : '',
      };
    });
    ok(bodyCards.ambSrcs.includes('ATC-99') && bodyCards.ambSrcs.includes('ATC-97'),
      'ambient sensor section cites ATC-97 and ATC-99');
    ok(bodyCards.ambOpen === false, 'ambient sensor Rangos section is collapsed by default');
    ok(bodyCards.offSrcs.includes('BRC-33'), 'ABS actuator E51 section cites BRC-33');
    ok(bodyCards.sockText === 'Sin dato en el SM', 'power socket none card shows Sin dato en el SM');
    ok(bodyCards.sockOpen === false, 'power socket Rangos section is collapsed by default');
    ok(bodyCards.sockTitle === 'Rangos', 'power socket default language summary is Rangos');
  } finally {
    await browser.close();
  }
}

if (failed) {
  console.error(failed + ' sm_values test(s) failed');
  process.exit(1);
}
console.log('sm_values.mjs ok');
