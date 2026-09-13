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
  lblLang: { es: 'Idioma', en: 'Language', ja: '言語' },
  selTopTitle: { es: 'Grupos seleccionados', en: 'Selected groups', ja: '選択グループ' },
  selTopGroups: { es: 'grupos', en: 'groups', ja: 'グループ' },
  selTopLines: { es: 'líneas', en: 'lines', ja: 'ライン' },
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

if (failed) {
  console.log(`\n${failed} failed`);
  process.exit(1);
}
console.log('\nall i18n checks passed');
