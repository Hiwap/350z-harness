#!/usr/bin/env node
/**
 * Maintainer corrections, enforced on the loaded data (no page sentences matched).
 * Each block names the rule it guards; AGENTS.md points here. Run: node test/rules.mjs
 */
import fs from 'fs';
import vm from 'vm';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadMap } from './load_map.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const map = loadMap(path.join(ROOT, 'index.html'));
const CARDS = map.CONN_BASE;
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').replace(/\r\n/g, '\n');
let failed = 0;
function ok(name, cond, detail = '') {
  if (cond) console.log(`PASS  ${name}${detail ? ' — ' + detail : ''}`);
  else { failed++; console.error(`FAIL  ${name}${detail ? ' — ' + detail : ''}`); }
}
const nameOf = (id, lg) => (lg === 'es' ? CARDS[id].name : ((map.CONN_I18N[id] || {})[lg] || {}).name) || '';
const pinIds = (c) => (c.pins || []).map((p) => String(p.id));

/* Rule speakers-2-pin: every speaker / tweeter card draws exactly cavities 1 and 2 (AV-11/12/17). */
{
  const spk = Object.keys(CARDS).filter((id) => /^spk_/.test(id)
    || /altavoz|tweeter/i.test(nameOf(id, 'es')) || /speaker|tweeter/i.test(nameOf(id, 'en')));
  const bad = spk.filter((id) => !/^spk_/.test(id)
    || pinIds(CARDS[id]).join(',') !== '1,2'
    || JSON.stringify(CARDS[id].faceRows) !== JSON.stringify([['1', '2']]));
  ok('speakers: every speaker/tweeter card is spk_* with pins 1,2 and faceRows [[1,2]]', spk.length >= 8 && bad.length === 0,
    bad.length ? bad.map((id) => `${id}: pins ${pinIds(CARDS[id])} rows ${JSON.stringify(CARDS[id].faceRows)}`).join('; ') : `${spk.length} cards`);
}

/* Rule defogger-one-card: the rear-glass defogger filament is ONE card per body with both terminals
   (Coupe D104 + / D211 −, GW-63; Roadster B202 + / B203 −, GW-67), never a card per terminal. */
{
  const want = { defog_d104: ['D104', 'D211'], defog_b202: ['B202', 'B203'] };
  const filament = Object.keys(CARDS).filter((id) => !/^ix_/.test(id)
    && (CARDS[id].pins || []).some((p) => p.lab === 'DEF+' && String(p.src || '') === 'B34·5'));
  const shape = Object.entries(want).filter(([id, terms]) => {
    const c = CARDS[id];
    if (!c) return true;
    const labs = (c.pins || []).map((p) => p.lab).join(',');
    return labs !== 'DEF+,GND' || !terms.every((t) => (c.meta || '').includes(t)) || (c.pins || []).some((p) => p.circ !== 'rear_defog');
  }).map(([id]) => id);
  ok('defogger: one filament card per body (defog_d104 Coupe, defog_b202 Roadster), each with DEF+ and GND',
    filament.sort().join(',') === Object.keys(want).sort().join(',') && shape.length === 0,
    `filament cards ${filament.join(',')}${shape.length ? ' · bad ' + shape.join(',') : ''}`);
  const split = Object.keys(CARDS).filter((id) => !(id in want)
    && /\b(D104|D211|B202|B203)\b/.test(`${id} ${CARDS[id].name} ${CARDS[id].meta}`));
  ok('defogger: no other card is named after a single filament terminal (D104/D211/B202/B203)', split.length === 0, split.join(','));
}

/* Rule photo-sources: no VQ35HR part photos (the map is the VQ35DE car), and the rejected eBay listing
   206578549537 never comes back. Checked on faces/SOURCES.md, fichas_fotos_arnes_motor.txt and every
   CONN_FACE source / caption string. */
const CONN_FACE = (() => {
  const m = html.match(/const CONN_FACE = \{[\s\S]*?\n\};/);
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(m[0].replace('const CONN_FACE', 'this.CONN_FACE'), ctx);
  return ctx.CONN_FACE;
})();
{
  const BANNED = [
    [/\bVQ3[57]\s*V?HR\b/i, 'VQ35HR part'],
    [/\bHR\b/, 'HR part'],
    [/206578549537/, 'rejected eBay listing 206578549537'],
  ];
  const hits = [];
  for (const rel of ['faces/SOURCES.md', 'fichas_fotos_arnes_motor.txt']) {
    const file = path.join(ROOT, rel);
    if (!fs.existsSync(file)) continue;
    fs.readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
      for (const [re, why] of BANNED) if (re.test(line)) hits.push(`${rel}:${i + 1} ${why}`);
    });
  }
  for (const [id, f] of Object.entries(CONN_FACE)) {
    for (const [k, v] of Object.entries(f)) {
      if (typeof v !== 'string') continue;
      for (const [re, why] of BANNED) if (re.test(v)) hits.push(`CONN_FACE.${id}.${k} ${why}`);
    }
  }
  ok('photo sources: no VQ35HR part and no eBay 206578549537 in SOURCES.md, the photo list or CONN_FACE', hits.length === 0, hits.join('; '));
}

