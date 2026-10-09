#!/usr/bin/env node
/**
 * Equipment selectors (body / brakes / audio / navigation / power seat / heated seats).
 * FSM GI-48 splits only body (Coupe/Roadster), transmission and destination (USA/Canada) and names no trims,
 * so options are separate dropdowns. Defaults = generic OEM coupe (Coupe, ABS, base audio, no options).
 * No market selector: the map is the USA car (VARIANT_FIXED market=usa); the Canada-only DTRL cavities
 * stay drawn dimmed (OPT_OFF_OPACITY), clickable, with a "solo Canadá (luces diurnas)" tooltip.
 *  - static: every select matches VARIANT_DIMS (values + default), vif/altIf use only known keys/values,
 *    vifMatch semantics, every body pin's circ exists and every circuit path cavity exists on its card
 *  - browser: defaults hide equipment-only cavities/cards, each selector shows/hides them, persists in
 *    localStorage, relabels es/en/ja, and the transmission filter keeps working next to them
 */
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { createRequire } from 'module';
import { fileURLToPath, pathToFileURL } from 'url';
import { loadMap } from './load_map.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const require = createRequire(import.meta.url);
const HTML = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

let pass = 0; const fails = [];
const ok = (name, cond, detail = '') => { if (cond) { pass++; console.log('  ok  ' + name); } else { fails.push(name + (detail ? ' — ' + detail : '')); console.log('  FAIL ' + name + (detail ? ' — ' + detail : '')); } };

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

/* ---------- static ---------- */
const script = HTML.match(/<script>([\s\S]*?)<\/script>/)[1];
const dimsSrc = script.match(/const VARIANT_DIMS = (\{[\s\S]*?\n\});/)[1];
const DIMS = vm.runInNewContext('(' + dimsSrc + ')');
const KEYS = Object.keys(DIMS);
ok('VARIANT_DIMS = body, brake, audio, nav, pseat, hseat (no rear-wiper selector: the rear washer is Coupe, BCS-9; no market selector)', KEYS.join(',') === 'body,brake,audio,nav,pseat,hseat', KEYS.join(','));
const DEF = { body: 'coupe', brake: 'abs', audio: 'base', nav: 'no', pseat: 'no', hseat: 'no' };
const FIXED = vm.runInNewContext('(' + script.match(/const VARIANT_FIXED = (\{[^\n]*?\});/)[1] + ')');
ok('market is fixed (VARIANT_FIXED market=usa) with no selector, label or strings left', FIXED.market === 'usa' && !/marketView|lblMarket|marketUsa|marketCanada|z33_market/.test(HTML), JSON.stringify(FIXED));
for (const k of KEYS) {
  const d = DIMS[k];
  ok(`${k}: default = generic OEM coupe (${DEF[k]})`, d.def === DEF[k], d.def);
  const sel = HTML.match(new RegExp(`<select id="${d.el}">([\\s\\S]*?)</select>`));
  ok(`${k}: <select id="${d.el}"> exists next to the other options`, !!sel);
  if (sel) {
    const vals = [...sel[1].matchAll(/<option value="([^"]+)"/g)].map((m) => m[1]);
    const selected = (sel[1].match(/<option value="([^"]+)"[^>]*selected/) || [])[1];
    ok(`${k}: options ${d.vals.join('/')}, ${d.def} selected`, vals.join(',') === d.vals.join(',') && selected === d.def, vals.join(',') + ' sel=' + selected);
  }
  ok(`${k}: localStorage key z33_${k}`, d.ls === 'z33_' + k, d.ls);
}
ok('no trim dropdown (GI-48 names no trims)', !/id="trimView"/.test(HTML));
ok('transmission filter still a single #transView select', (HTML.match(/<select id="transView">/g) || []).length === 1);

const vifSrc = script.match(/function vifMatch\([\s\S]*?\n\}/)[0];
const ctx = {}; vm.createContext(ctx);
vm.runInContext(vifSrc + '\nthis.vifMatch = vifMatch;', ctx);
const V = { trans: 'mt', ...DEF };
ok('vifMatch: empty expression always matches', ctx.vifMatch('', V) && ctx.vifMatch(undefined, V));
ok('vifMatch: single term', !ctx.vifMatch('body=roadster', V) && ctx.vifMatch('body=coupe', V));
ok('vifMatch: value list (brake=tcs,vdc)', !ctx.vifMatch('brake=tcs,vdc', V) && ctx.vifMatch('brake=tcs,vdc', { ...V, brake: 'tcs' }));
ok('vifMatch: AND (&)', !ctx.vifMatch('body=roadster&pseat=yes', { ...V, body: 'roadster' }) && ctx.vifMatch('body=roadster&pseat=yes', { ...V, body: 'roadster', pseat: 'yes' }));
ok('vifMatch: OR (|) incl. trans', ctx.vifMatch('audio=bose|trans=at', { ...V, trans: 'at' }) && !ctx.vifMatch('audio=bose|trans=at', V));

