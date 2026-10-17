#!/usr/bin/env node
/**
 * Maintainer corrections, enforced on the loaded data (no page sentences matched).
 * Each block names the rule it guards; AGENTS.md points here. Run: node test/rules.mjs
 */
import fs from 'fs';
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

if (failed) { console.error(`rules.mjs: ${failed} failed`); process.exit(1); }
console.log('rules.mjs: all passed');
