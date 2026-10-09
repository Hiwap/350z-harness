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
import { loadLoomBodyExtra } from './load_map.mjs';

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
const html = fs.readFileSync(HTML, 'utf8').replace(
  'let CONN = {};',
  fs.readFileSync(path.join(ROOT, 'data', 'conn.js'), 'utf8')
    + fs.readFileSync(path.join(ROOT, 'data', 'i18n.js'), 'utf8')
    + 'let CONN = {};\n'
    + fs.readFileSync(path.join(ROOT, 'js', 'selection.js'), 'utf8'),
);
const LOOM_BODY_EXTRA = loadLoomBodyExtra(html);
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
ok('path feed always lit, not Tierras-gated (yellow hl with Relacionados off, related style with it on)',
  /if\(onPathFeed\) return relOn \? \{cls:'hl-group', path:true\} : \{cls:'hl'\};/.test(html) && /if\(hit\.path \|\| circuitSiblingAllowed\(kind\)\)/.test(html));
ok('knock shield displays GND',
  /knock:\{[\s\S]*?lab:'GND'/.test(html) && /ix_f14_f229:\{[\s\S]*?lab:'GND'/.test(html));
ok('cavBottomLabel defines lab before use',
  /function cavBottomLabel\(pin\)\{\s*const rail = cavRailOf\(pin\);\s*const lab = /.test(html));
ok('cavBottomLabel rail always GND/12V/5V',
  /if\(rail === 'gnd'\) return 'GND';\s*if\(rail === '12v'\) return '12V';\s*if\(rail === '5v'\) return '5V';/.test(html));
ok('cavBottomLabel SIG with ECM is the word SIG',
  /if\(pin && pin\.ecm != null\) return 'SIG';/.test(html));

/* 2026-09 audit: every ficha is a fixed harness-plug face exactly as the 2005 FSM T.S. drawing.
   The ECM selector (#ecmOrient) only drives the ECM grid and the ECM excerpt ecm_f101_can. */
ok('fixed faces: FACE_FOLLOWS_ECM_ORIENT is exactly the ECM excerpt',
  /const FACE_FOLLOWS_ECM_ORIENT = new Set\(\['ecm_f101_can'\]\);/.test(html));
{
  const flipUses = [...script.matchAll(/flipRow\(/g)].length;
  const faceInvUses = [...script.matchAll(/isFaceInv\(/g)].length;
  ok('fixed faces: flipRow only in its definition + the single FACE_FOLLOWS_ECM_ORIENT guard',
    flipUses === 2 && /if\(FACE_FOLLOWS_ECM_ORIENT\.has\(cid\)\) row = flipRow\(row\);/.test(script), `flipRow( ×${flipUses}`);
  ok('fixed faces: isFaceInv only used by flipRow', faceInvUses === 2, `isFaceInv( ×${faceInvUses}`);
  const svgFns = [...script.matchAll(/function (svg\w+)\([^)]*\)\{[\s\S]*?\n\}/g)].filter((m) => m[1] !== 'svgTabN' && /flipRow|isFaceInv/.test(m[0])).map((m) => m[1]);
  ok('fixed faces: no svg* renderer other than svgTabN references flipRow/isFaceInv', svgFns.length === 0, svgFns.join(','));
  const noView = [...html.matchAll(/^  (\w+):\{group:'motor'[^\n]*$/gm)]
    .filter((m) => !/(?:\bview|viewByTrans):\{/.test(m[0]) && !/shape:'(?:ring|jb|ixnote)'/.test(m[0]) && !/^  (?:jb_|feed_|fuse\d+_|fuse_link_box|fuse_link_holder|comb_meter|ix_f103_f151)/.test(m[0]))
    .map((m) => m[1]).filter((id) => !['ecm_f101_can', 'f152', 'e17', 'f23_gnd'].includes(id));
  ok('fixed faces: every plug ficha carries view data (FSM ref + order, or unverified reason)', noView.length === 0, noView.join(','));
  const pp = fs.readFileSync(path.join(ROOT, 'make_print_pack.py'), 'utf8');
  ok('print pack cards are fixed (use_inv = bool(face_inv), never FACE_INV)', /use_inv = bool\(face_inv\)/.test(pp) && !/use_inv = [^\n]*FACE_INV/.test(pp));
}
{
  const f36 = (html.match(/backup_sw:\{group[\s\S]*?\n  \w+:\{group/) || [''])[0];
  const f36p2 = (f36.match(/\{id:'2',[^\n]*/) || [''])[0];
  const h22 = (html.match(/\{id:'22H'[^}]*\}/) || [''])[0];
  ok('backup_sw F36·2 is the switched REV output, not a 12V rail (LT-183)', /lab:'REV',code:'OR'/.test(f36p2) && !/rail:'12v'/.test(f36p2), f36p2.slice(0, 80));
  ok('F102·22H is the switched REV output, not a 12V rail (LT-183)', /lab:'REV'/.test(h22) && !/rail:'12v'/.test(h22), h22.slice(0, 80));
  ok('backup_sw F36·1 keeps the IGN 12V feed (fuse 83)', /\{id:'1',lab:'IN',code:'Y\/R',ecm:null,rail:'12v'[^\n]*fusible 83/.test(f36));
  /* Alternator charging (SC-22 / PG-53 / PG-POWER-01/02) */
  ok('alternator B E202: ring, B/GY, 12V, src E201·5, circ alt_charge',
    /alt_b:\{group:'motor', sub:'sensors'[^\n]*shape:'ring'[^\n]*\n\s*pins:\[\{id:'1',lab:'B',code:'B\/GY',ecm:null,rail:'12v',src:'E201·5',srcSub:'power',circ:'alt_charge'/.test(html));
  ok('alternator E E211: ring, B, GND, src E212 (B/Y link to E213), circ alt_charge',
    /alt_e:\{group:'motor', sub:'sensors'[^\n]*shape:'ring'[^\n]*\n\s*pins:\[\{id:'2',lab:'E',code:'B',ecm:null,rail:'gnd',src:'E212',srcSub:'power',circ:'alt_charge'/.test(html));
  ok('E11/F2·1 ALT-S fed by fuse 36 10A (E21·36), 12V rail, circ alt_s',
    /\{id:'1',lab:'ALT-S',code:'LG\/B',ecm:null,rail:'12v',src:'E21·36',srcSub:'fuses',circ:'alt_s'/.test(html)
    && /\n  fuse_link_box:\{[\s\S]*?\{id:'36',lab:'36',fuseLab:'ALT-S',code:'LG\/B',ecm:null,rail:'12v',src:'10A',srcSub:'power',circ:'alt_s'/.test(html));
  ok('F20·4 S = 12V alt_s · F20·3 L and F102·13H = alt_l (signal, no rail)',
    /\{id:'4',lab:'S',code:'LG\/B',rail:'12v',src:'E11\/F2·1',srcSub:'pedals',circ:'alt_s'/.test(html)
    && /\{id:'3',lab:'L',code:'W\/R',src:'F102·13H',srcSub:'intermedias',circ:'alt_l'\}/.test(html)
    && /\{id:'13H',code:'W\/R',ecm:null,lab:'CHARGE',src:'F20·3',srcSub:'sensors',circ:'alt_l'/.test(html));
  ok('charge circuits alt_charge / alt_s / alt_l defined; alt_l path has no rail cavity',
    /\{id:'alt_charge'[\s\S]*?path:\{alt_b:\['1'\],alt_e:\['2'\],fuse_link_box:\['36'\],ix_e11_f2:\['1'\],f20_alt:\['3','4'\],ix_f102_m72:\['13H'\]\}/.test(html)
    && /\{id:'alt_s'[\s\S]*?path:\{fuse_link_box:\['36'\],ix_e11_f2:\['1'\],f20_alt:\['4'\]\}/.test(html)
    && /\{id:'alt_l'[\s\S]*?path:\{f20_alt:\['3'\],ix_f102_m72:\['13H'\],meter_m19:\['17'\]\}/.test(html));
  ok('Arnés motor hides alternator B/E (battery cable PG-53) and the E18/E21 fuse box (fuse 36)',
    LOOM_BODY_EXTRA.has('fuse_link_box') && LOOM_BODY_EXTRA.has('alt_b') && LOOM_BODY_EXTRA.has('alt_e'));
}
{
  /* Fuse cards: one top-level ficha group 'fuses' (Fusibles / Fuses / ヒューズ), collapsed by default, body-side (hidden in Arnés motor). */
  const FUSES = ['fuse_link_box', 'jb_fuse_block', 'fuse_link_holder'];
  const subOf = (id) => ((html.match(new RegExp(`\\n  ${id}:\\{group:'\\w+', sub:'(\\w+)'`)) || [])[1]);
  ok('fuse box cards (cabin J/B, battery + link holder, battery box E18/E21) all in sub fuses', FUSES.every((id) => subOf(id) === 'fuses'), FUSES.map((id) => `${id}=${subOf(id)}`).join(','));
  const inFuses = [...html.matchAll(/\n  (\w+):\{group:'\w+', sub:'fuses'/g)].map((m) => m[1]);
  ok('sub fuses holds exactly the fuse cards, in E18/E21 → J/B → holder E1/E2/E201 order', inFuses.join(',') === FUSES.join(','), inFuses.join(','));
  const noFuseInFeeds = [...html.matchAll(/\n  ((?:jb_|fuse)\w*):\{group:'\w+', sub:'(\w+)'/g)].filter((m) => m[2] !== 'fuses').map((m) => m[1]);
  ok('no jb_* / fuse* card left outside the Fusibles group', noFuseInFeeds.length === 0, noFuseInFeeds.join(','));
  ok('SUB_ORDER has fuses (after feeds, before sensors)', /const SUB_ORDER = \['power','ipdm','feeds','fuses','sensors',/.test(html));
  ok('SUB_I18N fuses: Fusibles / Fuses / ヒューズ', /fuses:\s*\{es:'Fusibles', en:'Fuses', ja:'ヒューズ'\}/.test(html));
  ok('SUB_ACCENT has fuses colour', /SUB_ACCENT = \{[\s\S]*?\n  fuses:\s*'#[0-9a-f]{6}'/.test(html));
  ok('Fusibles group collapsed by default (SUB_DEFAULT_CLOSED)', /const SUB_DEFAULT_CLOSED = new Set\(\['fuses'\]\)/.test(html)
    && /sec\.open = saved === null \? !SUB_DEFAULT_CLOSED\.has\(sk\) : saved === '1'/.test(html));
  ok('LOOM_BODY_EXTRA keeps every fuse card (hidden in Arnés motor)', FUSES.every((id) => LOOM_BODY_EXTRA.has(id)));
  ok('power-path helpers treat fuses like feeds', /f\.sub === 'feeds' \|\| f\.sub === 'fuses'/.test(html) && /f\.sub === 'feeds' \|\| f\.sub === 'fuses'\)\) connSet\.add/.test(html)
    && /HL_GROUP_SUB_PRIORITY = \[[^\]]*'fuses'/.test(html));
  /* Fuse box fichas drawn like the FSM terminal arrangement (PG-88 J/B, PG-89 E18/E21) */
  const fuseLay = (id) => { const m = html.match(new RegExp(`\\n  ${id}:\\{group:[^\\n]*?fuseLayout:(\\{[^\\n]*?\\]\\]\\}|\\{[^\\n]*?\\}\\]\\})`)); return m ? m[1] : ''; };
  const layIds = (lay) => (lay.match(/'[^']*'/g) || []).map((q) => q.slice(1, -1)).filter((t) => t !== 'gap' && t !== 'cw' && !t.startsWith('#') && !/^PG-|^(?:Holder|Box) /.test(t));
  const cardPinIds = (id) => { const blk = (html.match(new RegExp(`\\n  ${id}:\\{group:[\\s\\S]*?(?=\\n  \\w+:\\{group:)`)) || [''])[0]; return [...blk.matchAll(/\{id:'([^']+)'/g)].map((m) => m[1]); };
  const jbLay = fuseLay('jb_fuse_block'), bxLay = fuseLay('fuse_link_box'), hoLay = fuseLay('fuse_link_holder');
  ok('J/B fuse layout = PG-88: 1-7, gap, 8-11, spare / 12-22, crossed slot, spare',
    jbLay.includes("rows:[['1','2','3','4','5','6','7',null,'8','9','10','11','#sp'],['12','13','14','15','16','17','18','19','20','21','22','#x','#sp']]"), jbLay.slice(0, 120));
  ok('E18/E21 layout = PG-89 box only: relays, 31-34 F-I / J-M 35-38 (no holder links)',
    bxLay.includes("rows:[['#relay:Back-up lamp relay','#relay:Horn relay',null,'31','32','33','34',null,'F','G','H','I'],['#relay+','#relay+',null,'J','K','L','M',null,'35','36','37','38']]") && !/'[A-E]'/.test(bxLay), bxLay.slice(0, 120));
  ok('battery + holder layout = PG-89 top: A, then E D C B (E1/E2/E201)', hoLay.includes("rows:[['A',null,'E','D','C','B']]"), hoLay.slice(0, 120));
  ok('holder and box fichas: own PG-89 crops and own location markers (holder E1/E2, box E18/E21)',
    /\n  fuse_link_holder: \{ src: 'faces\/fsm_e1_pg89_holder\.webp', source: 'FSM 2005 PG-89' \},/.test(html)
    && /\n  fuse_link_box: \{ src: 'faces\/fsm_e21_pg89_box\.webp', source: 'FSM 2005 PG-89' \},/.test(html)
    && /\n  fuse_link_holder: \{pg:50, m:\[\[63\.81,20\.28,4\.51,3\.28\],\[59\.38,20\.23,4\.47,3\.23\]\]\},/.test(html)
    && /\n  fuse_link_box: \{pg:50, m:\[\[36\.52,43\.89,4\.51,3\.28\],\[62\.6,16\.07,4\.47,3\.23\],\[57\.22,8\.9,3\.96,2\.81\]\]\},/.test(html)
    && !html.includes('fsm_e18_pg89.webp'));
  ok('fuse layouts place every fuse/link pin exactly once',
    ['jb_fuse_block', 'fuse_link_holder', 'fuse_link_box'].every((id) => { const a = layIds(fuseLay(id)).sort().join(','); const b = cardPinIds(id).sort().join(','); return a && a === b; }),
    ['jb_fuse_block', 'fuse_link_holder', 'fuse_link_box'].map((id) => `${id}:${layIds(fuseLay(id)).length}/${cardPinIds(id).length}`).join(' '));
  ok('fuse boxes use the IPDM cover look and click: shape fusebox, svgFuseBox via renderConnSvg, shared fuseAmpColor, FUSE_BOX_CONNS',
    /\n  jb_fuse_block:\{group:'motor', sub:'fuses', [^\n]*shape:'fusebox'/.test(html) && /\n  fuse_link_box:\{group:'motor', sub:'fuses', [^\n]*shape:'fusebox'/.test(html) && /\n  fuse_link_holder:\{group:'motor', sub:'fuses', [^\n]*shape:'fusebox'/.test(html)
    && /case 'fusebox': svg = svgFuseBox\(cid,f\); break;/.test(html) && !html.includes('fusebox-scroll')
    && (html.match(/fuseLayout:\{ref:'PG-8[89]', rotate:'cw', rows:/g) || []).length === 2 && /fuseLayout:\{ref:'PG-89', rows:\[\['A',/.test(html)
    && /\.ficha\.ficha-narrow \{ width: min-content; \}/.test(html)
    && /items = items\.map\(it => \(\{ t: it\.t, r: it\.c, c: nR0 - it\.r - it\.rs, rs: it\.cs, cs: it\.rs \}\)\);/.test(html)
    && /const ampColor = fuseAmpColor;/.test(html) && /col: empty \? '#546e7a' : fuseAmpColor\(p\.src\)/.test(html)
    && /const FUSE_BOX_CONNS = new Set\(\['ipdm_cover', 'jb_fuse_block', 'fuse_link_holder', 'fuse_link_box'\]\);/.test(html)
    && /if\(FUSE_BOX_CONNS\.has\(cid\)\) return !!\(pin && !pin\.unknown\);/.test(html)
    && /const related = \(pin && pin\.circ && \(CIRCUITS \|\| \[\]\)\.some\(c => c\.id === pin\.circ\)\) \? \[pin\.circ\]\n        : \(CIRCUITS \|\| \[\]\)\.filter\(cir => \{\n          const cavs = cir\.path && cir\.path\[cid\];/.test(html)
    && /function fuseCellSvg\(cid, id, x, y, cw, ch, o\)\{/.test(html)
    && /cells \+= fuseCellSvg\(cid, id, x, y, cw, ch, \{ lab: p\.lab \|\| '', amps: p\.code \|\| '', col: ampColor\(p\.code\), empty \}\);/.test(html)
    && /body \+= fuseCellSvg\(cid, t, x, yy, cw, ch, \{\n\s+lab: empty \? '' : \(p\.fuseLab \|\| '\?'\)/.test(html)
    && /const cw = 54, ch = 26, gap = 2, padX = 5, labH = 9;/.test(html));
  /* line 2 of every fuse/link cell = short name of what it feeds (fuseLab), like the IPDM lid names; J/B 5 has no destination in the FSM = ? */
  {
    const pinsOf = (id) => { const blk = (html.match(new RegExp(`\\n  ${id}:\\{group:[\\s\\S]*?(?=\\n  \\w+:\\{group:)`)) || [''])[0]; return [...blk.matchAll(/\{id:'([^']+)',lab:'[^']*',(?:fuseLab:'([^']*)',)?[^\n]*?src:'([^']*)'/g)].map((m) => ({ id: m[1], fl: m[2], src: m[3] })); };
    const miss = ['jb_fuse_block', 'fuse_link_holder', 'fuse_link_box'].flatMap((id) => pinsOf(id).filter((p) => p.src !== 'X' && !p.fl).map((p) => `${id}:${p.id}`));
    const j5 = pinsOf('jb_fuse_block').find((p) => p.id === '5');
    ok('every fitted fuse/link has a short feeds label (fuseLab); J/B 5 = ?', miss.length === 0 && j5 && j5.fl === '?', miss.join(',') || (j5 && j5.fl));
  }
  ok('svgNote hands fuseLayout cards to svgFuseBox', /function svgNote\(cid, f\)\{\n  if\(f\.fuseLayout\) return svgFuseBox\(cid, f\);/.test(html) && /function svgFuseBox\(cid, f\)\{/.test(html));
  /* Audio unit connectors per AV-12/16/18 legends: M40 = 1-10, M41 = 11-16, M39 = 17-32 */
  ok('audio unit terminals 9 / 12-16 are not on M39 (AV-16 M40·9 earth; AV-12 / AV-18 M41·12-16)', !/M39·(?:9|1[2-6])\b/.test(html) && /audio_m40:\{[\s\S]*?\{id:'9'/.test(html) && /audio_m41:\{[\s\S]*?\{id:'12'[\s\S]*?\{id:'14'/.test(html));
  ok('B1/M12 speaker shields: 20J/25J to M40·9 (AV-16), 28J/33J to M41·11 (AV-18), no colour in the FSM',
    ['20J', '25J'].every((id) => new RegExp(`\\{id:'${id}',code:'—'[^{}]*wireUnk:true[^{}]*M40·9 \\(AV-16\\)`).test(html))
    && ['28J', '33J'].every((id) => new RegExp(`\\{id:'${id}',code:'—'[^{}]*wireUnk:true[^{}]*M41·11 \\(AV-18\\)`).test(html)));
  ok('pins fed straight from a fuse colour their source tag with the fuses accent', !/src:'(?:JB·10A|JB·15A|E21·36|F83|F89|F80|F75)',srcSub:'feeds'/.test(html));
}

{
  /* IPDM E8 (EC-710 / PG-15 / PG-25 / WW-56): 35 not used (horn LG is from fuse No.35, not E8·35); 40 L/W FPR → ECM 113;
     face = H.S. 37 36 [lock] 35 34 33 / 44 43 42 41 40 39 38 */
  {
    const e8 = (html.match(/  ipdm_e8:\{group:[\s\S]*?\n  ipdm_e9:/) || [''])[0];
    ok('IPDM E8·35 not used (PG-25), not horn', /\{id:'35',code:'nc',ecm:null,lab:'nc'/.test(e8) && !/id:'35',src:'HORN'/.test(e8));
    ok('IPDM E8·40 L/W → ECM 113 (EC-710)', /\{id:'40',code:'L\/W',ecm:113,/.test(e8));
    ok('IPDM E8·42 G VMOT → ECM 3, 43 G/R, 44 OR, 39 B/Y, 38 B, 33 L/Y',
      /id:'42',code:'G',ecm:3/.test(e8) && /id:'43',src:'IGN',srcSub:'power',code:'G\/R'/.test(e8) && /id:'44',src:'WASH',srcSub:'ipdm',code:'OR'/.test(e8)
      && /id:'39',src:'F81',srcSub:'ipdm',code:'B\/Y'/.test(e8) && /id:'38',src:'E17',srcSub:'power',code:'B'/.test(e8) && /id:'33',src:'A\/C·RLY',srcSub:'ipdm',code:'L\/Y'/.test(e8));
    ok('IPDM E8 H.S. rows (42/41 under the lock), turned +90 (PG-26)',
      /ipdm_e8: \{ hs:\[\['37','36','L','L','35','34','33'\],\['44','43','42','41','40','39','38'\]\], rot:90 \}/.test(html));
  }
  /* IPDM E7 / E9 faces = FSM H.S. (PG-15 / EC-472), E9·56 LG/B hood (BL-159), E8·43 fuse 82 (PG-15) */
  ok('IPDM E7 H.S. rows (lock between 20 and 19), turned −90 (PG-26)',
    /ipdm_e7: \{ hs:\[\['23','22','21','20','L','L','19','18','17'\],\['32','31','30','29','28','27','26','25','24'\]\], rot:-90 \}/.test(html));
  ok('IPDM E9 H.S. rows (52–45 under the lock), turned 180 (PG-26)',
    /ipdm_e9: \{ hs:\[\['52','51','50','49','48','47','46','45'\],\['60','59','58','57','56','55','54','53'\]\], rot:180 \}/.test(html));
  ok('IPDM E9·56 hood switch LG/B (BL-159)', /\{id:'56',code:'LG\/B',ecm:null,lab:'HOOD'/.test(html));
  ok('IPDM E8·43 = IPDM fuse 82 (PG-15)', /id:'43',src:'IGN',srcSub:'power',code:'G\/R',ecm:null,rail:'12v',note:'12 V con la llave en ON, por el fusible 82 del IPDM/.test(html));
  ok('IPDM E3–E6 H.S. rows + PG-26 turns (E3/E6 180, E4/E5 −90)',
    /ipdm_e3: \{ hs:\[\['1'\],\['2'\]\], rot:180 \}/.test(html)
    && /ipdm_e4: \{ hs:\[\['4','3'\],\['6','5'\]\], rot:-90 \}/.test(html)
    && /ipdm_e5: \{ hs:\[\['8','7'\],\['10','9'\]\], rot:-90 \}/.test(html)
    && /ipdm_e6: \{ hs:\[\['13','12','11'\],\['16','15','14'\]\], rot:180 \}/.test(html));
  ok('IPDM E3–E9 cards drawn by svgIpdmPlug (rotated H.S., no mirror)',
    ['e3','e4','e5','e6','e7','e8','e9'].every(e => new RegExp(`case 'ipdm_${e}': svg = svgIpdmPlug\\(cid,f\\)`).test(html)));
  ok('selection keeps the clicked card lit + retarget keeps a cav: key (deselect bug: E7·18/26, E8·42, E10·2, F18·5/6)',
    /if\(focusConn && CONN\[focusConn\] && !SKIP_SEL_CONN\.has\(focusConn\)\) connSet\.add\(focusConn\);/.test(html)
    && /if\(focusConn && focusCav != null\) selKey = 'cav:' \+ focusConn \+ ':' \+ focusCav;/.test(html));
  ok('no combined IPDM module card', !/ipdm_module|svgIpdmModule|IPDM_MODULE_PLUGS/.test(html));
  ok('IPDM card view notes = wire side as on the IPDM (es/en/ja)',
    ['e3','e4','e5','e6','e7','e8','e9'].every(e => new RegExp(`  ipdm_${e}:\\{group:'motor'[^\\n]*view:\\{hs:\\{es:'lado CABLES, orientada como en el IPDM \\(PG-26\\), traba [^']+',en:'WIRE side, oriented as on the IPDM \\(PG-26\\), lock [^']+',ja:'配線側、IPDM上の向き（PG-26）、ロック[^']+'\\}\\}`).test(html)));
  /* F102·14H/15H/16H = oil pressure sensor F21 ↔ triple meter M44 (DI-34 / DI-66), this car */
  ok('F102·14H G OIL-P / 15H R/L SNS-V (no rail) / 16H B SNS-GND (no rail), src F21, circ oilp_gauge (DI-34/DI-66)',
    /\{id:'14H',code:'G',ecm:null,lab:'OIL-P',src:'F21·2',srcSub:'sensors',circ:'oilp_gauge',note:'[^']*DI-34[^']*',note_en:'[^']+',note_ja:'[^']+'\}/.test(html)
    && /\{id:'15H',code:'R\/L',ecm:null,lab:'SNS-V',src:'F21·1',srcSub:'sensors',circ:'oilp_gauge',note:'[^']*M44·9[^']*',note_en:'[^']+',note_ja:'[^']+'\}/.test(html)
    && /\{id:'16H',code:'B',ecm:null,lab:'SNS-GND',src:'F21·3',srcSub:'sensors',circ:'oilp_gauge',note:'[^']*M44·7[^']*',note_en:'[^']+',note_ja:'[^']+'\}/.test(html));
  ok('circuit oilp_gauge F21 1/2/3 ↔ F102 14H/15H/16H, en/ja, F21 card cites DI-34/66 (es/en/ja)',
    /\{id:'oilp_gauge',[^\n]*\n\s*ecm:\[\], conn:\['f21_oilp','ix_f102_m72','triple_m44'\], f102:\['14H','15H','16H'\],\n\s*path:\{f21_oilp:\['1','2','3'\],ix_f102_m72:\['14H','15H','16H'\],triple_m44:\['9','8','7'\]\}/.test(html)
    && (html.match(/\n  oilp_gauge: \{en:'[^']+', ja:'[^']+'\},/g) || []).length === 2
    && /f21_oilp:\{group:'motor'[^\n]*meta:'B\/3 · DI-34\/66'/.test(html) && (html.match(/meta:'B\/3 · DI-34\/66'/g) || []).length === 3
    && /\{id:'3',code:'B',lab:'SNS-GND',src:'M44·7',circ:'oilp_gauge'\}/.test(html));
  /* F102·10H = DLC signal ground (EC-742): DLC M8·5 B/W → M72·10H → F102·10H → F103·2 (ECM 115 splice) → F152 */
  ok('F102·10H B/W GND rail, src F103·2, circ dlc_gnd (EC-742)',
    /\{id:'10H',code:'B\/W',ecm:null,rail:'gnd',lab:'GND',src:'F103·2',srcSub:'power',circ:'dlc_gnd',note:'[^']*EC-742[^']*',note_en:'[^']+',note_ja:'[^']+'\}/.test(html));
  ok('F102·9H still empty (not in 2005 FSM)', /\{id:'9H',code:'—',ecm:null\}/.test(html));
  ok('DLC pin 5 B/W signal ground → F102·10H, circ dlc_gnd',
    /\{id:'5',code:'B\/W',ecm:null,rail:'gnd',lab:'GND',src:'F102·10H',srcSub:'intermedias',circ:'dlc_gnd'/.test(html));
  ok('circuit dlc_gnd: no ECM pin; path DLC 5 → F102·10H → F103·2 → F152, f102 10H',
    /\{id:'dlc_gnd',[^\n]*\n\s*ecm:\[\], conn:\['dlc','ix_f102_m72','gnd4','f152'\], f102:\['10H'\],\n\s*path:\{dlc:\['5'\],ix_f102_m72:\['10H'\],gnd4:\['2'\],f152:\['ring'\]\}/.test(html));
  ok('dlc_gnd circuit title/notes translated en/ja', (html.match(/\n  dlc_gnd: \{en:'[^']+', ja:'[^']+'\},/g) || []).length === 2);
}

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

/* Optional-equipment pins: gated pins keep their FSM colour (offCode) and draw dimmed with an "only with …" tooltip */
{
  const optSrc = [
    extractFunction(script, 'isPseudoWireCode'),
    extractFunction(script, 'vifMatch'),
    extractConstObject(script, 'VARIANT_OFF'),
    extractFunction(script, 'transGatePin'),
    extractFunction(script, 'variantGatePin'),
    extractConstObject(script, 'VIF_VAL_LABEL'),
    extractFunction(script, 'optNeedLabel'),
    extractFunction(script, 'optOffDisplayPin'),
    extractFunction(script, 'livePinOf'),
    'var lang = "es";',
  ].join('\n');
  const ob = { console };
  vm.createContext(ob);
  vm.runInContext(optSrc, ob);
  const V = (o) => Object.assign({ trans: 'mt', body: 'coupe', market: 'usa', brake: 'abs', audio: 'base', nav: 'no', pseat: 'no', hseat: 'no' }, o || {});
  const hs = { id: '14', code: 'R', ecm: null, lab: 'HS-BAT', vif: 'hseat=yes', note: 'x' };
  unit('unit: dimmed state — heated-seat pin without heated seats keeps its FSM colour as offCode', () => {
    const g = ob.variantGatePin(hs, V());
    const d = ob.optOffDisplayPin(g);
    return g.code === '—' && g.vifOff === 'hseat=yes' && g.offCode === 'R' && d && d.code === 'R' && d.vifOff === 'hseat=yes';
  });
  unit('unit: dimmed state — display pin keeps every label line of the live pin (top src / ECM, lab) and its circuit', () => {
    const live = { id: 'HS-PWR', code: 'G', ecm: null, lab: 'HS-PWR', src: 'B37·3', srcSub: 'carroceria', circ: 'heated_seat', vif: 'hseat=yes' };
    const g = ob.variantGatePin(live, V());
    const d = ob.optOffDisplayPin(g);
    const f = ob.variantGatePin({ id: '28H', code: 'BR/Y', ecm: 102, lab: 'PNP', trans: 'at' }, V());
    const fd = ob.optOffDisplayPin(f);
    return d.src === 'B37·3' && d.lab === 'HS-PWR' && d.circ === 'heated_seat' && d.vifOff === 'hseat=yes'
      && ob.livePinOf(g) === live && fd.ecm === 102 && fd.lab === 'PNP' && fd.transOff === 'at' && g.ecm === null && g.lab === '';
  });
  unit('unit: dimmed state — tooltip names the option (es/en/ja)', () =>
    ob.optNeedLabel(ob.variantGatePin(hs, V()), 'es') === 'solo con asientos calefactables'
    && ob.optNeedLabel(ob.variantGatePin({ id: '15', code: 'R/B', vif: 'audio=bose' }, V()), 'es') === 'solo con Bose'
    && ob.optNeedLabel(ob.variantGatePin({ id: '15', code: 'R/B', vif: 'audio=bose' }, V()), 'en') === 'only with Bose'
    && ob.optNeedLabel(ob.variantGatePin({ id: '15', code: 'R/B', vif: 'audio=bose' }, V()), 'ja') === 'Bose装着車のみ'
    && ob.optNeedLabel(ob.variantGatePin({ id: '7', code: 'P', vif: 'body=roadster&pseat=yes' }, V()), 'es') === 'solo con Roadster + asiento eléctrico'
    && ob.optNeedLabel(ob.variantGatePin({ id: '35G', code: 'L/Y', vif: 'brake=tcs,vdc' }, V()), 'en') === 'only with TCS or VDC'
    && ob.optNeedLabel(ob.variantGatePin({ id: '23H', code: 'GY/R', trans: 'at' }, V()), 'es') === 'solo con A/T');
  unit('unit: full strength when the option is selected (no gate, no dimming)', () => {
    const g = ob.variantGatePin(hs, V({ hseat: 'yes' }));
    return g.code === 'R' && !g.vifOff && ob.optOffDisplayPin(g) === null;
  });
  unit('unit: gated pin with no FSM colour (shield drain) keeps "?" / no colour but still gated + labelled', () => {
    const g = ob.variantGatePin({ id: '20J', code: '—', lab: 'SHIELD', wireUnk: true, vif: 'audio=bose' }, V());
    const d = ob.optOffDisplayPin(g);
    return g.vifOff === 'audio=bose' && d.code === '—' && d.wireUnk === true && d.lab === 'SHIELD' && ob.optNeedLabel(g, 'es') === 'solo con Bose';
  });
  unit('unit: A/T-only F102 pin on M/T keeps its colour dimmed', () => {
    const g = ob.variantGatePin({ id: '24H', code: 'BR/Y', trans: 'at' }, V());
    return g.transOff === 'at' && ob.optOffDisplayPin(g).code === 'BR/Y';
  });
  const opac = Number((script.match(/const OPT_OFF_OPACITY = ([0-9.]+);/) || [])[1]);
  ok('dimmed state rendered: cavGroup + F102 pins use OPT_OFF_OPACITY (<1), data-opt-off, <title> tooltip, clickable through the live pin',
    opac > 0 && opac < 1
    && /const optAttr = optOff \? ` opacity="\$\{OPT_OFF_OPACITY\}" data-opt-off="\$\{esc\(optNeed\)\}"` : '';/.test(script)
    && /const optTitle = optNeed \? `<title>\$\{esc\(optNeed\)\}<\/title>` : '';/.test(script)
    && /const noClick0 = typeof cavClickable === 'function' \? !cavClickable\(cid, pin\) : false;\n  if\(optOff\) pin = optOffDisplayPin\(pin\) \|\| pin;/.test(script)
    && /if\(optOff\)\{ d\.classList\.add\('opt-off'\); d\.style\.opacity = String\(OPT_OFF_OPACITY\);/.test(script)
    && /if\(hasWire && cavClickable\('ix_f102_m72', livePin\)\)/.test(script)
    && /if\(pin && \(pin\.vifOff \|\| pin\.transOff\)\)\{\n    const live = livePinOf\(pin\);[\s\S]{0,160}optOffCircuitsFor\(cid, pin\)\.length > 0;/.test(script)
    && /if\(pin0 && \(pin0\.vifOff \|\| pin0\.transOff\)\)\{ selectOptOffPin\(cid, cavId, pin0, key, opts\); return; \}/.test(script)
    && /\.cav-hit\.cav-opt-off\.hl, \.cav-hit\.cav-opt-off\.hl-group, \.cav-hit\.cav-opt-off\.hl-end \{ opacity: 0\.6 !important; \}/.test(html), `opacity ${opac}`);
}


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
    const srcs = [...faceBlock[1].matchAll(/(?:src|srcAt):\s*'([^']+)'/g)].map((m) => m[1]);
    const uniq = [...new Set(srcs)];
    const absent = uniq.filter((s) => !fs.existsSync(path.join(ROOT, s)));
    ok('CONN_FACE image files exist', absent.length === 0, absent.length ? absent.join(',') : `${uniq.length} unique`);
    ok('no empty CONN_FACE placeholders', keys.length > 0 && uniq.length > 0);

    /* Shared face photos are intentional when the fichas use the same connector part.
       Every share is listed here; a new share outside this list fails so it gets reviewed.
       Do not change these mappings without confirmation. */
    const FACE_SHARE_OK = {
      'faces/inj.webp': ['inj1', 'inj2', 'inj3', 'inj4', 'inj5', 'inj6'],
      'faces/coil.webp': ['coil1', 'coil2', 'coil3', 'coil4', 'coil5', 'coil6'],
      'faces/vtc.webp': ['vtc_b1', 'vtc_b2'],
      'faces/af.webp': ['af_b1', 'af_b2'], /* A/F F22/F34: same 6-way part both banks (Connector Experts i-26377349, similar) */
      'faces/ho2s.webp': ['ho2s_b1', 'ho2s_b2', 'vtc_ex_b1', 'vtc_ex_b2'],
      'faces/oil.webp': ['f21_oilp', 'psp', 'ac_press', 'evap_press', 'f38_evtc_b1', 'f42_evtc_b2'],
      'faces/reverse.webp': ['backup_sw', 'evap_purge', 'f35_pnp'],
      /* B27 GY/5 is one shell: fuel pump draws 3/1, tank temp draws 5/4. Same EC-710 inset. */
      'faces/fsm_b27.webp': ['fuel_pump', 'fuel_tank_temp'],
      /* SRS-12 draws the same white 3-cavity face for both buckle switches. */
      'faces/fsm_b8.webp': ['belt_b8', 'belt_b11'],
      /* AV-11 draws one brown tweeter face for D3 and D33, and one white door-speaker face for D4 and D34. */
      'faces/fsm_d3.webp': ['spk_d3', 'spk_d33'],
      'faces/fsm_d4.webp': ['spk_d4', 'spk_d34'],
      /* AV-12 draws one brown rear-speaker face for B40 and B42. */
      'faces/fsm_b40.webp': ['spk_b40', 'spk_b42'],
    };
    const bySrc = {};
    for (const m of faceBlock[1].matchAll(/^\s*([A-Za-z0-9_]+)\s*:\s*\{\s*src:\s*'([^']+)'/gm)) {
      (bySrc[m[2]] = bySrc[m[2]] || []).push(m[1]);
    }
    const badShare = Object.entries(bySrc).filter(([src, ids]) => ids.length > 1 &&
      !ids.every((id) => (FACE_SHARE_OK[src] || []).includes(id))).map(([src, ids]) => `${src}: ${ids.join('+')}`);
    ok('CONN_FACE: every shared face photo is in the FACE_SHARE_OK allowlist', badShare.length === 0,
      badShare.length ? `unlisted share: ${badShare.join(' · ')}` : `${Object.keys(FACE_SHARE_OK).length} allowlisted shares`);
    const faceOf = (id) => (faceBlock[1].match(new RegExp(`^\\s*${id}\\s*:\\s*\\{\\s*src:\\s*'([^']+)'`, 'm')) || [])[1];
    ok('CKP (F10) uses its own crank-sensor photo faces/ckp.webp (not cmp.webp / oil.webp)',
      faceOf('ckp') === 'faces/ckp.webp' && !(FACE_SHARE_OK['faces/cmp.webp'] || []).includes('ckp')
      && !FACE_SHARE_OK['faces/oil.webp'].includes('ckp'), faceOf('ckp'));
    ok('A/F B1/B2 (F22/F34) use faces/af.webp, not the throttle-body etc.webp',
      faceOf('af_b1') === 'faces/af.webp' && faceOf('af_b2') === 'faces/af.webp', `${faceOf('af_b1')} / ${faceOf('af_b2')}`);
    ok('F33/F221 injector splice uses faces/f33.webp = EFI Hardware male 8-pin grey (gallery img 4, F33 GY/8 PG-55/EC-702)',
      faceOf('ix_f221_f33') === 'faces/f33.webp'
      && /ix_f221_f33: \{ src: 'faces\/f33\.webp', source: 'EFI Hardware \(Nissan 8 Pin Injector Loom Male Pin Connector, Grey\)', note: 'faceNoteMateMirror' \}/.test(faceBlock[1])
      && (html.match(/faceNoteMateMirror: '/g) || []).length === 3,
      faceOf('ix_f221_f33'));
    {
      const banned = ['svgF33', 'svgF18', 'svgHo2s4', 'svgAf6'];
      const stillFn = banned.filter((name) => new RegExp('function ' + name + '\\(').test(script));
      ok('svgF33, svgF18, svgHo2s4, svgAf6 are not functions', stillFn.length === 0, stillFn.join(','));
      const cards = {};
      vm.createContext(cards);
      vm.runInContext(
        fs.readFileSync(path.join(ROOT, 'data', 'conn.js'), 'utf8') + '\nvar __cards = CONN_BASE;',
        cards,
      );
      const wantRows = {
        af_b1: [['5', '3', '1'], ['6', '4', '2']],
        af_b2: [['5', '3', '1'], ['6', '4', '2']],
        ho2s_b1: [['3', '1'], ['4', '2']],
        ho2s_b2: [['3', '1'], ['4', '2']],
        ix_f18_f201: [['1', '2', '3'], ['4', '5', '6']],
        ix_f221_f33: [['1', '2', '3', '4'], ['5', '6', '7', '8']],
      };
      const rowBad = Object.entries(wantRows).filter(([id, rows]) =>
        JSON.stringify(cards.__cards[id] && cards.__cards[id].faceRows) !== JSON.stringify(rows));
      ok('loaded faceRows on af_b1, af_b2, ho2s_b1, ho2s_b2, ix_f18_f201, ix_f221_f33',
        rowBad.length === 0, rowBad.map(([id, rows]) => id + ' want ' + JSON.stringify(rows)).join('; '));
      const base = cards.__cards;
      const shapeOk = base.af_b1.shape === 'af6' && base.af_b2.shape === 'af6'
        && base.ho2s_b1.shape === 'ho2s4' && base.ho2s_b1.faceRound === true
        && base.ho2s_b2.shape === 'ho2s4' && base.ho2s_b2.faceRound === true
        && base.ix_f18_f201.shape === 'f18' && base.ix_f18_f201.shellFill === '#212121'
        && base.ix_f221_f33.shape === 'f33';
      const otherFill = Object.entries(base).filter(([id, card]) => card && card.shellFill && id !== 'ix_f18_f201').map(([id]) => id);
      ok('shellFill is only #212121 on ix_f18_f201, HO2S stays faceRound, shapes stay af6/ho2s4/f18/f33',
        shapeOk && otherFill.length === 0, otherFill.join(','));
      ok('f33, f18, af6, and ho2s4 call svgFaceRows',
        /case 'f33':\r?\n    case 'f18':\r?\n    case 'af6':\r?\n    case 'ho2s4': svg = svgFaceRows\(cid,f\); break;/.test(script));
      const pp = fs.readFileSync(path.join(ROOT, 'make_print_pack.py'), 'utf8');
      ok('print pack af6 has no private 5-3-1 / 6-4-2 order; af_b1.faceRows is still that order',
        !/order = \[\["5", "3", "1"\], \["6", "4", "2"\]\]/.test(pp)
        && JSON.stringify(base.af_b1 && base.af_b1.faceRows) === JSON.stringify([['5', '3', '1'], ['6', '4', '2']]));
    }
    ok('A/F face caption carries the localized similar/lock note', /af_b1:[^\n]*note: 'faceNoteSimilarLock'/.test(faceBlock[1])
      && (html.match(/faceNoteSimilarLock: '/g) || []).length === 3 /* es + en + ja packs */);
    ok('E108/M15 has no face photo', !/ix_e108_m15\s*:\s*\{\s*src:/.test(faceBlock[1]));
    ok('IPDM FSM PG-26 image exists and each E3–E9 plug has a mark',
      fs.existsSync(path.join(ROOT, 'faces/ipdm_pg26.webp'))
      && /const IPDM_FSM_MARK = \{/.test(html)
      && ['ipdm_e3','ipdm_e4','ipdm_e5','ipdm_e6','ipdm_e7','ipdm_e8','ipdm_e9'].every((id) =>
        new RegExp(id + ':\\s*\\{l:').test(html)));
    ok('IPDM PG-26 camera on the IPDM group header + per-plug camera on Seleccionados E3–E9 cards (as before 19ebb00)',
      /function ipdmFsmBtnHtml\(/.test(html)
      && /class="ficha-face-btn ipdm-fsm-btn"/.test(html)
      && /sum\.insertAdjacentHTML\('beforeend', ipdmFsmBtnHtml\(''\)\);/.test(html)
      && /if\(sk === 'ipdm'\) addIpdmGroupBtn\(sum\);/.test(html)
      && (html.match(/makeFichaEl\(id, CONN\[id\], \{ipdmIcon:true\}\)/g) || []).length === 2
      && /const showIpdm = !!\(opts && opts\.ipdmIcon && IPDM_FSM_MARK\[id\]\);/.test(html));
    {
      const locBlock = (html.match(/const CONN_LOC = \{\n([\s\S]*?)\n\};/) || [,''])[1];
      const locIds = [...locBlock.matchAll(/^  ([a-z0-9_]+): \{pg:(\d+), m:(\[[^\n]*\])\},$/gm)];
      const pages = new Set(locIds.map((m) => m[2]));
      ok('Location (FSM PG harness layout) map: ≥65 fichas, pages 48/50/52/53/54/56/57/59/63/69/70 exist, marks inside the image, every id is a ficha, no IPDM plug',
        locIds.length >= 65 && [...pages].every((pg) => ['48','50','52','53','54','56','57','59','63','69','70'].includes(pg) && fs.existsSync(path.join(ROOT, `faces/loc/pg${pg}.webp`)))
        && locIds.every((m) => JSON.parse(m[3]).every((b) => b.length === 4 && b[0] >= 0 && b[1] >= 0 && b[0] + b[2] <= 100 && b[1] + b[3] <= 100))
        && locIds.every((m) => new RegExp(`\\n  ${m[1]}:\\{group:`).test(html))
        && !locIds.some((m) => /^ipdm_/.test(m[1])));
      ok('Location button sits next to the photo button (fichas + F102 panel), es/en/ja captions',
        /<h3>\$\{esc\(connField\(id, f, 'name'\)\)\}<\/h3>\$\{locBtnHtml\(id\)\}\$\{faceBtn\}/.test(html)
        && /\$\{locBtnHtml\('ix_f102_m72'\)\}\$\{faceBtnHtml\('ix_f102_m72'\)\}/.test(html)
        && (html.match(/    locOpen: '/g) || []).length === 3 && (html.match(/    locPg54: '/g) || []).length === 3 && (html.match(/    locHint: '/g) || []).length === 3);
      ok('Location on every intermedias card (B1/M12, B43/T1, T2/B44 → PG-57) and the ASCD/DLC cards (M8/M23/M48 → PG-48, B27 → PG-57, alternator E202/E211 → PG-53)',
        ['ix_e106_b2','ix_b43_t1','ix_t2_b44','ix_b1_m12','ix_e10_f1','ix_e12_f3','ix_e108_m15','ix_f102_m72'].every((c) => locIds.some((m) => m[1] === c))
        && ['ix_b1_m12','ix_b43_t1','ix_t2_b44','fuel_pump','fuel_tank_temp','fuel_level_sub'].every((c) => locIds.some((m) => m[1] === c && m[2] === '57'))
        && ['dlc','clock_spring','comb_meter','unified_m49'].every((c) => locIds.some((m) => m[1] === c && m[2] === '48'))
        && ['evap_vent','evap_press'].every((c) => locIds.some((m) => m[1] === c && m[2] === '63'))
        && ['alt_b','alt_e'].every((c) => locIds.some((m) => m[1] === c && m[2] === '53')) && (html.match(/    locPg53: '/g) || []).length === 3
        && (html.match(/    locPg57: '/g) || []).length === 3 && (html.match(/    locPg48: '/g) || []).length === 3 && (html.match(/    locPg63: '/g) || []).length === 3);
      ok('CKP location = single FSM EC-113 view from under the vehicle, sensor marked, plain es/en/ja note (under the car, engine–transmission joint)',
        /\n  ckp: \{src:'faces\/loc\/ec113_ckp\.webp', ref:'EC-113', note:'locCkpNote', m:\[\[[\d.,]+\]\]\},/.test(html)
        && fs.existsSync(path.join(ROOT, 'faces/loc/ec113_ckp.webp'))
        && /locCkpNote: 'Está ABAJO del auto, en la unión motor–caja/.test(html) && /locCkpNote: 'It is UNDER the car, at the engine–transmission joint/.test(html) && /locCkpNote: '車両の下側、エンジンとトランスミッションの継ぎ目/.test(html));
      ok('IPDM location only on the IPDM group header: PG-50 with the 7 E3–E9 callouts, next to the group camera',
        /const IPDM_GROUP_LOC = \{pg:50, m:\[(\[[\d.]+,[\d.]+,[\d.]+,[\d.]+\],?){7}\]\};/.test(html)
        && /function addIpdmGroupBtn\(sum\)\{\s*sum\.insertAdjacentHTML\('beforeend', locBtnHtml\('ipdm_group'\)\);/.test(html));
    }
    ok('IPDM cover fuses 71–89 are one ficha, with the amp under the short name',
      /ipdm_cover:\{group:'motor', sub:'ipdm'/.test(html)
      && /function svgIpdmCover\(/.test(html)
      && /if\(n === 10\) return '#ef5350'/.test(html)
      && /if\(n === 15\) return '#42a5f5'/.test(html)
      && /if\(n === 20\) return '#ffee58'/.test(html)
      && Array.from({length:19}, (_,i) => 71+i).every((n) =>
        new RegExp(`\\{id:'${n}',lab:'`).test(html))
      && !/ipdm_f71: \{l:/.test(html));

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
      app: 6,
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
      f35_pnp: 2,
      f20_alt: 2,
      gnd4: 4,
      evap_purge: 2,
      f9_starter: 1,
      f16_cond: 2,
      vtc_ex_b1: 2, vtc_ex_b2: 2, /* FSM face is 4-cavity; CONN wires 2 */
      f38_evtc_b1: 3, /* FSM EC-445 / PG-55: F38 B/3 */
      f42_evtc_b2: 3,
      f242_eot: 2, /* PG-55 sub-harness-3: F242 GY/2 (only asserted if a face is mapped) */
      evap_vent: 2,
      fuel_pump: 2, /* shell is B27 GY/5; the ficha wires 3 and 1 */
      fuel_tank_temp: 2, /* same B27; the ficha wires 5 and 4 */
      ascd_brake: 2,
      ascd_clutch: 2,
      stop_lamp: 4,
      clock_spring: 2,
      dlc: 16,
      wiper_e52: 4, /* shell E52 GY/5; cavity 5 empty */
      washer_e29: 2,
      washer_e28: 2,
      wiper_d106: 3, /* shell D106 W/4; cavity 3 empty */
      meter_m19: 17, /* shell M19 W/24; 4-9 and 19 have no FSM wire */
      brake_fluid_e44: 2,
      pkb_b47: 1,
      bcm_m90: 27, bcm_m91: 12, turn_e40: 8, turn_e41: 6, turn_t10: 2, turn_e24: 8, turn_e25: 6, turn_t18: 2,
      stop_t9: 3, stop_t17: 3, stop_d103: 2, lug_t13: 2, map_r52: 3, map_r53: 4, dtrl_e14: 4, dtrl_e15: 5,
      abs_e51: 18, /* shell E51 GY/30; 12 cavities have no FSM wire */
      abs_t5: 4,
      vdc_e118: 43, /* shell E118 B/88; cavities with no FSM wire stay empty */
      vdc_off_m9: 2, /* shell M9 GY: 1-2-3-4 plus two unnumbered cavities; the ficha wires 1 and 2 */
      vdc_m51: 6,
      comb_meter: 10, triple_m44: 9, unified_m49: 9, unified_m50: 13, fuel_level_sub: 2,
      door_sw_b17: 1, door_sw_b23: 1, door_lock_d11: 4, door_lock_d40: 2, mirror_d2: 5, mirror_d32: 5, bcm_b83: 7, rke_m78: 3, tpms_m79: 1, sec_m34: 2, key_m25: 2, comb_sw_m29: 13, pw_d7: 13,
      back_door_t12: 2, back_opener_t103: 2, trunk_cancel_b71: 2, back_opener_t11: 2,
      fuel_lid_m59: 4, fuel_lid_m13: 2, fuel_lid_t19: 2,
      seat_b37: 4, seat_m154: 6, seat_m155: 6, belt_b8: 2, belt_b11: 2,
      defog_b34: 6, defog_d104: 2, defog_b202: 2,
      audio_m40: 10, audio_m41: 6, audio_m39: 5,
      amb_e34: 2, blower_m62: 3,
      top_b66: 13, top_b67: 19, top_b68: 7, top_m14: 5, atdev_m47: 9,
      spk_d4: 2, spk_d3: 2, spk_d34: 2, spk_d33: 2, spk_b40: 2, spk_b42: 2,
      socket_b36: 2, socket_m38: 2,
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

runNested('sel_order.mjs (selected fichas: control module toward the sensor)', path.join(__dirname, 'sel_order.mjs'));
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
  runNested('variants.mjs (equipment selectors: body / brakes / options; Canada DTRL dimmed)', path.join(__dirname, 'variants.mjs'));
  runNested('ix_dest.mjs (every used intermediate cavity shows its destination line)', path.join(__dirname, 'ix_dest.mjs'));
  runNested('outline_contrast.mjs (outline-mode labels readable on every wire colour)', path.join(__dirname, 'outline_contrast.mjs'));
  runNested('popup_short.mjs (click info = one short line; Descripción in the details panel, never in a ficha; one pin per connector type, es/en/ja)', path.join(__dirname, 'popup_short.mjs'));
  runNested('sel_outline.mjs (Relacionados on: only the clicked pin/cavity gets the yellow selected outline; ECM 85 K-line regression)', path.join(__dirname, 'sel_outline.mjs'));
  runNested('coil_etc_rails.mjs (coils: one 12V + own ground per coil, EC-689/691/693; ETC F31 motor 3/6 ← VMOT, TPS 5V/ground)', path.join(__dirname, 'coil_etc_rails.mjs'));
  runNested('rel_sweep.mjs (every ECM pin × Relacionados/grouping option, every ficha cavity: route + 12V partners lit, clickable)', path.join(__dirname, 'rel_sweep.mjs'));
}

console.log('---');
console.log(`${passes.length} passed, ${failures.length} failed`);
if (failures.length) {
  console.error('FAILED:', failures.join(', '));
  process.exit(1);
}
console.log('ALL PAGE TESTS PASSED');
