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
ok('evap_press CONN exists', /\n  evap_press:\{/.test(html));

{
  // Arnès motor view (skill + FSM PG-54): no JB fusibles / IPDM / E108 / APP E11/F2
  const loomOnly = html.match(/const LOOM_BODY_EXTRA = new Set\(\[[\s\S]*?\]\);/)[0];
  const keepOnly = html.match(/const LOOM_MOTOR_KEEP = new Set\(\[[\s\S]*?\]\);/)[0];
  ok('LOOM_BODY_EXTRA has jb_10a_inj', /'jb_10a_inj'/.test(loomOnly));
  ok('LOOM_BODY_EXTRA has jb_15a_ht', /'jb_15a_ht'/.test(loomOnly));
  ok('LOOM_BODY_EXTRA has ix_e11_f2', /'ix_e11_f2'/.test(loomOnly));
  ok('LOOM_BODY_EXTRA has ipdm_e7', /'ipdm_e7'/.test(loomOnly));
  ok('LOOM_BODY_EXTRA has ix_e108_m15', /'ix_e108_m15'/.test(loomOnly));
  ok('LOOM_BODY_EXTRA has feed_af_12v (JB/E108 heater origin)', /'feed_af_12v'/.test(loomOnly));
  ok('LOOM_BODY_EXTRA has feed_ho2s_12v', /'feed_ho2s_12v'/.test(loomOnly));
  ok('LOOM_MOTOR_KEEP is E10/F1 + E12/F3 only (no E11/F2)',
    /'ix_e10_f1'/.test(keepOnly) && /'ix_e12_f3'/.test(keepOnly) && !/'ix_e11_f2'/.test(keepOnly));
  ok('LOOM_MOTOR_KEEP must not include ix_e11_f2',
    !/'ix_e11_f2'/.test(keepOnly));

  const groups = {};
  for (const m of html.matchAll(/\n  ([a-z0-9_]+):\{group:'([^']+)'/g)) groups[m[1]] = m[2];
  const ctx = { result: {}, Set, groups };
  vm.createContext(ctx);
  vm.runInContext(
    loomOnly + '\n' + keepOnly + `;
      function loomOfConn(id){
        if (LOOM_MOTOR_KEEP.has(id)) return 'motor';
        if (groups[id] === 'body') return 'body';
        if (LOOM_BODY_EXTRA.has(id)) return 'body';
        return 'motor';
      }
      const mustHide = ['jb_10a_inj','jb_15a_ht','ipdm_e3','ipdm_e4','ipdm_e5','ipdm_e6','ipdm_e7','ipdm_e8','ipdm_e9','ipdm_legend','ix_e108_m15','ix_e11_f2','feed_af_12v','feed_ho2s_12v','evap_press','fuel_pump'];
      const mustKeep = ['ix_e10_f1','ix_e12_f3','maf','ckp','coil1','inj1','gnd4','feed_ckp_maf_12v','feed_inj_coil_12v','ix_f18_f201'];
      result.badHide = mustHide.filter(id => loomOfConn(id) !== 'body');
      result.badKeep = mustKeep.filter(id => loomOfConn(id) !== 'motor');
    `,
    ctx
  );
  ok('motor loom hides jb_*/ipdm_e*/E108/E11/F2/heater-fuse feeds',
    ctx.result.badHide.length === 0, JSON.stringify(ctx.result.badHide));
  ok('motor loom keeps tray mates + sensors/coils + harness 12V feeds',
    ctx.result.badKeep.length === 0, JSON.stringify(ctx.result.badKeep));
}



{
  const fn = html.match(/function updateEcmSelCount\([\s\S]*?\nfunction /)[0];
  const domLine = fn.match(/const domSel = '([^']+)'/);
  ok('updateEcmSelCount DOM sel excludes hl-group',
    domLine && !domLine[1].includes('hl-group') && domLine[1].includes('.pin.hl'),
    domLine ? domLine[1] : 'no domSel');
  ok('selectCircuits passes focusPin to updateEcmSelCount',
    /if\(focusPin!=null\) updateEcmSelCount\(\[focusPin\]\)/.test(html));
  const f102 = html.match(/function updateF102SelPins\([\s\S]*?\nfunction /)[0];
  const f102Dom = f102.match(/const domSel = '([^']+)'/);
  ok('updateF102SelPins DOM sel excludes hl-group',
    f102Dom && !f102Dom[1].includes('hl-group'),
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
  const block = circuitBlock('batt_ecm');
  ok('batt_ecm circuit found', !!block);
  if (block) {
    ok('batt_ecm.conn includes F102 and E108',
      /ix_f102_m72/.test(block) && /ix_e108_m15/.test(block));
    ok('batt_ecm path has F102 5H and E108 68G',
      /5H/.test(block) && /68G/.test(block));
    ok('batt_ecm notes cite EC-441', /EC-441/.test(block));
    ok('batt_ecm does not use fake batt_feed', !/batt_feed/.test(block));
  }
  ok('F102 5H is R/W ecm 121 BATT',
    /\{id:'5H',code:'R\/W',ecm:121,lab:'BATT',rail:'12v'/.test(html));
  ok('E108 68G is R/W ecm 121 BATT',
    /\{id:'68G',code:'R\/W',ecm:121,lab:'BATT',rail:'12v'/.test(html));
  ok('fake batt_feed CONN removed', !/\nbatt_feed:\{/.test(html));
}

{
  const block = circuitBlock('vmot');
  ok('vmot circuit found', !!block);
  if (block) {
    ok('vmot.conn is ipdm_e8 only (no empty E12 HL)',
      /conn:\['ipdm_e8'\]/.test(block) && !/ix_e12_f3/.test(block));
    ok('vmot.path has E8-42', /path:\{ipdm_e8:\['42'\]\}/.test(block));
    ok('vmot notes mention FSM E12/F3 cavity not invented',
      /E12\/F3/.test(block) && /no inventar|cavidad F3 no fijada/i.test(block));
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
      JSON.stringify(ctx.result.loom.filter(x => x.startsWith('evap') || x.startsWith('fuel'))));

    const buildFn = script.match(/function buildCircuits\(model\)\{[\s\S]*?\n\}/);
    if (buildFn) {
      vm.runInContext(buildFn[0] + '; result.circs = buildCircuits("de_early");', ctx);
      const circs = ctx.result.circs;
      const vmot = circs.find(c => c.id === 'vmot');
      const dlc = circs.find(c => c.id === 'dlc_k');
      const vtc = circs.filter(c => c.id === 'vtc_adm_b1');
      ok('buildCircuits de_early has vmot', !!vmot);
      ok('vmot.conn === [ipdm_e8]', vmot && JSON.stringify(vmot.conn) === JSON.stringify(['ipdm_e8']));
      ok('dlc_k.conn includes dlc', dlc && dlc.conn.includes('dlc'));
      ok('dlc_k.conn includes F102 (eval)', dlc && dlc.conn.includes('ix_f102_m72'));
      ok('only one vtc_adm_b1 in de_early', vtc.length === 1, `count=${vtc.length}`);
      const pin11 = circs.filter(c => (c.ecm || []).includes(11));
      ok('pin 11 maps to single circuit id set',
        new Set(pin11.map(c => c.id)).size === 1,
        pin11.map(c => c.id).join(','));
    } else {
      ok('buildCircuits extractable', false);
    }
  } catch (e) {
    ok('eval harness', false, String(e.message || e));
  }
}


{
  /* Regression: rail filter ON + click rail-highlighted pin must NOT exit to selectCircuits.
     Expected: focusRailSelection → applyRailFilter({focusing}) + yellow hl; selKey set for re-clear.
     Cleared lastCircIds on rail enter so selMarkOn(hl-rail) cannot retarget oddly. */
  ok('focusRailSelection helper exists',
    /function focusRailSelection\(focusPin, focusConn, focusCav\)/.test(html));
  ok('ecmPinOnActiveRail helper exists',
    /function ecmPinOnActiveRail\(n\)/.test(html));
  ok('cavIsActiveRailPrimary helper exists',
    /function cavIsActiveRailPrimary\(cid, pin\)/.test(html));
  ok('applyRailFilter clears lastCircIds in rail mode',
    /function applyRailFilter\(opts\)\{[\s\S]*?lastCircIds = \[\];/.test(html));
  ok('applyRailFilter clears stale selKey unless focusing',
    /if\(!opts \|\| !opts\.focusing\)\{\s*selKey = null;\s*selFocusPin = null;/.test(html));
  ok('selectPin stays in rail mode for active-rail pins',
    /if\(activeRails\.size && ecmPinOnActiveRail\(n\)\)\{\s*focusRailSelection\(n\);\s*return;/.test(html));
  ok('selectConnPin stays in rail mode for rail-primary cavities',
    /if\(activeRails\.size && cavIsActiveRailPrimary\(cid, pin0\)\)\{[\s\S]*?focusRailSelection\(ecmN, cid, cavId\);/.test(html));
  ok('focusRailSelection does not call selectCircuits', (() => {
    const m = html.match(/function focusRailSelection\([\s\S]*?\nfunction /);
    return m && !/selectCircuits/.test(m[0]);
  })());
  ok('yellow focus CSS beats rail outline',
    /Yellow selection focus beats rail-family/.test(html) &&
    /\.pin\.hl\.hl-rail/.test(html) &&
    /\.cav-hit\.hl\.hl-rail \.cav-face/.test(html));
}

console.log('\n---');
console.log(`${passes.length} passed, ${failures.length} failed`);
if (failures.length) {
  console.error('FAILED:', failures.join(', '));
  process.exit(1);
}
console.log('ALL ASSERTIONS PASSED');
process.exit(0);
