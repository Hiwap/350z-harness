import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

function extractI18N() {
  const start = html.indexOf('const I18N = {');
  const end = html.indexOf('\nconst TITLES_I18N');
  if (start < 0 || end < 0) throw new Error('Could not find I18N object in index.html');
  return Function(html.slice(start, end) + '; return I18N;')();
}

const I18N = extractI18N();
const LANGS = ['es', 'en', 'ja'];
let failed = 0;
function ok(cond, msg) {
  if (cond) console.log('  ok  ' + msg);
  else { console.log('  FAIL ' + msg); failed++; }
}

console.log('i18n packs');
for (const l of LANGS) ok(I18N[l] && typeof I18N[l] === 'object', `pack ${l}`);

const keys = (l) => Object.keys(I18N[l]).filter((k) => k !== 'cname').sort();
const esKeys = keys('es');
console.log(`\nkey parity (es has ${esKeys.length})`);
for (const l of ['en', 'ja']) {
  const missing = esKeys.filter((k) => !(k in I18N[l]));
  const extra = keys(l).filter((k) => !(k in I18N.es));
  ok(missing.length === 0, `${l} has all es keys` + (missing.length ? ` missing: ${missing.join(', ')}` : ''));
  ok(extra.length === 0, `${l} has no extra keys` + (extra.length ? ` extra: ${extra.join(', ')}` : ''));
}

console.log('\ncname color codes');
const cnameEs = Object.keys(I18N.es.cname).sort().join(',');
for (const l of ['en', 'ja']) {
  ok(Object.keys(I18N[l].cname).sort().join(',') === cnameEs, `${l} cname codes match es`);
}

console.log('\nnon-empty strings');
for (const l of LANGS) {
  const empty = esKeys.filter((k) => k !== 'f102Legend' && k !== 'unkPin' && k !== 'f102RStub' && (I18N[l][k] == null || I18N[l][k] === ''));
  ok(empty.length === 0, `${l} values present` + (empty.length ? ` empty: ${empty.join(', ')}` : ''));
}

console.log('\nexpected chrome labels');
const expect = {
  railRelTitle: { es: 'Relacionados', en: 'Related', ja: '関連' },
  railRelPower: { es: 'Alim.', en: 'Power', ja: '電源' },
  railRelGnd: { es: 'Tierras', en: 'Grounds', ja: 'アース' },
  railRelData: { es: 'Datos', en: 'Data', ja: 'データ' },
  loomAll: { es: 'Completo', en: 'Full', ja: '全体' },
  loomMotor: { es: 'Arnès motor', en: 'Engine harness', ja: 'エンジンハーネス' },
  lblTrans: { es: 'Transmisión', en: 'Transmission', ja: 'トランスミッション' },
  transMt: { es: 'Manual', en: 'Manual', ja: 'マニュアル' },
  transAt: { es: 'Automático', en: 'Automatic', ja: 'オートマチック' },
  lblLang: { es: 'Idioma', en: 'Language', ja: '言語' },
  selTopTitle: { es: 'Grupos seleccionados', en: 'Selected groups', ja: '選択グループ' },
  selTopGroups: { es: 'grupos', en: 'groups', ja: 'グループ' },
  selTopLines: { es: 'líneas', en: 'lines', ja: 'ライン' },
  hdrTitle: { es: 'Nissan 350Z · Harness / Fichas OEM', en: 'Nissan 350Z · OEM harness / connectors', ja: 'Nissan 350Z · OEMハーネス / コネクタ' },
  pageTitle: { es: 'Nissan 350Z · Harness / Fichas OEM (FSM)', en: 'Nissan 350Z · OEM harness / connectors (FSM)', ja: 'Nissan 350Z · OEMハーネス / コネクタ (FSM)' },
  railLabel: { es: 'Rieles', en: 'Rails', ja: 'レール' },
};
for (const [key, byLang] of Object.entries(expect)) {
  for (const l of LANGS) {
    ok(I18N[l][key] === byLang[l], `${l}.${key} = ${JSON.stringify(byLang[l])}` + (I18N[l][key] !== byLang[l] ? ` (got ${JSON.stringify(I18N[l][key])})` : ''));
  }
}

console.log('\nt() call sites exist in all packs');
const used = [...new Set([...html.matchAll(/\bt\('([^']+)'\)/g)].map((m) => m[1]))];
for (const key of used) {
  for (const l of LANGS) {
    ok(key in I18N[l], `t('${key}') in ${l}`);
  }
}

function grab(startTok, endTok) {
  const s = html.indexOf(startTok);
  const e = html.indexOf(endTok, s + 1);
  if (s < 0 || e < 0) throw new Error('missing ' + startTok);
  return html.slice(s, e);
}

console.log('\ncavity notes have note_en');
const CONN_BASE = Function(grab('const CONN_BASE = {', 'const CONN_FACE = {') + '; return CONN_BASE;')();
const missingNoteEn = [];
for (const id of Object.keys(CONN_BASE)) {
  for (const pin of CONN_BASE[id].pins || []) {
    if (pin.note && !pin.note_en) missingNoteEn.push(id + '·' + pin.id);
  }
}
ok(missingNoteEn.length === 0, 'every pin.note has note_en' + (missingNoteEn.length ? ` missing: ${missingNoteEn.join(', ')}` : ''));

console.log('\nEnglish packs stay English');
const esLeak = /[áéíóúñ¿¡]|\b(Ruta:|Arnés|ficha|Fichas|calentador|Bobina|Inyector|venteo|habitáculo|carrocería|embrague|Arranque|admisión|mariposa|seleccionados)\b/i;
function walkLeak(obj, p, hits) {
  if (obj && typeof obj === 'object') {
    for (const k of Object.keys(obj)) {
      if (k === 'es' || k.endsWith('_es')) continue;
      walkLeak(obj[k], p + '.' + k, hits);
    }
  } else if (typeof obj === 'string' && (p.includes('.en') || p.includes('.en_')) && esLeak.test(obj)) {
    hits.push(p + ': ' + obj.slice(0, 120));
  }
}
const TITLES = Function(grab('const TITLES_I18N = {', 'const NOTES_I18N = {') + '; return TITLES_I18N;')();
const NOTES = Function(grab('const NOTES_I18N = {', 'function t(key)') + '; return NOTES_I18N;')();
const CONN_I18N = Function(grab('const CONN_I18N = {', 'function connField') + '; return CONN_I18N;')();
const leaks = [];
walkLeak(I18N, 'I18N', leaks);
walkLeak(TITLES, 'TITLES', leaks);
walkLeak(NOTES, 'NOTES', leaks);
walkLeak(CONN_I18N, 'CONN', leaks);
ok(leaks.length === 0, 'no Spanish leftovers in EN strings' + (leaks.length ? `\n    ${leaks.slice(0, 12).join('\n    ')}` : ''));

ok(!/>Alim\. 12V</.test(html), 'info Power-12V pill uses t(), not hardcoded Alim.');
ok(/t\('hdrTitle'\)/.test(html) && /t\('pageTitle'\)/.test(html), 'applyLang sets h1 + document.title');

if (failed) {
  console.log(`\n${failed} failed`);
  process.exit(1);
}
console.log('\nall i18n checks passed');
