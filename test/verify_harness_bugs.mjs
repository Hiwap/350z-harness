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

ok('evap_press not in LOOM_BODY_EXTRA (motor loom)',
  !html.match(/const LOOM_BODY_EXTRA = new Set\(\[[\s\S]*?\]\);/)[0].includes("'evap_press'"));
ok('ac_press in LOOM_BODY_EXTRA',
  /const LOOM_BODY_EXTRA = new Set\(\[[\s\S]*?'ac_press'[\s\S]*?\]\)/.test(html));
ok('cabin JB fuse notes in LOOM_BODY_EXTRA',
  /const LOOM_BODY_EXTRA = new Set\(\[[\s\S]*?'jb_10a_inj'[\s\S]*?'jb_15a_ht'[\s\S]*?\]\)/.test(html));
ok('F9 starter not on pulled motor loom',
  /const LOOM_BODY_EXTRA = new Set\(\[[\s\S]*?'f9_starter'[\s\S]*?\]\)/.test(html));
ok('F16 condenser and F24 A/C clutch not on pulled motor loom',
  /const LOOM_BODY_EXTRA = new Set\(\[[\s\S]*?'f16_cond'[\s\S]*?'f24_comp'[\s\S]*?\]\)/.test(html));
ok('F20 alt and F21 oil pressure not on pulled motor loom',
  /const LOOM_BODY_EXTRA = new Set\(\[[\s\S]*?'f20_alt'[\s\S]*?'f21_oilp'[\s\S]*?\]\)/.test(html));
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
    ok('eval LOOM_BODY_EXTRA has no evap_press',
      !ctx.result.loom.includes('evap_press'),
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


{
  ok('trans select present (z33_trans / Manual default)',
    /id="transView"/.test(html) && /LS_TRANS = 'z33_trans'/.test(html)
    && /return s === 'at' \? 'at' : 'mt'/.test(html));
  ok('TRANS_AT_ONLY hides F6 on Manual',
    /const TRANS_AT_ONLY = new Set\(\[[^\]]*'f6_at'[^\]]*\]\)/.test(html));
  ok('TRANS_MT_ONLY has backup_sw',
    /const TRANS_MT_ONLY = new Set\(\[[^\]]*'backup_sw'[^\]]*\]\)/.test(html));
  ok('connVisibleInLoom gates transmission',
    /function connVisibleInTrans/.test(html)
    && /if\(!connVisibleInTrans\(id\)\) return false/.test(html));
}

{
  const block = circuitBlock('backup_lamp');
  ok('backup_lamp circuit found', !!block);
  if (block) {
    ok('backup_lamp declares F102 22H', /f102:\['22H'\]/.test(block));
    ok('backup_lamp path has 22H', /ix_f102_m72:\['22H'\]/.test(block));
    ok('backup_lamp conn has backup_sw + F102',
      /backup_sw/.test(block) && /ix_f102_m72/.test(block));
  }
  ok('F102 22H is REV OR backup_lamp',
    /\{id:'22H',code:'OR'[^}]*circ:'backup_lamp'\}/.test(html)
    || /\{id:'22H',code:'OR'[^}]*lab:'REV'[^}]*circ:'backup_lamp'\}/.test(html));
  ok('backup does not force-collapse F102',
    /function shouldCollapseF102ForBackup[\s\S]*?return false;/.test(html)
    && !/if\(focusConn === 'backup_sw'\) return true/.test(html));
  ok('selectCircuits keeps declared F102 cavities (f102Declared)',
    /f102Declared/.test(html) && /keepF102/.test(html)
    && /Explicit cir\.f102 only/.test(html));
}