const { CONN_BASE: C } = loadMap(path.join(root, 'index.html'));
const bi = script.indexOf('function buildCircuits('); const bj = script.indexOf('\n/* ========== Connectors', bi);
const c3 = {}; vm.createContext(c3);
vm.runInContext(script.slice(bi, bj) + '\nthis.R = buildCircuits("de_early"); this.R2 = buildCircuits("de_revup");', c3);
const CIRC = Object.fromEntries(c3.R.concat(c3.R2).map((c) => [c.id, c]));
const checkVif = (expr) => !expr || String(expr).split('|').every((g) => g.split('&').every((t) => {
  const [k, vals] = t.split('=');
  if (k === 'trans') return vals.split(',').every((v) => v === 'mt' || v === 'at');
  if (k === 'market') return vals.split(',').every((v) => v === 'usa' || v === 'canada');
  return DIMS[k] && vals.split(',').every((v) => DIMS[k].vals.includes(v));
}));
const badVif = [];
for (const [id, c] of Object.entries(C)) {
  if (!checkVif(c.vif)) badVif.push(id);
  for (const p of c.pins || []) { if (!checkVif(p.vif) || !checkVif(p.altIf)) badVif.push(id + '·' + p.id); if (p.altIf && !p.altCode) badVif.push(id + '·' + p.id + ' altIf without altCode'); }
}
for (const c of c3.R) if (!checkVif(c.vif)) badVif.push('circuit ' + c.id);
ok('every vif / altIf uses known equipment keys and values', badVif.length === 0, badVif.join(', '));
const badCirc = [];
for (const [id, c] of Object.entries(C)) for (const p of c.pins || []) if (p.circ && !CIRC[p.circ]) badCirc.push(`${id}·${p.id} → ${p.circ}`);
ok('every pin circ points to an existing circuit', badCirc.length === 0, badCirc.join(', '));
const badPath = [];
for (const c of c3.R) for (const [cid, cavs] of Object.entries(c.path || {})) {
  const card = C[cid]; if (!card) { badPath.push(`${c.id}: card ${cid}`); continue; }
  for (const cav of cavs) if (!(card.pins || []).some((p) => String(p.id) === String(cav)) && !/^(ring)$/.test(cav) && !['ipdm_cover', 'f152', 'e17', 'f23_gnd'].includes(cid)) badPath.push(`${c.id}: ${cid}·${cav}`);
}
ok('every circuit path cavity exists on its card', badPath.length === 0, badPath.join(', '));
const bodyIds = Object.keys(C).filter((id) => C[id].sub === 'carroceria');
ok('Carrocería groups: ABS, lamps, doors, defogger, seats, audio, gauges, climate, wipers, soft top, A/T',
  ['abs', 'luces', 'puertas', 'desemp', 'asientos', 'audio', 'medidores', 'clima', 'limpia', 'techo', 'at'].every((n) => bodyIds.some((id) => C[id].nest === n)), bodyIds.join(','));
const railBody = [];
for (const id of ['ix_e106_b2', 'ix_t2_b44', 'ix_e108_m15', 'ix_b1_m12', ...bodyIds]) for (const p of C[id].pins || []) if (p.srcSub === 'carroceria' && p.rail) railBody.push(id + '·' + p.id);
ok('new body pins carry no rail (switched outputs / sensor supplies are not 12V rails)', railBody.length === 0, railBody.join(','));
const pin = (cid, id) => (C[cid].pins || []).find((p) => String(p.id) === String(id)) || {};
ok('DLC M8·16 is R/W (AT-194)', pin('dlc', '16').code === 'R/W');
ok('E108·16G VDC sensor supply is not a rail', !pin('ix_e108_m15', '16G').rail && pin('ix_e108_m15', '16G').vif === 'brake=vdc');
ok('A/T-only body cavities use trans:at (E10/F1·4/6/7, F102·24H, E108·63G/64G)',
  ['4', '6', '7'].every((i) => pin('ix_e10_f1', i).trans === 'at') && pin('ix_f102_m72', '24H').trans === 'at' && pin('ix_e108_m15', '63G').trans === 'at');
