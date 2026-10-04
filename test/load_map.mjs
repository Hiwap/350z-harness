import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';

function cut(script, startTok, endTok) {
  const i = script.indexOf(startTok);
  const j = script.indexOf(endTok, i < 0 ? 0 : i + startTok.length);
  if (i < 0 || j < 0) throw new Error('anchor missing');
  return script.slice(i, j);
}

export function loadMap(htmlPath) {
  const html = fs.readFileSync(htmlPath, 'utf8');
  const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  const i = script.indexOf('const CONN_BASE = {');
  const j = script.indexOf('const CONN_FACE = {', i + 1);
  if (i < 0 || j < 0) throw new Error('anchor missing');
  const src = script.slice(i, j) + '\n'
    + script.match(/const PIN_COL = \{[\s\S]*?\};/)[0] + '\n'
    + script.match(/const PIN_RAIL = \{[\s\S]*?\};/)[0] + '\n'
    + script.match(/function buildCircuits\(model\)\{[\s\S]*?\n\}/)[0] + '\n'
    + cut(script, 'const I18N = {', 'const TITLES_I18N') + '\n'
    + cut(script, 'const TITLES_I18N = {', 'const NOTES_I18N = {') + '\n'
    + cut(script, 'const NOTES_I18N = {', 'function t(key)') + '\n'
    + cut(script, 'const CONN_I18N = {', 'const IPDM_DISPLAY_ORDER') + '\n'
    + 'result = {CONN_BASE, PIN_COL, PIN_RAIL, early: buildCircuits("de_early"), rev: buildCircuits("de_revup"), I18N, CONN_I18N, TITLES_I18N, NOTES_I18N};';
  const ctx = { result: null };
  vm.createContext(ctx);
  vm.runInContext(src, ctx);
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
