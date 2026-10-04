import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';

export function loadLoomBodyExtra(html) {
  const script = html.match(/<script>([\s\S]*?)<\/script>/);
  if (!script) throw new Error('no <script> block');
  const decl = script[1].match(/const LOOM_BODY_EXTRA = new Set\(\[[\s\S]*?\]\);/);
  if (!decl) throw new Error('LOOM_BODY_EXTRA missing');
  const ctx = { result: null };
  vm.createContext(ctx);
  vm.runInContext(decl[0] + '; result = LOOM_BODY_EXTRA;', ctx);
  return ctx.result;
}

export function loadMap(htmlPath) {
  const html = fs.readFileSync(htmlPath, 'utf8');
  const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  const dir = path.join(path.dirname(path.resolve(htmlPath)), 'data');
  const connSrc = fs.readFileSync(path.join(dir, 'conn.js'), 'utf8');
  const i18nSrc = fs.readFileSync(path.join(dir, 'i18n.js'), 'utf8');
  const src = connSrc + '\n'
    + i18nSrc + '\n'
    + script.match(/const PIN_COL = \{[\s\S]*?\};/)[0] + '\n'
    + script.match(/const PIN_RAIL = \{[\s\S]*?\};/)[0] + '\n'
    + script.match(/function buildCircuits\(model\)\{[\s\S]*?\n\}/)[0] + '\n'
    + 'result = {CONN_BASE, PIN_COL, PIN_RAIL, early: buildCircuits("de_early"), rev: buildCircuits("de_revup"), I18N, CONN_I18N, TITLES_I18N, NOTES_I18N};';
  const ctx = { result: null };
  vm.createContext(ctx);
  vm.runInContext(src, ctx);
  ctx.result.LOOM_BODY_EXTRA = loadLoomBodyExtra(html);
  return ctx.result;
}

const entry = process.argv[1] ? path.resolve(process.argv[1]) : '';
const self = path.resolve(fileURLToPath(import.meta.url));
if (entry.toLowerCase() === self.toLowerCase()) {
  const htmlPath = process.argv[2];
  if (!htmlPath) throw new Error('html path required');
  const m = loadMap(htmlPath);
  console.log(JSON.stringify({ I18N: m.I18N, CONN_BASE: m.CONN_BASE, CONN_I18N: m.CONN_I18N }));
}