ok('rear washer E108·8G (WW-40): Coupe only, from rear washer motor E28·1; no rwiper selector left', pin('ix_e108_m15', '8G').vif === 'body=coupe' && pin('ix_e108_m15', '8G').src === 'E28·1' && pin('ix_e108_m15', '8G').circ === 'rear_washer' && !/rwiper/.test(HTML));
ok('Canada DTRL cavities (E106·6, E108·62G) are market=canada', pin('ix_e106_b2', '6').vif === 'market=canada' && pin('ix_e108_m15', '62G').vif === 'market=canada');

/* ---------- browser ---------- */
const puppeteer = loadPuppeteer();
const browser = await puppeteer.launch({ executablePath: findChrome(), headless: true, args: ['--no-sandbox', '--disable-gpu'] });
const page = await browser.newPage();
await page.setViewport({ width: 1400, height: 900 });
const url = pathToFileURL(path.join(root, 'index.html')).href;
await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForSelector('#fichas .ficha');
const sel = async (id, v) => { await page.select('#' + id, v); await new Promise((r) => setTimeout(r, 80)); };
const st = () => page.evaluate(() => {
  const code = (cid, id) => { const c = CONN[cid]; const p = c && c.pins.find((x) => String(x.id) === String(id)); return p ? p.code : null; };
  const shown = (cid) => !!document.querySelector(`#fichas [data-conn="${cid}"]`);
  return {
    vals: Object.fromEntries(Object.keys(VARIANT_DIMS).map((k) => [k, document.getElementById(VARIANT_DIMS[k].el).value])),
    circs: CIRCUITS.map((c) => c.id),
    m51: shown('vdc_m51'), techo: shown('top_b67'), at: shown('atdev_m47'), abs: shown('abs_e51'), t5: shown('abs_t5'), e118: shown('vdc_e118'), m9: shown('vdc_off_m9'), f6: shown('f6_at'),
    g13: code('ix_e108_m15', '13G'), g35: code('ix_e108_m15', '35G'), j29: code('ix_b1_m12', '29J'), j23: code('ix_b1_m12', '23J'),
    j46: code('ix_b1_m12', '46J'), t2: code('ix_t2_b44', '2'), b12: code('ix_e106_b2', '12'), b6: code('ix_e106_b2', '6'),
    j2: code('ix_b1_m12', '2J'), g8: code('ix_e108_m15', '8G'), j1: code('ix_b1_m12', '1J'), j4: code('ix_b1_m12', '4J'),
    f4: code('ix_e10_f1', '4'), h24: (f102Conf().pins.find((p) => p.id === '24H') || {}).code,
    note13: (CONN.ix_e108_m15.pins.find((p) => p.id === '13G') || {}).note_en || '',
  };
});
let s = await st();
ok('defaults: Coupe / ABS / base audio / no options', JSON.stringify(s.vals) === JSON.stringify(DEF), JSON.stringify(s.vals));
ok('defaults: ABS unit E51 and rear sensors T5 shown; VDC unit E118, OFF switch M9, sensor M51 and Roadster soft top hidden', s.abs && s.t5 && !s.e118 && !s.m9 && !s.m51 && !s.techo, JSON.stringify([s.abs, s.t5, s.e118, s.m9, s.m51, s.techo]));
ok('defaults: VDC-only E108·13G empty, with an explanation', s.g13 === '—' && /Not used with the selected equipment/.test(s.note13), s.g13 + ' ' + s.note13.slice(0, 60));
ok('defaults: no VDC/TCS/Roadster/Canada/option circuits', !['vdc_yaw', 'vdc_off', 'soft_top', 'dtrl_pkb', 'heated_seat', 'blower_gnd', 'pseat_bat', 'audio_bose_ctl'].some((c) => s.circs.includes(c)));
ok('defaults: circuits common to every coupe are present', ['abs_rl', 'abs_rr', 'abs_kline', 'turn_lh', 'turn_rh', 'stop_lamps', 'bcm_bat', 'rear_defog', 'belt_dr', 'audio_backup', 'brake_fluid', 'ambient', 'dlc_ign'].every((c) => s.circs.includes(c)));
ok('defaults: Coupe-only cavities present (T2/B44·2 back door switch R)', s.t2 === 'R' && s.j46 === '—' && s.b12 === 'G/R', JSON.stringify([s.t2, s.j46, s.b12]));
ok('defaults: base audio "BS" colours (M12·29J LG/R, front 23J empty)', s.j29 === 'LG/R' && s.j23 === '—', JSON.stringify([s.j29, s.j23]));
ok('defaults (M/T): A/T body card and E10/F1·4 / F102·24H empty', !s.at && s.f4 === '—' && s.h24 === '—' && !s.f6, JSON.stringify([s.at, s.f4, s.h24, s.f6]));