/* Rule face-share-approval: FACE_SHARE_OK (test/face_share_ok.json) grows only with the maintainer's
   confirmation that the shared photo is the same part. Each share carries its approval date and basis,
   every listed card really uses that image, and the size is pinned here: raising FACE_SHARE_PINNED is
   the approval step, done in the same commit that records the confirmation date. */
{
  const FACE_SHARE_PINNED = { shares: 14, cards: 43 };
  const J = JSON.parse(fs.readFileSync(path.join(__dirname, 'face_share_ok.json'), 'utf8'));
  const today = new Date().toISOString().slice(0, 10);
  const noDate = J.shares.filter((e) => !/^\d{4}-\d{2}-\d{2}$/.test(e.approved || '') || e.approved > today || !(e.basis || '').trim());
  ok('face shares: every FACE_SHARE_OK entry has an approval date and a basis', noDate.length === 0, noDate.map((e) => e.src).join(','));
  const stale = [];
  for (const e of J.shares) for (const id of e.ids) {
    const f = CONN_FACE[id];
    if (!f || (f.src !== e.src && f.fsm !== e.src)) stale.push(`${e.src}→${id}`);
  }
  ok('face shares: every FACE_SHARE_OK card really shows that image (no stale pre-approval)', stale.length === 0, stale.join(','));
  const cards = J.shares.reduce((n, e) => n + e.ids.length, 0);
  ok('face shares: FACE_SHARE_OK size is pinned (grows only with the maintainer\'s confirmation; then bump FACE_SHARE_PINNED in test/rules.mjs)',
    J.shares.length === FACE_SHARE_PINNED.shares && cards === FACE_SHARE_PINNED.cards,
    `${J.shares.length} shares / ${cards} cards, pinned ${FACE_SHARE_PINNED.shares} / ${FACE_SHARE_PINNED.cards}`);
}

/* Rule body-subgroups: Body is one top-level group; each system (BODY_NEST_ORDER) is a subgroup with its own
   accent, and that accent is the only colour of its cards (cards carry no accent field of their own). */
{
  const grab = (re) => { const m = html.match(re); if (!m) throw new Error('missing ' + re); const ctx = {}; vm.createContext(ctx); vm.runInContext('this.v = ' + m[1], ctx); return ctx.v; };
  const NEST = grab(/const BODY_NEST_ORDER = (\[[^\]]*\]);/);
  const ACC = grab(/const SUB_ACCENT = (\{[\s\S]*?\n\});/);
  const own = Object.keys(CARDS).filter((id) => 'accent' in CARDS[id]);
  ok('body: no card carries its own accent (the group decides)', own.length === 0, own.join(','));
  const body = Object.keys(CARDS).filter((id) => CARDS[id].sub === 'carroceria');
  const badNest = body.filter((id) => CARDS[id].group !== 'body' || !NEST.includes(CARDS[id].nest));
  ok('body: every Body card sits in one BODY_NEST_ORDER subgroup', body.length > 0 && badNest.length === 0, badNest.map((id) => `${id}:${CARDS[id].nest}`).join(','));
  const nestCards = Object.keys(CARDS).filter((id) => CARDS[id].nest && CARDS[id].sub !== 'carroceria');
  ok('body: only Body cards use nest (no second-level groups elsewhere)', nestCards.length === 0, nestCards.join(','));
  const keys = NEST.map((n) => 'body_' + n);
  const noAcc = keys.filter((k) => !/^#[0-9a-f]{6}$/i.test(ACC[k] || ''));
  const cols = Object.values(ACC).map((c) => c.toLowerCase());
  const dupes = keys.filter((k) => ACC[k] && cols.filter((c) => c === ACC[k].toLowerCase()).length > 1);
  ok('body: each subgroup has its own accent, different from every other group', noAcc.length === 0 && dupes.length === 0, `missing ${noAcc.join(',')} · shared ${dupes.join(',')}`);
  const noGroup = Object.keys(CARDS).filter((id) => { const c = CARDS[id]; const g = c.sub === 'carroceria' ? 'body_' + c.nest : c.sub; return !ACC[g]; });
  ok('body: every card\'s group has an accent', noGroup.length === 0, noGroup.join(','));
}

