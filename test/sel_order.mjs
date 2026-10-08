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
if (failed) process.exit(1);
console.log('sel order ok');
