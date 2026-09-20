#!/usr/bin/env node
/**
 * Deterministic verification for 350Z harness bugfixes (pstack prove-it-works).
 * Static + extracted-JS checks — no browser required.
 * Run from repo: node test/verify_harness_bugs.mjs
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import vm from 'vm';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const HTML_CANDIDATES = [
  process.argv[2],
  path.join(ROOT, 'index.html'),
  path.join(ROOT, '350Z_harness_interactive.html'),
  '/workspace/350Z_harness_interactive.html',
].filter(Boolean);
const HTML = HTML_CANDIDATES.find((p) => fs.existsSync(p));
if (!HTML) {
  console.error('HTML not found. Tried:', HTML_CANDIDATES.join(', '));
  process.exit(1);
}
const html = fs.readFileSync(HTML, 'utf8');
const failures = [];
const passes = [];

function ok(name, cond, detail='') {
  if (cond) { passes.push(name); console.log(`PASS  ${name}${detail ? ' — ' + detail : ''}`); }
  else { failures.push(name); console.error(`FAIL  ${name}${detail ? ' — ' + detail : ''}`); }
}

function extractScript(h) {
  const m = h.match(/<script>([\s\S]*?)<\/script>/);
  if (!m) throw new Error('no <script> block');
  return m[1];
}

function circuitBlock(id) {
  const re = new RegExp(`\\{id:'${id}'[\\s\\S]*?notes:'[^']*'\\}`);
  const m = html.match(re);
  return m ? m[0] : null;
}

const script = extractScript(html);

const tmp = path.join(process.env.TMPDIR || '/tmp', 'harness_verify_main.js');
fs.writeFileSync(tmp, script);
const chk = spawnSync(process.execPath, ['--check', tmp], { encoding: 'utf8' });
ok('node --check extracted script', chk.status === 0, chk.stderr?.trim() || 'syntax ok');

ok('evap_press in LOOM_BODY_EXTRA',
  /const LOOM_BODY_EXTRA = new Set\(\[[\s\S]*?'evap_press'[\s\S]*?\]\)/.test(html));
ok('ac_press in LOOM_BODY_EXTRA',
  /const LOOM_BODY_EXTRA = new Set\(\[[\s\S]*?'ac_press'[\s\S]*?\]\)/.test(html));
ok('evap_press CONN exists', /\n  evap_press:\{/.test(html));

{
  const fn = html.match(/function updateEcmSelCount\([\s\S]*?\nfunction /)[0];
  const domLine = fn.match(/const domSel = '([^']+)'/);
  ok('updateEcmSelCount DOM sel includes hl-group + Relacionados',
    domLine && domLine[1].includes('hl-group') && domLine[1].includes('hl-rail-rel-gnd') && domLine[1].includes('.pin.hl'),
    domLine ? domLine[1] : 'no domSel');
  ok('selectCircuits labels from DOM (not focus-only)',
    /updateEcmSelCount\(\)/.test(html) && !/if\(focusPin!=null\) updateEcmSelCount\(\[focusPin\]\)/.test(html));
  const f102 = html.match(/function updateF102SelPins\([\s\S]*?\nfunction /)[0];
  const f102Dom = f102.match(/const domSel = '([^']+)'/);
  ok('updateF102SelPins DOM sel includes hl-group',
    f102Dom && f102Dom[1].includes('hl-group'),
    f102Dom ? f102Dom[1] : 'no domSel');
}

ok('rebuildIndexes dedupes circuit ids',
  /if\(!arr\.includes\(cir\.id\)\) arr\.push\(cir\.id\)/.test(html));
ok('selectCircuits dedupes circIds',
  /circIds = \[\.\.\.new Set\(\(circIds\|\|\[\]\)\.filter\(Boolean\)\)\]/.test(html));
ok('selectCircuits dedupes info lines',
  /seenCircLine/.test(html));
ok('updateSelectedTop allows ≥2 fichas same sub',
  /if\(nBuckets < 2 && ids\.length < 2\) return/.test(html));

{
  const block = circuitBlock('dlc_k');
  ok('dlc_k circuit found', !!block);
  if (block) {
    ok('dlc_k.conn includes dlc', /conn:\[[^\]]*\'dlc\'/.test(block));
    ok('dlc_k.conn includes F102', /ix_f102_m72/.test(block));
    ok('dlc_k path has F102 4H', /4H/.test(block));
    ok('dlc_k notes mention EC-742 / F102', /EC-742|F102·4H|F102/i.test(block));
  }
  ok('F102 4H is LG ecm 85', /\{id:'4H',code:'LG',ecm:85,lab:'K'\}/.test(html));
}

{
  ok('ign_vb_119 circuit found', /id:'ign_vb_119'/.test(html));
  ok('ign_vb_120 circuit found', /id:'ign_vb_120'/.test(html));
  ok('stale ign_feeds circuit id removed', !/id:'ign_feeds'/.test(html));
  const b119 = circuitBlock('ign_vb_119');
  const b120 = circuitBlock('ign_vb_120');
  ok('ign_vb_119 ecm is 119 only', b119 && /ecm:\[119\]/.test(b119) && !/ecm:\[119,120\]/.test(b119));
  ok('ign_vb_120 ecm is 120 only', b120 && /ecm:\[120\]/.test(b120));
  ok('ign_vb_119 path cavity is F3·7', b119 && /ix_e12_f3:\['7'\]/.test(b119));
  ok('ign_vb_120 path cavity is F3·4', b120 && /ix_e12_f3:\['4'\]/.test(b120));
}

{
  const block = circuitBlock('vmot');
  ok('vmot circuit found', !!block);
  if (block) {
    ok('vmot.conn is E12/F3 (motor loom; IPDM is Completo/Alim.)',
      /conn:\['ix_e12_f3'\]/.test(block) && !/conn:\['ipdm_e8'\]/.test(block));
    ok('vmot.path has E8-42', /path:\{ipdm_e8:\['42'\]\}/.test(block));
    ok('vmot notes mention FSM E12/F3 cavity not invented',
      /E12\/F3/.test(block) && /no inventar/i.test(block));
  }
  const f3Body = (html.split(/ix_e12_f3:\{/)[1] || '').slice(0, 1500);
  ok('ix_e12_f3 has no ecm:3 cavity (not invented)', !/ecm:3/.test(f3Body));
}

ok('applyCollapseIdleSubs force-closes idle nests',
  /force-close even if something reopened/.test(html));
ok('applyCollapseIdleSubs does not restore-first (race fix)',
  /do not restore-first/.test(html));
ok('revealConns calls applyCollapseIdleSubs last',
  /applyCollapseIdleSubs\(ids\); \/\* last word/.test(html));
ok('ACT_BOBINAS / ACT_INYECTORES defined',
  /const ACT_BOBINAS = new Set/.test(html) && /const ACT_INYECTORES = new Set/.test(html));
ok('bobinas/inyectores are top-level SUB_ORDER entries',
  /SUB_ORDER = \[[^\]]*\'bobinas\'[^\]]*\'inyectores\'/.test(html));
ok('coils use sub bobinas', /coil1:\{group:'motor', sub:'bobinas'/.test(html));
ok('injectors use sub inyectores', /inj1:\{group:'motor', sub:'inyectores'/.test(html));
ok('actuators render no longer nests bobinas under actuators',
  !/if\(sk === 'actuators'\)/.test(html));

{
  try {
    const ctx = { console, result: {} };
    vm.createContext(ctx);
    const loomOnly = html.match(/const LOOM_BODY_EXTRA = new Set\(\[[\s\S]*?\]\);/)[0];
    vm.runInContext(loomOnly + '; result.loom = [...LOOM_BODY_EXTRA];', ctx);
    ok('eval LOOM_BODY_EXTRA has evap_press',
      ctx.result.loom.includes('evap_press'),
      JSON.stringify(ctx.result.loom.filter(x => x.startsWith('evap') || x.startsWith('fuel') || x === 'ac_press')));
    ok('eval LOOM_BODY_EXTRA has ac_press', ctx.result.loom.includes('ac_press'));

    const buildFn = script.match(/function buildCircuits\(model\)\{[\s\S]*?\n\}/);
    if (buildFn) {
      vm.runInContext(buildFn[0] + '; result.circs = buildCircuits("de_early");', ctx);
      const circs = ctx.result.circs;
      const vmot = circs.find(c => c.id === 'vmot');
      const dlc = circs.find(c => c.id === 'dlc_k');
      const vtc = circs.filter(c => c.id === 'vtc_adm_b1');
      ok('buildCircuits de_early has vmot', !!vmot);
      ok('vmot.conn === [ix_e12_f3]', vmot && JSON.stringify(vmot.conn) === JSON.stringify(['ix_e12_f3']));
      ok('dlc_k.conn includes dlc', dlc && dlc.conn.includes('dlc'));
      ok('dlc_k.conn includes F102 (eval)', dlc && dlc.conn.includes('ix_f102_m72'));
      ok('only one vtc_adm_b1 in de_early', vtc.length === 1, `count=${vtc.length}`);
      const pin11 = circs.filter(c => (c.ecm || []).includes(11));
      ok('pin 11 maps to single circuit id set',
        new Set(pin11.map(c => c.id)).size === 1,
        pin11.map(c => c.id).join(','));
      const ign119 = circs.filter(c => c.id === 'ign_vb_119' || (c.ecm || []).includes(119));
      const ign120 = circs.filter(c => c.id === 'ign_vb_120' || (c.ecm || []).includes(120));
      ok('no combined ign_feeds circuit',
        !circs.some(c => c.id === 'ign_feeds'));
      ok('ign_vb_119 is ECM 119 only',
        ign119.length === 1 && JSON.stringify(ign119[0].ecm) === JSON.stringify([119]),
        ign119.map(c => c.id + ':' + JSON.stringify(c.ecm)).join(','));
      ok('ign_vb_120 is ECM 120 only',
        ign120.length === 1 && JSON.stringify(ign120[0].ecm) === JSON.stringify([120]),
        ign120.map(c => c.id + ':' + JSON.stringify(c.ecm)).join(','));
      ok('ign_vb_119.conn is F3 (IPDM E7 is Alim. path)',
        ign119[0] && JSON.stringify(ign119[0].conn) === JSON.stringify(['ix_e12_f3'])
          && ign119[0].path && JSON.stringify(ign119[0].path.ipdm_e7) === JSON.stringify(['18'])
          && JSON.stringify(ign119[0].path.ix_e12_f3) === JSON.stringify(['7']));
      ok('ign_vb_120 path is F3·4 not F3·7',
        ign120[0] && ign120[0].path && JSON.stringify(ign120[0].path.ix_e12_f3) === JSON.stringify(['4']));
    } else {
      ok('buildCircuits extractable', false);
    }
  } catch (e) {
    ok('eval harness', false, String(e.message || e));
  }
}

console.log('\n---');
console.log(`${passes.length} passed, ${failures.length} failed`);
if (failures.length) {
  console.error('FAILED:', failures.join(', '));
  process.exit(1);
}
console.log('ALL ASSERTIONS PASSED');
process.exit(0);