/* Rule no-pendientes: PENDIENTES.md and docs/plans/ stay deleted (split landed in 09e0d17). Work lists live
   in the issue tracker, not in the repo. */
{
  const found = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name === 'node_modules' || e.name === '.git') continue;
      const p = path.join(dir, e.name);
      const rel = path.relative(ROOT, p).split(path.sep).join('/');
      if (/^pendientes/i.test(e.name) || rel === 'docs/plans') found.push(rel);
      if (e.isDirectory()) walk(p);
    }
  };
  walk(ROOT);
  ok('no PENDIENTES.md (any case, any folder) and no docs/plans/', found.length === 0, found.join(','));
}

/* Rule ecm-88: the extra wire ECM 88 → F102·9H seen on one car is not in any 2005/2006 FSM diagram or
   EC terminal table, so it stays off the map: no ECM 88 colour/rail, no card pin on ECM 88, F102·9H empty,
   no circuit through either, and no FSM-table entry for 88. */
{
  const TABLE = JSON.parse(fs.readFileSync(path.join(__dirname, 'fsm_ecm_routes.json'), 'utf8'));
  const on88 = [];
  for (const [id, c] of Object.entries(CARDS)) for (const p of c.pins || []) if (Number(p.ecm) === 88) on88.push(`${id}·${p.id}`);
  const h9 = (CARDS.ix_f102_m72.pins || []).find((p) => p.id === '9H') || {};
  const h9wired = Object.keys(h9).filter((k) => !['id', 'code', 'ecm'].includes(k)).length > 0 || h9.code !== '—' || h9.ecm != null;
  const circs = [...map.early, ...map.rev].filter((c) => (c.ecm || []).map(Number).includes(88)
    || ((c.path || {}).ix_f102_m72 || []).includes('9H')).map((c) => c.id);
  ok('ECM 88 / F102·9H stay off the map (not in the FSM)',
    !(88 in map.PIN_COL) && !(88 in map.PIN_RAIL) && on88.length === 0 && !h9wired && circs.length === 0 && !TABLE.pins['88'],
    JSON.stringify({ col: map.PIN_COL[88], rail: map.PIN_RAIL[88], on88, h9, circs: [...new Set(circs)], table: !!TABLE.pins['88'] }));
}

