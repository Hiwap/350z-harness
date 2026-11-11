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
  vm.runInContext(src + '\n; this._out = { SM_VALUES, SM_NONE, smCompactText, smWrapPinText, smParsePinRefs, smPinRangeText };', ctx);
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

const { SM_VALUES, SM_NONE, smCompactText, smWrapPinText, smParsePinRefs, smPinRangeText } = loadSm();
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

ok(typeof smCompactText === 'function' && typeof smWrapPinText === 'function' && typeof smPinRangeText === 'function', 'typography helpers export');
ok(smPinRangeText('Suelto: 0.5 - 1.0 V. A fondo: 3.9 - 4.7 V') === '0.5–1.0 V · 3.9–4.7 V',
  'smPinRangeText keeps both APP ranges, without condition words');
ok(smPinRangeText('Aproximadamente 5 V') === '≈5 V', 'smPinRangeText shortens Aproximadamente 5 V to ≈5 V');
ok(smPinRangeText('Approximately 5 V') === '≈5 V', 'smPinRangeText shortens Approximately 5 V to ≈5 V');
ok(smPinRangeText('約5 V') === '≈5 V', 'smPinRangeText shortens 約5 V to ≈5 V');
ok(smPinRangeText('Pedal de freno y/o embrague ligeramente pisados (M/T), o freno ligeramente pisado (A/T): aproximadamente 0 V. Freno y embrague sueltos (M/T), o freno suelto (A/T): tensión de batería (11 - 14 V)') === '≈0 V · 11–14 V',
  'smPinRangeText compacts the ASCD brake pin to ≈0 V · 11–14 V');
ok(smPinRangeText('ブレーキおよび／またはクラッチをわずかに踏んだ状態（M/T）、またはブレーキをわずかに踏んだ状態（A/T）: 約0 V。ブレーキとクラッチを離した状態（M/T）、またはブレーキを離した状態（A/T）: バッテリー電圧（11–14 V）') === '≈0 V · 11–14 V',
  'smPinRangeText reads 11–14 V out of Japanese fullwidth parentheses');
ok(smPinRangeText('A 20 °C (68 °F): 2.1 - 2.9 kΩ. A 50 °C (122 °F): 0.68 - 1.00 kΩ. A 90 °C (194 °F): 0.236 - 0.260 kΩ') === '0.236–2.9 kΩ',
  'smPinRangeText collapses a temperature table to one min–max');
ok(smPinRangeText('Tras desconectar E34, medir la resistencia entre los terminales 1 y 2 del lado del sensor. -15 °C (5 °F): 12.73 kΩ; -10 (14): 9.92; -5 (23): 7.80; 0 (32): 6.19; 5 (41): 4.95; 10 (50): 3.99; 15 (59): 3.24; 20 (68): 2.65; 25 (77): 2.19; 30 (86): 1.81; 35 (95): 1.51; 40 (104): 1.27; 45 (113): 1.07') === '1.07–12.73 kΩ',
  'smPinRangeText collapses the ambient-sensor table to 1.07–12.73 kΩ, without intermediate points');
ok(smPinRangeText('0 - aproximadamente 1.0 V') === '0–1.0 V', 'smPinRangeText drops aproximadamente inside a range');
ok(smPinRangeText('Tensión de batería') === '', 'smPinRangeText does not invent a number for battery voltage with no published range');
ok(smPinRangeText('Sin vacío aplicado: 1.8 - 4.8 V. A −26.7 kPa (−200 mmHg, −7.87 inHg): 2.1 a 2.5 V menos que el valor anterior') === '1.8–4.8 V',
  'smPinRangeText keeps the evap absolute range and skips the delta');
ok(smCompactText('0.5 - 1.0 V') === '0.5–1.0 V', 'smCompactText uses an en-dash in ranges');
ok(smCompactText('Suelto: 0.5 - 1.0 V. A fondo: 3.9 - 4.7 V') === 'Suelto: 0.5–1.0 V · A fondo: 3.9–4.7 V',
  'smCompactText joins condition sentences with a middot');
