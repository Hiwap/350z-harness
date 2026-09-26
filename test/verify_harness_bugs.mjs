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

{
  /* Knock shield: EC-317 → F228·2 → F14/F229·1 → ECM 116 B/R splice → F103/F151·4 → F152 (not "SNS GND"). */
  ok('no knock "shield → SNS GND" text left (es/en/ja)',
    !/malla a SNS GND|shield ?(→|to) ?SNS GND|シールド ?(→|は)? ?SNS GND/.test(html));
  const kn = circuitBlock('knock');
  ok('knock circuit notes: shield → 116 → F103/F151·4 → F152 (EC-317)',
    kn && /116/.test(kn) && /F103\/F151·4/.test(kn) && /F152/.test(kn) && /EC-317/.test(kn));
  ok('knock circuit path = F14·SH + F103·4 + F152 (SH on 116)',
    kn && /path:\{ix_f14_f229:\['SH'\],gnd4:\['4'\],f152:\['ring'\]\}/.test(kn));
  ok('knock + F14/F229 fichas keep SH → ECM 116 GND',
    /\n  knock:\{[^\n]*\n    pins:\[[^\n]*\{id:'SH',code:'B',ecm:116,rail:'gnd'/.test(html)
    && /\n  ix_f14_f229:\{[^\n]*\n    pins:\[[^\n]*\{id:'SH',code:'B',ecm:116,rail:'gnd'/.test(html));
  const pk = [...html.matchAll(/path_knock: "([^"]*)"/g)].map((m) => m[1]);
  ok('path_knock es/en/ja mention B/R 116 → F103·4 → F152',
    pk.length === 3 && pk.every((x) => /116/.test(x) && /F103·4/.test(x) && /F152/.test(x)), pk.join(' | '));
}

{
  /* PNP per transmission: M/T F35 (EC-646) vs A/T via F102·28H → meter (EC-644). */
  ok('stale pnp_sw circuit / body pnp ficha removed',
    !/id:'pnp_sw'/.test(html) && !/\n  pnp:\{group:'body'/.test(html));
  ok('TRANS_MT_ONLY has f35_pnp; TRANS_AT_ONLY is F6 only',
    /const TRANS_MT_ONLY = new Set\(\[[^\]]*'f35_pnp'[^\]]*\]\)/.test(html)
    && /const TRANS_AT_ONLY = new Set\(\['f6_at'\]\)/.test(html));
  const f35 = (html.match(/\n  f35_pnp:\{[\s\S]*?\n  inj1:\{/) || [''])[0];
  ok('f35_pnp ficha: motor loom, 1 BR/Y → ECM 102, 2 B GND → F152',
    /group:'motor'/.test(f35) && /\{id:'1',lab:'SIG',code:'BR\/Y',ecm:102/.test(f35)
    && /\{id:'2',lab:'GND',code:'B',ecm:null,rail:'gnd',src:'F152'/.test(f35) && !/E17/.test(f35));
  ok('F102 28H is A/T only (trans:at, EC-644)',
    /\{id:'28H',code:'BR\/Y',ecm:102,lab:'PNP',trans:'at',circ:'pnp_at'/.test(html));
  ok('F102 23H START GY/R is A/T only (trans:at, EC-644)',
    /\{id:'23H',code:'GY\/R',ecm:null,lab:'START',src:'F6·9',srcSub:'actuators',trans:'at'/.test(html));
  ok('applyTransView rebuilds circuits + F102',
    /localStorage\.setItem\(LS_TRANS, v\);\n  CIRCUITS = circuitsForView\([^\n]*\n  rebuildIndexes\(\);\n  renderFichas\(\);\n  renderF102\(\);/.test(html));
  try {
    const ctx = { result: {} };
    vm.createContext(ctx);
    const buildFn = script.match(/function buildCircuits\(model\)\{[\s\S]*?\n\}/)[0];
    const helpers = ['circuitVisibleInTrans', 'circuitsForView', 'transGatePin']
      .map((n) => script.match(new RegExp(`function ${n}\\([\\s\\S]*?\\n\\}`))[0]).join('\n');
    const src = buildFn + '\nlet TV = "mt"; function transView(){ return TV; }\n' + helpers
      + '\nresult.mt = circuitsForView("de_early"); TV = "at"; result.at = circuitsForView("de_early");'
      + '\nresult.all = buildCircuits("de_early");'
      + "\nconst p28 = {id:'28H',code:'BR/Y',ecm:102,lab:'PNP',trans:'at',offNote:'x'};"
      + "\nresult.g28mt = transGatePin(p28, 'mt'); result.g28at = transGatePin(p28, 'at');";
    vm.runInContext(src, ctx);
    const { mt, at, all, g28mt, g28at } = ctx.result;
    const pmt = mt.filter((c) => (c.ecm || []).includes(102));
    const pat = at.filter((c) => (c.ecm || []).includes(102));
    ok('Manual: ECM 102 → only pnp_mt', pmt.length === 1 && pmt[0].id === 'pnp_mt', pmt.map((c) => c.id).join(','));
    ok('Automático: ECM 102 → only pnp_at', pat.length === 1 && pat[0].id === 'pnp_at', pat.map((c) => c.id).join(','));
    const m = all.find((c) => c.id === 'pnp_mt');
    ok('pnp_mt = signal only: ECM 102 → F35·1, no F103/F152/F102/E17 (ground in pnp_mt_gnd)',
      m && m.trans === 'mt' && JSON.stringify(m.path) === JSON.stringify({ f35_pnp: ['1'] })
        && JSON.stringify(m.conn) === JSON.stringify(['f35_pnp']) && !m.f102 && !m.gndRel, JSON.stringify(m));
    const mg = all.find((c) => c.id === 'pnp_mt_gnd');
    ok('pnp_mt_gnd: F35·2 → F103·3 → F152, no ECM pin, gndRel, M/T only',
      mg && mg.trans === 'mt' && mg.gndRel === true && mg.ecm.length === 0
        && JSON.stringify(mg.path) === JSON.stringify({ f35_pnp: ['2'], gnd4: ['3'], f152: ['ring'] })
        && !(mg.conn || []).includes('e17'), JSON.stringify(mg));
    ok('Automático: no pnp_mt_gnd', !at.some((c) => c.id === 'pnp_mt_gnd'));
    const a = all.find((c) => c.id === 'pnp_at');
    ok('pnp_at: F102 28H (+23H) → F6, no invented PNP ground',
      a && a.trans === 'at' && JSON.stringify(a.f102) === JSON.stringify(['28H', '23H'])
        && (a.conn || []).includes('f6_at') && !(a.conn || []).includes('e17') && !(a.conn || []).includes('f152'), JSON.stringify(a));
    ok('transGatePin empties A/T cavity on Manual', g28mt.ecm === null && g28mt.code === '—' && g28mt.transOff === 'at' && g28mt.note === 'x');
    ok('transGatePin keeps A/T cavity on Automático', g28at.ecm === 102 && g28at.code === 'BR/Y');
  } catch (e) {
    ok('eval PNP per transmission', false, String(e.message || e));
  }
}

{
  /* Info-panel route tag follows the circuit rail (ECM 116 = GND, not "Alim. 12V"). */
  ok('route pill no longer hardcodes railRelPower + " 12V"', !/t\('railRelPower'\)\)\} 12V/.test(html));
  try {
    const grab = (a, b) => { const i = html.indexOf(a); const j = html.indexOf(b, i + 1); return html.slice(i, j); };
    const ctx = { result: {} };
    vm.createContext(ctx);
    const src = grab('const CONN_BASE = {', 'const CONN_FACE = {')
      + '\n' + html.match(/const PIN_RAIL = \{[\s\S]*?\};/)[0]
      + '\n' /* CONN_BASE slice already declares let CONN = {} */
      + script.match(/function pathStepRail\([\s\S]*?\n\}/)[0] + '\n'
      + script.match(/function circuitPathRail\([\s\S]*?\n\}/)[0] + '\n'
      + script.match(/function buildCircuits\(model\)\{[\s\S]*?\n\}/)[0]
      + '\nconst C = buildCircuits("de_early"); const r = (id) => circuitPathRail(C.find((c) => c.id === id));'
      + "\nresult.r = { g116: r('gnd_ecm_116'), g1: r('gnd_ecm_1'), knock: r('knock'), pnp_mt: r('pnp_mt'), pnp_mt_gnd: r('pnp_mt_gnd'), pnp_at: r('pnp_at'), coil1: r('coil_1'), backup: r('backup_lamp'), brake: r('brake_stop') };"
      + "\nresult.v5 = circuitPathRail({ path: { app: ['4'] } });";
    vm.runInContext(src, ctx);
    const r = ctx.result.r;
    ok('route rail: ECM 116 / ECM 1 grounds = gnd', r.g116 === 'gnd' && r.g1 === 'gnd', JSON.stringify(r));
    ok('route rail: knock shield + PNP M/T ground return = gnd', r.knock === 'gnd' && r.pnp_mt_gnd === 'gnd');
    ok('route rail: PNP M/T signal (ECM 102 → F35·1) = sig', r.pnp_mt === 'sig', r.pnp_mt);
    ok('route rail: coil / backup lamp = 12v', r.coil1 === '12v' && r.backup === '12v');
    ok('route rail: brake / PNP A/T = sig', r.brake === 'sig' && r.pnp_at === 'sig');
    ok('route rail: 5V cavity = 5v', ctx.result.v5 === '5v', ctx.result.v5);
  } catch (e) {
    ok('eval route rail tag', false, String(e.message || e));
  }
  for (const k of ['pathTag12v', 'pathTag5v', 'pathTagGnd', 'pathTagSig']) {
    ok(`t('${k}') used`, html.includes(`t('${k}')`));
  }
}

{
  /* EVT position sensors F38/F42 (EC-445/447, PG-55 *1): Rev-Up only; 1 B → F103·3 → F152 · 2 SIG → ECM 53/72 · 3 R/W 12V ← E12/F3·7 ← E7·18. */
  const blk = (id) => (html.match(new RegExp('\\n  ' + id + ':\\{[\\s\\S]*?\\n    note:[^\\n]*')) || [''])[0];
  for (const [id, color, ecm, sig, page] of [['f38_evtc_b1', 'B', 53, 'L\\/B', 'EC-445'], ['f42_evtc_b2', 'GY', 72, 'L\\/W', 'EC-447']]) {
    const b = blk(id);
    ok(`${id} is ${color}/3 tab3 motor sensor (${page})`,
      new RegExp(`meta:'${color}/3 `).test(b) && /shape:'tab3'/.test(b) && /group:'motor', sub:'sensors'/.test(b) && b.includes(page));
    const ids = [...b.matchAll(/\{id:'([^']+)'/g)].map((m) => m[1]);
    ok(`${id} cavities 1-2-3`, JSON.stringify(ids) === JSON.stringify(['1', '2', '3']), ids.join(','));
    ok(`${id} pin 1 B GND → F152`, /\{id:'1',lab:'GND',code:'B',ecm:null,rail:'gnd',src:'F152'/.test(b));
    ok(`${id} pin 2 SIG → ECM ${ecm}`, new RegExp(`\\{id:'2',lab:'SIG',code:'${sig}',ecm:${ecm}\\}`).test(b));
    ok(`${id} pin 3 R/W 12V ← E7·18`, /\{id:'3',lab:'12V',code:'R\/W',ecm:null,rail:'12v',src:'E7·18',srcSub:'ipdm'/.test(b));
  }
  ok('F38 no longer GY/2', !/F38 GY\/2/.test(html) && !/GY\/2/.test(blk('f38_evtc_b1')) && !/f38_evtc_b1: \{ en:\{name:'F38 · EVT pos\. B1', meta:'GY\/2/.test(html));
  ok('EVT fichas hidden on VQ35DE sin VTC escape',
    /id !== 'f38_evtc_b1' && id !== 'f42_evtc_b2'/.test(html));
  ok('EVT fichas not in LOOM_BODY_EXTRA (engine loom)',
    !/'f38_evtc_b1'|'f42_evtc_b2'/.test(html.match(/const LOOM_BODY_EXTRA = new Set\(\[[\s\S]*?\]\);/)[0]));
  ok('ECM 53/72 inactive unless Rev-Up',
    /\(Number\(p\)===53 \|\| Number\(p\)===72\) && model !== 'de_revup'/.test(html));
  ok('PIN_COL 53 L/B · 72 L/W', /"53":"L\/B"/.test(html) && /"72":"L\/W"/.test(html));
  try {
    const ctx = { result: {} };
    vm.createContext(ctx);
    const buildFn = script.match(/function buildCircuits\(model\)\{[\s\S]*?\n\}/)[0];
    vm.runInContext(buildFn + '; result.early = buildCircuits("de_early"); result.rev = buildCircuits("de_revup");', ctx);
    const { early, rev } = ctx.result;
    ok('no EVT circuits on de_early', !early.some((c) => /^evt_pos/.test(c.id)));
    const by = (id) => rev.find((c) => c.id === id);
    for (const [b, ecm, conn] of [[1, 53, 'f38_evtc_b1'], [2, 72, 'f42_evtc_b2']]) {
      const sig = by(`evt_pos_b${b}`); const pwr = by(`evt_pos_b${b}_pwr`); const gnd = by(`evt_pos_b${b}_gnd`);
      ok(`evt_pos_b${b}: signal only ECM ${ecm} → pin 2, no F103/F152`,
        sig && JSON.stringify(sig.ecm) === JSON.stringify([ecm])
          && JSON.stringify(sig.path) === JSON.stringify({ [conn]: ['2'] })
          && JSON.stringify(sig.conn) === JSON.stringify([conn]), JSON.stringify(sig));
      ok(`evt_pos_b${b}_gnd: pin 1 → F103·3 → F152, no ECM pin, gndRel`,
        gnd && gnd.ecm.length === 0 && gnd.gndRel === true
          && JSON.stringify(gnd.path) === JSON.stringify({ [conn]: ['1'], gnd4: ['3'], f152: ['ring'] })
          && !(gnd.conn || []).includes('e17'), JSON.stringify(gnd));
      ok(`evt_pos_b${b}_pwr: E7·18 → F3·7 → pin 3, no ECM pin`,
        pwr && pwr.ecm.length === 0
          && JSON.stringify(pwr.path) === JSON.stringify({ ipdm_e7: ['18'], ix_e12_f3: ['7'], [conn]: ['3'] }), JSON.stringify(pwr));
    }
  } catch (e) {
    ok('eval EVT circuits', false, String(e.message || e));
  }
}

{
  /* Signal-pin clicks show the signal path; sensor ground returns are separate gndRel circuits. */
  ok('F35·2 / F38·1 / F42·1 ground cavities select their own ground circuit',
    /circ:'pnp_mt_gnd',note:'Masa PNP/.test(html) && /circ:'evt_pos_b1_gnd'/.test(html) && /circ:'evt_pos_b2_gnd'/.test(html));
  ok('F35·1 SIG still selects pnp_mt', /\{id:'1',lab:'SIG',code:'BR\/Y',ecm:102,circ:'pnp_mt'\}/.test(html));
  ok('Masa rail paints gndRel sensor-ground path cavities only',
    /if\(!cir\.gndRel\) return;/.test(html) && /gndRelOnlyConns\.has\(cid\) && !\(gndRelCavs\[cid\]/.test(html));
  for (const id of ['pnp_mt_gnd', 'evt_pos_b1_gnd', 'evt_pos_b2_gnd']) {
    ok(`CIRC i18n title + notes for ${id}`, (html.match(new RegExp(`\\n  ${id}: \\{en:'`, 'g')) || []).length === 2);
  }
}

{
  /* Engine oil temperature sensor: PG-55 sub-harness-3 F242 GY/2 (not F232); F241 BR/2 ↔ F39 GY/2 intermediate; no ECM terminal in the 2005 FSM. */
  ok('no F232 oil temp card left', !/f232_eot|F232/.test(html));
  const b = (html.match(/\n  f242_eot:\{[\s\S]*?\n    note:[^\n]*/) || [''])[0];
  ok('f242_eot: F242 GY/2 tab2 motor sensor, PG-55', /name:'F242 · Temp\. aceite'/.test(b) && /meta:'GY\/2 /.test(b)
    && /shape:'tab2'/.test(b) && /group:'motor', sub:'sensors'/.test(b) && b.includes('PG-55'));
  const pins = [...b.matchAll(/\{id:'([^']+)',code:'([^']+)',ecm:(\w+),unknown:true/g)].map((m) => m.slice(1).join(':'));
  ok('f242_eot: 2 cavities, no invented ECM pin / color', JSON.stringify(pins) === JSON.stringify(['1:—:null', '2:—:null']), pins.join(','));
  ok('f242_eot note: F241 BR/2 ↔ F39 GY/2 intermediate, CONSULT only', /F241 BR\/2 ↔ F39 GY\/2/.test(b) && /ENG OIL TEMP/.test(b));
  ok('f242_eot en/ja i18n', /\n  f242_eot: \{ en:\{name:'F242 · Oil temp', meta:'GY\/2 [^']*', note:'[^']*F241 BR\/2 ↔ F39 GY\/2/.test(html)
    && /ja:\{name:'F242 · 油温'/.test(html));
  ok('F242 hidden on VQ35DE sin VTC escape (Rev-Up only)', /id !== 'f42_evtc_b2' && id !== 'f242_eot'\)/.test(html));
  ok('F242 not trans-gated', !/'f242_eot'/.test((html.match(/const TRANS_MT_ONLY = new Set\(\[[^\]]*\]\)/) || [''])[0]));
}

console.log('\n---');
console.log(`${passes.length} passed, ${failures.length} failed`);
if (failures.length) {
  console.error('FAILED:', failures.join(', '));
  process.exit(1);
}
console.log('ALL ASSERTIONS PASSED');
process.exit(0);