/* Rule short-descriptions: card notes, circuit notes and pin notes stay short in es/en/ja (the tags already
   show the route). DESC_MAX is the cap. Notes that were longer when the cap landed are grandfathered at
   their length in LONG_NOTES: they may shrink, never grow; once one fits the cap, drop it from the list. */
{
  const DESC_MAX = { card: { es: 360, en: 360, ja: 180 }, circ: { es: 260, en: 260, ja: 130 }, pin: { es: 320, en: 320, ja: 170 } };
  const LONG_NOTES = {
    'card:abs_e51:ja': 185,
    'card:bcm_b83:es': 361,
    'card:comb_meter:es': 375,
    'card:ix_e11_f2:en': 445,
    'card:ix_e11_f2:es': 447,
    'card:ix_e11_f2:ja': 202,
    'card:ix_f18_f201:en': 522,
    'card:ix_f18_f201:es': 514,
    'card:ix_f18_f201:ja': 264,
    'card:ix_f221_f33:en': 408,
    'card:ix_f221_f33:es': 403,
    'card:ix_f221_f33:ja': 195,
    'card:triple_m44:ja': 193,
    'card:unified_m49:ja': 181,
    'card:unified_m50:ja': 183,
    'circ:can_tcm:ja': 146,
    'circ:pnp_at:en': 402,
    'circ:pnp_at:es': 392,
    'circ:pnp_at:ja': 230,
    'circ:pseat_r:ja': 147,
    'circ:rear_defog:en': 265,
    'circ:rear_defog:es': 287,
    'circ:rear_defog:ja': 144,
    'circ:rear_wiper:en': 266,
    'circ:rear_wiper:es': 272,
    'circ:rear_wiper:ja': 153,
    'pin:fuse_link_box·F:ja': 254,
    'pin:ix_b1_m12·27J:en': 360,
    'pin:ix_b1_m12·27J:es': 347,
    'pin:ix_b1_m12·27J:ja': 185,
    'pin:ix_b1_m12·4J:es': 324,
    'pin:jb_fuse_block·12:en': 489,
    'pin:jb_fuse_block·12:es': 505,
    'pin:jb_fuse_block·12:ja': 359,
    'pin:jb_fuse_block·14:en': 519,
    'pin:jb_fuse_block·14:es': 537,
    'pin:jb_fuse_block·14:ja': 369,
    'pin:jb_fuse_block·15:en': 431,
    'pin:jb_fuse_block·15:es': 470,
    'pin:jb_fuse_block·15:ja': 276,
    'pin:jb_fuse_block·18:en': 414,
    'pin:jb_fuse_block·18:es': 435,
    'pin:jb_fuse_block·18:ja': 299,
    'pin:jb_fuse_block·19:en': 440,
    'pin:jb_fuse_block·19:es': 461,
    'pin:jb_fuse_block·19:ja': 325,
    'pin:jb_fuse_block·1:en': 510,
    'pin:jb_fuse_block·1:es': 549,
    'pin:jb_fuse_block·1:ja': 362,
    'pin:jb_fuse_block·20:es': 329,
    'pin:jb_fuse_block·20:ja': 193,
    'pin:jb_fuse_block·6:en': 344,
    'pin:jb_fuse_block·6:es': 369,
    'pin:jb_fuse_block·6:ja': 268,
  };
  const seen = new Set();
  const over = [];
  const check = (kind, key, lg, s) => {
    if (!s) return;
    const k = `${kind}:${key}:${lg}`;
    const cap = k in LONG_NOTES ? LONG_NOTES[k] : DESC_MAX[kind][lg];
    if (k in LONG_NOTES) seen.add(k);
    if (s.length > cap) over.push(`${k} ${s.length}>${cap}`);
    else if (k in LONG_NOTES && s.length <= DESC_MAX[kind][lg]) over.push(`${k} now fits (${s.length}); drop it from LONG_NOTES`);
  };
  for (const [id, c] of Object.entries(CARDS)) {
    const i = map.CONN_I18N[id] || {};
    check('card', id, 'es', c.note); check('card', id, 'en', i.en && i.en.note); check('card', id, 'ja', i.ja && i.ja.note);
    for (const p of c.pins || []) {
      const k = `${id}·${p.id}`;
      check('pin', k, 'es', p.note); check('pin', k, 'en', p.note_en); check('pin', k, 'ja', p.note_ja);
    }
  }
  const circEs = new Map();
  for (const c of [...map.early, ...map.rev]) if (c.notes && (!circEs.has(c.id) || circEs.get(c.id).length < c.notes.length)) circEs.set(c.id, c.notes);
  for (const [id, n] of circEs) check('circ', id, 'es', n);
  for (const [id, v] of Object.entries(map.NOTES_I18N)) { check('circ', id, 'en', v.en); check('circ', id, 'ja', v.ja); }
  const gone = Object.keys(LONG_NOTES).filter((k) => !seen.has(k));
  ok('descriptions: card / circuit / pin notes within DESC_MAX (es/en/ja), grandfathered ones never grow',
    over.length === 0 && gone.length === 0, [...over, ...gone.map((k) => `${k} no longer exists; drop it from LONG_NOTES`)].join('; '));
}

/* Rule optional-dimmed (data side): optional equipment (audio / nav / power seat / heated seats) gates pins,
   which stay drawn dimmed (test/rules_browser.mjs). A whole card hidden by an option is allowed only for the
   door speakers: D4/D34 without Bose, D5/D35 with Bose (AV-11 / AV-17). Body, brakes, market and
   transmission are different cars, so their card gates stay. */
{
  const OPTION_DIMS = ['audio', 'nav', 'pseat', 'hseat'];
  const DOOR_SPEAKERS = { spk_d4: 'audio=base', spk_d34: 'audio=base', spk_d5: 'audio=bose', spk_d35: 'audio=bose' };
  const usesOption = (expr) => OPTION_DIMS.some((k) => new RegExp(`(^|[&|])\\s*${k}\\s*=`).test(expr || ''));
  const hidden = Object.keys(CARDS).filter((id) => usesOption(CARDS[id].vif));
  const bad = hidden.filter((id) => DOOR_SPEAKERS[id] !== CARDS[id].vif);
  const lost = Object.keys(DOOR_SPEAKERS).filter((id) => !CARDS[id] || CARDS[id].vif !== DOOR_SPEAKERS[id]);
  ok('optional equipment hides a whole card only for the door speakers (D4/D34 base, D5/D35 Bose)', bad.length === 0 && lost.length === 0,
    `${bad.map((id) => `${id} vif ${CARDS[id].vif}`).join(',')}${lost.length ? ' · door speakers not gated: ' + lost.join(',') : ''}`);
}

if (failed) { console.error(`rules.mjs: ${failed} failed`); process.exit(1); }
console.log('rules.mjs: all passed');