ok(smCompactText('aprox. 0.4 V') === 'aprox. 0.4 V', 'smCompactText does not split aprox. as a sentence');
ok(smCompactText('Approximately 0.4 V') === 'Approximately 0.4 V', 'smCompactText keeps Approximately 0.4 V intact');
ok(smCompactText('0 - aproximadamente 1.0 V') === '0–aproximadamente 1.0 V', 'smCompactText en-dashes a range before a word');
{
  const wrapped = smWrapPinText('Suelto: 0.5–1.0 V · A fondo: 3.9–4.7 V', 22);
  ok(Array.isArray(wrapped) && wrapped.length === 2, 'APP range wraps into two lines at the middot (got ' + JSON.stringify(wrapped) + ')');
  ok(wrapped[0].includes('0.5–1.0') && wrapped[1].includes('3.9–4.7'), 'wrapped APP lines keep both ranges');
  const narrow = smWrapPinText('Suelto: 0.5–1.0 V · A fondo: 3.9–4.7 V', 12);
  ok(narrow.length === 2 && narrow[0].includes('0.5–1.0') && narrow[1].includes('3.9–4.7'),
    'narrow width still keeps both APP conditions on their own lines (got ' + JSON.stringify(narrow) + ')');
  const aprox = smWrapPinText('Aproximadamente 5 V', 12);
  ok(aprox.length >= 1 && aprox.every((ln) => !/Aproximadam$/.test(ln) && !/^nte /.test(ln)),
    'Aproximadamente 5 V does not break mid-word (got ' + JSON.stringify(aprox) + ')');
  ok(aprox.join(' ').includes('Aproximadamente') && aprox.join(' ').includes('5 V'),
    'Aproximadamente 5 V keeps both words (got ' + JSON.stringify(aprox) + ')');
}
{
  const refs = smParsePinRefs('E113·5 / ECM 106');
  ok(refs && refs.ecm && refs.ecm.map(String).includes('106') && refs.cavs.some((c) => c.id === '5' && c.code === 'E113'),
    'smParsePinRefs reads E113·5 / ECM 106 (got ' + JSON.stringify(refs) + ')');
}

const packPy = fs.readFileSync(path.join(root, 'make_print_pack.py'), 'utf8');
ok(/use_inv = bool\(face_inv\)/.test(packPy) && !/use_inv = [^\n]*FACE_INV/.test(packPy),
  'print pack still uses use_inv = bool(face_inv)');
