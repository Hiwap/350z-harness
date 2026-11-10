/* FSM expected values for connector cards.
   Source of truth: 2005 Coupe FSM only. Do not invent values.
   Each entry: {pins, src, es:{value,cond}, en:{value,cond}, ja:{value,cond}}
   No published value: SM_NONE (explicit "Sin dato en el SM" / translations). */
(function (global) {
  'use strict';

  function sm(pins, src, esV, esC, enV, enC, jaV, jaC) {
    return {
      pins: pins,
      src: src,
      es: { value: esV, cond: esC },
      en: { value: enV, cond: enC },
      ja: { value: jaV, cond: jaC }
    };
  }

  const SM_NONE = {
    none: true,
    es: { value: 'Sin dato en el SM', cond: '' },
    en: { value: 'No value in the SM', cond: '' },
    ja: { value: 'SMに規定値なし', cond: '' }
  };

  const SM_VALUES = {
    /* —— First batch: APP, TP/ETC F31, MAF (+ IAT) —— */
    app: [
      sm(
        'E113·5 / ECM 106',
        'EC-670',
        'Suelto: 0.5 - 1.0 V. A fondo: 3.9 - 4.7 V',
        'Contacto ON. Medir entre el terminal 106 del ECM (señal APP1) y masa.',
        'Fully released: 0.5 - 1.0 V. Fully depressed: 3.9 - 4.7 V',
        'Ignition switch: ON. Check voltage between ECM terminal 106 (APP sensor 1 signal) and ground.',
        '全閉（離した状態）: 0.5 - 1.0 V。全開（踏み込んだ状態）: 3.9 - 4.7 V',
        'イグニッションON。ECM端子106（APPセンサ1信号）とアース間を測定。'
      ),
      sm(
        'E113·2 / ECM 98',
        'EC-670',
        'Suelto: 0.15 - 0.60 V. A fondo: 1.95 - 2.40 V',
        'Contacto ON. Medir entre el terminal 98 del ECM (señal APP2) y masa.',
        'Fully released: 0.15 - 0.60 V. Fully depressed: 1.95 - 2.40 V',
        'Ignition switch: ON. Check voltage between ECM terminal 98 (APP sensor 2 signal) and ground.',
        '全閉（離した状態）: 0.15 - 0.60 V。全開（踏み込んだ状態）: 1.95 - 2.40 V',
        'イグニッションON。ECM端子98（APPセンサ2信号）とアース間を測定。'
      ),
      sm(
        'E113·6 / ECM 90',
        'EC-132',
        'Aproximadamente 5 V',
        'Contacto ON. Alimentación del sensor APP1 (tabla de terminales del ECM).',
        'Approximately 5 V',
        'Ignition switch: ON. APP sensor 1 power supply (ECM terminal table).',
        '約5 V',
        'イグニッションON。APPセンサ1電源（ECM端子表）。'
      ),
      sm(
        'E113·4 / ECM 91',
        'EC-132',
        'Aproximadamente 5 V',
        'Contacto ON. Alimentación del sensor APP2 (tabla de terminales del ECM).',
        'Approximately 5 V',
        'Ignition switch: ON. APP sensor 2 power supply (ECM terminal table).',
        '約5 V',
        'イグニッションON。APPセンサ2電源（ECM端子表）。'
      )
    ],
    etc: [
      sm(
        'F31·4 / ECM 50',
        'EC-240',
        'Pedal suelto: más de 0.36 V. Pedal a fondo: menos de 4.75 V',
        'Contacto ON, motor parado, palanca en D (A/T) o 1.ª (M/T). Antes, hacer el aprendizaje de válvula de mariposa cerrada (EC-91). Medir entre el terminal 50 del ECM (TPS1) y masa.',
        'Accelerator pedal fully released: more than 0.36 V. Fully depressed: less than 4.75 V',
        'Ignition switch: ON, engine stopped, shift lever in D (A/T) or 1st (M/T). Perform Throttle Valve Closed Position Learning (EC-91) first. Check voltage between ECM terminal 50 (TP sensor 1) and ground.',
        'アクセル全閉: 0.36 V超。全開: 4.75 V未満',
        'イグニッションON、エンジン停止、シフトはD（A/T）または1速（M/T）。先にスロットルバルブ全閉位置学習（EC-91）を行う。ECM端子50（TPセンサ1）とアース間を測定。'
      ),
      sm(
        'F31·2 / ECM 69',
        'EC-240',
        'Pedal suelto: menos de 4.75 V. Pedal a fondo: más de 0.36 V',
        'Contacto ON, motor parado, palanca en D (A/T) o 1.ª (M/T). Antes, hacer el aprendizaje de válvula de mariposa cerrada (EC-91). Medir entre el terminal 69 del ECM (TPS2) y masa.',
        'Accelerator pedal fully released: less than 4.75 V. Fully depressed: more than 0.36 V',
        'Ignition switch: ON, engine stopped, shift lever in D (A/T) or 1st (M/T). Perform Throttle Valve Closed Position Learning (EC-91) first. Check voltage between ECM terminal 69 (TP sensor 2) and ground.',
        'アクセル全閉: 4.75 V未満。全開: 0.36 V超',
        'イグニッションON、エンジン停止、シフトはD（A/T）または1速（M/T）。先にスロットルバルブ全閉位置学習（EC-91）を行う。ECM端子69（TPセンサ2）とアース間を測定。'
      ),
      sm(
        'F31·1 / ECM 47',
        'EC-129',
        'Aproximadamente 5 V',
        'Contacto ON. Alimentación del sensor de posición de la mariposa (tabla de terminales del ECM).',
        'Approximately 5 V',
        'Ignition switch: ON. Throttle position sensor power supply (ECM terminal table).',
        '約5 V',
        'イグニッションON。スロットルポジションセンサ電源（ECM端子表）。'
      ),
      sm(
        'F31·3 y F31·6 (motor)',
        'EC-469',
        'Aproximadamente 1 - 15 Ω [a 25 °C (77 °F)]',
        'Contacto OFF. Conector del actuador desconectado. Medir la resistencia entre los terminales 3 y 6.',
        'Approximately 1 - 15 Ω [at 25 °C (77 °F)]',
        'Ignition switch OFF. Electric throttle control actuator harness connector disconnected. Check resistance between terminals 3 and 6.',
        '約1 - 15 Ω［25 °C（77 °F）］',
        'イグニッションOFF。電動スロットルアクチュエータのハーネスコネクターを外し、端子3と6の間の抵抗を測定。'
      )
    ],
    maf: [
      sm(
        'F25·2 (R/W)',
        'EC-210',
        'Tensión de batería',
        'Desconectar el conector del sensor MAF. Contacto ON. Medir la tensión entre el terminal 2 del sensor MAF y masa, con CONSULT-II o un polímetro. El 12 V (R/W) llega desde IPDM E7·18 por E12/F3·7 (el mismo que al CKP F10·1).',
        'Battery voltage',
        'Disconnect the mass air flow (MAF) sensor harness connector. Turn ignition switch ON. Check voltage between MAF sensor terminal 2 and ground with CONSULT-II or tester. The 12 V (R/W) comes from IPDM E7·18 through E12/F3·7 (the same feed as CKP F10·1).',
        'バッテリー電圧',
        'MAFセンサのハーネスコネクターを外す。イグニッションON。MAFセンサ端子2とアース間をCONSULT-IIまたはテスターで測定。12 V（R/W）はIPDM E7·18からE12/F3·7経由（CKP F10·1と同じ電源）。'
      ),
      sm(
        'F25·4 / ECM 51',
        'EC-212',
        'Contacto ON, motor parado: aprox. 0.4 V. Ralentí (motor caliente): 0.9 - 1.2 V. 2.500 rpm (motor caliente): 1.5 - 1.9 V. De ralentí a unos 4.000 rpm: 0.9 - 1.2 V hasta aprox. 2.4 V (subida lineal)',
        'Sin CONSULT-II. Motor ya caliente a temperatura normal de trabajo. Medir entre el terminal 51 del ECM (señal del MAF) y masa. Los mismos valores, con CONSULT-II (MAS A/F SE-B1), están en EC-211.',
        'Ignition switch ON (engine stopped.): Approx. 0.4 V. Idle (engine warmed-up to normal operating temperature.): 0.9 - 1.2 V. 2,500 rpm (engine warmed-up to normal operating temperature.): 1.5 - 1.9 V. Idle to about 4,000 rpm: 0.9 - 1.2 V to Approx. 2.4 V (linear voltage rise)',
        'Without CONSULT-II. Engine warmed up to normal operating temperature. Check voltage between ECM terminal 51 (mass air flow sensor signal) and ground. The same values, with CONSULT-II (MAS A/F SE-B1), are on EC-211.',
        'イグニッションON・エンジン停止: 約0.4 V。アイドル（暖機後）: 0.9 - 1.2 V。2,500 rpm（暖機後）: 1.5 - 1.9 V。アイドルから約4,000 rpm: 0.9 - 1.2 Vから約2.4 V（回転上昇に対して線形）',
        'CONSULT-IIなし。エンジンを通常の動作温度まで暖機。ECM端子51（マスエアフローセンサ信号）とアース間を測定。CONSULT-II（MAS A/F SE-B1）での同じ値はEC-211。'
      ),
      sm(
        'F25·5 y F25·6 (IAT)',
        'EC-226',
        'A 25 °C (77 °F): 1.800 - 2.200 kΩ',
        'Medir la resistencia entre los terminales 5 y 6 del sensor de caudal de aire (IAT integrado).',
        'At 25 °C (77 °F): 1.800 - 2.200 kΩ',
        'Check resistance between mass air flow sensor terminals 5 and 6.',
        '25 °C（77 °F）: 1.800 - 2.200 kΩ',
        'マスエアフローセンサの端子5と6の間の抵抗を測定（IAT一体）。'
      ),
      sm(
        'F25·5 / ECM 34',
        'EC-128',
        'Aproximadamente 0 - 4.8 V. La tensión de salida varía con la temperatura del aire de admisión',
        'Motor en marcha (tabla de terminales del ECM).',
        'Approximately 0 - 4.8 V. Output voltage varies with intake air temperature',
        'Engine is running (ECM terminal table).',
        '約0 - 4.8 V。出力電圧は吸入空気温度によって変化する',
        'エンジン回転中（ECM端子表）。'
      )
    ]
  };

  global.sm = sm;
  global.SM_NONE = SM_NONE;
  global.SM_VALUES = SM_VALUES;
})(typeof window !== 'undefined' ? window : globalThis);