{
  const b1 = circuitBlock('af_b1');
  const h1 = circuitBlock('af_b1_htr');
  const b2 = circuitBlock('af_b2');
  const h2 = circuitBlock('af_b2_htr');
  ok('af_b1_htr ecm is pin 2', h1 && /ecm:\[2\]/.test(h1));
  ok('af_b2_htr ecm is pin 24', h2 && /ecm:\[24\]/.test(h2));
  ok('af_b1 sensor shares conn af_b1 with heater',
    b1 && /conn:\['af_b1'\]/.test(b1) && h1 && /conn:\['af_b1'\]/.test(h1));
  ok('af_b2 sensor shares conn af_b2 with heater',
    b2 && /conn:\['af_b2'\]/.test(b2) && h2 && /conn:\['af_b2'\]/.test(h2));
  ok('af_b1 ficha HTR cavity maps ECM 2',
    /af_b1:\{[\s\S]*?\{id:'4',code:'GY\/R',ecm:2,lab:'HTR'\}/.test(html));
  ok('af_b2 ficha HTR cavity maps ECM 24',
    /af_b2:\{[\s\S]*?\{id:'4',code:'G\/Y',ecm:24,lab:'HTR'\}/.test(html));
  ok('attachDataRelatedEcm pulls device sibling ECM (Datos)',
    /function attachDataRelatedEcm/.test(html)
    && /attachDataRelatedEcm\(circIds, ecmSet\)/.test(html));
}


{
  /* EC-169: ECM grounds 115/1/116 → F103/F151 cav 2/3/4 → engine ground F152 (not E17).
     E17 is only reached via F151·1 → F103·1 → F3/E12·6. No A/B/C/D cavities on F103. */
  const gnd4Body = (html.match(/\n  gnd4:\{[\s\S]*?\n  f152:\{/) || [''])[0];
  ok('gnd4 ficha block found', !!gnd4Body);
  const gnd4Ids = [...gnd4Body.matchAll(/\{id:'([^']+)'/g)].map((m) => m[1]);
  ok('gnd4 cavities are FSM 1-2-3-4 (no A/B/C/D)',
    JSON.stringify(gnd4Ids) === JSON.stringify(['1', '2', '3', '4']), gnd4Ids.join(','));
  ok('gnd4 cav 2 = B/W ECM 115', /\{id:'2',code:'B\/W',ecm:115,/.test(gnd4Body));
  ok('gnd4 cav 3 = B ECM 1', /\{id:'3',code:'B',ecm:1,/.test(gnd4Body));
  ok('gnd4 cav 4 = B/R ECM 116', /\{id:'4',code:'B\/R',ecm:116,/.test(gnd4Body));
  ok('gnd4 cav 1 = B link → F3·6 (no ECM pin)', /\{id:'1',code:'B',ecm:null,rail:'gnd',src:'F3·6'/.test(gnd4Body));
  ok('gnd4 cites EC-169', /EC-169/.test(gnd4Body));
  ok('f152 engine ground ficha (motor/power ring)',
    /\n  f152:\{group:'motor', sub:'power', name:'Masa motor · F152', meta:'punto de masa F152 · EC-169'[^\n]*shape:'ring'/.test(html));
  ok('f152 not hidden from Arnès motor (LOOM_BODY_EXTRA)',
    !html.match(/const LOOM_BODY_EXTRA = new Set\(\[[\s\S]*?\]\);/)[0].includes("'f152'"));
  ok('f152 has CONN_I18N en/ja', /\n  f152: \{\n    en: \{ name:'Engine ground · F152'/.test(html) && /ja: \{ name:'エンジンアース · F152'/.test(html));
  ok('no stale F103·A/B/C/D or "→ D → E17" strings',
    !/F103·[ABCD]\b/.test(html) && !/→ D → E17/.test(html) && !/D→E17/.test(html) && !/A\/B\/C/.test(html));
  const pp = fs.existsSync(path.join(ROOT, 'make_print_pack.py')) ? fs.readFileSync(path.join(ROOT, 'make_print_pack.py'), 'utf8') : '';
  ok('print pack F103 uses cavities 1-4 (not A/B/C/D)',
    !pp || (!/\("A", "B", "1"\)/.test(pp) && /\("4", "B\/R", "116"\)/.test(pp)));
  try {
    const ctx = { result: {} };
    vm.createContext(ctx);
    const loomSrc = html.match(/const LOOM_BODY_EXTRA = new Set\(\[[\s\S]*?\]\);/)[0]
      + "\nconst LOOM_MOTOR_KEEP = new Set(['ix_e10_f1', 'ix_e11_f2', 'ix_e12_f3']);\nconst CONN_BASE = { f152:{group:'motor'}, e17:{group:'motor'} }; const CONN = {};\n"
      + script.match(/function loomOfConn\([\s\S]*?\n\}/)[0];
    vm.runInContext(loomSrc + "; result.f152 = loomOfConn('f152');", ctx);
    ok('loomOfConn(f152) === motor (visible in Arnès motor)', ctx.result.f152 === 'motor', ctx.result.f152);
    const buildFn = script.match(/function buildCircuits\(model\)\{[\s\S]*?\n\}/);
    vm.runInContext(buildFn[0] + '; result.circs = buildCircuits("de_early");', ctx);
    const circs = ctx.result.circs;
    const byId = (id) => circs.find((c) => c.id === id);
    const expect = { gnd_ecm_1: [1, '3'], gnd_ecm_115: [115, '2'], gnd_ecm_116: [116, '4'] };
    for (const [id, [pin, cav]] of Object.entries(expect)) {
      const c = byId(id);
      ok(`${id} exists`, !!c);
      if (!c) continue;
      ok(`${id} ecm === [${pin}]`, JSON.stringify(c.ecm) === JSON.stringify([pin]));
      ok(`${id} path gnd4 === ['${cav}'] + f152 ring`,
        c.path && JSON.stringify(c.path.gnd4) === JSON.stringify([cav]) && JSON.stringify(c.path.f152) === JSON.stringify(['ring']),
        JSON.stringify(c.path));
      ok(`${id} does not touch E17 or gnd4 cav 1`,
        !(c.conn || []).includes('e17') && !(c.path && c.path.e17) && !(c.path.gnd4 || []).includes('1'),
        JSON.stringify({ conn: c.conn, path: c.path }));
    }
    const ecmGndCircs = circs.filter((c) => (c.ecm || []).some((p) => [1, 115, 116].includes(Number(p))));
    ok('no circuit reached from ECM 1/115/116 marks E17',
      ecmGndCircs.every((c) => !(c.conn || []).includes('e17') && !(c.path && c.path.e17)),
      ecmGndCircs.map((c) => c.id).join(','));
    const bond = byId('gnd_f152_e17');
    ok('gnd_f152_e17 bond: F152 → gnd4·1 → F3·6 → E17, no ECM pins',
      bond && (bond.ecm || []).length === 0
        && JSON.stringify(bond.path.gnd4) === JSON.stringify(['1'])
        && JSON.stringify(bond.path.ix_e12_f3) === JSON.stringify(['6'])
        && JSON.stringify(bond.path.e17) === JSON.stringify(['ring']));
  } catch (e) {
    ok('eval F103/F152 ground circuits', false, String(e.message || e));
  }
  ok('CMP B1/B2 GND → F152 (EC-331/333 via F103·3)',
    /cmp_b1:\{[^\n]*\n    pins:\[[^\n]*src:'F152'/.test(html) && /cmp_b2:\{[^\n]*\n    pins:\[[^\n]*src:'F152'/.test(html));
}

console.log('\n---');
console.log(`${passes.length} passed, ${failures.length} failed`);
if (failures.length) {
  console.error('FAILED:', failures.join(', '));
  process.exit(1);
}
console.log('ALL ASSERTIONS PASSED');
process.exit(0);
