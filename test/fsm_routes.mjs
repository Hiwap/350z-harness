#!/usr/bin/env node
/**
 * FSM route gate (static). Compares the map in index.html against the FSM-derived
 * table test/fsm_ecm_routes.json (2005 FSM, EC/PG citations per entry).
 * The table is the source of truth: these checks never assert the map against itself.
 *
 *  (a) every ECM pin the map draws has a table entry; the map cavities carrying that ECM pin,
 *      their wire colors (per depicted connector half), PIN_COL/PIN_RAIL and the circuit path
 *      order match the table route
 *  (b) any gnd-rail circuit path ends at an FSM ground point, reached from one of that
 *      ground point's FSM feed cavities; ECM ground/power pins' paths equal the table exactly
 *  (c) every map card is either an FSM connector in the table (cavity ids subset of the FSM face,
 *      count = full face or = wired set) or a declared pseudo card
 * Pins/connectors marked status=pending are reported as SKIP with their reason.
 *
 *   node test/fsm_routes.mjs [index.html]
 */
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const HTML = process.argv[2] || path.join(ROOT, 'index.html');
const TABLE = JSON.parse(fs.readFileSync(path.join(__dirname, 'fsm_ecm_routes.json'), 'utf8'));

export function loadMap(htmlPath = HTML) {
  const html = fs.readFileSync(htmlPath, 'utf8');
  const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  const i = script.indexOf('const CONN_BASE = {');
  const j = script.indexOf('const CONN_FACE = {', i + 1);
  if (i < 0 || j < 0) throw new Error('CONN_BASE block not found');
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

const { CONN_BASE, PIN_COL, PIN_RAIL, early, rev } = loadMap();
const CIRCUITS = [...new Map([...early, ...rev].map((c) => [c.id, c])).values()];

let pass = 0, skip = 0;
const fails = [];
const ok = (name, cond, detail = '') => {
  if (cond) { pass++; return true; }
  fails.push(name + (detail ? ' — ' + detail : ''));
  console.log('  FAIL ' + name + (detail ? ' — ' + detail : ''));
  return false;
};
const skipped = (name, reason) => { skip++; console.log('  SKIP ' + name + ' — ' + reason); };

const K = (cid, cav) => `${cid}·${cav}`;
const conns = TABLE.connectors;
const half = (mapId) => (conns[mapId] && conns[mapId].half) || null;
const stepColor = (s) => (s.col && s.map && half(s.map) && s.col[half(s.map)]) || null;
const pinOf = (cid, cav) => ((CONN_BASE[cid] && CONN_BASE[cid].pins) || []).find((p) => String(p.id) === String(cav));
const groundKey = (g) => (TABLE.ground_points[g] && TABLE.ground_points[g].map ? K(TABLE.ground_points[g].map, 'ring') : null);
const GROUND_RINGS = new Map(Object.entries(TABLE.ground_points).filter(([, g]) => g.map).map(([n, g]) => [K(g.map, 'ring'), n]));
const pathKeys = (cir) => Object.entries(cir.path || {}).flatMap(([cid, cavs]) => (cavs || []).map((c) => K(cid, c)));
const pathStepRail = (cid, cav) => {
  const p = pinOf(cid, cav);
  if (!p) return null;
  if (p.rail) return p.rail;
  if (p.ecm != null && p.ecm !== '' && PIN_RAIL[Number(p.ecm)]) return PIN_RAIL[Number(p.ecm)];
  return null;
};
const circuitPathRail = (cir) => {
  if (cir.pathRail) return cir.pathRail;
  const rails = new Set(pathKeys(cir).map((k) => { const [cid, cav] = k.split('·'); return pathStepRail(cid, cav); }).filter(Boolean));
  return rails.has('12v') ? '12v' : rails.has('5v') ? '5v' : rails.has('gnd') ? 'gnd' : 'sig';
};
// map_cav: map label where the FSM publishes no cavity number (cav null), e.g. F242 S/G (EC-123)
const MC = (s) => (s.cav == null && s.map_cav ? s.map_cav : s.cav);
const branchKeys = (b) => {
  const ks = b.route.filter((s) => s.map).map((s) => K(s.map, MC(s)));
  if (b.end.type === 'device' && b.end.map) ks.push(K(b.end.map, MC(b.end)));
  if (b.end.type === 'ground' && groundKey(b.end.point)) ks.push(groundKey(b.end.point));
  if (b.end.type === 'source' && b.end.map) ks.push(K(b.end.map, b.end.cav));
  return ks;
};
const sameSeq = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

// ---------------------------------------------------------------- (a) pin routes
console.log('(a) ECM pin routes vs FSM table');
// every ECM pin the map draws: PIN_COL keys + ECM pins on cards + circuit ECM lists (a pin with an unpublished colour has no PIN_COL entry)
const mapPins = [...new Set([
  ...Object.keys(PIN_COL).map(Number),
  ...Object.entries(CONN_BASE).filter(([cid]) => !TABLE.pseudo_cards[cid]).flatMap(([, c]) => (c.pins || []).filter((p) => p.ecm != null && p.ecm !== '').map((p) => Number(p.ecm))),
  ...CIRCUITS.flatMap((c) => (c.ecm || []).map(Number)),
])].filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
let verifiedPins = 0; const pendingPins = [];
for (const p of mapPins) {
  const e = TABLE.pins[String(p)];
  if (!ok(`ECM ${p} has an FSM table entry`, !!e, 'add it to test/fsm_ecm_routes.json with EC/PG citation')) continue;
  ok(`ECM ${p} entry cites an EC page`, (e.cite && e.cite.ec || []).some((c) => /^EC-\d+$/.test(c)));
  if (e.status === 'pending') { pendingPins.push(p); skipped(`ECM ${p} route`, e.reason); continue; }
  verifiedPins++;
  // expected cavities
  const expected = new Map(); const optional = new Set();
  const addExp = (k, col) => { if (!expected.has(k)) expected.set(k, new Set()); if (col) expected.get(k).add(col); };
  for (const b of e.branches) {
    for (const s of b.route) if (s.map) addExp(K(s.map, MC(s)), stepColor(s));
    if (b.end.type === 'device' && b.end.map) addExp(K(b.end.map, MC(b.end)), b.end.col);
    if (b.end.type === 'source' && b.end.map) optional.add(K(b.end.map, b.end.cav));
  }
  const actual = new Map();
  for (const [cid, c] of Object.entries(CONN_BASE)) {
    if (TABLE.pseudo_cards[cid]) continue; // declared non-FSM cards (ECM excerpt, feed notes) are not route cavities
    for (const pin of c.pins || []) {
      if (pin.ecm != null && pin.ecm !== '' && Number(pin.ecm) === p) actual.set(K(cid, pin.id), pin.code || null);
    }
  }
  for (const k of expected.keys()) ok(`ECM ${p}: map carries FSM route cavity ${k}`, actual.has(k), `cite ${e.cite.ec.join('/')}`);
  for (const k of actual.keys()) if (!expected.has(k) && !optional.has(k)) ok(`ECM ${p}: map cavity ${k} is on the FSM route`, false, `not in FSM table (cite ${e.cite.ec.join('/')})`);
  if (e.color_pending) skipped(`ECM ${p} wire colors`, e.color_pending);
  else {
    ok(`ECM ${p}: PIN_COL ${PIN_COL[p]} = FSM ${e.color}`, PIN_COL[p] === e.color, `cite ${e.cite.ec.join('/')}`);
    for (const [k, cols] of expected) {
      if (!actual.has(k) || !cols.size) continue;
      const code = actual.get(k);
      if (!code || code === '—') continue;
      ok(`ECM ${p}: ${k} color ${code} = FSM ${[...cols].join(' or ')}`, cols.has(code), `half ${half(k.split('·')[0])}, cite ${e.cite.ec.join('/')}`);
    }
  }
  // applicability: Rev-Up-only pins have no circuit on the early (non-Rev-Up) model; revup+mt circuits are also M/T-only
  if (e.applies === 'revup' || e.applies === 'revup+mt') {
    const earlyC = early.filter((c) => (c.ecm || []).map(Number).includes(p));
    const revC = rev.filter((c) => (c.ecm || []).map(Number).includes(p));
    ok(`ECM ${p} (${e.applies}): no circuit on the non-Rev-Up model`, earlyC.length === 0, earlyC.map((c) => c.id).join(','));
    ok(`ECM ${p} (${e.applies}): drawn on the Rev-Up model`, revC.length > 0);
    if (e.applies === 'revup+mt') ok(`ECM ${p} (revup+mt): every circuit is M/T-only (trans:'mt')`, revC.every((c) => c.trans === 'mt'), revC.map((c) => `${c.id}:${c.trans || 'all'}`).join(','));
  }
  // rail class
  const mapRail = PIN_RAIL[p] || null;
  const fsmRail = ['gnd', '5v', '12v'].includes(e.rail) ? e.rail : null;
  ok(`ECM ${p}: PIN_RAIL ${mapRail || 'sig'} = FSM ${e.rail}`, mapRail === fsmRail);
  // order along circuit paths
  const branchSeqs = e.branches.map(branchKeys);
  for (const cir of CIRCUITS) {
    if (!(cir.ecm || []).map(Number).includes(p) || !cir.path) continue;
    const seq = pathKeys(cir);
    const matched = branchSeqs.some((bk) => {
      const f = seq.filter((k) => bk.includes(k));
      if (f.length < 2) return true;
      const want = bk.filter((k) => f.includes(k));
      return sameSeq(f, want) || sameSeq(f, [...want].reverse());
    });
    ok(`ECM ${p}: circuit ${cir.id} path order follows FSM`, matched, seq.join(' → '));
  }
  // ECM ground / power pins: their own circuit path must be exactly route + end
  if (e.rail === 'gnd' && !e.sensor_return || e.rail === '12v') {
    const own = CIRCUITS.filter((c) => (c.ecm || []).length === 1 && Number(c.ecm[0]) === p && c.path);
    ok(`ECM ${p}: has a circuit with a path`, own.length > 0);
    for (const cir of own) {
      const seq = pathKeys(cir);
      const good = branchSeqs.some((bk) => sameSeq(seq, bk) || sameSeq(seq, [...bk].reverse())
        || (e.branches.some((b) => b.end.type === 'source') && (sameSeq(seq, bk.slice(0, -1)) || sameSeq(seq, bk.slice(0, -1).reverse()))));
      ok(`ECM ${p}: circuit ${cir.id} path = FSM ${branchSeqs.map((b) => b.join(' → ')).join(' | ')}`, good, 'map: ' + seq.join(' → '));
    }
  }
}

// ---------------------------------------------------------------- (b) grounds
console.log('(b) gnd-rail paths end at an FSM ground point');
const feedKeys = new Map(Object.entries(TABLE.ground_points).map(([n, g]) => [n, new Set((g.feeds || []).filter((s) => s.map).map((s) => K(s.map, s.cav)))]));
for (const cir of CIRCUITS) {
  if (!cir.path) continue;
  const seq = pathKeys(cir);
  if (!seq.length) continue;
  const rail = circuitPathRail(cir);
  for (let i = 0; i < seq.length; i++) {
    const g = GROUND_RINGS.get(seq[i]);
    if (!g) continue;
    const nb = [seq[i - 1], seq[i + 1]].filter(Boolean);
    ok(`circuit ${cir.id}: ground ${g} reached from an FSM feed (${[...feedKeys.get(g)].join(', ')})`,
      nb.some((k) => feedKeys.get(g).has(k)), 'map: ' + seq.join(' → ') + ` (cite ${TABLE.ground_points[g].cite.join('/')})`);
  }
  if (rail !== 'gnd') continue;
  const ends = [seq[0], seq[seq.length - 1]];
  ok(`circuit ${cir.id}: gnd path ends at an FSM ground point`, ends.some((k) => GROUND_RINGS.has(k)), 'map: ' + seq.join(' → '));
}
for (const [cid, c] of Object.entries(CONN_BASE)) for (const pin of c.pins || []) {
  if (pin.ecm == null || pin.ecm === '') continue;
  const e = TABLE.pins[String(pin.ecm)];
  if (!e || e.status === 'pending' || e.rail !== 'gnd' || e.sensor_return) continue;
  const gp = e.branches.map((b) => b.end.point).filter(Boolean);
  ok(`ECM ${pin.ecm} ground ends at FSM ${gp.join('/')}`, gp.length > 0 && gp.every((g) => TABLE.ground_points[g]));
}

// ---------------------------------------------------------------- (c) connector faces
console.log('(c) connector cavity ids vs FSM faces');
for (const [cid, c] of Object.entries(CONN_BASE)) {
  const ids = (c.pins || []).map((p) => String(p.id));
  const reg = conns[cid];
  if (!reg) {
    ok(`${cid}: registered in FSM table (connectors or pseudo_cards)`, !!TABLE.pseudo_cards[cid], 'add it to test/fsm_ecm_routes.json');
    continue;
  }
  if (reg.status === 'pending') { skipped(`${cid} face`, reg.reason); continue; }
  const fsm = new Set(reg.cav.map(String));
  const bad = ids.filter((x) => !fsm.has(x));
  ok(`${cid} (${reg.fsm}): cavity ids ⊆ FSM face`, bad.length === 0, `not on FSM face: ${bad.join(',')} (FSM ${reg.cav[0]}…${reg.cav[reg.cav.length - 1]}, cite ${reg.cite.join('/')})`);
  const uniq = new Set(ids);
  ok(`${cid}: no duplicate cavity ids`, uniq.size === ids.length);
  const wired = reg.wired ? new Set(reg.wired.map(String)) : null;
  const countOk = uniq.size === fsm.size || (wired && uniq.size === wired.size && [...wired].every((x) => uniq.has(x)));
  ok(`${cid} (${reg.fsm}): cavity count ${uniq.size} = FSM ${fsm.size}${wired ? ' or wired ' + wired.size : ''}`, countOk, `map: ${ids.join(',')}`);
}
for (const cid of Object.keys(conns)) ok(`table connector ${cid} exists on the map`, !!CONN_BASE[cid]);
for (const cid of Object.keys(TABLE.pseudo_cards)) ok(`pseudo card ${cid} exists on the map`, !!CONN_BASE[cid]);

console.log(`---\nfsm_routes: ${pass} passed, ${fails.length} failed, ${skip} skipped · pins verified ${verifiedPins}/${mapPins.length}, pending [${pendingPins.join(', ')}]`);
if (fails.length) { console.log('FAILED:\n' + fails.join('\n')); process.exit(1); }
console.log('FSM ROUTES OK');