await sel('brakeView', 'tcs'); s = await st();
ok('brakes ABS+TCS: OFF switch (35G L/Y, card M9) shown with unit E51, VDC unit and sensor still hidden', s.g35 === 'L/Y' && s.circs.includes('vdc_off') && s.m9 && s.abs && !s.e118 && !s.m51 && s.g13 === '—');
await sel('brakeView', 'vdc'); s = await st();
ok('brakes VDC: M51 card + E108·13G W/R + vdc_yaw circuit; unit E118 replaces E51', s.m51 && s.g13 === 'W/R' && s.circs.includes('vdc_yaw') && s.e118 && s.m9 && !s.abs && s.t5, JSON.stringify([s.m51, s.g13, s.e118, s.abs]));
ok('brakes VDC: rear speaker colours switch to the non-"BS" set (29J BR) and front loop appears (23J W)', s.j29 === 'BR' && s.j23 === 'W', JSON.stringify([s.j29, s.j23]));
await sel('brakeView', 'abs');
await sel('bodyView', 'roadster'); s = await st();
ok('Roadster: soft top card + 46J W shown; Coupe back door switch T2·2 empty; defogger E106·12 is G', s.techo && s.j46 === 'W' && s.t2 === '—' && s.b12 === 'G', JSON.stringify([s.techo, s.j46, s.t2, s.b12]));
await sel('bodyView', 'coupe');
const canada = await page.evaluate(() => {
  const cell = (c, v) => { const g = document.querySelector(`.cav-hit[data-conn="${c}"][data-cav="${v}"]`); return g ? { off: g.classList.contains('cav-opt-off'), op: Number(g.getAttribute('opacity')), tip: (g.querySelector('title') || {}).textContent || '', code: ((g.querySelector('.cav-code') || {}).textContent || '').replace(/\s/g, ''), click: cavClickable(c, variantGatePin(CONN[c].pins.find((p) => p.id === v), variantView())) } : null; };
  return { b6: cell('ix_e106_b2', '6'), g62: cell('ix_e108_m15', '62G'), pkb: cell('dtrl_e15', '17'), alt: cell('dtrl_e14', '1'), h13: f102PinEl('13H') && f102PinEl('13H').classList.contains('opt-off') };
});
const dimOk = (c, code) => !!c && c.off && c.op === 0.35 && c.tip === 'solo Canadá (luces diurnas)' && c.code === code && c.click;
ok('Canada DTRL (no selector): E106·6 G, E108·62G W/R, E15·17 G / E14·1 W/R drawn dimmed at 0.35, clickable, tooltip "solo Canadá (luces diurnas)"',
  dimOk(canada.b6, 'G') && dimOk(canada.g62, 'W/R') && dimOk(canada.pkb, 'G') && dimOk(canada.alt, 'W/R'), JSON.stringify(canada));
