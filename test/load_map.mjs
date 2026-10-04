import fs from 'fs';
import vm from 'vm';

export function loadMap(htmlPath) {
  const html = fs.readFileSync(htmlPath, 'utf8');
  const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  const i = script.indexOf('const CONN_BASE = {');
  const j = script.indexOf('const CONN_FACE = {', i + 1);
  if (i < 0 || j < 0) throw new Error('anchor missing');
  const src = script.slice(i, j) + '\n'
    + script.match(/const PIN_COL = \{[\s\S]*?\};/)[0] + '\n'
    + script.match(/const PIN_RAIL = \{[\s\S]*?\};/)[0] + '\n'
    + script.match(/function buildCircuits\(model\)\{[\s\S]*?\n\}/)[0]
    + '\nresult = {CONN_BASE, PIN_COL, PIN_RAIL, early: buildCircuits("de_early"), rev: buildCircuits("de_revup")};';
  const ctx = { result: null };
  vm.createContext(ctx);
  vm.runInContext(src, ctx);
  return ctx.result;
}
