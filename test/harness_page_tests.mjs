#!/usr/bin/env node
/**
 * Pre-ship tests for 350Z harness interactive HTML.
 * Deterministic assertions + unit tests for pure helpers (Grok Build style).
 * Must exit 0 before Pages push / EzePC copy.
 *
 * From repo clone:  node test/harness_page_tests.mjs
 * Optional HTML:    node test/harness_page_tests.mjs path/to/index.html
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

function ok(name, cond, detail = '') {
  if (cond) {
    passes.push(name);
    console.log(`PASS  ${name}${detail ? ' — ' + detail : ''}`);
  } else {
    failures.push(name);
    console.error(`FAIL  ${name}${detail ? ' — ' + detail : ''}`);
  }
}

function extractScript(h) {
  const m = h.match(/<script>([\s\S]*?)<\/script>/);
  if (!m) throw new Error('no <script> block');
  return m[1];
}

function extractFunction(src, name) {
  const re = new RegExp(`function ${name}\\([\\s\\S]*?\\n\\}`);
  const m = src.match(re);
  if (!m) throw new Error('missing function ' + name);
  return m[0];
}

function extractConstObject(src, name) {
  const re = new RegExp(`const ${name} = \\{[\\s\\S]*?\\n\\};`);
  const m = src.match(re);
  if (!m) throw new Error('missing const ' + name);
  return m[0];
}

const script = extractScript(html);
const tmp = path.join(process.env.TMPDIR || '/tmp', 'harness_page_tests_main.js');
fs.writeFileSync(tmp, script);
const chk = spawnSync(process.execPath, ['--check', tmp], { encoding: 'utf8' });
ok('node --check extracted script', chk.status === 0, chk.stderr?.trim() || 'syntax ok');

ok('bobinas/inyectores in SUB_ORDER',
  /SUB_ORDER = \[[^\]]*'bobinas'[^\]]*'inyectores'/.test(html));
ok('coil1 sub bobinas', /coil1:\{group:'motor', sub:'bobinas'/.test(html));
ok('inj1 sub inyectores', /inj1:\{group:'motor', sub:'inyectores'/.test(html));
ok('F102 4H K-line EC-742', /\{id:'4H',code:'LG',ecm:85,lab:'K'\}/.test(html));
ok('dlc_k includes F102 path',
  /id:'dlc_k'[\s\S]*?ix_f102_m72[\s\S]*?4H/.test(html));
ok('path feed uses primary hl (not Tierras-gated hl-group)',
  /if\(onPathFeed\) return \{cls:'hl'\};/.test(html));
ok('knock shield displays GND',
  /knock:\{[\s\S]*?lab:'GND'/.test(html) && /ix_f14_f229:\{[\s\S]*?lab:'GND'/.test(html));
ok('cavBottomLabel defines lab before use',
  /function cavBottomLabel\(pin\)\{\s*const rail = cavRailOf\(pin\);\s*const lab = /.test(html));
ok('cavBottomLabel rail always GND/12V/5V',
  /if\(rail === 'gnd'\) return 'GND';\s*if\(rail === '12v'\) return '12V';\s*if\(rail === '5v'\) return '5V';/.test(html));
ok('cavBottomLabel SIG with ECM is the word SIG',
  /if\(pin && pin\.ecm != null\) return 'SIG';/.test(html));

const helperSrc = [
  extractConstObject(script, 'PIN_RAIL'),
  extractConstObject(script, 'PIN_CAN'),
  extractFunction(script, 'isPseudoWireCode'),
  extractFunction(script, 'cavDisplayLab'),
  extractFunction(script, 'cavRailOf'),
  extractFunction(script, 'cavCanOf'),
  extractFunction(script, 'cavBottomLabel'),
  extractFunction(script, 'cavTopLabel'),
].join('\n');

const sandbox = { console };
vm.createContext(sandbox);
vm.runInContext(helperSrc, sandbox);

function unit(name, fn) {
  try {
    const r = fn();
    ok(name, r === true || r === undefined, r === false ? 'assertion false' : '');
  } catch (e) {
    ok(name, false, e.message);
  }
}
unit('unit: gnd rail → GND even if lab ECM116', () =>
  sandbox.cavBottomLabel({ rail: 'gnd', lab: 'ECM116', code: 'B/R', ecm: 116 }) === 'GND');
unit('unit: 12v rail → 12V even if lab MOTRLY', () =>
  sandbox.cavBottomLabel({ rail: '12v', lab: 'MOTRLY', code: 'SB' }) === '12V');
unit('unit: 5v rail → 5V', () =>
  sandbox.cavBottomLabel({ rail: '5v', lab: '5V', code: 'PU' }) === '5V');
unit('unit: SIG with ECM pin on top → SIG', () =>
  sandbox.cavBottomLabel({ lab: 'SIG', code: 'W', ecm: 15 }) === 'SIG');
unit('unit: SIG by id with ECM → SIG', () =>
  sandbox.cavBottomLabel({ id: 'SIG', code: 'OR', ecm: 51 }) === 'SIG');
unit('unit: unnamed ECM cavity (knock/A/F/APP) → SIG', () =>
  sandbox.cavBottomLabel({ id: '1', code: 'W', ecm: 15 }) === 'SIG');
unit('unit: injector ECM pin → SIG', () =>
  sandbox.cavBottomLabel({ id: 'ECM', code: 'R/B', ecm: 23 }) === 'SIG');
unit('unit: HTR keeps HTR', () =>
  sandbox.cavBottomLabel({ id: '4', lab: 'HTR', code: 'GY/R', ecm: 2 }) === 'HTR');
unit('unit: SIG without ecm uses cavity id+S', () =>
  sandbox.cavBottomLabel({ id: '2', lab: 'SIG', code: 'G' }) === '2S');
unit('unit: top label prefers ecm number', () =>
  sandbox.cavTopLabel({ ecm: 116, lab: 'ECM116', rail: 'gnd' }) === '116');
unit('unit: top label falls back to src', () =>
  sandbox.cavTopLabel({ ecm: null, src: 'E17', lab: 'E17', rail: 'gnd' }) === 'E17');
unit('unit: cavBottomLabel no ReferenceError on signal pin', () => {
  sandbox.cavBottomLabel({ code: 'L', ecm: 94 });
  return true;
});


ok('ECM 8/9 exhaust VTC only on Rev-Up',
  /Number\(p\)===8 \|\| Number\(p\)===9/.test(html) && /model !== 'de_revup'/.test(html));
ok('ECM grid third line via ecmBottomLabel',
  /function ecmBottomLabel\(/.test(html) && /ecmBottomLabel\(p\)/.test(html) && /has-dest/.test(html));
ok('rail-focus helpers present (stay in rail on re-click)',
  /function focusRailSelection\(/.test(html) && /function ecmPinOnActiveRail\(/.test(html));

{
  /* CONN_FACE ⊆ CONN_BASE keys; referenced face files exist on disk */
  const faceBlock = html.match(/const CONN_FACE = \{([\s\S]*?)\n\};/);
  ok('CONN_FACE block present', !!faceBlock);
  ok('F102 panel injects face camera', /faceBtnHtml\('ix_f102_m72'\)/.test(html));
  if (faceBlock) {
    const keys = [...faceBlock[1].matchAll(/^\s*([A-Za-z0-9_]+)\s*:/gm)].map((m) => m[1]);
    const baseBlock = html.match(/const CONN_BASE = \{([\s\S]*?)\n\};\s*\nlet CONN/);
    ok('CONN_BASE extractable for face check', !!baseBlock);
    const baseKeys = new Set([...baseBlock[1].matchAll(/^\s*([A-Za-z0-9_]+)\s*:\{/gm)].map((m) => m[1]));
    const missing = keys.filter((k) => !baseKeys.has(k));
    ok('CONN_FACE keys ⊆ CONN_BASE', missing.length === 0, missing.length ? missing.join(',') : `${keys.length} keys`);
    const srcs = [...faceBlock[1].matchAll(/src:\s*'([^']+)'/g)].map((m) => m[1]);
    const uniq = [...new Set(srcs)];
    const absent = uniq.filter((s) => !fs.existsSync(path.join(ROOT, s)));
    ok('CONN_FACE image files exist', absent.length === 0, absent.length ? absent.join(',') : `${uniq.length} unique`);
    ok('no empty CONN_FACE placeholders', keys.length > 0 && uniq.length > 0);

    /* One photo = one physical connector. A src may only be shared inside an allowlisted group of
       identical parts (same connector on every cylinder/bank). Guards against generic reuse such as
       the old CKP→cmp.webp, A/F→etc.webp, PSP/EVAP/A/C/EVT→oil.webp, purge→reverse.webp, F40/F41→ho2s.webp. */
    const FACE_SHARE_OK = {
      'faces/inj.webp': ['inj1', 'inj2', 'inj3', 'inj4', 'inj5', 'inj6'],
      'faces/coil.webp': ['coil1', 'coil2', 'coil3', 'coil4', 'coil5', 'coil6'],
      'faces/ho2s.webp': ['ho2s_b1', 'ho2s_b2'],
      'faces/vtc.webp': ['vtc_b1', 'vtc_b2'],
    };
    const bySrc = {};
    for (const m of faceBlock[1].matchAll(/^\s*([A-Za-z0-9_]+)\s*:\s*\{\s*src:\s*'([^']+)'/gm)) {
      (bySrc[m[2]] = bySrc[m[2]] || []).push(m[1]);
    }
    const badShare = Object.entries(bySrc).filter(([src, ids]) => ids.length > 1 &&
      !ids.every((id) => (FACE_SHARE_OK[src] || []).includes(id))).map(([src, ids]) => `${src}: ${ids.join('+')}`);
    ok('CONN_FACE: no face image shared outside allowlist (inj/coil/ho2s/vtc)', badShare.length === 0, badShare.join(' · '));
    const faceOf = (id) => (faceBlock[1].match(new RegExp(`^\\s*${id}\\s*:\\s*\\{\\s*src:\\s*'([^']+)'`, 'm')) || [])[1];
    ok('CKP (F10) uses its own crank-sensor photo faces/ckp.webp, not the cam one', faceOf('ckp') === 'faces/ckp.webp', faceOf('ckp'));
    ok('evap_press (T21) face = FSM EC-379 crop', faceOf('evap_press') === 'faces/fsm_t21.webp', faceOf('evap_press'));

    /* Pin-count lock: CONN/CONN_BASE.pins.length must match expected for mapped faces. */
    const EXPECTED_FACE_PINS = {
      etc: 6,
      inj1: 2, inj2: 2, inj3: 2, inj4: 2, inj5: 2, inj6: 2,
      coil1: 3, coil2: 3, coil3: 3, coil4: 3, coil5: 3, coil6: 3,
      maf: 6,
      ckp: 3,
      cmp_b1: 3, cmp_b2: 3, /* FSM EC-331/333: F4 GY/3, F32 B/3 */
      knock: 2,
      ect: 2,
      ho2s_b1: 4, ho2s_b2: 4,
      /* Round-2 ids — only asserted when present in CONN_FACE */
      ix_e10_f1: 9, ix_e12_f3: 8, ix_e11_f2: 10,
      ix_f14_f229: 2, ix_f18_f201: 6, ix_f221_f33: 8,
      af_b1: 6, af_b2: 6,
      psp: 3,
      ac_press: 3,
      evap_press: 3,
      f21_oilp: 3,
      vtc_b1: 2, vtc_b2: 2,
      backup_sw: 2,
      f20_alt: 2,
      gnd4: 4,
      evap_purge: 2,
      f9_starter: 1,
      f16_cond: 2,
      vtc_ex_b1: 2, vtc_ex_b2: 2, /* FSM face is 4-cavity; CONN wires 2 */
      f38_evtc_b1: 3, /* FSM EC-445 / PG-55: F38 B/3 */
      f42_evtc_b2: 3,
      f242_eot: 2, /* PG-55 sub-harness-3: F242 GY/2 (only asserted if a face is mapped) */
    };
    function expectedFacePins(id) {
      if (Object.prototype.hasOwnProperty.call(EXPECTED_FACE_PINS, id)) return EXPECTED_FACE_PINS[id];
      if (/^inj\d+$/.test(id)) return 2;
      if (/^coil\d+$/.test(id)) return 3;
      if (/^af_/.test(id)) return 6;
      if (/^ho2s_/.test(id)) return 4;
      if (/^cmp_/.test(id)) return 2;
      return null;
    }
    function connPinCount(id) {
      const re = new RegExp('\\n  ' + id + ':\\{[\\s\\S]*?pins:\\[([\\s\\S]*?)\\]');
      const m = baseBlock[1].match(re);
      if (!m) return null;
      return [...m[1].matchAll(/[{]id:/g)].length;
    }
    const pinMismatches = [];
    const pinChecked = [];
    for (const id of keys) {
      const exp = expectedFacePins(id);
      if (exp == null) continue;
      const got = connPinCount(id);
      if (got == null) {
        pinMismatches.push(id + ': missing CONN pins');
        continue;
      }
      pinChecked.push(id + '=' + got);
      if (got !== exp) pinMismatches.push(id + ': got ' + got + ' expected ' + exp);
    }
    ok('CONN_FACE pin counts match EXPECTED_FACE_PINS',
      pinMismatches.length === 0,
      pinMismatches.length ? pinMismatches.join('; ') : pinChecked.join(', '));
  }
}


{
  /* PIN_RAIL is const — probe via in-VM eval, not box.PIN_RAIL */
  const src = [
    extractConstObject(script, 'PIN_RAIL'),
    'var activeRails = new Set();',
    'function ecmPinEl(){ return null; }',
    'function cavSelEl(){ return null; }',
    extractFunction(script, 'ecmPinOnActiveRail'),
    extractFunction(script, 'cavIsActiveRailPrimary'),
    `var __railProbe = (function(){
      const five = Object.entries(PIN_RAIL).filter(([,r]) => r === '5v').map(([p]) => Number(p));
      let orphan = 9999;
      while (PIN_RAIL[orphan] != null) orphan++;
      return { sample5: five[0], orphan };
    })();`,
  ].join('\n');
  const box = {};
  vm.createContext(box);
  vm.runInContext(src, box);
  const sample5 = box.__railProbe.sample5;
  const orphan = box.__railProbe.orphan;
  unit('unit: ecmPinOnActiveRail false when rails empty', () => {
    box.activeRails.clear();
    return box.ecmPinOnActiveRail(sample5) === false;
  });
  unit('unit: ecmPinOnActiveRail true for PIN_RAIL pin on active rail', () => {
    box.activeRails.clear();
    box.activeRails.add('5v');
    return box.ecmPinOnActiveRail(sample5) === true;
  });
  unit('unit: ecmPinOnActiveRail false for orphan pin with 5v filter', () => {
    box.activeRails.clear();
    box.activeRails.add('5v');
    return box.ecmPinOnActiveRail(orphan) === false;
  });
  unit('unit: cavIsActiveRailPrimary bare 5v feed', () => {
    box.activeRails.clear();
    box.activeRails.add('5v');
    return box.cavIsActiveRailPrimary('feed', { id: '1', ecm: null, rail: '5v' }) === true;
  });
  unit('unit: cavIsActiveRailPrimary bare gnd feed not primary', () => {
    box.activeRails.clear();
    box.activeRails.add('gnd');
    return box.cavIsActiveRailPrimary('feed', { id: '1', ecm: null, rail: 'gnd' }) === false;
  });
  unit('unit: cavIsActiveRailPrimary ecm on active rail', () => {
    box.activeRails.clear();
    box.activeRails.add('5v');
    return box.cavIsActiveRailPrimary('s', { id: '2', ecm: sample5 }) === true;
  });
}


function runNested(label, scriptPath, args = []) {
  if (!fs.existsSync(scriptPath)) {
    ok(label + ' present', false, 'missing ' + scriptPath);
    return;
  }
  const env = { ...process.env };
  const localNm = path.join(ROOT, 'node_modules');
  if (fs.existsSync(localNm)) {
    env.NODE_PATH = [localNm, env.NODE_PATH].filter(Boolean).join(path.delimiter);
  }
  const v = spawnSync(process.execPath, [scriptPath, ...args], { encoding: 'utf8', env });
  ok(label + ' exit 0', v.status === 0,
    v.status === 0 ? 'ok' : (v.stdout + '\n' + v.stderr).slice(-500));
}

{
  /* Print pack coil/injector card titles use each language's own I18N word (no Spanish "Bob"/"Iny" in en). */
  const pack = fs.readFileSync(path.join(ROOT, 'make_print_pack.py'), 'utf8');
  ok('print pack: coil/injector titles not hardcoded to Spanish abbreviations', !/else "Bob"|else "Iny"/.test(pack));
  const enPdf = path.join(ROOT, '350Z_2005_PRINT_PACK.pdf');
  const pt = spawnSync('pdftotext', [enPdf, '-'], { encoding: 'utf8' });
  if (pt.status === 0) {
    ok('print pack en PDF: "Coil 1" / "Inj 1" titles, no "Bob1" / "Iny1"',
      /\bCoil 1\b/.test(pt.stdout) && /\bInj 1\b/.test(pt.stdout) && !/\bBob ?\d|\bIny ?\d|\bBobina\b|\bInyector\b/.test(pt.stdout));
  } else {
    ok('print pack en PDF title check', true, 'skipped (pdftotext unavailable)');
  }
}

runNested('verify_harness_bugs.mjs', path.join(__dirname, 'verify_harness_bugs.mjs'), [HTML]);
runNested('i18n.mjs', path.join(__dirname, 'i18n.mjs'));
runNested('fsm_routes.mjs (FSM table: routes, grounds, faces)', path.join(__dirname, 'fsm_routes.mjs'), [HTML]);

const skipBrowser = process.env.HARNESS_SKIP_BROWSER === '1';
if (skipBrowser) {
  ok('browser suites (f102/ui-lang)', true, 'skipped HARNESS_SKIP_BROWSER=1');
} else {
  runNested('ui-lang.mjs', path.join(__dirname, 'ui-lang.mjs'));
  runNested('f102.mjs', path.join(__dirname, 'f102.mjs'));
  runNested('fsm_sig_click.mjs (FSM table: SIG clicks light no rail-only cavity)', path.join(__dirname, 'fsm_sig_click.mjs'));
  runNested('feedback.mjs (Send feedback button/dialog, offline)', path.join(__dirname, 'feedback.mjs'));
}

console.log('---');
console.log(`${passes.length} passed, ${failures.length} failed`);
if (failures.length) {
  console.error('FAILED:', failures.join(', '));
  process.exit(1);
}
console.log('ALL PAGE TESTS PASSED');
