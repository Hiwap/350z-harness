/* Selected strip runs from the control module toward the sensor. */
import fs from 'fs';
import vm from 'vm';

const src = fs.readFileSync(new URL('../js/selection.js', import.meta.url), 'utf8');
const pin = (id, rail) => (rail ? { id, rail } : { id });
const ctx = {
  CONN: {
    f21_oilp: { sub: 'sensors', name: 'F21', pins: [pin('1'), pin('2'), pin('3')] },
    ix_f102_m72: { sub: 'intermedias', name: 'F102', pins: [pin('14H')] },
    triple_m44: { sub: 'ascd_dlc', name: 'M44', pins: [pin('9')] },
    bcm_m91: { sub: 'carroceria', name: 'BCM', pins: [pin('45')] },
    turn_e40: { sub: 'carroceria', name: 'E40', pins: [pin('2')] },
    turn_e24: { sub: 'carroceria', name: 'E24', pins: [pin('3')] },
    ix_e108_m15: { sub: 'intermedias', name: 'E108', pins: [pin('37G')] },
    gnd4: { sub: 'power', name: 'F103', pins: [pin('4', 'gnd')] },
    f152: { sub: 'power', name: 'F152', pins: [pin('ring', 'gnd')] },
    ckp: { sub: 'sensors', name: 'CKP', pins: [pin('3')] },
    ipdm_e7: { sub: 'ipdm', name: 'IPDM', pins: [pin('28')] },
    unified_m49: { sub: 'ascd_dlc', name: 'M49', pins: [pin('28')] },
    fuel_level_sub: { sub: 'carroceria', name: 'B28', pins: [pin('1')] },
    ix_b1_m12: { sub: 'intermedias', name: 'B1', pins: [pin('42J')] },
  },
  CIRCUITS: [
    { id: 'oilp_gauge', path: { f21_oilp: ['1'], ix_f102_m72: ['14H'], triple_m44: ['9'] }, conn: ['f21_oilp', 'ix_f102_m72', 'triple_m44'] },
    { id: 'turn_lh', path: { bcm_m91: ['45'], ix_e108_m15: ['37G'], turn_e40: ['2'] }, conn: ['bcm_m91', 'ix_e108_m15', 'turn_e40'] },
    { id: 'ckp_gnd', path: { ckp: ['3'], gnd4: ['3'], f152: ['ring'] }, conn: ['ckp', 'gnd4', 'f152'] },
    { id: 'headlamp_hi', path: { turn_e40: ['3'], turn_e24: ['3'], ipdm_e7: ['28'] }, conn: ['turn_e40', 'turn_e24', 'ipdm_e7'] },
    { id: 'fuel_level', path: { fuel_level_sub: ['1'], ix_b1_m12: ['42J'], unified_m49: ['28'] }, conn: ['fuel_level_sub', 'ix_b1_m12', 'unified_m49'] },
  ],
  lastCircIds: [],
};
vm.createContext(ctx);
vm.runInContext(src, ctx);

let failed = 0;
function check(name, circ, ids, expect) {
  ctx.lastCircIds = [circ];
  const got = ctx.selectionOrder(ids);
  if (got.join(',') !== expect.join(',')) {
    failed++;
    console.error('FAIL', name, 'got', got.join(' > '), 'want', expect.join(' > '));
  } else {
    console.log('ok', name, got.join(' > '));
  }
}
check('oil pressure: amp, joint, sensor', 'oilp_gauge', ['f21_oilp', 'triple_m44', 'ix_f102_m72'], ['triple_m44', 'ix_f102_m72', 'f21_oilp']);
check('turn: BCM stays ahead of the lamp', 'turn_lh', ['turn_e40', 'bcm_m91', 'ix_e108_m15'], ['bcm_m91', 'ix_e108_m15', 'turn_e40']);
check('ground point stays last', 'ckp_gnd', ['f152', 'ckp', 'gnd4'], ['ckp', 'gnd4', 'f152']);
check('high beam: IPDM ahead of the lamps', 'headlamp_hi', ['turn_e40', 'turn_e24', 'ipdm_e7'], ['ipdm_e7', 'turn_e24', 'turn_e40']);
check('fuel level: meter, joint, sensor', 'fuel_level', ['fuel_level_sub', 'ix_b1_m12', 'unified_m49'], ['unified_m49', 'ix_b1_m12', 'fuel_level_sub']);