ok('F102·13H (alternator L, shared with the USA charge lamp) is not dimmed', canada.h13 === false, String(canada.h13));
await page.evaluate(() => { clearSelection(); document.querySelector('.cav-hit[data-conn="ix_e108_m15"][data-cav="62G"]').dispatchEvent(new MouseEvent('click', { bubbles: true })); });
const c62 = await page.evaluate(() => ({ info: selectionInfoText(), hl: document.querySelector('.cav-hit[data-conn="ix_e108_m15"][data-cav="62G"]').classList.contains('hl'), alt: !!document.querySelector('.cav-hit[data-conn="f20_alt"][data-cav="3"].hl, .cav-hit[data-conn="f20_alt"][data-cav="3"].hl-group') }));
ok('clicking dimmed E108·62G lights it + the DTRL path to alternator F20·3; info says Canada only', c62.hl && c62.alt && /Solo Canadá/.test(c62.info), JSON.stringify(c62).slice(0, 300));
await page.evaluate(() => clearSelection());
const tips = {};
for (const lg of ['en', 'ja', 'es']) { await sel('lang', lg); tips[lg] = await page.evaluate(() => (document.querySelector('.cav-hit[data-conn="ix_e106_b2"][data-cav="6"] title') || {}).textContent); }
ok('Canada tooltip es/en/ja', tips.es === 'solo Canadá (luces diurnas)' && tips.en === 'Canada only (daytime running lights)' && tips.ja === 'カナダ仕様のみ（デイライト）', JSON.stringify(tips));
await sel('audioView', 'bose'); s = await st();
ok('Bose: amp-ON circuit + front speaker 23J W/LG', s.circs.includes('audio_bose_ctl') && s.j23 === 'W/LG', s.j23);
await sel('audioView', 'base');
await sel('hseatView', 'yes'); s = await st();
ok('Heated seats: relay output M12·2J G + heated_seat circuits', s.j2 === 'G' && s.circs.includes('heated_seat'), s.j2);
await sel('pseatView', 'yes'); await sel('navView', 'yes'); s = await st();
ok('Power seat / navigation: 4J W, 1J B; rear washer 8G LG/B on the default Coupe', s.j4 === 'W' && s.j1 === 'B' && s.g8 === 'LG/B', JSON.stringify([s.j4, s.j1, s.g8]));

await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForSelector('#fichas .ficha');
s = await st();
ok('selectors persist across reload (localStorage)', s.vals.hseat === 'yes' && s.vals.pseat === 'yes' && s.vals.nav === 'yes' && s.j2 === 'G', JSON.stringify(s.vals));
for (const k of ['hseatView', 'pseatView', 'navView']) await sel(k, 'no');

await sel('transView', 'at'); s = await st();
ok('Automático: F6 + A/T body card shown, E10/F1·4 Y/R, F102·24H PU/W', s.f6 && s.at && s.f4 === 'Y/R' && s.h24 === 'PU/W', JSON.stringify([s.f6, s.at, s.f4, s.h24]));
ok('Automático (still ABS / base): rear speakers use the non-"BS" colours (29J BR)', s.j29 === 'BR', s.j29);
await sel('transView', 'mt'); s = await st();
ok('Manual again: A/T body card hidden, transmission filter unaffected by the new selectors', !s.at && !s.f6 && s.f4 === '—');

const click = await page.evaluate(() => { clearSelection(); selectConnPin('ix_e108_m15', '36G'); return [...lastCircIds]; });
ok('click E108·36G → right turn circuit only (no fan-out over the SMJ)', click.length === 1 && click[0] === 'turn_rh', click.join(','));
const click2 = await page.evaluate(() => { clearSelection(); selectConnPin('abs_t5', '4'); return [...lastCircIds]; });
ok('click rear sensor T5·4 → abs_rl', click2.join(',') === 'abs_rl', click2.join(','));
const flat = await page.evaluate(() => { const sec = document.querySelector('#fichas details.ficha-sec[data-sub="carroceria"]'); return { nests: sec ? sec.querySelectorAll('details.ficha-nest').length : -1, ids: sec ? [...sec.querySelectorAll(':scope > .fichas-grid > .ficha-wrap')].map((f) => f.dataset.conn) : [] }; });
ok('Carrocería is one flat group: no nested subgroups, fichas listed directly, ABS first', flat.nests === 0 && flat.ids.length >= 9 && flat.ids[0] === 'abs_e51', JSON.stringify(flat));

const labels = {};
for (const lg of ['en', 'ja', 'es']) {
  await sel('lang', lg);
  labels[lg] = await page.evaluate(() => [document.getElementById('lblBody').textContent.trim().split('\n')[0], document.querySelector('#bodyView option[value="roadster"]').textContent, document.querySelector('#hseatView option[value="yes"]').textContent]);
}
ok('labels relabel en/ja/es', labels.en[0].startsWith('Body') && labels.ja[0].startsWith('ボディ') && labels.es[0].startsWith('Carrocería') && labels.en[2] === 'Yes' && labels.ja[2] === 'あり' && labels.es[2] === 'Sí', JSON.stringify(labels));

await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
await browser.close();
console.log(`---\nvariants: ${pass} passed, ${fails.length} failed`);
if (fails.length) { console.log('FAILED:\n' + fails.join('\n')); process.exit(1); }
console.log('VARIANTS OK');
