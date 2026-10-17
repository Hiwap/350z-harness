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

if (failed) { console.error(`rules.mjs: ${failed} failed`); process.exit(1); }
console.log('rules.mjs: all passed');