ok(/def sm_pin_lines|sm_pin_lines\(/.test(packPy) && /SM_DUMP/.test(packPy),
  'print pack loads FSM values from the SM dump');

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

    /* Intermediate card detail + Seleccionados value line + uniform pin height (all pins, not only valued ones). */
    const ixDetail = await page.evaluate(() => {
      const sel = document.getElementById('lang');
      if (sel) sel.value = 'es';
      if (typeof applyLang === 'function') applyLang();
      const det = document.querySelector('.ficha[data-conn="ix_e11_f2"] details.ficha-sm');
      const values = det ? [...det.querySelectorAll('.sm-value')].map((n) => n.textContent) : [];
      const srcs = det ? [...det.querySelectorAll('.sm-src')].map((n) => n.textContent) : [];
      return { has: !!det, open: !!(det && det.open), values, srcs };
    });
    ok(ixDetail.has, 'E11/F2 intermediate has a .ficha-sm Rangos section');
    ok(ixDetail.open === false, 'E11/F2 Rangos section is collapsed by default');
    ok(ixDetail.values.some((v) => /0\.5–1\.0\s*V/.test(v) && /3\.9–4\.7\s*V/.test(v)),
      'E11/F2 Rangos includes the APP1 range (got ' + JSON.stringify(ixDetail.values).slice(0, 240) + ')');
    ok(ixDetail.srcs.includes('EC-670'), 'E11/F2 Rangos cites EC-670');

    const pinHeights = await page.evaluate(() => {
      const hOf = (sel) => [...document.querySelectorAll(sel)].map((el) => Math.round(el.getBoundingClientRect().height));
      const uniq = (arr) => [...new Set(arr)];
      const ecm = hOf('#blocks .pin');
      const ecmDest = hOf('#blocks .pin.has-dest');
      const ecmEmpty = hOf('#blocks .pin:not(.has-dest)');
      const f102Lg = hOf('#f102Blocks .f102-face-block.pin-lg .pin');
      const f102Sm = hOf('#f102Blocks .f102-face-block.pin-sm .pin');
      const appCav = [...document.querySelectorAll('.ficha[data-conn="app"] .cav-face, .ficha[data-conn="app"] rect.cavity')]
        .map((el) => Math.round(el.getBoundingClientRect().height));
      const ecmPins = document.querySelectorAll('#blocks .pin');
      const ecmSmv = document.querySelectorAll('#blocks .pin .smv');
      return {
        ecmUniq: uniq(ecm), ecmN: ecm.length, ecmMin: Math.min(...ecm), ecmMax: Math.max(...ecm),
        destUniq: uniq(ecmDest), emptyUniq: uniq(ecmEmpty),
        f102LgUniq: uniq(f102Lg), f102LgN: f102Lg.length, f102LgMin: f102Lg.length ? Math.min(...f102Lg) : 0, f102LgMax: f102Lg.length ? Math.max(...f102Lg) : 0,
        f102SmUniq: uniq(f102Sm), f102SmN: f102Sm.length, f102SmMin: f102Sm.length ? Math.min(...f102Sm) : 0, f102SmMax: f102Sm.length ? Math.max(...f102Sm) : 0,
        appUniq: uniq(appCav), appN: appCav.length, appMin: appCav.length ? Math.min(...appCav) : 0, appMax: appCav.length ? Math.max(...appCav) : 0,
        ecmSmv: ecmSmv.length, ecmPins: ecmPins.length,
        hasDestClass: !!document.querySelector('#blocks .pin.has-dest'),
      };
    });
    ok(pinHeights.ecmN > 80 && (pinHeights.ecmMax - pinHeights.ecmMin) <= 1,
      'all ECM pins share one height (got ' + JSON.stringify(pinHeights.ecmUniq) + ' n=' + pinHeights.ecmN + ')');
    ok((pinHeights.destUniq.length <= 1 || Math.abs((pinHeights.destUniq[0]||0) - (pinHeights.destUniq[1]||pinHeights.destUniq[0])) <= 1)
      && (pinHeights.emptyUniq[0] == null || Math.abs(pinHeights.destUniq[0] - pinHeights.emptyUniq[0]) <= 1),
      'has-dest does not change ECM pin height (dest=' + JSON.stringify(pinHeights.destUniq) + ' empty=' + JSON.stringify(pinHeights.emptyUniq) + ')');
    ok(pinHeights.ecmSmv === pinHeights.ecmPins && pinHeights.ecmPins > 0,
      'every ECM pin has a reserved .smv band');
    ok(pinHeights.hasDestClass, 'has-dest class remains on ECM pins');
    ok(pinHeights.f102LgN > 0 && (pinHeights.f102LgMax - pinHeights.f102LgMin) <= 1,
      'F102 L (pin-lg) cavities share one height including empties (got ' + JSON.stringify(pinHeights.f102LgUniq) + ')');
    ok(pinHeights.f102SmN > 0 && (pinHeights.f102SmMax - pinHeights.f102SmMin) <= 1,
      'F102 M (pin-sm) cavities share one height including empties (got ' + JSON.stringify(pinHeights.f102SmUniq) + ')');
    ok(pinHeights.appN >= 6 && (pinHeights.appMax - pinHeights.appMin) <= 1,
      'APP cavities share one height (got ' + JSON.stringify(pinHeights.appUniq) + ')');

    const selected = await page.evaluate(() => {
      const sel = document.getElementById('lang');
      if (sel) sel.value = 'es';
      if (typeof applyLang === 'function') applyLang();
      const hit = document.querySelector('.cav-hit[data-conn="app"][data-cav="5"]');
      if (hit) hit.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      const shortEl = document.getElementById('info-short') || document.querySelector('#info .info-short, #info p, #info');
      const short = (shortEl && (shortEl.innerText || shortEl.textContent) || '').split('\n')[0];
      const selTop = document.getElementById('selTop');
      const smv = selTop ? [...selTop.querySelectorAll('.smv, .cav-sm')].map((n) => n.textContent).join(' | ') : '';
      const desc = [...document.querySelectorAll('.sel-desc')].map((n) => n.innerText);
      return {
        clicked: !!hit,
        short: short.replace(/\s+/g, ' ').trim(),
        shortLen: short.replace(/\s+/g, ' ').trim().length,
        smv,
        desc: desc.join(' | '),
      };
    });
    ok(selected.clicked, 'clicked APP cavity 5');
    ok(selected.shortLen <= 140, 'click info short line stays <= 140 chars (got ' + selected.shortLen + ')');
    ok(!/Medir entre el terminal|Check voltage between ECM terminal/.test(selected.short),
      'short info line does not carry the long FSM measurement procedure');
    ok(/0\.5–1\.0/.test(selected.smv) && /3\.9–4\.7/.test(selected.smv),
      'Seleccionados APP pin shows the FSM range (got ' + JSON.stringify(selected.smv).slice(0, 240) + ')');
    ok(/0\.5–1\.0/.test(selected.desc) && (/EC-670/.test(selected.desc) || /Suelto/.test(selected.desc)),
      'sel-desc includes the APP expected value');

    /* Language switch still updates the selected-pin value. */
    const langSel = await page.evaluate(() => {
      const out = {};
      const clickApp = () => {
        const hit = document.querySelector('.cav-hit[data-conn="app"][data-cav="5"]');
        if (hit) hit.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      };
      for (const L of ['es', 'en', 'ja']) {
        const sel = document.getElementById('lang');
        if (sel) sel.value = L;
        if (typeof applyLang === 'function') applyLang();
        clickApp();
        if (!document.querySelector('#selTop .smv, #selTop .cav-sm')) clickApp();
        const selTop = document.getElementById('selTop');
        out[L] = selTop ? [...selTop.querySelectorAll('.smv, .cav-sm')].map((n) => n.textContent).join(' | ') : '';
      }
      return out;
    });
    ok(/0\.5–1\.0/.test(langSel.es) && /3\.9–4\.7/.test(langSel.es),
      'Seleccionados APP pin (es) shows both compact ranges (got ' + JSON.stringify(langSel.es).slice(0, 120) + ')');
    ok(/0\.5–1\.0/.test(langSel.en) && /3\.9–4\.7/.test(langSel.en),
      'Seleccionados APP pin (en) shows both compact ranges (got ' + JSON.stringify(langSel.en).slice(0, 120) + ')');
    ok(/0\.5–1\.0/.test(langSel.ja) && /3\.9–4\.7/.test(langSel.ja),
      'Seleccionados APP pin (ja) shows both compact ranges (got ' + JSON.stringify(langSel.ja).slice(0, 120) + ')');
    ok(!/Suelto|Fully releas|全閉|Aproximadamente|Approximately/.test(langSel.es + langSel.en + langSel.ja),
      'Seleccionados pin line has no condition prose (got ' + JSON.stringify(langSel).slice(0, 200) + ')');

    /* Compact pin labels on the SM view, and no overflow in es/en/ja. */
    const pinLabels = await page.evaluate(() => {
      const sel = document.getElementById('lang');
      if (sel) sel.value = 'es';
      if (typeof applyLang === 'function') applyLang();
      const txt = (pin) => {
        const el = document.querySelector('#blocks .pin[data-pin="' + pin + '"] .smv');
        return el ? el.textContent.replace(/\s+/g, ' ').trim() : '';
      };
      return { p108: txt(108), p106: txt(106), p90: txt(90), p51: txt(51) };
    });
    ok(/≈0\s*V/.test(pinLabels.p108) && /11–14\s*V/.test(pinLabels.p108) && !/Pedal de freno/.test(pinLabels.p108),
      'SM view pin 108 shows compact ≈0 V · 11–14 V (got ' + JSON.stringify(pinLabels.p108) + ')');
    ok(/0\.5–1\.0/.test(pinLabels.p106) && /3\.9–4\.7/.test(pinLabels.p106) && !/Suelto/.test(pinLabels.p106),
      'SM view pin 106 shows both APP ranges without condition words (got ' + JSON.stringify(pinLabels.p106) + ')');
    ok(/^≈5\s*V$/.test(pinLabels.p90), 'SM view pin 90 (5 V ref) shows the single value ≈5 V (got ' + JSON.stringify(pinLabels.p90) + ')');
    ok(/0\.4–2\.4\s*V/.test(pinLabels.p51) && !/Ralentí/.test(pinLabels.p51),
      'SM view pin 51 collapses MAF intermediates to 0.4–2.4 V (got ' + JSON.stringify(pinLabels.p51) + ')');

    const overflow = await page.evaluate(() => {
      const langs = ['es', 'en', 'ja'];
      const report = { langs: {}, worst: [] };
      const check = (node, tag) => {
        if (!node) return;
        const t = (node.textContent || '').replace(/\s+/g, ' ').trim();
        if (!t) return;
        const ox = node.scrollWidth > node.clientWidth + 1;
        const oy = node.scrollHeight > node.clientHeight + 1;
        const prose = /Pedal de freno|Fully released|Aproximadamente|Approximately|Ralentí|Ignition switch|warm-up protocol/.test(t);
        if (ox || oy || prose) {
          report.worst.push({ tag, t: t.slice(0, 80), ox, oy, prose, sw: node.scrollWidth, cw: node.clientWidth, sh: node.scrollHeight, ch: node.clientHeight });
        }
      };
      const svgOverflow = (textEl, tag) => {
        if (!textEl) return;
        const t = (textEl.textContent || '').trim();
        if (!t) return;
        const cav = textEl.closest('svg') && textEl.closest('svg').querySelector('rect.cavity, rect.cav-face, .cavity');
        /* Compare the text's ink box to the cavity width (the clip path). */
        const host = textEl.closest('.cav-sm-band') || textEl.parentElement;
        const clipRect = host && host.closest('svg') && (textEl.closest('g') && textEl.ownerSVGElement
          ? textEl.ownerSVGElement.querySelector('clipPath rect')
          : null);
        let maxW = 40;
        try {
          const pin = textEl.closest('.ficha, #selTop, svg');
          const face = pin && pin.querySelector('rect.cavity, rect.cav-face');
          if (face && typeof face.getBBox === 'function') maxW = face.getBBox().width;
        } catch (e) {}
        let inkW = 0;
        try { inkW = textEl.getComputedTextLength ? textEl.getComputedTextLength() : (textEl.getBBox().width); } catch (e) {}
        if (inkW > maxW + 1.5) report.worst.push({ tag, t: t.slice(0, 80), ox: true, oy: false, prose: false, inkW, maxW });
      };
      for (const L of langs) {
        const sel = document.getElementById('lang');
        if (sel) sel.value = L;
        if (typeof applyLang === 'function') applyLang();
        document.querySelectorAll('#blocks .pin .smv, #f102Blocks .pin .smv').forEach((n) => {
          const pin = n.closest('.pin');
          check(n, L + ' html ' + ((pin && (pin.dataset.pin || pin.dataset.cav)) || ''));
        });
        document.querySelectorAll('.ficha .cav-sm, #selTop .cav-sm').forEach((n) => {
          svgOverflow(n, L + ' svg');
        });
        report.langs[L] = report.worst.length;
      }
      return report;
    });
    ok(overflow.worst.length === 0,
      'no SM/Seleccionados pin value overflows or keeps long prose in es/en/ja (got ' + JSON.stringify(overflow.worst.slice(0, 8)) + ')');

    const shotDir = '/workspace/printpack_preview';
    try { fs.mkdirSync(shotDir, { recursive: true }); } catch (e) {}
    await page.select('#lang', 'es');
    await page.evaluate(() => {
      if (typeof applyLang === 'function') applyLang();
      if (typeof clearSelection === 'function') clearSelection();
      const hit = document.querySelector('.cav-hit[data-conn="app"][data-cav="5"]');
      if (hit) hit.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    const selTopEl = await page.$('#selTop');
    const appHl = await page.$('#selTop, .ficha.hl[data-conn="app"], .ficha-wrap.hl[data-conn="app"] .ficha, .ficha[data-conn="app"]');
    const shotEl = selTopEl || appHl;
    if (shotEl) {
      await shotEl.screenshot({ path: shotDir + '/sel_app_pin.png' });
    }
    /* Single-value pin in Seleccionados (APP cavity 6, ≈5 V). */
    await page.evaluate(() => {
      if (typeof clearSelection === 'function') clearSelection();
      const hit = document.querySelector('.cav-hit[data-conn="app"][data-cav="6"]');
      if (hit) hit.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    const selSingle = await page.$('#selTop');
    if (selSingle) await selSingle.screenshot({ path: shotDir + '/sel_single_pin.png' });

    /* SM view: full ECM grid + a close-up of pin 108 (and nearby range pins). */
    await page.setViewport({ width: 2000, height: 1800, deviceScaleFactor: 2 });
    await page.evaluate(() => {
      if (typeof clearSelection === 'function') clearSelection();
    });
    const blockOf = async (pin) => {
      const el = await page.$('#blocks .pin[data-pin="' + pin + '"]');
      if (!el) return null;
      await el.evaluate((node) => node.scrollIntoView({ block: 'center', inline: 'nearest' }));
      const handle = await page.evaluateHandle((node) => node.closest('.block') || node, el);
      return handle.asElement();
    };
    const ecmEl = await page.$('#ecm') || await page.$('#blocks');
    if (ecmEl) {
      await ecmEl.evaluate((node) => node.scrollIntoView({ block: 'start' }));
      await ecmEl.screenshot({ path: shotDir + '/sm_view_fixed.png' });
      try {
        const { execFileSync } = require('child_process');
        execFileSync('python3', [path.join(root, 'tools', 'crop_preview_png.py'), shotDir + '/sm_view_fixed.png'], { timeout: 15000 });
      } catch (e) { /* keep the uncropped frame if PIL is missing */ }
    }
    const zoomBlock = await blockOf('108');
    if (zoomBlock) await zoomBlock.screenshot({ path: shotDir + '/sm_view_fixed_zoom.png' });
    const singleBlock = await blockOf('90');
    if (singleBlock) {
      /* Same mid block as 108; crop a tight row around pin 90 (single ≈5 V). */
      const singleClip = await page.evaluate(() => {
        const el = document.querySelector('#blocks .pin[data-pin="90"]');
        const n91 = document.querySelector('#blocks .pin[data-pin="91"]');
        if (!el) return null;
        el.scrollIntoView({ block: 'center', inline: 'nearest' });
        const r = el.getBoundingClientRect();
        const r2 = n91 ? n91.getBoundingClientRect() : r;
        const pad = 18;
        const x = Math.min(r.x, r2.x) - pad;
        const y = Math.min(r.y, r2.y) - pad;
        const right = Math.max(r.right, r2.right) + pad;
        const bot = Math.max(r.bottom, r2.bottom) + pad;
        return { x: Math.max(0, x), y: Math.max(0, y), width: right - Math.max(0, x), height: bot - Math.max(0, y) };
      });
      if (singleClip && singleClip.width > 10) {
        await page.screenshot({ path: shotDir + '/sm_view_single.png', clip: singleClip, captureBeyondViewport: true });
      }
    }
    /* Intermediate ficha detail: select the E11/F2 card and expand Rangos. */
    const ixShot = await page.evaluate(() => {
      if (typeof clearSelection === 'function') clearSelection();
      if (typeof selectConn === 'function') selectConn('ix_e11_f2');
      const det = document.querySelector('.ficha[data-conn="ix_e11_f2"] details.ficha-sm');
      if (det) det.open = true;
      const panel = document.querySelector('.sel-desc, #selPanel, #info').parentElement;
      return { opened: !!(det && det.open), hasDesc: !!document.querySelector('.sel-desc') };
    });
    ok(ixShot.opened, 'E11/F2 Rangos can be expanded for the detail shot');
    const ixCard = await page.$('.ficha[data-conn="ix_e11_f2"]');
    if (ixCard) await ixCard.screenshot({ path: shotDir + '/ix_e11_f2_ficha.png' });
    const descEl = await page.$('.sel-desc');
    if (descEl) await descEl.screenshot({ path: shotDir + '/ix_e11_f2_sel_desc.png' });
  } finally {
    await browser.close();
  }
}

if (failed) {
  console.error(failed + ' sm_values test(s) failed');
  process.exit(1);
}
console.log('sm_values.mjs ok');