/* Every real circuit of both models: grounds last; a control module card comes first; on an ECM circuit
   (the ECM grid is not a card) no device card sits ahead of a joint. Input order is shuffled. */
{
  const { loadMap } = await import('./load_map.mjs');
  const map = loadMap(new URL('../index.html', import.meta.url).pathname);
  for (const model of ['early', 'rev']) {
    const circs = map[model];
    const real = { CONN: map.CONN_BASE, CIRCUITS: circs, lastCircIds: [] };
    vm.createContext(real);
    vm.runInContext(src, real);
    const source = (id) => ['fuses', 'feeds'].includes((map.CONN_BASE[id] || {}).sub);
    const kind = (id) => real.isSelGround(id) ? 'G' : real.isSelControl(id) ? 'C' : real.isSelJoint(id) ? 'J' : source(id) ? 'S' : 'D';
    if (model === 'early') {
      const want = (name, circ, ids, expect) => {
        real.lastCircIds = [circ];
        const got = real.selectionOrder(ids).join(' > ');
        if (got !== expect.join(' > ')) { failed++; console.error('FAIL', name, 'got', got, 'want', expect.join(' > ')); } else console.log('ok', name, got);
      };
      /* past mistakes: ECM circuits drawn sensor-first, and a BCM return drawn after the lamp */
      want('ECM pedal circuit drawn sensor-first: joint next to the ECM first', 'app1_sig', ['app', 'ix_e11_f2'], ['ix_e11_f2', 'app']);
      want('EVAP vent: F102 side first, tail joint, then the valve', 'evap_vent', ['evap_vent', 'ix_t2_b44', 'ix_b1_m12'], ['ix_b1_m12', 'ix_t2_b44', 'evap_vent']);
      want('luggage lamp: BCM B83 first, back along the return to the lamp, then the feed joints', 'luggage_lamp', ['ix_b1_m12', 'ix_t2_b44', 'lug_t13', 'ix_b43_t1', 'bcm_b83'], ['bcm_b83', 'ix_b43_t1', 'lug_t13', 'ix_t2_b44', 'ix_b1_m12']);
    }
    const bad = [];
    for (const c of circs) {
      const ids = [...new Set([...Object.keys(c.path || {}), ...(c.conn || [])])].filter((id) => map.CONN_BASE[id]);
      if (ids.length < 2) continue;
      real.lastCircIds = [c.id];
      for (const input of [ids.slice().reverse(), ids.slice(1).concat(ids[0])]) {
        const out = real.selectionOrder(input);
        const ks = out.map(kind).join('');
        const fromEcm = !!(c.ecm && c.ecm.length);
        const why = [];
        if (/G[^G]/.test(ks)) why.push('ground point not last');
        if (ks.includes('C') && ks[0] !== 'C' && !(fromEcm && ks[0] === 'J')) why.push('control module not first');
        if (!ks.includes('C') && fromEcm && /D.*J/.test(ks)) why.push('device ahead of a joint on an ECM circuit');
        if (why.length) { bad.push(`${model}:${c.id} ${out.join(' > ')} (${why.join(', ')})`); break; }
      }
    }
    if (bad.length) { failed++; console.error('FAIL every circuit runs from the module toward the sensor (' + model + '):\n  ' + bad.join('\n  ')); }
    else console.log('ok every', model, 'circuit runs from the module toward the sensor');
  }
}
if (failed) process.exit(1);
console.log('sel order ok');
