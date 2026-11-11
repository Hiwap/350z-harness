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


  function coilEntries(cav, ecm, tableSrc) {
    return [
      sm(
        cav + '·1 / ECM ' + ecm,
        tableSrc,
        'Ralentí (motor caliente): 0 - 0.2 V. A 2.500 rpm (motor caliente): 0.1 - 0.4 V. El ciclo del pulso cambia con el régimen.',
        'Motor en marcha. Medir entre el terminal del ECM y masa (tabla de terminales). Señal de pulso; el pulso real se confirma con osciloscopio.',
        'Idle (warm-up condition): 0 - 0.2 V. 2,500 rpm (warm-up condition): 0.1 - 0.4 V. The pulse cycle changes depending on rpm.',
        'Engine is running. Check voltage between the ECM terminal and ground (ECM terminal table). Pulse signal; actual pulse can be confirmed by oscilloscope.',
        'アイドル（暖機後）: 0 - 0.2 V。2,500 rpm（暖機後）: 0.1 - 0.4 V。パルス周期は回転数によって変化する。',
        'エンジン回転中。ECM端子とアース間を測定（ECM端子表）。パルス信号。実際のパルスはオシロスコープで確認できる。'
      ),
      sm(
        cav + '·1–2, ' + cav + '·1–3 y ' + cav + '·2–3',
        'EC-699',
        'Entre 1 y 2: distinto de 0 y de ∞. Entre 1 y 3, y entre 2 y 3: distinto de 0. [a 25 °C (77 °F)]',
        'Contacto OFF. Conector de la bobina desconectado. Medir la resistencia entre los terminales.',
        'Between 1 and 2: Except 0 or ∞. Between 1 and 3, and between 2 and 3: Except 0. [at 25 °C (77 °F)]',
        'Ignition switch OFF. Ignition coil harness connector disconnected. Check resistance between the terminals.',
        '1と2の間: 0または∞を除く。1と3、および2と3の間: 0を除く。［25 °C（77 °F）］',
        'イグニッションOFF。イグニッションコイルのハーネスコネクターを外し、端子間の抵抗を測定。'
      )
    ];
  }

  function injEntries(cav, ecm, tableSrc) {
    return [
      sm(
        cav + '·2 / ECM ' + ecm,
        tableSrc,
        'Tensión de batería (11 - 14 V) a ralentí (motor caliente) y a 2.000 rpm (motor caliente). El ciclo del pulso cambia con el régimen.',
        'Motor en marcha. Medir entre el terminal del ECM y masa (tabla de terminales). Señal de pulso; el pulso real se confirma con osciloscopio.',
        'BATTERY VOLTAGE (11 - 14 V) at idle (warm-up condition) and at 2,000 rpm (warm-up condition). The pulse cycle changes depending on rpm.',
        'Engine is running. Check voltage between the ECM terminal and ground (ECM terminal table). Pulse signal; actual pulse can be confirmed by oscilloscope.',
        'バッテリー電圧（11 - 14 V）。アイドル（暖機後）および2,000 rpm（暖機後）。パルス周期は回転数によって変化する。',
        'エンジン回転中。ECM端子とアース間を測定（ECM端子表）。パルス信号。実際のパルスはオシロスコープで確認できる。'
      ),
      sm(
        cav + ' (entre terminales)',
        'EC-708',
        '11.1 - 14.5 Ω [a 10 - 60 °C (50 - 140 °F)]',
        'Conector del inyector desconectado. Medir la resistencia entre los terminales.',
        '11.1 - 14.5 Ω [at 10 - 60 °C (50 - 140 °F)]',
        'Injector harness connector disconnected. Check resistance between terminals.',
        '11.1 - 14.5 Ω［10 - 60 °C（50 - 140 °F）］',
        'インジェクターのハーネスコネクターを外し、端子間の抵抗を測定。'
      )
    ];
  }

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
    ],

    /* —— Position sensors —— */
    ckp: [
      sm(
        'F10·1 (R/W)',
        'EC-326',
        'Tensión de batería',
        'Desconectar el conector del sensor CKP (POS). Contacto ON. Medir la tensión entre el terminal 1 del sensor CKP y masa, con CONSULT-II o un polímetro. El 12 V (R/W) llega desde IPDM E7·18 por E12/F3·7 (el mismo que al MAF F25·2).',
        'Battery voltage',
        'Disconnect the crankshaft position (CKP) sensor (POS) harness connector. Turn ignition switch ON. Check voltage between CKP sensor (POS) terminal 1 and ground with CONSULT-II or tester. The 12 V (R/W) comes from IPDM E7·18 through E12/F3·7 (the same feed as MAF F25·2).',
        'バッテリー電圧',
        'クランクシャフトポジション（CKP）センサ（POS）のハーネスコネクターを外す。イグニッションON。CKPセンサ（POS）端子1とアース間をCONSULT-IIまたはテスターで測定。12 V（R/W）はIPDM E7·18からE12/F3·7経由（MAF F25·2と同じ電源）。'
      ),
      sm(
        'F10·2 / ECM 13',
        'EC-126',
        'Ralentí (motor caliente): aprox. 1.6 V. A 2.000 rpm: aprox. 1.4 V. El ciclo del pulso cambia con el régimen.',
        'Motor en marcha, condición de calentamiento. Medir entre el terminal 13 del ECM (CKP POS) y masa (tabla de terminales). Señal de pulso; el pulso real se confirma con osciloscopio.',
        'Idle (warm-up condition): Approximately 1.6 V. Engine speed 2,000 rpm: Approximately 1.4 V. The pulse cycle changes depending on rpm.',
        'Engine is running, warm-up condition. Check voltage between ECM terminal 13 (CKP POS) and ground (ECM terminal table). Pulse signal; actual pulse can be confirmed by oscilloscope.',
        'アイドル（暖機後）: 約1.6 V。2,000 rpm: 約1.4 V。パルス周期は回転数によって変化する。',
        'エンジン回転中、暖機状態。ECM端子13（CKP POS）とアース間を測定（ECM端子表）。パルス信号。実際のパルスはオシロスコープで確認できる。'
      ),
      sm(
        'F10·1–2, F10·1–3 y F10·2–3',
        'EC-328',
        'Distinto de 0 y de ∞ [a 25 °C (77 °F)]',
        'Contacto OFF. Aflojar el tornillo del sensor, desconectar el conector y retirar el sensor. Medir la resistencia entre 1 (+) y 2 (−), 1 (+) y 3 (−), y 2 (+) y 3 (−).',
        'Except 0 or ∞ [at 25 °C (77 °F)]',
        'Ignition switch OFF. Loosen the sensor fixing bolt, disconnect the harness connector and remove the sensor. Check resistance between 1 (+) and 2 (−), 1 (+) and 3 (−), and 2 (+) and 3 (−).',
        '0または∞を除く［25 °C（77 °F）］',
        'イグニッションOFF。センサの固定ボルトを緩め、ハーネスコネクターを外してセンサを取り外す。1（+）-2（−）、1（+）-3（−）、2（+）-3（−）の抵抗を測定。'
      )
    ],
    cmp_b1: [
      sm(
        'F4·2 / ECM 33',
        'EC-128',
        'Ralentí (motor caliente): 1.0 - 4.0 V. A 2.000 rpm: 1.0 - 4.0 V. El ciclo del pulso cambia con el régimen.',
        'Motor en marcha, condición de calentamiento. Medir entre el terminal 33 del ECM (CMP PHASE banco 1) y masa (tabla de terminales). Señal de pulso; el pulso real se confirma con osciloscopio.',
        'Idle (warm-up condition): 1.0 - 4.0 V. Engine speed 2,000 rpm: 1.0 - 4.0 V. The pulse cycle changes depending on rpm.',
        'Engine is running, warm-up condition. Check voltage between ECM terminal 33 (CMP PHASE bank 1) and ground (ECM terminal table). Pulse signal; actual pulse can be confirmed by oscilloscope.',
        'アイドル（暖機後）: 1.0 - 4.0 V。2,000 rpm: 1.0 - 4.0 V。パルス周期は回転数によって変化する。',
        'エンジン回転中、暖機状態。ECM端子33（CMP PHASE バンク1）とアース間を測定（ECM端子表）。パルス信号。実際のパルスはオシロスコープで確認できる。'
      ),
      sm(
        'F4·1–2, F4·1–3 y F4·2–3',
        'EC-338',
        'Distinto de 0 y de ∞ [a 25 °C (77 °F)]',
        'Aflojar el tornillo del sensor, desconectar el conector y retirar el sensor. Medir la resistencia entre 1 (+) y 2 (−), 1 (+) y 3 (−), y 2 (+) y 3 (−).',
        'Except 0 or ∞ [at 25 °C (77 °F)]',
        'Loosen the sensor fixing bolt, disconnect the harness connector and remove the sensor. Check resistance between 1 (+) and 2 (−), 1 (+) and 3 (−), and 2 (+) and 3 (−).',
        '0または∞を除く［25 °C（77 °F）］',
        'センサの固定ボルトを緩め、ハーネスコネクターを外してセンサを取り外す。1（+）-2（−）、1（+）-3（−）、2（+）-3（−）の抵抗を測定。'
      )
    ],
    cmp_b2: [
      sm(
        'F32·2 / ECM 14',
        'EC-127',
        'Ralentí (motor caliente): 1.0 - 4.0 V. A 2.000 rpm: 1.0 - 4.0 V. El ciclo del pulso cambia con el régimen.',
        'Motor en marcha, condición de calentamiento. Medir entre el terminal 14 del ECM (CMP PHASE banco 2) y masa (tabla de terminales). Señal de pulso; el pulso real se confirma con osciloscopio.',
        'Idle (warm-up condition): 1.0 - 4.0 V. Engine speed 2,000 rpm: 1.0 - 4.0 V. The pulse cycle changes depending on rpm.',
        'Engine is running, warm-up condition. Check voltage between ECM terminal 14 (CMP PHASE bank 2) and ground (ECM terminal table). Pulse signal; actual pulse can be confirmed by oscilloscope.',
        'アイドル（暖機後）: 1.0 - 4.0 V。2,000 rpm: 1.0 - 4.0 V。パルス周期は回転数によって変化する。',
        'エンジン回転中、暖機状態。ECM端子14（CMP PHASE バンク2）とアース間を測定（ECM端子表）。パルス信号。実際のパルスはオシロスコープで確認できる。'
      ),
      sm(
        'F32·1–2, F32·1–3 y F32·2–3',
        'EC-338',
        'Distinto de 0 y de ∞ [a 25 °C (77 °F)]',
        'Aflojar el tornillo del sensor, desconectar el conector y retirar el sensor. Medir la resistencia entre 1 (+) y 2 (−), 1 (+) y 3 (−), y 2 (+) y 3 (−).',
        'Except 0 or ∞ [at 25 °C (77 °F)]',
        'Loosen the sensor fixing bolt, disconnect the harness connector and remove the sensor. Check resistance between 1 (+) and 2 (−), 1 (+) and 3 (−), and 2 (+) and 3 (−).',
        '0または∞を除く［25 °C（77 °F）］',
        'センサの固定ボルトを緩め、ハーネスコネクターを外してセンサを取り外す。1（+）-2（−）、1（+）-3（−）、2（+）-3（−）の抵抗を測定。'
      )
    ],
    f38_evtc_b1: [
      sm(
        'F38·2 / ECM 53',
        'EC-130',
        'Ralentí: 0 - 1.0 V. A 2.000 rpm: 0 - 1.0 V. El ciclo del pulso cambia con el régimen.',
        'Solo 35th Anniversary (Rev-Up). Motor en marcha. Medir entre el terminal 53 del ECM (sensor de posición EVT banco 1) y masa (tabla de terminales). Señal de pulso; el pulso real se confirma con osciloscopio.',
        'Idle speed: 0 - 1.0 V. Engine speed 2,000 rpm: 0 - 1.0 V. The pulse cycle changes depending on rpm.',
        'For 35th Anniversary (Rev-Up) only. Engine is running. Check voltage between ECM terminal 53 (EVT control position sensor bank 1) and ground (ECM terminal table). Pulse signal; actual pulse can be confirmed by oscilloscope.',
        'アイドル: 0 - 1.0 V。2,000 rpm: 0 - 1.0 V。パルス周期は回転数によって変化する。',
        '35周年記念車（Rev-Up）のみ。エンジン回転中。ECM端子53（EVTコントロールポジションセンサ バンク1）とアース間を測定（ECM端子表）。パルス信号。実際のパルスはオシロスコープで確認できる。'
      ),
      sm(
        'F38·3–1, F38·2–1 y F38·3–2',
        'EC-453',
        'Distinto de 0 y de ∞ [a 25 °C (77 °F)]',
        'Solo 35th Anniversary (Rev-Up). Desconectar el conector, aflojar el tornillo y retirar el sensor. Medir la resistencia entre 3 (+) y 1 (−), 2 (+) y 1 (−), y 3 (+) y 2 (−).',
        'Except 0 or ∞ [at 25 °C (77 °F)]',
        'For 35th Anniversary (Rev-Up) only. Disconnect the harness connector, loosen the fixing bolt and remove the sensor. Check resistance between 3 (+) and 1 (−), 2 (+) and 1 (−), and 3 (+) and 2 (−).',
        '0または∞を除く［25 °C（77 °F）］',
        '35周年記念車（Rev-Up）のみ。ハーネスコネクターを外し、固定ボルトを緩めてセンサを取り外す。3（+）-1（−）、2（+）-1（−）、3（+）-2（−）の抵抗を測定。'
      )
    ],
    f42_evtc_b2: [
      sm(
        'F42·2 / ECM 72',
        'EC-131',
        'Ralentí: 0 - 1.0 V. A 2.000 rpm: 0 - 1.0 V. El ciclo del pulso cambia con el régimen.',
        'Solo 35th Anniversary (Rev-Up). Motor en marcha. Medir entre el terminal 72 del ECM (sensor de posición EVT banco 2) y masa (tabla de terminales). Señal de pulso; el pulso real se confirma con osciloscopio.',
        'Idle speed: 0 - 1.0 V. Engine speed 2,000 rpm: 0 - 1.0 V. The pulse cycle changes depending on rpm.',
        'For 35th Anniversary (Rev-Up) only. Engine is running. Check voltage between ECM terminal 72 (EVT control position sensor bank 2) and ground (ECM terminal table). Pulse signal; actual pulse can be confirmed by oscilloscope.',
        'アイドル: 0 - 1.0 V。2,000 rpm: 0 - 1.0 V。パルス周期は回転数によって変化する。',
        '35周年記念車（Rev-Up）のみ。エンジン回転中。ECM端子72（EVTコントロールポジションセンサ バンク2）とアース間を測定（ECM端子表）。パルス信号。実際のパルスはオシロスコープで確認できる。'
      ),
      sm(
        'F42·3–1, F42·2–1 y F42·3–2',
        'EC-453',
        'Distinto de 0 y de ∞ [a 25 °C (77 °F)]',
        'Solo 35th Anniversary (Rev-Up). Desconectar el conector, aflojar el tornillo y retirar el sensor. Medir la resistencia entre 3 (+) y 1 (−), 2 (+) y 1 (−), y 3 (+) y 2 (−).',
        'Except 0 or ∞ [at 25 °C (77 °F)]',
        'For 35th Anniversary (Rev-Up) only. Disconnect the harness connector, loosen the fixing bolt and remove the sensor. Check resistance between 3 (+) and 1 (−), 2 (+) and 1 (−), and 3 (+) and 2 (−).',
        '0または∞を除く［25 °C（77 °F）］',
        '35周年記念車（Rev-Up）のみ。ハーネスコネクターを外し、固定ボルトを緩めてセンサを取り外す。3（+）-1（−）、2（+）-1（−）、3（+）-2（−）の抵抗を測定。'
      )
    ],

    /* —— Other sensors —— */
    knock: [
      sm(
        'F228·1 / ECM 15',
        'EC-127',
        'Aproximadamente 2.5 V',
        'Motor en marcha, a ralentí. Medir entre el terminal 15 del ECM (sensor de detonación) y masa (tabla de terminales).',
        'Approximately 2.5 V',
        'Engine is running, idle speed. Check voltage between ECM terminal 15 (knock sensor) and ground (ECM terminal table).',
        '約2.5 V',
        'エンジン回転中、アイドル。ECM端子15（ノックセンサ）とアース間を測定（ECM端子表）。'
      ),
      sm(
        'F228·1 a masa',
        'EC-320',
        'Aproximadamente 532 - 588 kΩ [a 20 °C (68 °F)]',
        'Medir la resistencia entre el terminal 1 del sensor de detonación y masa. Hace falta un óhmetro que mida más de 10 MΩ. No usar un sensor que se haya caído o esté dañado.',
        'Approximately 532 - 588 kΩ [at 20 °C (68 °F)]',
        'Check resistance between knock sensor terminal 1 and ground. It is necessary to use an ohmmeter which can measure more than 10 MΩ. Do not use any knock sensors that have been dropped or physically damaged.',
        '約532 - 588 kΩ［20 °C（68 °F）］',
        'ノックセンサ端子1とアース間の抵抗を測定。10 MΩ以上を測定できる抵抗計が必要。落下または損傷したセンサは使用しない。'
      )
    ],
    ect: [
      sm(
        'F13·1 y F13·2',
        'EC-232',
        'A 20 °C (68 °F): 2.1 - 2.9 kΩ. A 50 °C (122 °F): 0.68 - 1.00 kΩ. A 90 °C (194 °F): 0.236 - 0.260 kΩ',
        'Medir la resistencia entre los terminales 1 y 2 del sensor de temperatura del refrigerante.',
        'At 20 °C (68 °F): 2.1 - 2.9 kΩ. At 50 °C (122 °F): 0.68 - 1.00 kΩ. At 90 °C (194 °F): 0.236 - 0.260 kΩ',
        'Check resistance between engine coolant temperature sensor terminals 1 and 2.',
        '20 °C（68 °F）: 2.1 - 2.9 kΩ。50 °C（122 °F）: 0.68 - 1.00 kΩ。90 °C（194 °F）: 0.236 - 0.260 kΩ',
        'エンジン冷却水温センサの端子1と2の間の抵抗を測定。'
      ),
      sm(
        'F13·1 / ECM 73',
        'EC-131',
        'Aproximadamente 0 - 4.8 V. La tensión de salida varía con la temperatura del refrigerante',
        'Motor en marcha (tabla de terminales del ECM).',
        'Approximately 0 - 4.8 V. Output voltage varies with engine coolant temperature',
        'Engine is running (ECM terminal table).',
        '約0 - 4.8 V。出力電圧はエンジン冷却水温によって変化する',
        'エンジン回転中（ECM端子表）。'
      )
    ],
    af_b1: [
      sm(
        'F22·1 / ECM 16, F22·5 / ECM 35, F22·6 / ECM 56, F22·2 / ECM 75',
        'EC-127',
        'Ralentí (motor caliente): ·1 / ECM 16 aprox. 3.1 V; ·5 / ECM 35 aprox. 2.6 V; ·6 / ECM 56 aprox. 2.3 V; ·2 / ECM 75 aprox. 2.3 V',
        'Motor en marcha, condición de calentamiento, a ralentí. Medir entre cada terminal del ECM (A/F sensor 1 banco 1) y masa (tabla de terminales).',
        'Idle (warm-up condition): ·1 / ECM 16 Approximately 3.1 V; ·5 / ECM 35 Approximately 2.6 V; ·6 / ECM 56 Approximately 2.3 V; ·2 / ECM 75 Approximately 2.3 V',
        'Engine is running, warm-up condition, idle speed. Check voltage between each ECM terminal (A/F sensor 1 bank 1) and ground (ECM terminal table).',
        'アイドル（暖機後）: ·1 / ECM 16 約3.1 V、·5 / ECM 35 約2.6 V、·6 / ECM 56 約2.3 V、·2 / ECM 75 約2.3 V',
        'エンジン回転中、暖機状態、アイドル。各ECM端子（A/Fセンサ1 バンク1）とアース間を測定（ECM端子表）。'
      ),
      sm(
        'F22·3 y F22·4 (calentador)',
        'EC-439',
        'Entre 3 y 4: 2.3 - 4.3 Ω [a 25 °C (77 °F)]. Entre 3 o 4 y 1, 2, 5 o 6: no debe haber continuidad',
        'Medir la resistencia del calentador del A/F sensor 1 entre los terminales 3 y 4, y comprobar que no hay continuidad hacia los demás terminales.',
        'Between 3 and 4: 2.3 - 4.3 Ω [at 25 °C (77 °F)]. Between 3 or 4 and 1, 2, 5 or 6: Continuity should not exist',
        'Check resistance of the A/F sensor 1 heater between terminals 3 and 4, and confirm there is no continuity to the other terminals.',
        '3と4の間: 2.3 - 4.3 Ω［25 °C（77 °F）］。3または4と1、2、5、6の間: 導通がないこと',
        'A/Fセンサ1ヒータの端子3と4の間の抵抗を測定し、他の端子との導通がないことを確認。'
      ),
      sm(
        'F22·4 / ECM 2',
        'EC-124',
        'Aproximadamente 5 V',
        'Motor en marcha, condición de calentamiento, a ralentí (tabla de terminales del ECM, calentador A/F banco 1).',
        'Approximately 5 V',
        'Engine is running, warm-up condition, idle speed (ECM terminal table, A/F sensor 1 heater bank 1).',
        '約5 V',
        'エンジン回転中、暖機状態、アイドル（ECM端子表、A/Fセンサ1ヒータ バンク1）。'
      )
    ],
    af_b2: [
      sm(
        'F34·5 / ECM 57, F34·6 / ECM 58, F34·1 / ECM 76, F34·2 / ECM 77',
        'EC-130',
        'Ralentí (motor caliente): ·5 / ECM 57 aprox. 2.6 V; ·6 / ECM 58 aprox. 2.3 V; ·1 / ECM 76 aprox. 3.1 V; ·2 / ECM 77 aprox. 2.3 V',
        'Motor en marcha, condición de calentamiento, a ralentí. Medir entre cada terminal del ECM (A/F sensor 1 banco 2) y masa (tabla de terminales).',
        'Idle (warm-up condition): ·5 / ECM 57 Approximately 2.6 V; ·6 / ECM 58 Approximately 2.3 V; ·1 / ECM 76 Approximately 3.1 V; ·2 / ECM 77 Approximately 2.3 V',
        'Engine is running, warm-up condition, idle speed. Check voltage between each ECM terminal (A/F sensor 1 bank 2) and ground (ECM terminal table).',
        'アイドル（暖機後）: ·5 / ECM 57 約2.6 V、·6 / ECM 58 約2.3 V、·1 / ECM 76 約3.1 V、·2 / ECM 77 約2.3 V',
        'エンジン回転中、暖機状態、アイドル。各ECM端子（A/Fセンサ1 バンク2）とアース間を測定（ECM端子表）。'
      ),
      sm(
        'F34·3 y F34·4 (calentador)',
        'EC-439',
        'Entre 3 y 4: 2.3 - 4.3 Ω [a 25 °C (77 °F)]. Entre 3 o 4 y 1, 2, 5 o 6: no debe haber continuidad',
        'Medir la resistencia del calentador del A/F sensor 1 entre los terminales 3 y 4, y comprobar que no hay continuidad hacia los demás terminales.',
        'Between 3 and 4: 2.3 - 4.3 Ω [at 25 °C (77 °F)]. Between 3 or 4 and 1, 2, 5 or 6: Continuity should not exist',
        'Check resistance of the A/F sensor 1 heater between terminals 3 and 4, and confirm there is no continuity to the other terminals.',
        '3と4の間: 2.3 - 4.3 Ω［25 °C（77 °F）］。3または4と1、2、5、6の間: 導通がないこと',
        'A/Fセンサ1ヒータの端子3と4の間の抵抗を測定し、他の端子との導通がないことを確認。'
      ),
      sm(
        'F34·4 / ECM 24',
        'EC-127',
        'Aproximadamente 5 V',
        'Motor en marcha, condición de calentamiento, a ralentí (tabla de terminales del ECM, calentador A/F banco 2).',
        'Approximately 5 V',
        'Engine is running, warm-up condition, idle speed (ECM terminal table, A/F sensor 1 heater bank 2).',
        '約5 V',
        'エンジン回転中、暖機状態、アイドル（ECM端子表、A/Fセンサ1ヒータ バンク2）。'
      )
    ],
    ho2s_b1: [
      sm(
        'F11·1 / ECM 74',
        'EC-131',
        '0 - aproximadamente 1.0 V',
        'Motor en marcha, condición de calentamiento. Tras mantener entre 3.500 y 4.000 rpm durante 1 minuto y luego en ralentí 1 minuto sin carga, acelerar de ralentí a 3.000 rpm de forma rápida. Medir entre el terminal 74 del ECM (HO2S2 banco 1) y masa.',
        '0 - Approximately 1.0 V',
        'Engine is running, warm-up condition. After keeping the engine speed between 3,500 and 4,000 rpm for 1 minute and at idle for 1 minute under no load, rev the engine from idle to 3,000 rpm quickly. Check voltage between ECM terminal 74 (HO2S2 bank 1) and ground.',
        '0 - 約1.0 V',
        'エンジン回転中、暖機状態。3,500〜4,000 rpmを1分間保持し、無負荷アイドルを1分間行った後、アイドルから3,000 rpmまで素早く回転を上げる。ECM端子74（HO2S2 バンク1）とアース間を測定。'
      ),
      sm(
        'F11·2 y F11·3 (calentador)',
        'EC-196',
        'Entre 2 y 3: 5.0 - 7.0 Ω [a 25 °C (77 °F)]. Entre 1 y 2, 3 o 4, y entre 4 y 1, 2 o 3: ∞ Ω (no debe haber continuidad)',
        'Medir la resistencia del calentador del HO2S2 entre los terminales indicados.',
        'Between 2 and 3: 5.0 - 7.0 Ω [at 25 °C (77 °F)]. Between 1 and 2, 3 or 4, and between 4 and 1, 2 or 3: ∞ Ω (Continuity should not exist)',
        'Check resistance of the HO2S2 heater between the listed terminals.',
        '2と3の間: 5.0 - 7.0 Ω［25 °C（77 °F）］。1と2、3、4の間、および4と1、2、3の間: ∞ Ω（導通がないこと）',
        'HO2S2ヒータの指定端子間の抵抗を測定。'
      ),
      sm(
        'F11·3 / ECM 25',
        'EC-128',
        'Tras el protocolo de calentamiento (3.500-4.000 rpm 1 min y ralentí 1 min sin carga), por debajo de 3.600 rpm: 0 - 1.0 V. Contacto ON, motor parado, o por encima de 3.600 rpm: tensión de batería (11 - 14 V)',
        'Medir entre el terminal 25 del ECM (calentador HO2S2 banco 1) y masa (tabla de terminales).',
        'After the warm-up protocol (3,500-4,000 rpm for 1 minute and idle for 1 minute under no load), below 3,600 rpm: 0 - 1.0 V. Ignition switch ON, engine stopped, or above 3,600 rpm: BATTERY VOLTAGE (11 - 14 V)',
        'Check voltage between ECM terminal 25 (HO2S2 heater bank 1) and ground (ECM terminal table).',
        '暖機プロトコル（3,500-4,000 rpmを1分、無負荷アイドル1分）の後、3,600 rpm未満: 0 - 1.0 V。イグニッションON・エンジン停止、または3,600 rpm超: バッテリー電圧（11 - 14 V）',
        'ECM端子25（HO2S2ヒータ バンク1）とアース間を測定（ECM端子表）。'
      )
    ],
    ho2s_b2: [
      sm(
        'F12·1 / ECM 55',
        'EC-130',
        '0 - aproximadamente 1.0 V',
        'Motor en marcha, condición de calentamiento. Tras mantener entre 3.500 y 4.000 rpm durante 1 minuto y luego en ralentí 1 minuto sin carga, acelerar de ralentí a 3.000 rpm de forma rápida. Medir entre el terminal 55 del ECM (HO2S2 banco 2) y masa.',
        '0 - Approximately 1.0 V',
        'Engine is running, warm-up condition. After keeping the engine speed between 3,500 and 4,000 rpm for 1 minute and at idle for 1 minute under no load, rev the engine from idle to 3,000 rpm quickly. Check voltage between ECM terminal 55 (HO2S2 bank 2) and ground.',
        '0 - 約1.0 V',
        'エンジン回転中、暖機状態。3,500〜4,000 rpmを1分間保持し、無負荷アイドルを1分間行った後、アイドルから3,000 rpmまで素早く回転を上げる。ECM端子55（HO2S2 バンク2）とアース間を測定。'
      ),
      sm(
        'F12·2 y F12·3 (calentador)',
        'EC-196',
        'Entre 2 y 3: 5.0 - 7.0 Ω [a 25 °C (77 °F)]. Entre 1 y 2, 3 o 4, y entre 4 y 1, 2 o 3: ∞ Ω (no debe haber continuidad)',
        'Medir la resistencia del calentador del HO2S2 entre los terminales indicados.',
        'Between 2 and 3: 5.0 - 7.0 Ω [at 25 °C (77 °F)]. Between 1 and 2, 3 or 4, and between 4 and 1, 2 or 3: ∞ Ω (Continuity should not exist)',
        'Check resistance of the HO2S2 heater between the listed terminals.',
        '2と3の間: 5.0 - 7.0 Ω［25 °C（77 °F）］。1と2、3、4の間、および4と1、2、3の間: ∞ Ω（導通がないこと）',
        'HO2S2ヒータの指定端子間の抵抗を測定。'
      ),
      sm(
        'F12·3 / ECM 6',
        'EC-125',
        'Tras el protocolo de calentamiento (3.500-4.000 rpm 1 min y ralentí 1 min sin carga), por debajo de 3.600 rpm: 0 - 1.0 V. Contacto ON, motor parado, o por encima de 3.600 rpm: tensión de batería (11 - 14 V)',
        'Medir entre el terminal 6 del ECM (calentador HO2S2 banco 2) y masa (tabla de terminales).',
        'After the warm-up protocol (3,500-4,000 rpm for 1 minute and idle for 1 minute under no load), below 3,600 rpm: 0 - 1.0 V. Ignition switch ON, engine stopped, or above 3,600 rpm: BATTERY VOLTAGE (11 - 14 V)',
        'Check voltage between ECM terminal 6 (HO2S2 heater bank 2) and ground (ECM terminal table).',
        '暖機プロトコル（3,500-4,000 rpmを1分、無負荷アイドル1分）の後、3,600 rpm未満: 0 - 1.0 V。イグニッションON・エンジン停止、または3,600 rpm超: バッテリー電圧（11 - 14 V）',
        'ECM端子6（HO2S2ヒータ バンク2）とアース間を測定（ECM端子表）。'
      )
    ],
    evap_press: [
      sm(
        'T21·2 / ECM 32',
        'EC-376',
        'Sin vacío aplicado: 1.8 - 4.8 V. A −26.7 kPa (−200 mmHg, −7.87 inHg): 2.1 a 2.5 V menos que el valor anterior',
        'Contacto ON. Dejar el sensor conectado, retirarlo del cánister (cambiar el O-ring) e instalar una bomba de vacío. Medir entre el terminal 32 del ECM y masa. Calibrar el vacuómetro; no aplicar menos de −93.3 kPa ni más de 101.3 kPa.',
        'Vacuum not applied: 1.8 - 4.8 V. At −26.7 kPa (−200 mmHg, −7.87 inHg): 2.1 to 2.5 V lower than the above value',
        'Ignition switch ON. Remove the sensor with its harness connector connected (always replace the O-ring) and install a vacuum pump. Check voltage between ECM terminal 32 and ground. Always calibrate the vacuum pump gauge; do not apply below −93.3 kPa or pressure over 101.3 kPa.',
        '真空なし: 1.8 - 4.8 V。−26.7 kPa（−200 mmHg、−7.87 inHg）: 上記の値より2.1〜2.5 V低い',
        'イグニッションON。ハーネスコネクターを接続したままセンサをキャニスターから外し（Oリングは必ず交換）、真空ポンプを取り付ける。ECM端子32とアース間を測定。真空計は校正すること。−93.3 kPa未満または101.3 kPa超は加えない。'
      ),
      sm(
        'T21·3 / ECM 48',
        'EC-129',
        'Aproximadamente 5 V',
        'Contacto ON. Alimentación del sensor de presión EVAP (tabla de terminales del ECM).',
        'Approximately 5 V',
        'Ignition switch: ON. EVAP control system pressure sensor power supply (ECM terminal table).',
        '約5 V',
        'イグニッションON。EVAP制御システム圧力センサ電源（ECM端子表）。'
      )
    ],
    psp: [
      sm(
        'F19·2 / ECM 12',
        'EC-429',
        'Volante girando: 0.5 - 4.5 V. Volante quieto: 0.4 - 0.8 V',
        'Arrancar el motor y dejarlo en ralentí. Reconectar todos los conectores. Medir entre el terminal 12 del ECM y masa.',
        'Steering wheel being turned: 0.5 - 4.5 V. Steering wheel not being turned: 0.4 - 0.8 V',
        'Start the engine and let it idle. Reconnect all harness connectors disconnected. Check voltage between ECM terminal 12 and ground.',
        'ステアリング操作中: 0.5 - 4.5 V。ステアリング非操作: 0.4 - 0.8 V',
        'エンジンを始動してアイドルにする。外したハーネスコネクターをすべて接続し直す。ECM端子12とアース間を測定。'
      ),
      sm(
        'F19·1 / ECM 68',
        'EC-131',
        'Aproximadamente 5 V',
        'Contacto ON. Alimentación del sensor de presión de dirección (tabla de terminales del ECM).',
        'Approximately 5 V',
        'Ignition switch: ON. Power steering pressure sensor power supply (ECM terminal table).',
        '約5 V',
        'イグニッションON。パワーステアリング圧力センサ電源（ECM端子表）。'
      )
    ],
    ac_press: [
      sm(
        'E252·2 / ECM 70',
        'EC-718',
        '1.0 - 4.0 V',
        'Motor en marcha, ya caliente a temperatura normal de trabajo. Interruptor de A/C y soplador en ON (el compresor funciona). Medir entre el terminal 70 del ECM y masa, con CONSULT-II o un polímetro.',
        '1.0 - 4.0 V',
        'Engine running and warmed up to normal operating temperature. Both A/C switch and blower switch ON (compressor operates). Check voltage between ECM terminal 70 and ground with CONSULT-II or tester.',
        '1.0 - 4.0 V',
        'エンジンを通常の動作温度まで暖機して回転させる。A/CスイッチとブロワスイッチON（コンプレッサ作動）。ECM端子70とアース間をCONSULT-IIまたはテスターで測定。'
      ),
      sm(
        'E252·1 / ECM 49',
        'EC-718',
        'Aproximadamente 5 V',
        'Contacto ON. Alimentación del sensor de presión de refrigerante (tabla de terminales, EC-718).',
        'Approximately 5 V',
        'Ignition switch: ON. Refrigerant pressure sensor power supply (terminal table, EC-718).',
        '約5 V',
        'イグニッションON。冷媒圧力センサ電源（端子表、EC-718）。'
      )
    ],
    f21_oilp: [
      sm(
        'F21·2 (misma señal que M44·8)',
        'DI-45',
        'Contacto ON, motor parado: aprox. 1 V. Motor en marcha, presión de aceite 80 psi (500 kPa): aprox. 3 V',
        'El SM mide entre el terminal 8 (LG/R) del triple meter M44 y masa; F21·2 es la misma señal del sensor de presión de aceite.',
        'Ignition switch ON (engine stopped): Approx. 1 V. Engine running [when the oil pressure is 80 psi (500 kPa)]: Approx. 3 V',
        'The SM checks voltage between triple meter M44 terminal 8 (LG/R) and ground; F21·2 is the same oil pressure sensor signal.',
        'イグニッションON・エンジン停止: 約1 V。エンジン回転中、油圧80 psi（500 kPa）: 約3 V',
        'SMはトリプルメータM44端子8（LG/R）とアース間を測定する。F21·2は同じ油圧センサ信号。'
      ),
      sm(
        'F21·1 (misma alimentación que M44·9)',
        'DI-45',
        'Aprox. 5 V',
        'El SM mide entre el terminal 9 (R/L) del triple meter M44 y masa; F21·1 es la misma alimentación del sensor. Continuidad M44·9 – F21·1: debe existir.',
        'Approx. 5 V',
        'The SM checks voltage between triple meter M44 terminal 9 (R/L) and ground; F21·1 is the same sensor power supply. Continuity M44·9 – F21·1 should exist.',
        '約5 V',
        'SMはトリプルメータM44端子9（R/L）とアース間を測定する。F21·1は同じセンサ電源。M44·9 – F21·1の導通があること。'
      )
    ],
    fuel_tank_temp: [
      sm(
        'B27·4 y B27·5',
        'EC-293',
        'A 20 °C (68 °F): 2.3 - 2.7 kΩ. A 50 °C (122 °F): 0.79 - 0.90 kΩ',
        'Retirar la unidad de nivel. Medir la resistencia entre los terminales 4 y 5 de la unidad de nivel y bomba, calentando con agua caliente o pistola de calor.',
        'At 20 °C (68 °F): 2.3 - 2.7 kΩ. At 50 °C (122 °F): 0.79 - 0.90 kΩ',
        'Remove the fuel level sensor unit. Check resistance between fuel level sensor unit and fuel pump terminals 4 and 5 by heating with hot water or a heat gun.',
        '20 °C（68 °F）: 2.3 - 2.7 kΩ。50 °C（122 °F）: 0.79 - 0.90 kΩ',
        'フューエルレベルセンサユニットを取り外す。レベルセンサユニット兼フューエルポンプの端子4と5の間の抵抗を、温水またはヒートガンで加熱して測定。'
      ),
      sm(
        'B27·4 / ECM 107',
        'EC-133',
        'Aproximadamente 0 - 4.8 V. La tensión de salida varía con la temperatura del tanque de combustible',
        'Motor en marcha (tabla de terminales del ECM).',
        'Approximately 0 - 4.8 V. Output voltage varies with fuel tank temperature',
        'Engine is running (ECM terminal table).',
        '約0 - 4.8 V。出力電圧はフューエルタンク温度によって変化する',
        'エンジン回転中（ECM端子表）。'
      )
    ],
    fuel_level_sub: [
      sm(
        'B28·1 y B28·2',
        'DI-24',
        'Lleno (*1, flotador contra el tope, 8 mm / 0.31 in): aprox. 3 Ω. Vacío (*2, flotador contra el tope, 175 mm / 6.89 in): aprox. 43 Ω',
        'Medir la resistencia entre los terminales 1 y 2 de la unidad de nivel secundaria (sub).',
        'Full (*1, float rod in contact with stopper, 8 mm / 0.31 in): Approx. 3 Ω. Empty (*2, float rod in contact with stopper, 175 mm / 6.89 in): Approx. 43 Ω',
        'Check the resistance between fuel level sensor unit (sub) terminals 1 and 2.',
        '満タン（*1、フロートがストッパに当たる、8 mm / 0.31 in）: 約3 Ω。空（*2、フロートがストッパに当たる、175 mm / 6.89 in）: 約43 Ω',
        'サブのフューエルレベルセンサユニットの端子1と2の間の抵抗を測定。'
      )
    ],
    f242_eot: SM_NONE /* 35th Anniversary M/T only; 2005/2006 FSM publishes no numeric values (EC-123). */,

    /* —— Switches —— */
    f35_pnp: [
      sm(
        'F35·1–2',
        'MT-11',
        'Neutro: continuidad sí. Fuera de neutro: continuidad no',
        'Comprobar la continuidad del interruptor de posición PNP (caja manual).',
        'Neutral: Continuity Yes. Except neutral: Continuity No',
        'Check continuity of the park/neutral position switch (M/T).',
        'ニュートラル: 導通あり。ニュートラル以外: 導通なし',
        'パーク／ニュートラルポジションスイッチ（M/T）の導通を点検。'
      ),
      sm(
        'F35·1 / ECM 102',
        'EC-133',
        'Palanca en P o N (A/T) o en neutro (M/T): aproximadamente 0 V. En cualquier otra posición: tensión de batería (11 - 14 V)',
        'Contacto ON. Medir entre el terminal 102 del ECM (interruptor PNP) y masa (tabla de terminales).',
        'Shift lever in P or N (A/T), Neutral (M/T): Approximately 0 V. Except above position: BATTERY VOLTAGE (11 - 14 V)',
        'Ignition switch: ON. Check voltage between ECM terminal 102 (PNP switch) and ground (ECM terminal table).',
        'シフトがPまたはN（A/T）、ニュートラル（M/T）: 約0 V。上記以外: バッテリー電圧（11 - 14 V）',
        'イグニッションON。ECM端子102（PNPスイッチ）とアース間を測定（ECM端子表）。'
      )
    ],
    backup_sw: [
      sm(
        'F36·1–2',
        'MT-11',
        'Marcha atrás: continuidad sí. Fuera de marcha atrás: continuidad no',
        'Comprobar la continuidad del interruptor de lámpara de marcha atrás (caja manual).',
        'Reverse: Continuity Yes. Except reverse: Continuity No',
        'Check continuity of the back-up lamp switch (M/T).',
        'リバース: 導通あり。リバース以外: 導通なし',
        'バックアップランプスイッチ（M/T）の導通を点検。'
      )
    ],
    stop_lamp: [
      sm(
        'Terminales 1 y 2 (E112 en M/T, E111 en A/T)',
        'EC-639',
        'Pedal de freno suelto: no debe haber continuidad. Pedal ligeramente pisado: debe haber continuidad',
        'Contacto OFF. Conector del interruptor de freno desconectado. Medir la continuidad entre los terminales 1 y 2.',
        'Brake pedal fully released: Continuity should not exist. Brake pedal slightly depressed: Continuity should exist',
        'Ignition switch OFF. Stop lamp switch harness connector disconnected. Check continuity between terminals 1 and 2.',
        'ブレーキペダル全開（離した状態）: 導通がないこと。わずかに踏んだ状態: 導通があること',
        'イグニッションOFF。ストップランプスイッチのハーネスコネクターを外し、端子1と2の間の導通を点検。'
      ),
      sm(
        'E112·2 / ECM 101 (M/T; en A/T es E111·2)',
        'EC-133',
        'Pedal suelto: aproximadamente 0 V. Pedal ligeramente pisado: tensión de batería (11 - 14 V)',
        'Contacto OFF. Medir entre el terminal 101 del ECM (interruptor de freno) y masa (tabla de terminales).',
        'Brake pedal fully released: Approximately 0 V. Brake pedal slightly depressed: BATTERY VOLTAGE (11 - 14 V)',
        'Ignition switch: OFF. Check voltage between ECM terminal 101 (stop lamp switch) and ground (ECM terminal table).',
        'ペダルを離した状態: 約0 V。わずかに踏んだ状態: バッテリー電圧（11 - 14 V）',
        'イグニッションOFF。ECM端子101（ストップランプスイッチ）とアース間を測定（ECM端子表）。'
      )
    ],
    ascd_brake: [
      sm(
        'E110·1–2',
        'EC-639',
        'Pedal de freno suelto: debe haber continuidad. Pedal ligeramente pisado: no debe haber continuidad',
        'Contacto OFF. Conector del interruptor ASCD de freno desconectado. Medir la continuidad entre los terminales 1 y 2.',
        'Brake pedal fully released: Continuity should exist. Brake pedal slightly depressed: Continuity should not exist',
        'Ignition switch OFF. ASCD brake switch harness connector disconnected. Check continuity between terminals 1 and 2.',
        'ブレーキペダルを離した状態: 導通があること。わずかに踏んだ状態: 導通がないこと',
        'イグニッションOFF。ASCDブレーキスイッチのハーネスコネクターを外し、端子1と2の間の導通を点検。'
      ),
      sm(
        'E110·2 / ECM 108',
        'EC-133',
        'Pedal de freno y/o embrague ligeramente pisados (M/T), o freno ligeramente pisado (A/T): aproximadamente 0 V. Freno y embrague sueltos (M/T), o freno suelto (A/T): tensión de batería (11 - 14 V)',
        'Contacto ON. Medir entre el terminal 108 del ECM (interruptor ASCD de freno) y masa (tabla de terminales). En M/T esta señal pasa también por el interruptor ASCD de embrague E122.',
        'Brake pedal and/or clutch pedal slightly depressed (M/T), or brake pedal slightly depressed (A/T): Approximately 0 V. Brake and clutch pedals fully released (M/T), or brake pedal fully released (A/T): BATTERY VOLTAGE (11 - 14 V)',
        'Ignition switch: ON. Check voltage between ECM terminal 108 (ASCD brake switch) and ground (ECM terminal table). On M/T this signal also passes through ASCD clutch switch E122.',
        'ブレーキおよび／またはクラッチをわずかに踏んだ状態（M/T）、またはブレーキをわずかに踏んだ状態（A/T）: 約0 V。ブレーキとクラッチを離した状態（M/T）、またはブレーキを離した状態（A/T）: バッテリー電圧（11 - 14 V）',
        'イグニッションON。ECM端子108（ASCDブレーキスイッチ）とアース間を測定（ECM端子表）。M/Tではこの信号はASCDクラッチスイッチE122も通る。'
      )
    ],
    ascd_clutch: [
      sm(
        'E122·1–2',
        'EC-639',
        'Pedal de embrague suelto: debe haber continuidad. Pedal ligeramente pisado: no debe haber continuidad',
        'Solo M/T. Contacto OFF. Conector del interruptor ASCD de embrague desconectado. Medir la continuidad entre los terminales 1 y 2.',
        'Clutch pedal fully released: Continuity should exist. Clutch pedal slightly depressed: Continuity should not exist',
        'M/T models. Ignition switch OFF. ASCD clutch switch harness connector disconnected. Check continuity between terminals 1 and 2.',
        'クラッチペダルを離した状態: 導通があること。わずかに踏んだ状態: 導通がないこと',
        'M/Tのみ。イグニッションOFF。ASCDクラッチスイッチのハーネスコネクターを外し、端子1と2の間の導通を点検。'
      )
    ],
    clock_spring: [
      sm(
        'M203·14–15 (interruptor combinado / cable espiral)',
        'EC-623',
        'MAIN: pulsado aprox. 0 Ω, suelto aprox. 4.000 Ω. CANCEL: pulsado aprox. 250 Ω, suelto aprox. 4.000 Ω. RESUME/ACCEL: pulsado aprox. 1.480 Ω, suelto aprox. 4.000 Ω. SET/COAST: pulsado aprox. 660 Ω, suelto aprox. 4.000 Ω',
        'Desconectar el conector M203 del interruptor combinado (cable espiral). Medir la continuidad / resistencia entre los terminales 14 y 15 al pulsar cada botón. El SM no indica M23·34/33 como punto de esta medición.',
        'MAIN: Pressed Approx. 0 Ω, Released Approx. 4,000 Ω. CANCEL: Pressed Approx. 250 Ω, Released Approx. 4,000 Ω. RESUME/ACCELERATE: Pressed Approx. 1,480 Ω, Released Approx. 4,000 Ω. SET/COAST: Pressed Approx. 660 Ω, Released Approx. 4,000 Ω',
        'Disconnect combination switch (spiral cable) harness connector M203. Check continuity between terminals 14 and 15 while pushing each switch. The SM does not specify M23·34/33 as this measurement point.',
        'MAIN: 押したとき約0 Ω、離したとき約4,000 Ω。CANCEL: 押したとき約250 Ω、離したとき約4,000 Ω。RESUME/ACCELERATE: 押したとき約1,480 Ω、離したとき約4,000 Ω。SET/COAST: 押したとき約660 Ω、離したとき約4,000 Ω',
        'コンビネーションスイッチ（スパイラルケーブル）のハーネスコネクターM203を外す。各スイッチを押しながら端子14と15の間の抵抗を測定。SMはこの測定点をM23·34/33とは記載していない。'
      ),
      sm(
        'M23·34 / ECM 99',
        'EC-133',
        'ASCD apagado: aprox. 4 V. MAIN pulsado: aprox. 0 V. CANCEL pulsado: aprox. 1 V. RESUME/ACCEL pulsado: aprox. 3 V. SET/COAST pulsado: aprox. 2 V',
        'Contacto ON. Medir entre el terminal 99 del ECM (interruptor ASCD del volante) y masa (tabla de terminales).',
        'ASCD steering switch OFF: Approximately 4 V. MAIN switch pressed: Approximately 0 V. CANCEL switch pressed: Approximately 1 V. RESUME/ACCELERATE switch pressed: Approximately 3 V. SET/COAST switch pressed: Approximately 2 V',
        'Ignition switch: ON. Check voltage between ECM terminal 99 (ASCD steering switch) and ground (ECM terminal table).',
        'ASCDステアリングスイッチOFF: 約4 V。MAIN押下: 約0 V。CANCEL押下: 約1 V。RESUME/ACCELERATE押下: 約3 V。SET/COAST押下: 約2 V',
        'イグニッションON。ECM端子99（ASCDステアリングスイッチ）とアース間を測定（ECM端子表）。'
      )
    ],

    /* —— Outputs / actuators —— */
    coil1: coilEntries('F203', 62, 'EC-130'),
    coil2: coilEntries('F27', 81, 'EC-132'),
    coil3: coilEntries('F202', 61, 'EC-130'),
    coil4: coilEntries('F28', 80, 'EC-132'),
    coil5: coilEntries('F15', 60, 'EC-130'),
    coil6: coilEntries('F29', 79, 'EC-132'),
    inj1: injEntries('F222', 23, 'EC-127'),
    inj2: injEntries('F225', 42, 'EC-128'),
    inj3: injEntries('F223', 22, 'EC-127'),
    inj4: injEntries('F226', 41, 'EC-128'),
    inj5: injEntries('F224', 21, 'EC-127'),
    inj6: injEntries('F227', 40, 'EC-128'),
    vtc_b1: [
      sm(
        'F204·1–2',
        'EC-182',
        'Entre 1 y 2: 7.0 - 7.5 Ω [a 20 °C (68 °F)]. Entre 1 o 2 y masa: ∞ Ω (no debe haber continuidad)',
        'Desconectar el conector de la electroválvula de VTC de admisión. Medir la resistencia entre los terminales 1 y 2, y entre cada terminal y masa.',
        'Between 1 and 2: 7.0 - 7.5 Ω [at 20 °C (68 °F)]. Between 1 or 2 and ground: ∞ Ω (Continuity should not exist)',
        'Disconnect the intake valve timing control solenoid valve harness connector. Check resistance between terminals 1 and 2, and between each terminal and ground.',
        '1と2の間: 7.0 - 7.5 Ω［20 °C（68 °F）］。1または2とアース間: ∞ Ω（導通がないこと）',
        '吸気バルブタイミングコントロールソレノイドバルブのハーネスコネクターを外し、端子1と2の間、および各端子とアース間の抵抗を測定。'
      ),
      sm(
        'F204·1 / ECM 11',
        'EC-126',
        'Ralentí (motor caliente): tensión de batería (11 - 14 V). Al acelerar de forma rápida hasta 2.000 rpm (motor caliente): 7 - 12 V',
        'Motor en marcha, condición de calentamiento. Medir entre el terminal 11 del ECM (electroválvula VTC admisión banco 1) y masa (tabla de terminales).',
        'Idle (warm-up condition): BATTERY VOLTAGE (11 - 14 V). When revving the engine up to 2,000 rpm quickly (warm-up condition): 7 - 12 V',
        'Engine is running, warm-up condition. Check voltage between ECM terminal 11 (intake valve timing control solenoid valve bank 1) and ground (ECM terminal table).',
        'アイドル（暖機後）: バッテリー電圧（11 - 14 V）。2,000 rpmまで素早く加速（暖機後）: 7 - 12 V',
        'エンジン回転中、暖機状態。ECM端子11（吸気バルブタイミングコントロールソレノイドバルブ バンク1）とアース間を測定（ECM端子表）。'
      )
    ],
    vtc_b2: [
      sm(
        'F26·1–2',
        'EC-182',
        'Entre 1 y 2: 7.0 - 7.5 Ω [a 20 °C (68 °F)]. Entre 1 o 2 y masa: ∞ Ω (no debe haber continuidad)',
        'Desconectar el conector de la electroválvula de VTC de admisión. Medir la resistencia entre los terminales 1 y 2, y entre cada terminal y masa.',
        'Between 1 and 2: 7.0 - 7.5 Ω [at 20 °C (68 °F)]. Between 1 or 2 and ground: ∞ Ω (Continuity should not exist)',
        'Disconnect the intake valve timing control solenoid valve harness connector. Check resistance between terminals 1 and 2, and between each terminal and ground.',
        '1と2の間: 7.0 - 7.5 Ω［20 °C（68 °F）］。1または2とアース間: ∞ Ω（導通がないこと）',
        '吸気バルブタイミングコントロールソレノイドバルブのハーネスコネクターを外し、端子1と2の間、および各端子とアース間の抵抗を測定。'
      ),
      sm(
        'F26·1 / ECM 10',
        'EC-126',
        'Ralentí (motor caliente): tensión de batería (11 - 14 V). Al acelerar de forma rápida hasta 2.000 rpm (motor caliente): 7 - 12 V',
        'Motor en marcha, condición de calentamiento. Medir entre el terminal 10 del ECM (electroválvula VTC admisión banco 2) y masa (tabla de terminales).',
        'Idle (warm-up condition): BATTERY VOLTAGE (11 - 14 V). When revving the engine up to 2,000 rpm quickly (warm-up condition): 7 - 12 V',
        'Engine is running, warm-up condition. Check voltage between ECM terminal 10 (intake valve timing control solenoid valve bank 2) and ground (ECM terminal table).',
        'アイドル（暖機後）: バッテリー電圧（11 - 14 V）。2,000 rpmまで素早く加速（暖機後）: 7 - 12 V',
        'エンジン回転中、暖機状態。ECM端子10（吸気バルブタイミングコントロールソレノイドバルブ バンク2）とアース間を測定（ECM端子表）。'
      )
    ],
    vtc_ex_b1: [
      sm(
        'F40·3 y F40·4',
        'EC-188',
        '9.0 - 11.0 Ω [a 20 °C (68 °F)]',
        'Solo 35th Anniversary (Rev-Up). Desconectar el conector del retardador magnético EVT. Medir la resistencia entre los terminales 3 y 4 (banco 1).',
        '9.0 - 11.0 Ω [at 20 °C (68 °F)]',
        'For 35th Anniversary (Rev-Up) only. Disconnect the exhaust valve timing control magnet retarder harness connector. Check resistance between terminals 3 and 4 (bank 1).',
        '9.0 - 11.0 Ω［20 °C（68 °F）］',
        '35周年記念車（Rev-Up）のみ。排気バルブタイミングコントロールマグネットリターダのハーネスコネクターを外し、端子3と4（バンク1）の間の抵抗を測定。'
      ),
      sm(
        'F40·3 / ECM 9',
        'EC-125',
        'Ralentí (motor caliente): tensión de batería (11 - 14 V). Por encima de 1.500 rpm (motor caliente): 7 - 12 V',
        'Solo 35th Anniversary (Rev-Up). Motor en marcha. Medir entre el terminal 9 del ECM (retardador magnético EVT banco 1) y masa (tabla de terminales).',
        'Idle (warm-up condition): BATTERY VOLTAGE (11 - 14 V). Engine speed above 1,500 rpm (warm-up condition): 7 - 12 V',
        'For 35th Anniversary (Rev-Up) only. Engine is running. Check voltage between ECM terminal 9 (EVT control magnet retarder bank 1) and ground (ECM terminal table).',
        'アイドル（暖機後）: バッテリー電圧（11 - 14 V）。1,500 rpm超（暖機後）: 7 - 12 V',
        '35周年記念車（Rev-Up）のみ。エンジン回転中。ECM端子9（EVTコントロールマグネットリターダ バンク1）とアース間を測定（ECM端子表）。'
      )
    ],
    vtc_ex_b2: [
      sm(
        'F41·1 y F41·2',
        'EC-188',
        '9.0 - 11.0 Ω [a 20 °C (68 °F)]',
        'Solo 35th Anniversary (Rev-Up). Desconectar el conector del retardador magnético EVT. Medir la resistencia entre los terminales 1 y 2 (banco 2).',
        '9.0 - 11.0 Ω [at 20 °C (68 °F)]',
        'For 35th Anniversary (Rev-Up) only. Disconnect the exhaust valve timing control magnet retarder harness connector. Check resistance between terminals 1 and 2 (bank 2).',
        '9.0 - 11.0 Ω［20 °C（68 °F）］',
        '35周年記念車（Rev-Up）のみ。排気バルブタイミングコントロールマグネットリターダのハーネスコネクターを外し、端子1と2（バンク2）の間の抵抗を測定。'
      ),
      sm(
        'F41·2 / ECM 8',
        'EC-125',
        'Ralentí (motor caliente): tensión de batería (11 - 14 V). Por encima de 1.500 rpm (motor caliente): 7 - 12 V',
        'Solo 35th Anniversary (Rev-Up). Motor en marcha. Medir entre el terminal 8 del ECM (retardador magnético EVT banco 2) y masa (tabla de terminales).',
        'Idle (warm-up condition): BATTERY VOLTAGE (11 - 14 V). Engine speed above 1,500 rpm (warm-up condition): 7 - 12 V',
        'For 35th Anniversary (Rev-Up) only. Engine is running. Check voltage between ECM terminal 8 (EVT control magnet retarder bank 2) and ground (ECM terminal table).',
        'アイドル（暖機後）: バッテリー電圧（11 - 14 V）。1,500 rpm超（暖機後）: 7 - 12 V',
        '35周年記念車（Rev-Up）のみ。エンジン回転中。ECM端子8（EVTコントロールマグネットリターダ バンク2）とアース間を測定（ECM端子表）。'
      )
    ],
    evap_purge: [
      sm(
        'Terminales 1 y 2',
        'EC-363',
        '12 V de corriente continua entre los terminales 1 y 2: paso de aire entre A y B, sí. Sin alimentación: paso de aire, no',
        'Sin CONSULT-II. Comprobar la continuidad del paso de aire de la electroválvula de purga EVAP en esas condiciones.',
        '12 V direct current supply between terminals 1 and 2: Air passage continuity between A and B, Yes. No supply: Air passage, No',
        'Without CONSULT-II. Check air passage continuity of the EVAP canister purge volume control solenoid valve under the listed conditions.',
        '端子1と2の間に12 V直流を加えたとき: A-B間の空気通路の連通あり。非供給時: 連通なし',
        'CONSULT-IIなし。EVAPキャニスターパージボリュームコントロールソレノイドバルブの空気通路の連通を上記条件で点検。'
      ),
      sm(
        'Terminal 2 / ECM 45',
        'EC-129',
        'Tensión de batería (11 - 14 V) a ralentí (sin pisar el acelerador, justo después de arrancar) y a unos 2.000 rpm (más de 100 s después de arrancar)',
        'Motor en marcha. Medir entre el terminal 45 del ECM (electroválvula de purga EVAP) y masa (tabla de terminales).',
        'BATTERY VOLTAGE (11 - 14 V) at idle (accelerator pedal not depressed even slightly, after engine starting) and at about 2,000 rpm (more than 100 seconds after starting the engine)',
        'Engine is running. Check voltage between ECM terminal 45 (EVAP canister purge volume control solenoid valve) and ground (ECM terminal table).',
        'バッテリー電圧（11 - 14 V）。アイドル（始動後、アクセルをわずかにも踏まない）および約2,000 rpm（始動後100秒超）',
        'エンジン回転中。ECM端子45（EVAPキャニスターパージボリュームコントロールソレノイドバルブ）とアース間を測定（ECM端子表）。'
      )
    ],
    evap_vent: [
      sm(
        'T20·1 y T20·2',
        'EC-373',
        '12 V de corriente continua entre los terminales 1 y 2: paso de aire entre A y B, no. Sin alimentación (OFF): paso de aire, sí. La operación tarda menos de 1 s',
        'Sin CONSULT-II. Retirar la válvula de venteo del cánister (O-ring nuevo bien colocado) y comprobar la continuidad del paso de aire y el tiempo de respuesta.',
        '12 V direct current supply between terminals 1 and 2: Air passage continuity between A and B, No. OFF (no supply): Air passage, Yes. Operation takes less than 1 second',
        'Without CONSULT-II. Remove the EVAP canister vent control valve from the canister (make sure a new O-ring is installed properly) and check air passage continuity and operation delay time.',
        '端子1と2の間に12 V直流を加えたとき: A-B間の空気通路の連通なし。OFF（非供給）: 連通あり。作動は1秒未満',
        'CONSULT-IIなし。ベントコントロールバルブをキャニスターから外し（新しいOリングを正しく取り付ける）、空気通路の連通と作動遅れ時間を点検。'
      ),
      sm(
        'T20·2 / ECM 117',
        'EC-134',
        'Tensión de batería (11 - 14 V)',
        'Contacto ON. Medir entre el terminal 117 del ECM (válvula de venteo EVAP) y masa (tabla de terminales).',
        'BATTERY VOLTAGE (11 - 14 V)',
        'Ignition switch: ON. Check voltage between ECM terminal 117 (EVAP canister vent control valve) and ground (ECM terminal table).',
        'バッテリー電圧（11 - 14 V）',
        'イグニッションON。ECM端子117（EVAPキャニスターベントコントロールバルブ）とアース間を測定（ECM端子表）。'
      )
    ],
    fuel_pump: [
      sm(
        'B27·1 y B27·3',
        'EC-715',
        '0.2 - 5.0 Ω [a 25 °C (77 °F)]',
        'Desconectar el conector de la unidad de nivel y bomba de combustible. Medir la resistencia entre los terminales 1 y 3.',
        '0.2 - 5.0 Ω [at 25 °C (77 °F)]',
        'Disconnect the fuel level sensor unit and fuel pump harness connector. Check resistance between terminals 1 and 3.',
        '0.2 - 5.0 Ω［25 °C（77 °F）］',
        'フューエルレベルセンサユニット兼フューエルポンプのハーネスコネクターを外し、端子1と3の間の抵抗を測定。'
      ),
      sm(
        'B27·2 y B27·5 (nivel principal)',
        'DI-24',
        'Vacío (*1, flotador contra el tope, 30 mm / 1.18 in): aprox. 80 Ω. Lleno (*2, flotador contra el tope, 210 mm / 8.27 in): aprox. 3 Ω',
        'Medir la resistencia entre los terminales 2 y 5 de la unidad de nivel y bomba (sensor principal).',
        'Empty (*1, float rod in contact with stopper, 30 mm / 1.18 in): Approx. 80 Ω. Full (*2, float rod in contact with stopper, 210 mm / 8.27 in): Approx. 3 Ω',
        'Check the resistance between fuel level sensor unit and fuel pump (main) terminals 2 and 5.',
        '空（*1、フロートがストッパに当たる、30 mm / 1.18 in）: 約80 Ω。満タン（*2、フロートがストッパに当たる、210 mm / 8.27 in）: 約3 Ω',
        'フューエルレベルセンサユニット兼フューエルポンプ（メイン）の端子2と5の間の抵抗を測定。'
      )
    ],
    f16_cond: [
      sm(
        'F16·1 y F16·2',
        'EC-700',
        'Más de 1 MΩ [a 25 °C (77 °F)]',
        'Contacto OFF. Conector del condensador de encendido desconectado. Medir la resistencia entre los terminales 1 y 2. (El condensador de la bomba de combustible, con el mismo valor, está en EC-715 y no es esta ficha.)',
        'Above 1 MΩ [at 25 °C (77 °F)]',
        'Ignition switch OFF. Condenser harness connector disconnected. Check resistance between terminals 1 and 2. (The fuel-pump condenser, which has the same value, is on EC-715 and is not this card.)',
        '1 MΩ超［25 °C（77 °F）］',
        'イグニッションOFF。コンデンサのハーネスコネクターを外し、端子1と2の間の抵抗を測定。（同じ値のフューエルポンプ用コンデンサはEC-715で、このカードではない。）'
      )
    ],
    f9_starter: [
      sm(
        'F9·1 (B/Y)',
        'SC-18',
        'Tensión de batería con la llave en START',
        'Quitar el fusible de la bomba de combustible y aliviar la presión (arrancar o dar arranque si se puede). Contacto OFF. Desconectar el conector del arranque. En M/T, mantener el embrague a fondo. Medir la tensión entre F9 terminal 1 (B/Y) y masa.',
        'Battery voltage when the ignition switch is in START position',
        'Remove the fuel pump fuse and release fuel pressure (crank or start the engine where possible). Turn ignition switch OFF. Disconnect the starter motor connector. On M/T, keep the clutch pedal fully depressed. Check voltage between starter motor harness connector F9 terminal 1 (B/Y) and ground.',
        'イグニッションがSTARTのときバッテリー電圧',
        'フューエルポンプヒューズを外し、燃圧を解放する（可能な場合はクランキングまたは始動）。イグニッションOFF。スタータコネクターを外す。M/Tではクラッチペダルを一杯に踏む。F9端子1（B/Y）とアース間を測定。'
      )
    ],
    f20_alt: [
      sm(
        'F20·4 (LG/B) terminal S',
        'SC-27',
        'Tensión de batería',
        'Desconectar el conector del alternador. Medir la tensión entre F20 terminal 4 (LG/B) y masa.',
        'Battery voltage',
        'Disconnect the alternator connector. Check voltage between alternator harness connector F20 terminal 4 (LG/B) and ground.',
        'バッテリー電圧',
        'オルタネーターコネクターを外す。F20端子4（LG/B）とアース間を測定。'
      ),
      sm(
        'F20·3 (W/R) terminal L',
        'SC-27',
        'El testigo de carga debe encenderse',
        'Desconectar el conector del alternador. Con el contacto ON, poner a masa el terminal 3 (W/R) de F20. El testigo de carga del cuadro debe encenderse.',
        'Charge warning lamp should light up',
        'Disconnect the alternator connector. Apply ground to alternator harness connector F20 terminal 3 (W/R) with the ignition switch in the ON position. The charge warning lamp should light up.',
        '充電警告灯が点灯すること',
        'オルタネーターコネクターを外す。イグニッションONでF20端子3（W/R）をアースする。コンビネーションメータの充電警告灯が点灯すること。'
      )
    ],
    alt_b: [
      sm(
        'E202·1 (B/GY) terminal B',
        'SC-28',
        'A masa: tensión de batería. Caída a borne (+) de batería, motor en ralentí y caliente: menos de 0.2 V',
        'Comprobar que el terminal B esté limpio y apretado. Medir la tensión entre E202 terminal 1 (B/GY) y masa, y (con el motor en marcha a ralentí, ya caliente) entre E202·1 y el borne positivo de la batería.',
        'To ground: Battery voltage. Voltage drop to the battery positive terminal, engine running at idle and warm: Less than 0.2 V',
        'Make sure the “B” terminal is clean and tight. Check voltage between alternator “B” terminal E202 terminal 1 (B/GY) and ground, and (engine running at idle and warm) between E202·1 and the battery positive terminal.',
        'アース間: バッテリー電圧。暖機アイドル時のバッテリー正極との電圧降下: 0.2 V未満',
        'B端子が清潔で確実に締まっていることを確認。E202端子1（B/GY）とアース間、および（暖機アイドル回転中）E202·1とバッテリー正極間を測定。'
      )
    ],
    alt_e: SM_NONE /* Ground terminal E211·2 to body ground E212; SC-22 / PG-53 give no voltage or resistance spec. */,
    f24_comp: [
      sm(
        'F24·1',
        'ATC-81',
        'Al aplicar tensión de batería (corriente continua) al terminal, debe oírse el funcionamiento del embrague magnético',
        'Contacto OFF. Desconectar el conector del IPDM y el del compresor. Comprobar antes la continuidad entre IPDM E8·33 (L/Y) y F24·1 (L/Y): debe existir. Luego aplicar tensión de batería en corriente continua al terminal y comprobar el sonido de funcionamiento.',
        'When applying battery voltage direct current to the terminal, an operation sound should be heard from the magnet clutch',
        'Ignition switch OFF. Disconnect the IPDM E/R connector and the compressor connector. First check continuity between IPDM E/R E8 terminal 33 (L/Y) and compressor F24 terminal 1 (L/Y): Continuity should exist. Then apply battery voltage direct current to the terminal and check the operation sound.',
        '端子にバッテリー電圧（直流）を加えると、マグネットクラッチの作動音がすること',
        'イグニッションOFF。IPDM E/Rコネクターとコンプレッサコネクターを外す。まずIPDM E8端子33（L/Y）とF24端子1（L/Y）の導通があることを確認。その後、端子にバッテリー電圧（直流）を加えて作動音を点検。'
      )
    ],
    f6_at: SM_NONE /* A/T assembly connector; this Coupe M/T FSM has no component-inspection value at F6. */,

    /* —— Body / carrocería cards —— */
    /* ABS actuator E51 (without VDC). BRC-33/34/35. */
    abs_e51: [
      sm(
        'E51·1 (SB)',
        'BRC-33',
        'Tensión de batería (aprox. 12 V)',
        'Contacto OFF. Desconectar el conector E51. Medir la tensión entre el terminal 1 (SB) y masa (alimentación del relé del actuador ABS).',
        'Battery voltage (approx. 12V)',
        'Ignition switch OFF. Disconnect ABS actuator and electric unit (control unit) connector E51. Check voltage between connector terminal 1 (SB) and ground (ABS actuator relay power).',
        'バッテリー電圧（約12 V）',
        'イグニッションOFF。ABSアクチュエータ＆コントロールユニットのコネクターE51を外す。端子1（SB）とアース間を測定（ABSアクチュエータリレー電源）。'
      ),
      sm(
        'E51·15 (R/B)',
        'BRC-33',
        'Tensión de batería (aprox. 12 V)',
        'Contacto OFF. Desconectar el conector E51. Medir la tensión entre el terminal 15 (R/B) y masa (alimentación del relé del motor ABS).',
        'Battery voltage (approx. 12V)',
        'Ignition switch OFF. Disconnect connector E51. Check voltage between connector terminal 15 (R/B) and ground (ABS motor relay power).',
        'バッテリー電圧（約12 V）',
        'イグニッションOFF。コネクターE51を外す。端子15（R/B）とアース間を測定（ABSモーターリレー電源）。'
      ),
      sm(
        'E51·16 (B) y E51·30 (B)',
        'BRC-34',
        'Debe existir continuidad a masa',
        'Comprobar el circuito de masa de la unidad ABS: entre los terminales 16 (B) y 30 (B) del conector E51 (lado arnés) y masa.',
        'Continuity should exist to ground',
        'Check the ABS actuator and electric unit (control unit) ground circuit between harness connector E51 terminals 16 (B) and 30 (B) and ground.',
        'アースとの導通があること',
        'ABSユニットのアース回路を点検。ハーネス側コネクターE51の端子16（B）および30（B）とアース間。'
      ),
      sm(
        'E51·17 (P/L)',
        'BRC-35',
        'Pedal de freno pisado: tensión de batería (aprox. 12 V). Pedal suelto: 0 V',
        'Contacto OFF. Desconectar el conector E51. Medir la tensión entre el terminal 17 (P/L) y masa.',
        'Brake pedal depressed: Battery voltage (approx. 12V). Brake pedal not depressed: 0V',
        'Ignition switch OFF. Disconnect connector E51. Check voltage between the connector terminal 17 (P/L) and ground.',
        'ブレーキペダルを踏んだとき: バッテリー電圧（約12 V）。離したとき: 0 V',
        'イグニッションOFF。コネクターE51を外す。端子17（P/L）とアース間を測定。'
      )
    ],
    /* Rear wheel sensors T5 (RR-RH pins 1-2, RR-LH pins 3-4). Active sensors: do not measure at the sensor terminals. BRC-29/30. */
    abs_t5: [
      sm(
        'T5 (sensores traseros)',
        'BRC-29',
        'No medir resistencia ni tensión entre los terminales del sensor con un polímetro (es un sensor activo)',
        'Precaución del SM. No ensanchar el terminal del conector con la punta del polímetro. Después de localizar el sensor con CONSULT-II (SELF-DIAG RESULTS), comprobar montaje, rotor y conector.',
        'Do not measure the resistance value and also voltage between the sensor terminal with tester etc., because the sensor is an active sensor',
        'FSM caution. Do not expand the terminal of the connector with a tester terminal stick. After using CONSULT-II SELF-DIAG RESULTS to determine the malfunctioning wheel sensor, check the mount, sensor rotor and connector.',
        'アクティブセンサのため、テスターなどでセンサ端子間の抵抗値および電圧を測定しないこと',
        'SMの注意。テスターの端子スティックでコネクター端子を広げないこと。CONSULT-IIのセルフ診断で不具合センサを特定したあと、取付け・センサロータ・コネクターを点検。'
      ),
      sm(
        'T5·1 (BR/W) – E51·28 (BR) y T5·2 (BR) – E51·13 (BR/W) (RR RH); T5·3 (OR) – E51·26 (OR) y T5·4 (P) – E51·11 (P) (RR LH)',
        'BRC-30',
        'Alimentación y señal: debe existir continuidad. Circuito de masa (señal o alimentación del actuador contra masa E51·16/30): no debe existir continuidad',
        'Contacto OFF. Desconectar T5 y E51. Comprobar también con el volante a uno y otro lado y moviendo el arnés en el paso de rueda.',
        'Power system and signal system: Continuity should exist. Ground system (actuator signal or power terminals to E51 grounds 16 and 30): Continuity should not exist',
        'Ignition switch OFF. Disconnect wheel sensor connector T5 (RR-RH, LH) and ABS control unit connector E51. Also check continuity when the steering wheel is turned right and left and when the sensor harness inside the wheel well is moved.',
        '電源系統・信号系統: 導通があること。アース系統（アクチュエータの信号または電源端子とE51のアース16/30間）: 導通がないこと',
        'イグニッションOFF。ホイールセンサコネクターT5（後右・後左）とABSコントロールユニットコネクターE51を外す。ステアリングを左右に切ったとき、およびホイールハウス内のハーネスを動かしたときも導通を確認。'
      )
    ],
    /* VDC/TCS/ABS control unit E118. BRC-129/135/136. */
    vdc_e118: [
      sm(
        'E118·26 (W/G), ·5 (G/OR), ·6 (PU/W), ·53 (R/W), ·49 (B/W), ·50 (R) a masa',
        'BRC-129',
        '6.0 - 11 Ω',
        'Contacto OFF. Desconectar el conector E118. Medir la resistencia entre cada terminal y masa (inspección de la señal de entrada de los solenoides).',
        '6.0 - 11Ω',
        'Ignition switch OFF. Disconnect the VDC/TCS/ABS control unit connector E118. Check the resistance between each terminal and ground (solenoid input signal inspection).',
        '6.0 - 11 Ω',
        'イグニッションOFF。VDC/TCS/ABSコントロールユニットのコネクターE118を外す。各端子とアース間の抵抗を測定（ソレノイド入力信号の点検）。'
      ),
      sm(
        'E118·55 (R/Y), ·3 (Y/G), ·4 (GY/R), ·25 (L/W), ·54 (W/L), ·52 (R/L) a masa',
        'BRC-129',
        '3.0 - 5.0 Ω',
        'Contacto OFF. Desconectar el conector E118. Medir la resistencia entre cada terminal y masa (inspección de la señal de entrada de los solenoides).',
        '3.0 - 5.0Ω',
        'Ignition switch OFF. Disconnect connector E118. Check the resistance between each terminal and ground (solenoid input signal inspection).',
        '3.0 - 5.0 Ω',
        'イグニッションOFF。コネクターE118を外す。各端子とアース間の抵抗を測定（ソレノイド入力信号の点検）。'
      ),
      sm(
        'E118·48 (P/L)',
        'BRC-135',
        'Pedal de freno pisado: tensión de batería (aprox. 12 V). Pedal suelto: aprox. 0 V',
        'Contacto OFF. Desconectar el conector de la unidad VDC/TCS/ABS. Medir la tensión entre E118 terminal 48 (P/L) y masa.',
        'Brake pedal depressed: Battery voltage (approx. 12V). Brake pedal not depressed: Approx. 0V',
        'Ignition switch OFF. Disconnect the VDC/TCS/ABS control unit connector. Check the voltage between E118 terminal 48 (P/L) and ground.',
        'ブレーキペダルを踏んだとき: バッテリー電圧（約12 V）。離したとき: 約0 V',
        'イグニッションOFF。VDC/TCS/ABSコントロールユニットのコネクターを外す。E118端子48（P/L）とアース間を測定。'
      ),
      sm(
        'E118·1 (G/R)',
        'BRC-136',
        'Tensión de batería (aprox. 12 V)',
        'Desconectar el conector E118. Con el contacto ON y OFF, medir la tensión entre el terminal 1 (G/R) (alimentación) y masa.',
        'Battery voltage (Approx. 12V)',
        'Disconnect VDC/TCS/ABS control unit connector E118. With the ignition switch turned on and off, check the voltage between terminal 1 (G/R) (power supply) and ground.',
        'バッテリー電圧（約12 V）',
        'コネクターE118を外す。イグニッションONおよびOFFで、端子1（G/R）（電源）とアース間の電圧を測定。'
      ),
      sm(
        'E118·28 (B) y E118·29 (B)',
        'BRC-136',
        'Debe existir continuidad a masa',
        'Desconectar el conector E118. Comprobar la continuidad entre los terminales 28 (B) y 29 (B) (masa) y masa.',
        'Continuity should exist to ground',
        'Disconnect connector E118. Check continuity between terminals 28 (B) and 29 (B) (ground) and ground.',
        'アースとの導通があること',
        'コネクターE118を外す。端子28（B）および29（B）（アース）とアース間の導通を確認。'
      )
    ],
    /* TCS OFF switch (BRC-78) and VDC OFF switch (BRC-138) share connector M9; same continuity check. */
    vdc_off_m9: [
      sm(
        'M9·1 – M9·2',
        'BRC-138',
        'Interruptor pulsado: debe existir continuidad. Interruptor suelto: no debe existir continuidad',
        'Contacto OFF. Desconectar el conector M9 del interruptor TCS OFF / VDC OFF. Comprobar la continuidad entre los terminales 1 (L/Y en VDC, BRC-138) y 2. El mismo criterio aparece en BRC-78 para TCS OFF.',
        'Continuity should exist when pushing the switch. Continuity should not exist when releasing the switch',
        'Ignition switch OFF. Disconnect the TCS OFF / VDC OFF switch connector M9, and check the continuity between terminals 1 (L/Y on the VDC procedure, BRC-138) and 2. The same check is published for the TCS OFF switch on BRC-78.',
        'スイッチを押しているとき: 導通があること。離しているとき: 導通がないこと',
        'イグニッションOFF。TCS OFF / VDC OFFスイッチのコネクターM9を外し、端子1（VDC手順BRC-138ではL/Y）と2の導通を確認。同じ点検がTCS OFFスイッチについてBRC-78にも記載。'
      )
    ],
    /* Steering angle sensor M22. BRC-125/126. */
    vdc_m22: [
      sm(
        'M22·3 (Y/R) – E118·2 (Y/R)',
        'BRC-125',
        'Debe existir continuidad',
        'Contacto OFF. Desconectar el conector del sensor de ángulo de volante M22 y el de la unidad VDC/TCS/ABS. Comprobar la continuidad entre E118 terminal 2 (Y/R) y M22 terminal 3 (Y/R).',
        'Continuity should exist',
        'Ignition switch OFF. Disconnect the steering angle sensor connector M22 and the VDC/TCS/ABS control unit connector. Check the continuity between E118 terminal 2 (Y/R) and M22 terminal 3 (Y/R).',
        '導通があること',
        'イグニッションOFF。ステアリング角度センサのコネクターM22とVDC/TCS/ABSコントロールユニットのコネクターを外す。E118端子2（Y/R）とM22端子3（Y/R）の導通を確認。'
      ),
      sm(
        'Señal de ángulo (Data Monitor)',
        'BRC-126',
        'Al frente: -5 deg a +5 deg. 90° a la derecha: aprox. +90 deg. 90° a la izquierda: aprox. -90 deg',
        'Conectar los conectores. En CONSULT-II, Data Monitor de STEERING ANGLE SIGNAL, comprobar si el estado es normal.',
        'Straight-ahead: -5deg - +5deg. Turn wheel to the right by 90°: Approx. +90deg. Turn wheel to the left by 90°: Approx. -90deg',
        'Connect the steering angle sensor and VDC/TCS/ABS control unit connectors. Conduct Data Monitor of the STEERING ANGLE SIGNAL to check if the status is normal.',
        '直進: -5 deg〜+5 deg。右に90°: 約+90 deg。左に90°: 約-90 deg',
        'コネクターを接続する。CONSULT-IIのData MonitorでSTEERING ANGLE SIGNALが正常か確認。'
      )
    ],
    /* Yaw rate / side G sensor M51. BRC-127. */
    vdc_m51: [
      sm(
        'M51 a E118 (arnés)',
        'BRC-127',
        'Debe existir continuidad en cada par: M51·5 (LG)–E118·18 (LG); M51·3 (OR)–E118·34 (W/B); M51·2 (Y/B)–E118·77 (Y/B); M51·1 (L/B)–E118·78 (L/R); M51·4 (LG/R)–E118·79 (GY/L); M51·6 (W/R)–E118·80 (W/R)',
        'Contacto OFF. Desconectar el conector del sensor de giro/aceleración lateral y el de la unidad VDC/TCS/ABS. Comprobar la continuidad entre los conectores del lado vehículo.',
        'Continuity should exist on each pair: M51·5 (LG)–E118·18 (LG); M51·3 (OR)–E118·34 (W/B); M51·2 (Y/B)–E118·77 (Y/B); M51·1 (L/B)–E118·78 (L/R); M51·4 (LG/R)–E118·79 (GY/L); M51·6 (W/R)–E118·80 (W/R)',
        'Ignition switch OFF. Disconnect the yaw rate/side G sensor connector and the VDC/TCS/ABS control unit connector. Check the continuity between the vehicle-side connectors.',
        '各対で導通があること: M51·5（LG）–E118·18（LG）; M51·3（OR）–E118·34（W/B）; M51·2（Y/B）–E118·77（Y/B）; M51·1（L/B）–E118·78（L/R）; M51·4（LG/R）–E118·79（GY/L）; M51·6（W/R）–E118·80（W/R）',
        'イグニッションOFF。ヨーレート/横GセンサとVDC/TCS/ABSコントロールユニットのコネクターを外し、車両側コネクター間の導通を確認。'
      ),
      sm(
        'Sensor de guiñada / aceleración lateral (Data Monitor)',
        'BRC-127',
        'Detenido: guiñada -4 a +4 deg/s; aceleración lateral -1.1 a +1.1 m/s². Giro a la derecha: valores negativos. Giro a la izquierda: valores positivos',
        'Conectar los conectores. Con Data Monitor comprobar si los sensores son normales.',
        'When stopped: yaw rate -4 to +4 deg/s; side G -1.1 to +1.1 m/s². Right turn: Negative value. Left turn: Positive value',
        'Connect the yaw rate sensor/side G sensor and VDC/TCS/ABS control unit connectors. Use Data Monitor to check if the yaw rate sensor/side G sensor are normal.',
        '停車時: ヨーレート -4〜+4 deg/s、横G -1.1〜+1.1 m/s²。右旋回: 負の値。左旋回: 正の値',
        'コネクターを接続し、Data Monitorでヨーレートセンサ/横Gセンサが正常か確認。'
      )
    ],
    /* BCM connector M90 power and related pins. WW-16 / WW-44 / BL-41 / LT-166 / BL-50. */
    bcm_m90: [
      sm(
        'M90·38 (W/L)',
        'WW-16',
        'Contacto OFF: aprox. 0 V. Contacto ON: tensión de batería',
        'Contacto OFF. Desconectar el conector del BCM. Medir la tensión entre M90 terminal 38 (W/L) y masa (alimentación IGN ON). El mismo valor aparece en WW-44.',
        'Ignition switch OFF: Approx. 0V. Ignition switch ON: Battery voltage',
        'Ignition switch OFF. Disconnect the BCM connector. Check voltage between M90 terminal 38 (W/L) and ground (ignition ON supply). The same value is published on WW-44.',
        'イグニッションOFF: 約0 V。イグニッションON: バッテリー電圧',
        'イグニッションOFF。BCMコネクターを外し、M90端子38（W/L）とアース間を測定（イグニッションON電源）。同じ値はWW-44にも記載。'
      ),
      sm(
        'M90·37 (B/R) (interruptor de llave)',
        'BL-41',
        'Llave insertada: tensión de batería. Llave extraída: 0 V',
        'Sin CONSULT-II. Medir la tensión entre el conector del BCM M90 terminal 37 (B/R) y masa.',
        'Key is inserted: Battery voltage. Key is removed: 0V',
        'Without CONSULT-II. Check voltage between BCM connector M90 terminal 37 (B/R) and ground.',
        'キー挿入時: バッテリー電圧。キー抜去時: 0 V',
        'CONSULT-IIを使わず、BCMコネクターM90端子37（B/R）とアース間を測定。'
      ),
      sm(
        'M90·29 (G/R) – M153·2 (PU)',
        'LT-166',
        'Debe existir continuidad',
        'Contacto OFF. Desconectar el BCM y el interruptor de emergencia. Comprobar la continuidad entre M90 terminal 29 (G/R) y M153 terminal 2 (PU).',
        'Continuity should exist',
        'Ignition switch OFF. Disconnect the BCM connector and the hazard switch connector. Check continuity between M90 terminal 29 (G/R) and M153 terminal 2 (PU).',
        '導通があること',
        'イグニッションOFF。BCMとハザードスイッチのコネクターを外し、M90端子29（G/R）とM153端子2（PU）の導通を確認。'
      ),
      sm(
        'M90·30 (P) (pulsador del portón)',
        'BL-50',
        'Pulsador ON: 0 V. Pulsador OFF: tensión de batería (si el ahorro de batería de luces interiores está OFF: aprox. 5 V)',
        'Medir entre M90 terminal 30 (P) y masa, con la puerta del conductor desbloqueada, al pulsar el abridor del portón.',
        'Back door opener switch ON: 0V. Switch OFF: Battery voltage (when interior lamp battery saver control is in OFF position: Approx. 5V)',
        'Check voltage between BCM connector M90 terminal 30 (P) and ground. Press the back door opener switch when the driver side door is unlocked.',
        'オープナーON: 0 V。OFF: バッテリー電圧（室内灯バッテリーセーバー制御がOFFのときは約5 V）',
        '運転席ドアがアンロックの状態でバックドアオープナースイッチを押し、BCMコネクターM90端子30（P）とアース間を測定。'
      )
    ],
    /* BCM connector M91 battery feeds and ground. WW-16 / BL-38. */
    bcm_m91: [
      sm(
        'M91·42 (GY)',
        'WW-16',
        'Tensión de batería con el contacto OFF y ON',
        'Contacto OFF. Desconectar el conector del BCM. Medir la tensión entre M91 terminal 42 (GY) y masa (alimentación de batería). El mismo valor aparece en BL-38 y WW-44.',
        'Battery voltage with the ignition switch OFF and ON',
        'Ignition switch OFF. Disconnect the BCM connector. Check voltage between M91 terminal 42 (GY) and ground (battery power supply). The same value is published on BL-38 and WW-44.',
        'イグニッションOFFおよびONでバッテリー電圧',
        'イグニッションOFF。BCMコネクターを外し、M91端子42（GY）とアース間を測定（バッテリー電源）。同じ値はBL-38とWW-44にも記載。'
      ),
      sm(
        'M91·55 (R)',
        'WW-16',
        'Tensión de batería con el contacto OFF y ON',
        'Contacto OFF. Desconectar el conector del BCM. Medir la tensión entre M91 terminal 55 (R) y masa (alimentación de batería). El mismo valor aparece en BL-38 y WW-44.',
        'Battery voltage with the ignition switch OFF and ON',
        'Ignition switch OFF. Disconnect the BCM connector. Check voltage between M91 terminal 55 (R) and ground (battery power supply). The same value is published on BL-38 and WW-44.',
        'イグニッションOFFおよびONでバッテリー電圧',
        'イグニッションOFF。BCMコネクターを外し、M91端子55（R）とアース間を測定（バッテリー電源）。同じ値はBL-38とWW-44にも記載。'
      ),
      sm(
        'M91·52 (B)',
        'WW-16',
        'Debe existir continuidad a masa',
        'Comprobar la continuidad entre M91 terminal 52 (B) y masa. El mismo valor aparece en BL-38 y WW-44.',
        'Continuity should exist to ground',
        'Check continuity between BCM harness connector M91 terminal 52 (B) and ground. The same value is published on BL-38 and WW-44.',
        'アースとの導通があること',
        'M91端子52（B）とアース間の導通を確認。同じ値はBL-38とWW-44にも記載。'
      )
    ],
    /* BCM body connector B83: door switch and rear wiper. GW-44 / WW-48 / WW-49. */
    bcm_b83: [
      sm(
        'B83·62 (W) (interruptor puerta conductor)',
        'GW-44',
        'Puerta cerrada: tensión de batería. Puerta abierta: 0 V. Con el conector del interruptor desconectado, a masa: tensión de batería',
        'Medir entre B83 terminal 62 (W) y masa (señal del interruptor de la puerta del conductor). Con el interruptor y el BCM desconectados, 62 (W) a masa: no debe existir continuidad.',
        'Door closed: Battery voltage. Door open: 0V. With the door switch disconnected, 62 to ground: Battery voltage (BCM output)',
        'Check voltage between BCM connector B83 terminal 62 (W) and ground (driver door switch signal). With the door switch and BCM disconnected, continuity between 62 and ground should not exist; with the BCM connected, voltage to ground is battery voltage.',
        'ドア閉: バッテリー電圧。ドア開: 0 V。スイッチを外した状態でアース間はバッテリー電圧（BCM出力）',
        'BCMコネクターB83端子62（W）とアース間を測定（運転席ドアスイッチ信号）。スイッチとBCMを外した状態では62とアースの導通がないこと。BCM接続時はアース間がバッテリー電圧。'
      ),
      sm(
        'B83·70 (SB) – D106·4 (SB)',
        'WW-48',
        'Debe existir continuidad. B83·70 a masa: no debe existir continuidad',
        'Contacto OFF. Desconectar el BCM y el motor del limpialuneta. Comprobar la continuidad entre B83 terminal 70 (SB) y D106 terminal 4 (SB), y entre 70 (SB) y masa.',
        'Continuity should exist. B83·70 to ground: Continuity should not exist',
        'Ignition switch OFF. Disconnect the BCM connector and the rear wiper motor connector. Check continuity between B83 terminal 70 (SB) and D106 terminal 4 (SB), and between 70 (SB) and ground.',
        '導通があること。B83·70とアース間: 導通がないこと',
        'イグニッションOFF。BCMとリヤワイパーモーターのコネクターを外し、B83端子70（SB）とD106端子4（SB）の導通、および70（SB）とアース間の導通を確認。'
      ),
      sm(
        'B83·59 (OR) – D106·2 (OR)',
        'WW-49',
        'Debe existir continuidad. B83·59 a masa: no debe existir continuidad',
        'Contacto OFF. Desconectar el BCM y el motor del limpialuneta. Comprobar la continuidad entre B83 terminal 59 (OR) y D106 terminal 2 (OR), y entre 59 (OR) y masa (circuito de auto-stop).',
        'Continuity should exist. B83·59 to ground: Continuity should not exist',
        'Ignition switch OFF. Disconnect the BCM connector and the rear wiper motor connector. Check continuity between B83 terminal 59 (OR) and D106 terminal 2 (OR), and between 59 (OR) and ground (auto stop circuit).',
        '導通があること。B83·59とアース間: 導通がないこと',
        'イグニッションOFF。BCMとリヤワイパーモーターのコネクターを外し、B83端子59（OR）とD106端子2（OR）の導通、および59（OR）とアース間の導通を確認（オートストップ回路）。'
      )
    ],
    /* Ignition key switch (insert). BL-41. */
    key_m25: [
      sm(
        'M25·1 – M25·2',
        'BL-41',
        'Llave insertada en el cilindro de arranque: debe existir continuidad. Llave extraída: no debe existir continuidad',
        'Contacto OFF. Desconectar el conector del interruptor de llave. Comprobar la continuidad entre los terminales 1 y 2.',
        'Key is inserted in ignition key cylinder: Continuity Yes. Key is removed from ignition key cylinder: Continuity No',
        'Ignition switch OFF. Disconnect the key switch connector. Check continuity between key switch terminals 1 and 2.',
        'イグニッションキーシリンダにキーが挿入されているとき: 導通あり。抜かれているとき: 導通なし',
        'イグニッションOFF。キースイッチのコネクターを外し、端子1と2の導通を確認。'
      )
    ],
    /* Security indicator lamp M34. BL-160. */
    sec_m34: [
      sm(
        'M34·1 (R/W)',
        'BL-160',
        'Tensión de batería',
        'Desconectar el conector del testigo de seguridad. Medir la tensión entre M34 terminal 1 (R/W) y masa (alimentación; fusible 19 10A del J/B).',
        'Battery voltage',
        'Disconnect the security indicator lamp connector. Check voltage between security indicator lamp connector M34 terminal 1 (R/W) and ground (power supply; 10A fuse No. 19 in the fuse block J/B).',
        'バッテリー電圧',
        'セキュリティインジケーターランプのコネクターを外し、M34端子1（R/W）とアース間を測定（電源。J/Bの10AヒューズNo.19）。'
      )
    ],
    /* Remote keyless entry receiver M78. BL-93/94. */
    rke_m78: [
      sm(
        'M78·4 (Y) – M90·19 (Y)',
        'BL-93',
        'Debe existir continuidad. M78·4 a masa: no debe existir continuidad',
        'Contacto OFF. Desconectar el receptor del mando y el BCM. Comprobar la continuidad entre M78 terminal 4 (Y) y M90 terminal 19 (Y), y entre 4 (Y) y masa.',
        'Continuity should exist. M78·4 to ground: Continuity should not exist',
        'Ignition switch OFF. Disconnect the remote keyless entry receiver connector and the BCM connector. Check continuity between M78 terminal 4 (Y) and M90 terminal 19 (Y), and between 4 (Y) and ground.',
        '導通があること。M78·4とアース間: 導通がないこと',
        'イグニッションOFF。リモートキーレスエントリー受信機とBCMのコネクターを外し、M78端子4（Y）とM90端子19（Y）の導通、および4（Y）とアース間の導通を確認。'
      ),
      sm(
        'M78·2 (L) – M90·20 (L)',
        'BL-94',
        'Debe existir continuidad. M78·2 a masa: no debe existir continuidad',
        'Contacto OFF. Desconectar el receptor y el BCM. Comprobar la continuidad entre M78 terminal 2 (L) y M90 terminal 20 (L), y entre 2 (L) y masa. La forma de la señal de salida se comprueba con osciloscopio (figura en BL-94).',
        'Continuity should exist. M78·2 to ground: Continuity should not exist',
        'Ignition switch OFF. Disconnect the remote keyless entry receiver and BCM connectors. Check continuity between M78 terminal 2 (L) and M90 terminal 20 (L), and between 2 (L) and ground. The output signal waveform is checked with an oscilloscope (figure on BL-94).',
        '導通があること。M78·2とアース間: 導通がないこと',
        'イグニッションOFF。受信機とBCMのコネクターを外し、M78端子2（L）とM90端子20（L）の導通、および2（L）とアース間の導通を確認。出力信号波形はオシロスコープで確認（BL-94の図）。'
      )
    ],
    /* Tire pressure warning check connector M79. WT-22. */
    tpms_m79: [
      sm(
        'M79 (conector de comprobación)',
        'WT-22',
        'Poner a masa el terminal del conector de comprobación para entrar en el modo de resultados de autodiagnosis (el testigo de presión baja parpadea y suena el zumbador)',
        'El BCM del sistema de presión de neumáticos tiene función de diagnóstico. Con el contacto ON, la lámpara de aviso debe encenderse 1 segundo y apagarse si el sistema está en orden (WT-29). No hay tabla de tensión o resistencia publicada en el propio M79.',
        'Ground the terminal of the tire pressure warning check connector to start the self-diagnostic results mode (the warning lamp flashes and the buzzer sounds)',
        'The BCM of the low tire pressure warning system has a trouble diagnosis function. With the ignition switch ON, the warning lamp comes on immediately and turns off after 1 second when the system is OK (WT-29). No voltage or resistance table is published at M79 itself.',
        'タイヤ空気圧警告点検コネクターの端子をアースすると、セルフ診断結果モードが始まる（警告灯が点滅し、ブザーが鳴る）',
        '低圧タイヤ警告システムのBCMには故障診断機能がある。イグニッションONで、システム正常時は警告灯が直ちに点灯し1秒後に消灯する（WT-29）。M79自体に電圧・抵抗の表は掲載されていない。'
      )
    ],
    /* Combination switch M29. LT-175/176. */
    comb_sw_m29: [
      sm(
        'M29 a M90 (arnés del sistema sospechoso)',
        'LT-175',
        'Debe existir continuidad entre cada par del sistema: sistema 1 M90·6 (YG)–M29·6 (YG) y M90·36 (W/R)–M29·1 (W/R); sistema 2 M90·5 (Y/R)–M29·7 (Y/R) y M90·35 (W/G)–M29·2 (W/G); sistema 3 M90·4 (PU/W)–M29·10 (PU/W) y la salida 3 correspondiente',
        'Contacto OFF. Desconectar el BCM y el interruptor combinado. Comprobar la continuidad entre los terminales del BCM del sistema sospechoso y los del interruptor combinado (tabla LT-175).',
        'Continuity should exist (Yes) between each suspect-system pair: system 1 M90·6 (YG)–M29·6 (YG) and M90·36 (W/R)–M29·1 (W/R); system 2 M90·5 (Y/R)–M29·7 (Y/R) and M90·35 (W/G)–M29·2 (W/G); system 3 M90·4 (PU/W)–M29·10 (PU/W) and the matching output 3',
        'Ignition switch OFF. Disconnect the BCM and combination switch connectors. Check for continuity between the BCM harness connector of the suspect system and the corresponding combination switch connector terminals (table on LT-175).',
        '疑わしい系統の各対で導通があること（Yes）。系統1 M90·6（YG）–M29·6（YG）およびM90·36（W/R）–M29·1（W/R）; 系統2 M90·5（Y/R）–M29·7（Y/R）およびM90·35（W/G）–M29·2（W/G）; 系統3 M90·4（PU/W）–M29·10（PU/W）と対応する出力3',
        'イグニッションOFF。BCMとコンビネーションスイッチのコネクターを外し、疑わしい系統のBCM端子とコンビネーションスイッチ端子間の導通を確認（LT-175の表）。'
      ),
      sm(
        'M29·1 (W/R), ·2 (W/G), ·3 (W/L), ·4 (G), ·5 (G/B) a masa',
        'LT-176',
        'Comprobar la forma de onda de tensión de cada terminal de salida del BCM en el interruptor combinado (figura SKIA4976E)',
        'Luces y limpiaparabrisas en OFF, dial del intermitente del limpia en posición 4. Conectar el BCM y el interruptor combinado. Medir cada terminal (+) del sistema sospechoso contra masa.',
        'Check the BCM output terminal voltage waveform of the suspect system (figure SKIA4976E)',
        'Turn lighting switch and wiper switch OFF. Set wiper dial position 4. Connect the BCM and combination switch connectors, and check the BCM output terminal voltage waveform of the suspect malfunctioning system: M29 terminals 1 (W/R), 2 (W/G), 3 (W/L), 4 (G) or 5 (G/B) to ground.',
        'コンビネーションスイッチ側でBCM出力端子の電圧波形を点検（図 SKIA4976E）',
        'ライトおよびワイパーをOFF、ワイパーダイヤル位置4。BCMとコンビネーションスイッチのコネクターを接続し、疑わしい系統の出力端子（M29の1（W/R）、2（W/G）、3（W/L）、4（G）または5（G/B））とアース間の波形を確認。'
      )
    ],
    /* Hazard switch M153. LT-166/167. */
    hazard_m153: [
      sm(
        'M153·2 (PU)',
        'LT-166',
        'Interruptor de emergencia ON: aprox. 0 V. Interruptor OFF: aprox. 5 V',
        'Sin CONSULT-II. Medir la tensión entre M153 terminal 2 (PU) y masa.',
        'Hazard switch is ON: Approx. 0V. Hazard switch is OFF: Approx. 5V',
        'Without CONSULT-II. Check voltage between hazard switch harness connector M153 terminal 2 (PU) and ground.',
        'ハザードスイッチON: 約0 V。OFF: 約5 V',
        'CONSULT-IIを使わず、ハザードスイッチハーネスコネクターM153端子2（PU）とアース間を測定。'
      ),
      sm(
        'M153·1 (B)',
        'LT-167',
        'Debe existir continuidad a masa',
        'Comprobar la continuidad entre M153 terminal 1 (B) y masa.',
        'Continuity should exist to ground',
        'Check continuity between hazard switch harness connector M153 terminal 1 (B) and ground.',
        'アースとの導通があること',
        'ハザードスイッチハーネスコネクターM153端子1（B）とアース間の導通を確認。'
      ),
      sm(
        'M153·1 – M153·2',
        'LT-167',
        'Interruptor ON: debe existir continuidad. Interruptor OFF: no debe existir continuidad',
        'Comprobar la continuidad del interruptor de emergencia entre los terminales 1 y 2.',
        'Hazard switch is ON: Continuity Yes. Hazard switch is OFF: Continuity No',
        'Check continuity of the hazard switch between terminals 1 and 2.',
        'スイッチON: 導通あり。OFF: 導通なし',
        'ハザードスイッチの端子1と2の導通を点検。'
      )
    ],
    /* Map lamp Coupe R52. LT-233. */
    map_r52: [
      sm(
        'R52·3 – R52·2',
        'LT-233',
        'Interruptor en DOOR: debe existir continuidad. Interruptor en OFF: no debe existir continuidad',
        'Desconectar el conector de la luz de mapa. Comprobar la continuidad entre los terminales de la lámpara.',
        'Map lamp switch is DOOR: Continuity Yes. Map lamp switch is OFF: Continuity No',
        'Disconnect the map lamp connector. Check continuity between the map lamp terminals 3 and 2.',
        'マップランプスイッチがDOOR: 導通あり。OFF: 導通なし',
        'マップランプのコネクターを外し、端子3と2の導通を確認。'
      ),
      sm(
        'R52·2 (PU/W) – M91·48 (P)',
        'LT-233',
        'Debe existir continuidad',
        'Desconectar el BCM. Comprobar la continuidad entre M91 terminal 48 (P) y R52 terminal 2 (PU/W).',
        'Continuity should exist',
        'Disconnect the BCM connector. Check continuity between BCM harness connector M91 terminal 48 (P) and map lamp harness connector R52 terminal 2 (PU/W).',
        '導通があること',
        'BCMコネクターを外し、M91端子48（P）とR52端子2（PU/W）の導通を確認。'
      )
    ],
    /* Luggage room lamp T13. LT-236. */
    lug_t13: [
      sm(
        'T13·1 (Y)',
        'LT-236',
        'Tensión de batería. T13·1 a masa (circuito en corto): no debe existir continuidad',
        'Contacto ON. Medir la tensión entre T13 terminal 1 (Y) y masa. Luego, con el BCM desconectado, comprobar que no hay continuidad entre T13·1 (Y) y masa, y que sí la hay entre M91·41 (R/B) y T13·1 (Y), y entre B83·64 (R/W) y T13·2 (R/W).',
        'Battery voltage. T13·1 to ground (short circuit check): Continuity should not exist',
        'Turn ignition switch ON. Check voltage between luggage room lamp harness connector T13 terminal 1 (Y) and ground. Then, with the BCM disconnected, check continuity between T13·1 (Y) and ground (should not exist), between M91·41 (R/B) and T13·1 (Y) (should exist), and between B83·64 (R/W) and T13·2 (R/W) (should exist).',
        'バッテリー電圧。T13·1とアース間（短絡点検）: 導通がないこと',
        'イグニッションON。荷物室ランプハーネスコネクターT13端子1（Y）とアース間を測定。その後BCMを外し、T13·1（Y）とアース間に導通がないこと、M91·41（R/B）とT13·1（Y）、B83·64（R/W）とT13·2（R/W）に導通があることを確認。'
      )
    ],
    /* Daytime light control unit connector E14 (Canada). LT-81. */
    dtrl_e14: [
      sm(
        'E14·1 (W/R) (alternador L)',
        'LT-81',
        'Contacto ON: aprox. 0 V. Motor en marcha: tensión de batería. Contacto OFF: aprox. 0 V',
        'Valores de referencia de la unidad de luces diurnas (Canadá). Medir en las condiciones indicadas.',
        'When turning ignition switch to ON: Approx. 0V. When engine is running: Battery voltage. When turning ignition switch to OFF: Approx. 0V',
        'Terminals and reference values for the daytime light control unit (Canada). Check under the stated conditions.',
        'イグニッションON: 約0 V。エンジン回転中: バッテリー電圧。イグニッションOFF: 約0 V',
        'デイタイムライトコントロールユニット（カナダ仕様）の端子基準値。記載の条件で測定。'
      ),
      sm(
        'E14·5 (BR) (luz alta derecha, entrada)',
        'LT-81',
        'Tensión de batería al poner el interruptor de luces en HI BEAM',
        'Valores de referencia de la unidad de luces diurnas (Canadá), señal del interruptor de luces (LH/RH high beam en el terminal 5 según la tabla, BR).',
        'Battery voltage when turning lighting switch to HI BEAM',
        'Terminals and reference values for the daytime light control unit (Canada), lighting switch (RH hi beam) input.',
        'ライトスイッチをHI BEAMにしたときバッテリー電圧',
        'デイタイムライトコントロールユニット（カナダ仕様）の端子基準値。ライトスイッチ（右ハイビーム）入力。'
      ),
      sm(
        'E14·6 (L) (luz alta derecha, salida)',
        'LT-81',
        'Interruptor en 2.ª con HI BEAM o FLASH TO PASS: tensión de batería. Luces diurnas (freno de mano suelto, motor en marcha, luces OFF): aprox. 6 V',
        'Calzar las ruedas y dejar la palanca en N o P. Valores de referencia de la unidad de luces diurnas (Canadá).',
        'Lighting switch turned to the 2ND position with HI BEAM or FLASH TO PASS: Battery voltage. Daytime light operation (parking brake released, engine running, lighting switch OFF): Approx. 6V',
        'CAUTION: Block wheels and ensure selector lever is in N or P position. Terminals and reference values for the daytime light control unit (Canada).',
        'ライトスイッチ2NDでHI BEAMまたはFLASH TO PASS: バッテリー電圧。デイタイムライト作動（パーキングブレーキ解除、エンジン回転中、ライトOFF）: 約6 V',
        '車輪を止め、セレクトレバーをNまたはPにすること。デイタイムライトコントロールユニット（カナダ仕様）の端子基準値。'
      )
    ],
    /* Daytime light control unit connector E15 (Canada). LT-81. */
    dtrl_e15: [
      sm(
        'E15·9 (Y/G) (luz alta izquierda, salida / masa de hi beam)',
        'LT-81',
        'Interruptor en 2.ª con HI BEAM o FLASH TO PASS: aprox. 0 V. Luces diurnas (freno de mano suelto, motor en marcha, luces OFF): aprox. 6 V',
        'Calzar las ruedas y dejar la palanca en N o P. Valores de referencia de la unidad de luces diurnas (Canadá).',
        'Lighting switch turned to the 2ND position with HI BEAM or FLASH TO PASS: Approx. 0V. Daytime light operation (parking brake released, engine running, lighting switch OFF): Approx. 6V',
        'CAUTION: Block wheels and ensure selector lever is in N or P position. Terminals and reference values for the daytime light control unit (Canada), LH hi beam (ground).',
        'ライトスイッチ2NDでHI BEAMまたはFLASH TO PASS: 約0 V。デイタイムライト作動（パーキングブレーキ解除、エンジン回転中、ライトOFF）: 約6 V',
        '車輪を止め、セレクトレバーをNまたはPにすること。デイタイムライトコントロールユニット（カナダ仕様）の端子基準値（左ハイビーム・アース）。'
      ),
      sm(
        'E15·17 (G) (freno de mano)',
        'LT-81',
        'Freno de mano suelto: tensión de batería. Freno de mano puesto: aprox. 0 V',
        'Valores de referencia de la unidad de luces diurnas (Canadá), interruptor de freno de mano.',
        'When parking brake is released: Battery voltage. When parking brake is applied: Approx. 0V',
        'Terminals and reference values for the daytime light control unit (Canada), parking brake switch.',
        'パーキングブレーキ解除: バッテリー電圧。パーキングブレーキ作動: 約0 V',
        'デイタイムライトコントロールユニット（カナダ仕様）の端子基準値。パーキングブレーキスイッチ。'
      )
    ],
    /* Ambient sensor E34. ATC-97/99. */
    amb_e34: [
      sm(
        'E34·1 (Y/G)',
        'ATC-97',
        'Aprox. 5 V a masa',
        'Desconectar el conector del sensor. Contacto ON. Medir la tensión entre E34 terminal 1 (Y/G) y masa.',
        'Approx. 5V to ground',
        'Disconnect the ambient sensor connector. Turn ignition switch ON. Check voltage between ambient sensor harness connector E34 terminal 1 (Y/G) and ground.',
        'アース間 約5 V',
        'センサコネクターを外す。イグニッションON。E34端子1（Y/G）とアース間を測定。'
      ),
      sm(
        'E34·1 – E34·2 (lado sensor)',
        'ATC-99',
        'Tras desconectar E34, medir la resistencia entre los terminales 1 y 2 del lado del sensor. -15 °C (5 °F): 12.73 kΩ; -10 (14): 9.92; -5 (23): 7.80; 0 (32): 6.19; 5 (41): 4.95; 10 (50): 3.99; 15 (59): 3.24; 20 (68): 2.65; 25 (77): 2.19; 30 (86): 1.81; 35 (95): 1.51; 40 (104): 1.27; 45 (113): 1.07',
        'Inspección del componente. Si no coincide, sustituir el sensor de temperatura exterior.',
        'After disconnecting ambient sensor connector E34, measure resistance between terminals 1 and 2 at sensor side, using the table: -15 °C (5 °F): 12.73 kΩ; -10 (14): 9.92; -5 (23): 7.80; 0 (32): 6.19; 5 (41): 4.95; 10 (50): 3.99; 15 (59): 3.24; 20 (68): 2.65; 25 (77): 2.19; 30 (86): 1.81; 35 (95): 1.51; 40 (104): 1.27; 45 (113): 1.07',
        'Component inspection. If NG, replace the ambient sensor.',
        'アンビエントセンサコネクターE34を外し、センサ側端子1と2の間の抵抗を表で確認。-15 °C（5 °F）: 12.73 kΩ; -10（14）: 9.92; -5（23）: 7.80; 0（32）: 6.19; 5（41）: 4.95; 10（50）: 3.99; 15（59）: 3.24; 20（68）: 2.65; 25（77）: 2.19; 30（86）: 1.81; 35（95）: 1.51; 40（104）: 1.27; 45（113）: 1.07',
        'コンポーネント点検。不適合の場合はアンビエントセンサを交換。'
      )
    ],
    /* Blower motor M62. ATC-78. Duty-ratio table is a figure, not transcribed. */
    blower_m62: [
      sm(
        'M62·2 (G)',
        'ATC-78',
        'Las relaciones de trabajo habituales de la señal de mando al variar el ventilador entre Lo y Hi están en la tabla de ATC-78 (figura). Si el caudal no cambia, usar esa misma tabla',
        'Volver a conectar el motor y el amplificador unificado de A/C. Contacto ON. Variar el ventilador entre Lo y Hi y confirmar las relaciones de trabajo entre M62 terminal 2 (G) y masa con osciloscopio.',
        'Usual terminal 2 (G) drive signal duty ratios while varying fan speed between Lo and Hi are shown in the table on ATC-78 (figure). If the fan air flow does not change, the same table applies',
        'Reconnect the blower motor connector and the unified meter and A/C amp. connector. Turn ignition switch ON. Vary the fan speed between Lo and Hi and confirm the duty ratios between M62 terminal 2 (G) and ground using an oscilloscope.',
        'ファン速度をLo〜Hiで変化させたときの端子2（G）駆動信号の通常デューティ比はATC-78の表（図）を参照。風量が変化しない場合も同じ表を使う',
        'ブロアモーターとunified meter and A/C amp.のコネクターを再接続。イグニッションON。ファン速度をLoとHiの間で変え、オシロスコープでM62端子2（G）とアース間のデューティ比を確認。'
      ),
      sm(
        'Motor del ventilador',
        'ATC-78',
        'Debe girar con suavidad. No debe haber partículas extrañas dentro de la unidad',
        'Inspección del componente (blower motor).',
        'Confirm smooth rotation of the blower motor. Ensure that there are no foreign particles inside the blower unit',
        'Component inspection of the blower motor.',
        'ブロアモーターが滑らかに回転すること。ブロアユニット内に異物がないこと',
        'ブロアモーターのコンポーネント点検。'
      )
    ],
    /* Front wiper motor E52. WW-23/26/27. */
    wiper_e52: [
      sm(
        'E52·4 (B)',
        'WW-23',
        'Debe existir continuidad a masa',
        'Comprobar la continuidad entre E52 terminal 4 (B) y masa.',
        'Continuity should exist to ground',
        'Check continuity between front wiper motor harness connector E52 terminal 4 (B) and ground.',
        'アースとの導通があること',
        'フロントワイパーモーターハーネスコネクターE52端子4（B）とアース間の導通を確認。'
      ),
      sm(
        'E52·3 (PU) – E7·21 (PU)',
        'WW-26',
        'Debe existir continuidad. E7·21 a masa: no debe existir continuidad. Con el limpia en LO (ACTIVE TEST o auto active test): tensión de batería en E7·21 a masa',
        'Contacto OFF. Desconectar el IPDM y el motor. Comprobar la continuidad; luego reconectar y medir la tensión con el limpia en LO.',
        'Continuity should exist. E7·21 to ground: Continuity should not exist. During LO operation (ACTIVE TEST or auto active test): Battery voltage at E7·21 to ground',
        'Ignition switch OFF. Disconnect the IPDM E/R connector and the front wiper motor connector. Check continuity between E7 terminal 21 (PU) and E52 terminal 3 (PU). Then reconnect and check voltage between E7 terminal 21 (PU) and ground while front wiper LO is operating.',
        '導通があること。E7·21とアース間: 導通がないこと。LO作動中（ACTIVE TESTまたはオートアクティブテスト）: E7·21とアース間はバッテリー電圧',
        'イグニッションOFF。IPDM E/Rとフロントワイパーモーターのコネクターを外し、E7端子21（PU）とE52端子3（PU）の導通を確認。再接続後、LO作動中にE7端子21（PU）とアース間の電圧を測定。'
      ),
      sm(
        'E52·2 (L/B) – E7·31 (L/B)',
        'WW-27',
        'Debe existir continuidad. E7·31 a masa: no debe existir continuidad. Con el limpia en HI: tensión de batería en E7·31 a masa',
        'Contacto OFF. Desconectar el IPDM y el motor. Comprobar la continuidad; luego reconectar y medir la tensión con el limpia en HI.',
        'Continuity should exist. E7·31 to ground: Continuity should not exist. During HI operation: Battery voltage at E7·31 to ground',
        'Ignition switch OFF. Disconnect the IPDM E/R connector and the front wiper motor connector. Check continuity between E7 terminal 31 (L/B) and E52 terminal 2 (L/B). Then reconnect and check voltage between E7 terminal 31 (L/B) and ground while front wiper HI is operating.',
        '導通があること。E7·31とアース間: 導通がないこと。HI作動中: E7·31とアース間はバッテリー電圧',
        'イグニッションOFF。IPDM E/Rとフロントワイパーモーターのコネクターを外し、E7端子31（L/B）とE52端子2（L/B）の導通を確認。再接続後、HI作動中にE7端子31（L/B）とアース間の電圧を測定。'
      )
    ],
    /* Rear wiper motor D106. WW-47/49. */
    wiper_d106: [
      sm(
        'D106·4 (SB)',
        'WW-47',
        'Con el interruptor del limpialuneta ON: tensión de batería a masa',
        'Con el interruptor del limpialuneta en ON, medir la tensión entre D106 terminal 4 (SB) y masa.',
        'With rear wiper switch ON: Battery voltage to ground',
        'With rear wiper switch ON, check voltage between rear wiper motor harness connector D106 terminal 4 (SB) and ground.',
        'リヤワイパースイッチONでアース間がバッテリー電圧',
        'リヤワイパースイッチONで、リヤワイパーモーターハーネスコネクターD106端子4（SB）とアース間を測定。'
      ),
      sm(
        'D106·1 (B)',
        'WW-47',
        'Debe existir continuidad a masa',
        'Contacto OFF. Desconectar el motor. Comprobar la continuidad entre D106 terminal 1 (B) y masa.',
        'Continuity should exist to ground',
        'Turn ignition switch OFF. Disconnect the rear wiper motor connector. Check continuity between D106 terminal 1 (B) and ground.',
        'アースとの導通があること',
        'イグニッションOFF。モーターコネクターを外し、D106端子1（B）とアース間の導通を確認。'
      ),
      sm(
        'D106·2 (OR)',
        'WW-49',
        'Limpia parado: tensión de batería. Limpia en marcha: aprox. 0 V',
        'Conectar el BCM y el motor. Contacto ON. Medir entre D106 terminal 2 (OR) y masa con el limpialuneta parado y en marcha (señal de auto-stop).',
        'Wiper stopped: Battery voltage. Wiper operating: Approx. 0V',
        'Connect the BCM connector and the rear wiper motor connector. Turn ignition switch ON. Check voltage between D106 terminal 2 (OR) and ground while the rear wiper motor is stopped and while it is operating (auto stop signal).',
        'ワイパー停止: バッテリー電圧。作動中: 約0 V',
        'BCMとモーターのコネクターを接続。イグニッションON。リヤワイパー停止中および作動中にD106端子2（OR）とアース間を測定（オートストップ信号）。'
      )
    ],
    /* Power window main switch D7. GW-27/47. */
    pw_d7: [
      sm(
        'D7·1 (W)',
        'GW-47',
        'Tensión de batería',
        'Contacto ON. Medir la tensión entre D7 terminal 1 (W) y masa (alimentación de batería). La tabla de referencia de GW-27 también indica tensión de batería en el terminal 1.',
        'Battery voltage',
        'Turn ignition switch ON. Check voltage between power window main switch connector D7 terminal 1 (W) and ground (BAT power supply). The reference-value table on GW-27 also lists battery voltage at terminal 1.',
        'バッテリー電圧',
        'イグニッションON。パワーウィンドウメインスイッチコネクターD7端子1（W）とアース間を測定（バッテリー電源）。GW-27の基準値表でも端子1はバッテリー電圧。'
      ),
      sm(
        'D7·10 (SB)',
        'GW-47',
        'Tensión de batería (contacto ON, y también durante 45 s después de pasar a OFF)',
        'Contacto ON. Medir entre D7 terminal 10 (SB) y masa (señal RAP). GW-27: tensión de batería con IGN ON y dentro de los 45 s posteriores a IGN OFF.',
        'Battery voltage (ignition ON, and also within 45 seconds after the ignition switch is turned to OFF)',
        'Turn ignition switch ON. Check voltage between D7 terminal 10 (SB) and ground (RAP signal). GW-27 lists battery voltage with IGN SW ON and within 45 seconds after the ignition switch is turned to OFF.',
        'バッテリー電圧（イグニッションON、およびOFF後45秒以内）',
        'イグニッションON。D7端子10（SB）とアース間を測定（RAP信号）。GW-27ではIGN ON、およびイグニッションOFF後45秒以内もバッテリー電圧。'
      ),
      sm(
        'D7·8 (L) y D7·11 (G) (mandos UP/DOWN del motor del conductor)',
        'GW-27',
        'Al subir el cristal: tensión de batería en el terminal 8. Al bajar: tensión de batería en el terminal 11',
        'Tabla de referencia del interruptor principal. Condición: cuando el motor del elevalunas del conductor opera UP o DOWN.',
        'When the driver side power window motor is in UP operation: Battery voltage at terminal 8. In DOWN operation: Battery voltage at terminal 11',
        'Terminal and reference value for the power window main switch. Condition: when the driver side power window motor is in UP or DOWN operation.',
        '運転席パワーウィンドウモーター上昇作動時: 端子8がバッテリー電圧。下降作動時: 端子11がバッテリー電圧',
        'パワーウィンドウメインスイッチの端子基準値。運転席パワーウィンドウモーターがUPまたはDOWN作動しているとき。'
      ),
      sm(
        'D7·15 (B)',
        'GW-47',
        'Debe existir continuidad a masa. Referencia: aprox. 0 V',
        'Contacto OFF. Desconectar el interruptor principal. Comprobar la continuidad entre D7 terminal 15 y masa. GW-27 indica aprox. 0 V en el terminal 15 (masa).',
        'Continuity should exist to ground. Reference value: Approx. 0V',
        'Turn ignition switch OFF. Disconnect the power window main switch connector. Check continuity between D7 terminal 15 and ground. GW-27 lists approximately 0 V at terminal 15 (ground).',
        'アースとの導通があること。基準値: 約0 V',
        'イグニッションOFF。メインスイッチのコネクターを外し、D7端子15とアース間の導通を確認。GW-27では端子15（アース）は約0 V。'
      )
    ],
    /* Power window sub-switch D37. GW-28. */
    pw_sub_d37: [
      sm(
        'D37·10 (W)',
        'GW-28',
        'Tensión de batería',
        'Tabla de referencia del subinterruptor: alimentación de batería, terminal 10.',
        'Battery voltage',
        'Terminal and reference value for the power window sub-switch: BAT power supply, terminal 10.',
        'バッテリー電圧',
        'パワーウィンドウサブスイッチの端子基準値。バッテリー電源、端子10。'
      ),
      sm(
        'D37·8 (L) y D37·9 (G)',
        'GW-28',
        'Al subir el cristal del acompañante: tensión de batería en el terminal 8. Al bajar: tensión de batería en el terminal 9',
        'Tabla de referencia del subinterruptor, cuando el motor del acompañante opera UP o DOWN.',
        'When the passenger side power window motor is in UP operation: Battery voltage at terminal 8. In DOWN operation: Battery voltage at terminal 9',
        'Terminal and reference value for the power window sub-switch, when the passenger side power window motor is in UP or DOWN operation.',
        '助手席パワーウィンドウモーター上昇作動時: 端子8がバッテリー電圧。下降作動時: 端子9がバッテリー電圧',
        'パワーウィンドウサブスイッチの端子基準値。助手席パワーウィンドウモーターがUPまたはDOWN作動しているとき。'
      ),
      sm(
        'D37·11 (B) y D37·3 (GY)',
        'GW-28',
        'Aprox. 0 V (masa, y masa del limit switch/encoder)',
        'Tabla de referencia del subinterruptor.',
        'Approx. 0V (ground, and limit switch/encoder ground)',
        'Terminal and reference value for the power window sub-switch, terminals 11 (ground) and 3 (limit switch and encoder ground).',
        '約0 V（アース、およびリミットスイッチ/エンコーダアース）',
        'パワーウィンドウサブスイッチの端子基準値。端子11（アース）および端子3（リミットスイッチ/エンコーダアース）。'
      )
    ],
    /* Driver power window motor D9. GW-34. */
    pw_motor_d9: [
      sm(
        'D9·1 (G) y D9·2 (L)',
        'GW-34',
        'Contacto ON. Interruptor UP: D9·1 aprox. 0 V, D9·2 tensión de batería. Interruptor DOWN: D9·1 tensión de batería, D9·2 aprox. 0 V',
        'Operar el interruptor principal y medir la tensión entre cada terminal del motor y masa. Continuidad del arnés, contacto OFF: D7·8 (L)–D9·2 (L) y D7·11 (G)–D9·1 (G) deben tener continuidad.',
        'Ignition switch ON. Main switch UP: D9·1 approx. 0V, D9·2 battery voltage. Main switch DOWN: D9·1 battery voltage, D9·2 approx. 0V',
        'Operate the power window main switch and check voltage between the driver side power window motor connector and ground. Harness continuity, ignition switch OFF: continuity should exist between D7·8 (L)–D9·2 (L) and D7·11 (G)–D9·1 (G).',
        'イグニッションON。メインスイッチUP: D9·1 約0 V、D9·2 バッテリー電圧。DOWN: D9·1 バッテリー電圧、D9·2 約0 V',
        'パワーウィンドウメインスイッチを操作し、運転席パワーウィンドウモーターコネクターとアース間を測定。ハーネス導通はイグニッションOFFで、D7·8（L）–D9·2（L）およびD7·11（G）–D9·1（G）に導通があること。'
      )
    ],
    /* Passenger power window motor D38. GW-34. */
    pw_motor_d38: [
      sm(
        'D38·1 (G) y D38·2 (L)',
        'GW-34',
        'Contacto ON. Subinterruptor en cierre: D38·1 aprox. 0 V, D38·2 tensión de batería. En apertura: D38·1 tensión de batería',
        'Operar el subinterruptor y medir la tensión entre cada terminal del motor del acompañante y masa.',
        'Ignition switch ON. Sub-switch closing: D38·1 approx. 0V, D38·2 battery voltage. Sub-switch opening: D38·1 battery voltage',
        'Operate the power window sub-switch and check voltage between the passenger side power window motor connector and ground.',
        'イグニッションON。サブスイッチ閉じ側: D38·1 約0 V、D38·2 バッテリー電圧。開き側: D38·1 バッテリー電圧',
        'パワーウィンドウサブスイッチを操作し、助手席パワーウィンドウモーターコネクターとアース間を測定。'
      )
    ],
    /* Driver door switch B17. GW-44 / BL-40. */
    door_sw_b17: [
      sm(
        'B17·1 a masa del interruptor',
        'GW-44',
        'Interruptor pulsado (puerta cerrada): no debe existir continuidad. Interruptor suelto (puerta abierta): debe existir continuidad',
        'Comprobar la continuidad entre el terminal 1 del interruptor de puerta (conductor) y la parte de masa del propio interruptor. El mismo criterio está en BL-40.',
        'Switch pushed (door closed): Continuity No. Switch released (door open): Continuity Yes',
        'Check continuity between door switch (driver side) terminal 1 and the ground part of the door switch. The same check is published on BL-40.',
        'スイッチが押されている（ドア閉）: 導通なし。離されている（ドア開）: 導通あり',
        '運転席ドアスイッチの端子1とドアスイッチのアース部の導通を確認。同じ点検はBL-40にも記載。'
      ),
      sm(
        'B17·1 (P o W) – M90·12 (P) o B83·62 (W)',
        'GW-44',
        'Debe existir continuidad. Terminal 1 a masa de carrocería: no debe existir continuidad',
        'Contacto OFF. Desconectar el interruptor y el BCM. En GW-44 el conductor va a B83·62 (W) y el acompañante a M90·12 (P); comprobar el par que corresponda a esta ficha (conductor B17).',
        'Continuity should exist. Terminal 1 to body ground: Continuity should not exist',
        'Ignition switch OFF. Disconnect the door switch and BCM connectors. On GW-44 the driver switch goes to B83·62 (W) and the passenger switch to M90·12 (P); check the pair that belongs to this card (driver B17).',
        '導通があること。端子1とボディアース間: 導通がないこと',
        'イグニッションOFF。ドアスイッチとBCMのコネクターを外す。GW-44では運転席はB83·62（W）、助手席はM90·12（P）。このカード（運転席B17）に該当する対を確認。'
      )
    ],
    /* Passenger door switch B23. GW-44 / BL-40. */
    door_sw_b23: [
      sm(
        'B23·1 a masa del interruptor',
        'GW-44',
        'Interruptor pulsado (puerta cerrada): no debe existir continuidad. Interruptor suelto (puerta abierta): debe existir continuidad',
        'Comprobar la continuidad entre el terminal 1 del interruptor de puerta (acompañante) y la parte de masa del propio interruptor. El mismo criterio está en BL-40.',
        'Switch pushed (door closed): Continuity No. Switch released (door open): Continuity Yes',
        'Check continuity between door switch (passenger side) terminal 1 and the ground part of the door switch. The same check is published on BL-40.',
        'スイッチが押されている（ドア閉）: 導通なし。離されている（ドア開）: 導通あり',
        '助手席ドアスイッチの端子1とドアスイッチのアース部の導通を確認。同じ点検はBL-40にも記載。'
      ),
      sm(
        'B23·1 (P) – M90·12 (P)',
        'GW-44',
        'Debe existir continuidad. Terminal 1 a masa de carrocería: no debe existir continuidad',
        'Contacto OFF. Desconectar el interruptor y el BCM. En GW-44 el acompañante va a M90·12 (P).',
        'Continuity should exist. Terminal 1 to body ground: Continuity should not exist',
        'Ignition switch OFF. Disconnect the door switch and BCM connectors. On GW-44 the passenger switch goes to M90·12 (P).',
        '導通があること。端子1とボディアース間: 導通がないこと',
        'イグニッションOFF。ドアスイッチとBCMのコネクターを外す。GW-44では助手席はM90·12（P）。'
      )
    ],
    /* Driver door lock actuator D11. BL-46. */
    door_lock_d11: [
      sm(
        'D11·3 (Y) – M91·44 (Y) y D11·1 (PU) – M91·50 (PU)',
        'BL-46',
        'Debe existir continuidad. M91·44 y ·50 a masa: no debe existir continuidad. En M91, al pasar el interruptor a UNLOCK, 44 (Y) va de 0 V a tensión de batería y vuelve a 0 V; al pasar a LOCK, lo mismo en 50 (PU)',
        'Desconectar el BCM. Comprobar la continuidad del arnés. La señal de mando se mide en el BCM (M91) con el contacto OFF, entre esos terminales y masa.',
        'Continuity should exist. M91·44 and ·50 to ground: Continuity should not exist. At M91, when the driver door lock/unlock switch is turned to UNLOCK, 44 (Y) goes 0V → battery voltage → 0V; when turned to LOCK, 50 (PU) does the same',
        'Disconnect the BCM connector. Check harness continuity. The actuator signal is checked at the BCM (M91), ignition switch OFF, between those terminals and ground.',
        '導通があること。M91·44および·50とアース間: 導通がないこと。M91では、運転席ロック/アンロックスイッチをUNLOCKにすると44（Y）が0 V→バッテリー電圧→0 V、LOCKにすると50（PU）が同様',
        'BCMコネクターを外し、ハーネスの導通を確認。アクチュエータ信号はイグニッションOFFでBCM（M91）の当該端子とアース間で測定。'
      )
    ],
    /* Passenger door lock actuator D40. BL-47. */
    door_lock_d40: [
      sm(
        'D40·1 (PU) – M91·50 (PU) y D40·3 (GY) – M91·51 (W/R)',
        'BL-47',
        'Debe existir continuidad. M91·50 y ·51 a masa: no debe existir continuidad. En M91, al pasar el interruptor a LOCK, 50 (PU) va de 0 V a tensión de batería y vuelve a 0 V; al pasar a UNLOCK, lo mismo en 51 (W/R)',
        'Desconectar el BCM. Comprobar la continuidad del arnés. La señal se mide en el BCM (M91) entre esos terminales y masa.',
        'Continuity should exist. M91·50 and ·51 to ground: Continuity should not exist. At M91, when the door lock/unlock switch is turned to LOCK, 50 (PU) goes 0V → battery voltage → 0V; when turned to UNLOCK, 51 (W/R) does the same',
        'Disconnect the BCM connector. Check harness continuity. The actuator signal is checked at the BCM (M91) between those terminals and ground.',
        '導通があること。M91·50および·51とアース間: 導通がないこと。M91では、ロック/アンロックスイッチをLOCKにすると50（PU）が0 V→バッテリー電圧→0 V、UNLOCKにすると51（W/R）が同様',
        'BCMコネクターを外し、ハーネスの導通を確認。アクチュエータ信号はBCM（M91）の当該端子とアース間で測定。'
      )
    ],
    /* Door key cylinder switch D12. GW-50. */
    key_cyl_d12: [
      sm(
        'D12·1 (SB) – D12·2 (B) y D12·3 (R) – D12·2 (B)',
        'GW-50',
        '1–2: Neutral/Lock sin continuidad, Unlock con continuidad. 3–2: Neutral/Unlock sin continuidad, Lock con continuidad. Además D12·2 a masa: debe existir continuidad',
        'Comprobar la continuidad entre los terminales 1, 3 y 2 según la posición de la llave. También D7·6 (R)–D12·3 (R) y D7·7 (SB)–D12·1 (SB): debe existir continuidad (arnés, contacto OFF).',
        '1–2: Neutral/Lock continuity No, Unlock continuity Yes. 3–2: Neutral/Unlock continuity No, Lock continuity Yes. Also D12·2 to ground: Continuity should exist',
        'Check continuity between door key cylinder switch connector D12 terminals 1, 3 and 2 according to key position. Also, ignition switch OFF, continuity should exist between D7·6 (R)–D12·3 (R) and D7·7 (SB)–D12·1 (SB).',
        '1–2: Neutral/Lockは導通なし、Unlockは導通あり。3–2: Neutral/Unlockは導通なし、Lockは導通あり。またD12·2とアース間は導通があること',
        'キー位置に応じてD12端子1、3と2の導通を確認。イグニッションOFFでD7·6（R）–D12·3（R）およびD7·7（SB）–D12·1（SB）にも導通があること。'
      )
    ],
    /* Back door switch T12. BL-89. */
    back_door_t12: [
      sm(
        'T12·1 – T12·3',
        'BL-89',
        'Portón abierto: debe existir continuidad. Además T12·3 (B) a masa: debe existir continuidad',
        'Comprobar la continuidad entre los terminales 1 y 3 del interruptor del portón, y entre el terminal 3 (B) y masa.',
        'Open position: Continuity Yes. Also T12·3 (B) to ground: Continuity should exist',
        'Check continuity between back door switch terminals 1 and 3. Check continuity between door switch harness connector T12 terminal 3 (B) and ground.',
        '開位置: 導通あり。またT12·3（B）とアース間は導通があること',
        'バックドアスイッチ端子1と3の導通、およびハーネスコネクターT12端子3（B）とアース間の導通を確認。'
      )
    ],
    /* Back door opener switch T103. BL-50. */
    back_opener_t103: [
      sm(
        'T103·1 – T103·2',
        'BL-50',
        'Pulsador ON: debe existir continuidad. Pulsador OFF: no debe existir continuidad. T103·1 (P) – M90·30 (P): debe existir continuidad',
        'Comprobar la continuidad entre los terminales 1 y 2 del pulsador. Contacto OFF, desconectar BCM y pulsador: continuidad entre M90·30 (P) y T103·1 (P).',
        'Back door opener switch ON: Continuity Yes. Switch OFF: Continuity No. T103·1 (P) – M90·30 (P): Continuity should exist',
        'Check continuity between back door opener switch terminals 1 and 2. Ignition switch OFF, disconnect the BCM and the switch: check continuity between M90 terminal 30 (P) and T103 terminal 1 (P).',
        'オープナーON: 導通あり（OFFの行はBL-50の表の続き）。T103·1（P）–M90·30（P）: 導通があること',
        'オープナースイッチ端子1と2の導通を確認。イグニッションOFFでBCMとスイッチを外し、M90端子30（P）とT103端子1（P）の導通を確認。'
      )
    ],
    /* Back door opener actuator T11. BL-52. */
    back_opener_t11: [
      sm(
        'T11·1 (PU) – B83·68 (PU); T11·2 (B) a masa',
        'BL-52',
        'Debe existir continuidad en ambos casos',
        'Contacto OFF. Desconectar el BCM y el actuador. Comprobar la continuidad entre B83 terminal 68 (PU) y T11 terminal 1 (PU), y entre T11 terminal 2 (B) y masa.',
        'Continuity should exist in both checks',
        'Ignition switch OFF. Disconnect the BCM and the back door opener actuator. Check continuity between B83 terminal 68 (PU) and T11 terminal 1 (PU), and between T11 terminal 2 (B) and ground.',
        'どちらも導通があること',
        'イグニッションOFF。BCMとバックドアオープナーアクチュエータを外し、B83端子68（PU）とT11端子1（PU）、およびT11端子2（B）とアース間の導通を確認。'
      )
    ],
    /* Fuel lid opener switch M13. BL-60/61. */
    fuel_lid_m13: [
      sm(
        'M13·1 – M13·2',
        'BL-60',
        'Pulsado (ON): debe existir continuidad. Suelto (OFF): no debe existir continuidad. M13·2 (B) a masa: debe existir continuidad',
        'Comprobar la continuidad entre los terminales 1 y 2, y entre el terminal 2 y masa (BL-61). También M13·1 (L/R) – B83·58 (Y/B): debe existir continuidad; 58 a masa: no debe existir.',
        'ON (Pushed): Continuity Yes. OFF (Released): Continuity No. M13·2 (B) to ground: Continuity should exist',
        'Check continuity between fuel lid opener switch harness connector M13 terminals 1 and 2, and between terminal 2 and ground (BL-61). Also continuity should exist between M13·1 (L/R) and B83·58 (Y/B); 58 to ground should not exist.',
        'ON（押した状態）: 導通あり。OFF（離した状態）: 導通なし。M13·2（B）とアース間: 導通があること',
        'フューエルリッドオープナースイッチM13端子1と2の導通、および端子2とアース間（BL-61）を確認。M13·1（L/R）とB83·58（Y/B）は導通あり、58とアース間は導通なし。'
      )
    ],
    /* Fuel lid opener actuator T19. BL-60. */
    fuel_lid_t19: [
      sm(
        'T19·1 (PU) – B83·70 (PU); T19·2 (B) a masa',
        'BL-60',
        'T19·1–B83·70: debe existir continuidad. T19·1 a masa: no debe existir. T19·2 a masa: debe existir continuidad',
        'Desconectar el BCM y el actuador. Comprobar esas continuidades.',
        'T19·1–B83·70: Continuity should exist. T19·1 to ground: Continuity should not exist. T19·2 to ground: Continuity should exist',
        'Disconnect the BCM connector and the fuel lid opener actuator connector. Check those continuities.',
        'T19·1–B83·70: 導通があること。T19·1とアース間: 導通がないこと。T19·2とアース間: 導通があること',
        'BCMとフューエルリッドオープナーアクチュエータのコネクターを外し、それらの導通を確認。'
      )
    ],
    /* Driver door mirror (defogger pins). GW-80. */
    mirror_d2: [
      sm(
        'D2·2 (SB)',
        'GW-80',
        'Desempañador ON: tensión de batería. Desempañador OFF: 0 V',
        'Contacto OFF, desconectar el conector del espejo; luego contacto ON. Operar el interruptor del desempañador y medir entre D2 terminal 2 (SB) y masa.',
        'Rear window defogger switch ON: Battery voltage. Switch OFF: 0V',
        'Turn ignition switch OFF and disconnect the driver side door mirror defogger connector, then turn ignition switch ON. Operate the rear window defogger switch and check voltage between D2 terminal 2 (SB) and ground.',
        'リヤデフォッガースイッチON: バッテリー電圧。OFF: 0 V',
        'イグニッションOFFで運転席ドアミラーデフォッガーのコネクターを外し、イグニッションON。リヤデフォッガースイッチを操作し、D2端子2（SB）とアース間を測定。'
      ),
      sm(
        'D2·1 (B)',
        'GW-80',
        'Debe existir continuidad a masa',
        'Contacto OFF. Comprobar la continuidad entre D2 terminal 1 (B) y masa. El SM indica a continuación comprobar la continuidad del filament del espejo, sin publicar un valor en ohmios.',
        'Continuity should exist to ground',
        'Turn ignition switch OFF. Check continuity between driver side door mirror defogger connector D2 terminal 1 (B) and ground. The FSM then says to check door mirror defogger filament continuity, but publishes no ohm value.',
        'アースとの導通があること',
        'イグニッションOFF。運転席ドアミラーデフォッガーコネクターD2端子1（B）とアース間の導通を確認。その後SMはフィラメントの導通点検を指示するが、抵抗値は掲載していない。'
      )
    ],
    /* Passenger door mirror (defogger pins). GW-80/81. */
    mirror_d32: [
      sm(
        'D32·2 (L)',
        'GW-80',
        'Desempañador ON: tensión de batería. Desempañador OFF: 0 V',
        'Contacto ON. Desconectar el conector del espejo del acompañante. Operar el interruptor del desempañador y medir entre D32 terminal 2 (L) y masa.',
        'Rear window defogger switch ON: Battery voltage. Switch OFF: 0V',
        'Turn ignition switch ON. Disconnect the passenger side door mirror defogger connector. Operate the rear window defogger switch and check voltage between D32 terminal 2 (L) and ground.',
        'リヤデフォッガースイッチON: バッテリー電圧。OFF: 0 V',
        'イグニッションON。助手席ドアミラーデフォッガーのコネクターを外す。リヤデフォッガースイッチを操作し、D32端子2（L）とアース間を測定。'
      ),
      sm(
        'D32·1 (B)',
        'GW-81',
        'Debe existir continuidad a masa',
        'Contacto OFF. Comprobar la continuidad entre D32 terminal 1 (B) y masa. El SM indica comprobar la continuidad del filament, sin publicar un valor en ohmios.',
        'Continuity should exist to ground',
        'Turn ignition switch OFF. Check continuity between passenger side door mirror defogger connector D32 terminal 1 and ground. The FSM then says to check door mirror defogger filament continuity, but publishes no ohm value.',
        'アースとの導通があること',
        'イグニッションOFF。助手席ドアミラーデフォッガーコネクターD32端子1とアース間の導通を確認。その後SMはフィラメントの導通点検を指示するが、抵抗値は掲載していない。'
      )
    ],
    /* Rear window defogger relay B34. GW-76. */
    defog_b34: [
      sm(
        'B34·1',
        'GW-76',
        'Tensión de batería a masa (el color es G o P según el SM)',
        'Contacto OFF. Retirar el relé del desempañador. Medir la tensión entre B34 terminal 1 y masa (alimentación del relé).',
        'Battery voltage to ground (the wire colour is G or P in the FSM)',
        'Turn ignition switch OFF. Remove the rear window defogger relay. Check voltage between rear window defogger relay connector B34 terminal 1 and ground (relay power supply).',
        'アース間はバッテリー電圧（SMでは線色はGまたはP）',
        'イグニッションOFF。リヤデフォッガーリレーを外し、B34端子1とアース間を測定（リレー電源）。'
      ),
      sm(
        'Relé B34 (bobina 1–2, contactos 3–5 y 6–7)',
        'GW-76',
        'Al alimentar 12 V CC entre 1 y 2: debe existir continuidad entre 3 y 5, y entre 6 y 7. Sin alimentación: no debe existir continuidad en esos pares',
        'Retirar el relé. Comprobar la continuidad de los contactos con y sin alimentación de 12 V entre los terminales 1 y 2.',
        'With 12V direct current supplied between terminals 1 and 2: Continuity Yes between 3 and 5, and between 6 and 7. No current supply: Continuity No on those pairs',
        'Remove the rear window defogger relay. Check continuity between relay terminals 3 and 5, and 6 and 7, with and without 12V direct current between terminals 1 and 2.',
        '端子1と2に12 V直流を加えると、3–5および6–7に導通あり。電流を加えないときはそれらの導通なし',
        'リヤデフォッガーリレーを外し、端子1と2に12 V直流を加えたときと加えないときで、端子3と5、および6と7の導通を確認。'
      )
    ],
    /* Rear window defogger (Roadster) B202. GW-79. */
    defog_b202: [
      sm(
        'B202·1 – B34·5',
        'GW-79',
        'Debe existir continuidad entre B34·5 (B/W) y B202·1 (B)',
        'Contacto OFF. Desconectar el relé del desempañador. Comprobar la continuidad entre el conector del relé B34 terminal 5 y el conector del desempañador B202 terminal 1.',
        'Continuity should exist between B34·5 (B/W) and B202·1 (B)',
        'Turn ignition switch OFF. Disconnect the rear window defogger relay connector. Check continuity between rear window defogger relay connector B34 terminal 5 and rear window defogger connector B202 terminal 1.',
        'B34·5（B/W）とB202·1（B）の間に導通があること',
        'イグニッションOFF。リヤデフォッガーリレーのコネクターを外し、B34端子5とリヤデフォッガーコネクターB202端子1の導通を確認。'
      )
    ],
    /* Rear window defogger Coupe D104/D211. GW-77/78. */
    defog_d104: [
      sm(
        'D104·1 (B/W)',
        'GW-77',
        'Desempañador ON: tensión de batería. Desempañador OFF: 0 V',
        'Medir la tensión entre D104 terminal 1 (B/W) y masa, operando el interruptor del desempañador.',
        'Rear window defogger switch ON: Battery voltage. Switch OFF: 0V',
        'Check voltage between rear window defogger connector D104 terminal 1 (B/W) and ground while operating the rear window defogger switch.',
        'リヤデフォッガースイッチON: バッテリー電圧。OFF: 0 V',
        'リヤデフォッガースイッチを操作し、D104端子1（B/W）とアース間を測定。'
      ),
      sm(
        'D211·2 (B)',
        'GW-77',
        'Debe existir continuidad a masa',
        'Contacto OFF. Desconectar el conector del desempañador. Comprobar la continuidad entre D211 terminal 2 (B) y masa. B34·5/·7 (B/W) a D104·1 (B/W): debe existir continuidad; esos terminales a masa: no debe existir (GW-78).',
        'Continuity should exist to ground',
        'Turn ignition switch OFF. Disconnect the rear window defogger connector. Check continuity between D211 terminal 2 (B) and ground. Continuity should exist between B34 terminals 5 and 7 (B/W) and D104 terminal 1 (B/W); those relay terminals to ground should not have continuity (GW-78).',
        'アースとの導通があること',
        'イグニッションOFF。リヤデフォッガーのコネクターを外し、D211端子2（B）とアース間の導通を確認。B34端子5/7（B/W）とD104端子1（B/W）は導通あり、それらのリレー端子とアース間は導通なし（GW-78）。'
      )
    ],
    /* Audio unit M40 (pins 1-10). AV-28/36. */
    audio_m40: [
      sm(
        'M40·6 (Y)',
        'AV-36',
        'Tensión de batería con el contacto OFF, ACC y ON',
        'Medir la tensión entre M40 terminal 6 (Y) y masa (alimentación de batería). El mismo valor aparece en AV-28 (contacto OFF, tensión de batería).',
        'Battery voltage with the ignition switch OFF, ACC and ON',
        'Check voltage between audio unit harness connector M40 terminal 6 (Y) and ground (battery power supply). AV-28 also lists battery voltage at this terminal with the ignition switch OFF.',
        'イグニッションOFF、ACC、ONでバッテリー電圧',
        'オーディオユニットハーネスコネクターM40端子6（Y）とアース間を測定（バッテリー電源）。AV-28でもイグニッションOFFでバッテリー電圧。'
      ),
      sm(
        'M40·10 (LG)',
        'AV-36',
        'Contacto OFF: 0 V. ACC u ON: tensión de batería',
        'Medir la tensión entre M40 terminal 10 (LG) y masa (alimentación ACC). AV-28 indica tensión de batería con el contacto en ACC.',
        'Ignition switch OFF: 0V. ACC or ON: Battery voltage',
        'Check voltage between M40 terminal 10 (LG) and ground (ACC power supply). AV-28 lists battery voltage with the ignition switch in ACC.',
        'イグニッションOFF: 0 V。ACCまたはON: バッテリー電圧',
        'M40端子10（LG）とアース間を測定（ACC電源）。AV-28ではイグニッションACCでバッテリー電圧。'
      ),
      sm(
        'M40·5 (G/W)',
        'AV-28',
        'Aprox. 12 V (contacto ON, señal de antena, salida)',
        'Tabla de referencia de la unidad de audio (sistema base), entre el terminal 5 y masa.',
        'Approx. 12V (ignition switch ON, antenna signal, output)',
        'Terminals and reference value for the audio unit for the base system, between terminal 5 and ground.',
        '約12 V（イグニッションON、アンテナ信号、出力）',
        'ベースシステム用オーディオユニットの端子基準値。端子5とアース間。'
      ),
      sm(
        'M40·8 (R/L)',
        'AV-28',
        'Interruptor de luces ON: aprox. 12 V. Interruptor OFF: aprox. 0 V',
        'Contacto ON. Tabla de referencia, señal del interruptor de luces entre el terminal 8 y masa.',
        'Lighting switch ON: Approx. 12V. Lighting switch OFF: Approx. 0V',
        'Ignition switch ON. Terminals and reference value, lighting switch signal between terminal 8 and ground.',
        'ライトスイッチON: 約12 V。OFF: 約0 V',
        'イグニッションON。端子基準値。端子8とアース間のライトスイッチ信号。'
      ),
      sm(
        'M40·7 (R/Y)',
        'AV-28',
        'Cambia entre aprox. 0 y aprox. 12 V al operar el control de iluminación con el interruptor de luces en ON',
        'Contacto ON. Tabla de referencia, señal de control de iluminación.',
        'Changes between approx. 0 and approx. 12V when the illumination control switch is operated with the lighting switch in the ON position',
        'Ignition switch ON. Terminals and reference value, illumination control signal.',
        'ライトスイッチONでイルミネーションコントロールスイッチを操作すると、約0 Vと約12 Vの間で変化',
        'イグニッションON。端子基準値。イルミネーションコントロール信号。'
      )
    ],
    /* Audio unit M41 (pins 11-16), BOSE system. AV-29. */
    audio_m41: [
      sm(
        'M41·12 (G/Y)',
        'AV-29',
        'Aprox. 12 V (contacto ON, señal Amp. ON, salida)',
        'Tabla de referencia de la unidad de audio para sistema Bose, entre el terminal 12 y masa.',
        'Approx. 12V (ignition switch ON, Amp. ON signal, output)',
        'Terminals and reference value for the audio unit for the BOSE system, between terminal 12 and ground.',
        '約12 V（イグニッションON、Amp. ON信号、出力）',
        'BOSEシステム用オーディオユニットの端子基準値。端子12とアース間。'
      ),
      sm(
        'M41·11 (malla)',
        'AV-29',
        'Aprox. 0 V (contacto ON, shield)',
        'Tabla de referencia de la unidad de audio para sistema Bose.',
        'Approx. 0V (ignition switch ON, shield)',
        'Terminals and reference value for the audio unit for the BOSE system, terminal 11 (shield) to ground.',
        '約0 V（イグニッションON、シールド）',
        'BOSEシステム用オーディオユニットの端子基準値。端子11（シールド）とアース間。'
      )
    ],
    /* Audio unit M39 (pins 17-32). AV-30/37. */
    audio_m39: [
      sm(
        'M39·17 (Y/R)',
        'AV-30',
        'AudioPilot OFF: aprox. 7.5 V. AudioPilot ON: aprox. 0 V',
        'Contacto ON, salida. Tabla de referencia, señal AudioPilot ON/OFF. Continuidad del arnés: M39·17 (Y/R) a T7·31 (Y/R) debe existir; 17 a masa no debe existir (AV-37).',
        'AudioPilot OFF: Approx. 7.5V. AudioPilot ON: Approx. 0V',
        'Ignition switch ON, output. Terminals and reference value, AudioPilot ON/OFF signal. Harness continuity should exist between M39·17 (Y/R) and T7·31 (Y/R); 17 to ground should not exist (AV-37).',
        'AudioPilot OFF: 約7.5 V。AudioPilot ON: 約0 V',
        'イグニッションON、出力。端子基準値、AudioPilot ON/OFF信号。ハーネスはM39·17（Y/R）とT7·31（Y/R）に導通があり、17とアース間に導通がないこと（AV-37）。'
      )
    ],
    /* Combination meter M19. DI-16/17/11/97. */
    meter_m19: [
      sm(
        'M19·24 (R/W)',
        'DI-16',
        'Tensión de batería con el contacto OFF, ACC y ON',
        'Medir la tensión entre M19 terminal 24 (R/W) y masa (alimentación de batería).',
        'Battery voltage with the ignition switch OFF, ACC and ON',
        'Check voltage between combination meter harness connector M19 terminal 24 (R/W) and ground (battery power).',
        'イグニッションOFF、ACC、ONでバッテリー電圧',
        'コンビネーションメータハーネスコネクターM19端子24（R/W）とアース間を測定（バッテリー電源）。'
      ),
      sm(
        'M19·23 (G/Y)',
        'DI-16',
        'Contacto OFF o ACC: 0 V. Contacto ON: tensión de batería',
        'Medir la tensión entre M19 terminal 23 (G/Y) y masa (alimentación IGN ON/START, fusible 14).',
        'Ignition switch OFF or ACC: 0V. Ignition switch ON: Battery voltage',
        'Check voltage between M19 terminal 23 (G/Y) and ground (ignition ON or START supply, fuse 14).',
        'イグニッションOFFまたはACC: 0 V。ON: バッテリー電圧',
        'M19端子23（G/Y）とアース間を測定（イグニッションONまたはSTART電源、ヒューズ14）。'
      ),
      sm(
        'M19·14 (LG)',
        'DI-16',
        'Contacto OFF: 0 V. ACC u ON: tensión de batería',
        'Medir la tensión entre M19 terminal 14 (LG) y masa (alimentación ACC u ON). DI-11 también indica tensión de batería con el contacto en ACC.',
        'Ignition switch OFF: 0V. ACC or ON: Battery voltage',
        'Check voltage between M19 terminal 14 (LG) and ground (ACC or ON supply). DI-11 also lists battery voltage with the ignition switch in ACC.',
        'イグニッションOFF: 0 V。ACCまたはON: バッテリー電圧',
        'M19端子14（LG）とアース間を測定（ACCまたはON電源）。DI-11でもイグニッションACCでバッテリー電圧。'
      ),
      sm(
        'M19·10 (B), ·11 (B) y ·12 (B)',
        'DI-17',
        'Debe existir continuidad a masa. Referencia (DI-11, terminal 11, contacto ON): aprox. 0 V',
        'Contacto OFF. Desconectar el cuadro y el amplificador unificado. Comprobar la continuidad entre M19 terminales 10, 11 y 12 (B) y masa.',
        'Continuity should exist to ground. Reference value (DI-11, terminal 11, ignition ON): Approx. 0 V',
        'Turn ignition switch OFF. Disconnect the combination meter connector and the unified meter and A/C amp. connector. Check continuity between M19 terminals 10 (B), 11 (B), 12 (B) and ground.',
        'アースとの導通があること。基準値（DI-11、端子11、イグニッションON）: 約0 V',
        'イグニッションOFF。コンビネーションメータとunified meter and A/C amp.のコネクターを外し、M19端子10、11、12（B）とアース間の導通を確認。'
      ),
      sm(
        'M19·1 (BR/Y) (cinturón del conductor)',
        'DI-97',
        'Cinturón abrochado: aprox. 12 V. Cinturón desabrochado: aprox. 0 V',
        'Contacto ON. Medir la tensión entre M19 terminal 1 (BR/Y) y masa.',
        'When seat belt is fastened: Approx. 12 V. When seat belt is unfastened: Approx. 0 V',
        'Turn ignition switch ON. Check voltage between combination meter harness connector M19 terminal 1 (BR/Y) and ground.',
        'シートベルト着用時: 約12 V。非着用時: 約0 V',
        'イグニッションON。コンビネーションメータハーネスコネクターM19端子1（BR/Y）とアース間を測定。'
      )
    ],
    /* Driver seat belt buckle switch B8. DI-98. */
    belt_b8: [
      sm(
        'B8·1 (BR) – M19·1 (BR/Y)',
        'DI-98',
        'Debe existir continuidad. M19·1 a masa: no debe existir continuidad',
        'Desconectar el conector del cuadro. Comprobar la continuidad entre M19 terminal 1 (BR/Y) y B8 terminal 1 (BR), y entre M19·1 y masa. Luego comprobar el circuito de masa del interruptor del hebijón.',
        'Continuity should exist. M19·1 to ground: Continuity should not exist',
        'Disconnect the combination meter connector. Check harness continuity between M19 terminal 1 (BR/Y) and seat belt buckle switch (driver side) harness connector B8 terminal 1 (BR), and between M19·1 and ground. Then check the seat belt buckle switch ground circuit.',
        '導通があること。M19·1とアース間: 導通がないこと',
        'コンビネーションメータのコネクターを外し、M19端子1（BR/Y）と運転席シートベルトバックルスイッチB8端子1（BR）の導通、およびM19·1とアース間の導通を確認。その後バックルスイッチのアース回路を点検。'
      )
    ],
    /* Brake fluid level switch E44. BRC-138. */
    brake_fluid_e44: [
      sm(
        'E44·1 (W) – E118·40 (W); E44·2 (B) a masa',
        'BRC-138',
        'E44·1–E118·40: debe existir continuidad. E118·40 a masa: no debe existir. E44·2 a masa: debe existir continuidad',
        'Contacto OFF. Desconectar el sensor de nivel de líquido de frenos y la unidad VDC/TCS/ABS. Comprobar esas continuidades.',
        'E44·1–E118·40: Continuity should exist. E118·40 to ground: Continuity should not exist. E44·2 to ground: Continuity should exist',
        'Ignition switch OFF. Disconnect the brake fluid level sensor connector and the VDC/TCS/ABS control unit connector. Check those continuities.',
        'E44·1–E118·40: 導通があること。E118·40とアース間: 導通がないこと。E44·2とアース間: 導通があること',
        'イグニッションOFF。ブレーキフルードレベルセンサとVDC/TCS/ABSコントロールユニットのコネクターを外し、それらの導通を確認。'
      )
    ],
    /* Soft top control unit B66 (power). RF-39. */
    top_b66: [
      sm(
        'B66·1 (W/R) y B66·8 (W/R)',
        'RF-39',
        'Tensión de batería a masa',
        'Comprobar la tensión entre los terminales 1 y 8 del control del techo (conectores B66/B67) y masa. También el fusible 12 10A del J/B.',
        'Battery voltage to ground',
        'Check voltage between soft top control unit connector B66/B67 terminals 1 and 8 and ground. Also check 10A fuse No. 12 in the fuse block (J/B).',
        'アース間はバッテリー電圧',
        'ソフトトップコントロールユニットコネクターB66/B67の端子1および8とアース間を測定。J/Bの10AヒューズNo.12も確認。'
      ),
      sm(
        'B66·7 (B) y B66·16 (B)',
        'RF-39',
        'Debe existir continuidad a masa',
        'Contacto OFF. Comprobar la continuidad entre B66 terminales 7 y 16 y masa.',
        'Continuity should exist to ground',
        'Turn ignition switch OFF. Check continuity between soft top control unit connector B66 terminals 7 and 16 and ground.',
        'アースとの導通があること',
        'イグニッションOFF。ソフトトップコントロールユニットコネクターB66端子7および16とアース間の導通を確認。'
      )
    ],
    /* Soft top control unit B67 (switch inputs / IGN). RF-39/42. */
    top_b67: [
      sm(
        'B67·17 (G)',
        'RF-39',
        'Tensión de batería a masa (alimentación de encendido)',
        'Comprobar la tensión entre el terminal 17 (G) y masa, junto con los terminales 1 y 8 (RF-39).',
        'Battery voltage to ground (ignition supply)',
        'Check voltage between soft top control unit terminal 17 (G) and ground, together with terminals 1 and 8 (RF-39).',
        'アース間はバッテリー電圧（イグニッション電源）',
        '端子17（G）とアース間を、端子1および8とともに測定（RF-39）。'
      ),
      sm(
        'B67·18 (L/W) – M14·3 (L/B)',
        'RF-40',
        'Debe existir continuidad. B67·18 a masa: no debe existir continuidad',
        'Comprobar la continuidad entre B67 terminal 18 y M14 terminal 3, y entre 18 y masa.',
        'Continuity should exist. B67·18 to ground: Continuity should not exist',
        'Check continuity between soft top control unit connector B67 terminal 18 and soft top switch connector M14 terminal 3, and between 18 and ground.',
        '導通があること。B67·18とアース間: 導通がないこと',
        'ソフトトップコントロールユニットB67端子18とソフトトップスイッチM14端子3の導通、および18とアース間の導通を確認。'
      ),
      sm(
        'B67·19 (R/W) – M14·4 (R/G)',
        'RF-42',
        'Debe existir continuidad. B67·19 a masa: no debe existir. Con el conector conectado, B67·19 a masa: aprox. 5 V (señal de salida de la unidad)',
        'Comprobar la continuidad del arnés y luego, con los conectores puestos, la tensión de salida en B67·19.',
        'Continuity should exist. B67·19 to ground: Continuity should not exist. With the connectors attached, B67·19 to ground: Approx. 5V (control unit output signal)',
        'Check harness continuity between B67 terminal 19 and M14 terminal 4, then with the connectors attached check voltage between B67 terminal 19 and ground.',
        '導通があること。B67·19とアース間: 導通がないこと。コネクター接続時、B67·19とアース間は約5 V（コントロールユニット出力信号）',
        'B67端子19とM14端子4のハーネス導通を確認し、コネクター接続後にB67端子19とアース間の電圧を測定。'
      )
    ],
    /* Soft top switch M14. RF-40/42. */
    top_m14: [
      sm(
        'M14·1 (B)',
        'RF-40',
        'Debe existir continuidad a masa',
        'Contacto OFF. Comprobar la continuidad entre M14 terminal 1 (B) y masa.',
        'Continuity should exist to ground',
        'Turn ignition switch OFF. Check continuity between soft top switch connector M14 terminal 1 (B) and ground.',
        'アースとの導通があること',
        'イグニッションOFF。ソフトトップスイッチコネクターM14端子1（B）とアース間の導通を確認。'
      ),
      sm(
        'M14·1 – M14·3',
        'RF-40',
        'Posición OPEN: debe existir continuidad',
        'Operar el interruptor del techo y comprobar la continuidad entre los terminales 1 y 3.',
        'OPEN position: Continuity Yes',
        'Operate the soft top switch and check continuity between soft top switch connector M14 terminals 1 and 3.',
        'OPEN位置: 導通あり',
        'ソフトトップスイッチを操作し、M14端子1と3の導通を確認。'
      ),
      sm(
        'M14·1 – M14·4',
        'RF-42',
        'Posición CLOSE: debe existir continuidad',
        'Operar el interruptor del techo y comprobar la continuidad entre los terminales 1 y 4.',
        'CLOSE position: Continuity Yes',
        'Operate the soft top switch and check continuity between soft top switch connector M14 terminals 1 and 4.',
        'CLOSE位置: 導通あり',
        'ソフトトップスイッチを操作し、M14端子1と4の導通を確認。'
      )
    ],
    /* A/T device (manual mode switch) M47. AT-177. */
    atdev_m47: [
      sm(
        'M47 (lado unidad, interruptor de modo manual)',
        'AT-177',
        'Debe existir continuidad: Auto 9–10; Manual 6–9; UP 8–9; DOWN 7–9',
        'Inspección del componente (manual mode switch). Comprobar la continuidad entre los terminales indicados según la posición.',
        'Continuity should exist (Yes): Auto 9–10; Manual 6–9; UP 8–9; DOWN 7–9',
        'Component inspection of the manual mode switch. Check continuity between the listed terminals at the unit side of connector M47, according to position.',
        '導通があること（Yes）: Auto 9–10; Manual 6–9; UP 8–9; DOWN 7–9',
        'マニュアルモードスイッチのコンポーネント点検。位置に応じて、コネクターM47のユニット側で記載の端子間導通を確認。'
      )
    ],
    turn_e40: SM_NONE /* Front combination lamp LH xenon. FSM diagnosis is bulb and circuit checks (e.g. LT-25/26); no component voltage or resistance table is published at E40. */,
    turn_e41: SM_NONE /* Front combination lamp LH halogen. Same as the xenon diagnosis: bulb/circuit checks, no component table at E41. */,
    turn_t10: SM_NONE /* Rear combination lamp LH (turn). No component voltage or resistance table is published at T10; wiring pages only. */,
    turn_e24: SM_NONE /* Front combination lamp RH xenon. FSM diagnosis is bulb and circuit checks; no component table at E24. */,
    turn_e25: SM_NONE /* Front combination lamp RH halogen. FSM diagnosis is bulb and circuit checks; no component table at E25. */,
    turn_t18: SM_NONE /* Rear combination lamp RH (turn). Connector id does not appear in the 2005 LT text layer; no published component value at T18. */,
    stop_t9: SM_NONE /* Rear combination lamp LH (stop/tail). Diagnosis is bulb and circuit checks (LT-202/205); no component table at T9. */,
    stop_t17: SM_NONE /* Rear combination lamp RH (stop/tail). Same: bulb and circuit checks, no component table at T17. */,
    stop_t202: SM_NONE /* High-mounted stop lamp Roadster T202. LT-181 is a heading; no voltage or resistance table at T202. */,
    stop_d103: SM_NONE /* High-mounted stop lamp Coupe D103. LT-181 is a heading; no voltage or resistance table at D103. */,
    map_r53: SM_NONE /* Map lamp Roadster R53. LT-233/234/235 cover Coupe continuity at R52 and a Roadster active-test procedure; no component table was published at R53 in the extracted pages. */,
    ix_d1_m11: SM_NONE /* Door SMJ D1↔M11 is an intermediate. The 2005 FSM publishes no component-inspection value at this connector. */,
    ix_d31_m74: SM_NONE /* Door SMJ D31↔M74 is an intermediate. The 2005 FSM publishes no component-inspection value at this connector. */,
    mirror_sw_d6: SM_NONE /* Door mirror switch D6. GW-80/84 are location/wiring; no voltage or resistance table was found at D6 in the extracted GW inspection pages. */,
    trunk_cancel_b71: SM_NONE /* Trunk lid opener cancel switch B71. BL-130/133 mention the circuit; no standalone component voltage or continuity table was confirmed at B71 in the extracted pages. */,
    fuel_lid_m59: SM_NONE /* Fuel lid opener relay M59. BL-53/60 cover the actuator and switch; no component-inspection table was confirmed at the relay connector itself. */,
    socket_b36: SM_NONE /* Luggage power socket B36. WW-54/55 are the wiring diagram and R&R only; no voltage or resistance spec is published. */,
    socket_m38: SM_NONE /* Instrument panel power socket M38. WW-54/55 are the wiring diagram and R&R only; no voltage or resistance spec is published. */,
    seat_b37: SM_NONE /* Heated-seat relay B37. SE-57..64 and SE-71 are description, wiring diagrams and R&R; no component voltage or resistance table is published. */,
    seat_m154: SM_NONE /* Driver heated-seat switch M154. The 2005 SE heated-seat pages have no component-inspection table at this connector. */,
    seat_m155: SM_NONE /* Passenger heated-seat switch M155. The 2005 SE heated-seat pages have no component-inspection table at this connector. */,
    belt_b11: SM_NONE /* Passenger seat belt buckle B11. DI-97/98 inspect the driver buckle B8 and the meter input; no component table was found at B11. SRS-12 is a wiring figure. */,
    spk_d4: SM_NONE /* Door speaker (non-Bose). AV has terminal tables for the audio unit and amps, and R&R for speakers, but no speaker resistance or voltage table. */,
    spk_d5: SM_NONE /* Bose door speaker. No speaker resistance or voltage table is published in AV. */,
    spk_d3: SM_NONE /* Tweeter. AV-42 is R&R only; no resistance table. */,
    spk_d34: SM_NONE /* Passenger door speaker (non-Bose). No speaker resistance or voltage table is published in AV. */,
    spk_d35: SM_NONE /* Passenger Bose door speaker. No speaker resistance or voltage table is published in AV. */,
    spk_d33: SM_NONE /* Passenger tweeter. No resistance table is published in AV. */,
    spk_b40: SM_NONE /* Rear speaker LH. AV-42 is R&R only; no resistance table. */,
    spk_b42: SM_NONE /* Rear speaker RH. No resistance table is published in AV. */,
    pkb_b47: SM_NONE /* Parking-brake switch B47. DI-67 is a wiring figure. A parking-brake voltage table appears at the DTRL unit (E15·17, LT-81), not at B47 itself. */,
    washer_e29: SM_NONE /* Front washer motor E29. WW describes operation and IPDM E7·44 washer power (battery voltage, WW-15), but no component voltage or resistance table is published at E29. */,
    washer_e28: SM_NONE /* Rear washer motor E28. Same: system description only, no component table at E28. */,
    cb_b55: SM_NONE /* Soft-top circuit breaker B55. RF inspection pages do not publish a voltage or resistance value at B55. */,
    top_b68: SM_NONE /* Soft-top control unit B68. RF-33/34 terminal tables are dense and partly figure-based; no clean, complete numeric set was taken for B68 alone, so this card is left without invented values. */,

  };

  /* ---- Lookup / typography for pin lines, Seleccionados, sel-desc and the print pack.
     Compact the FSM value text only (en-dashes, middots). Do not invent conditions. */
  function smLang(){
    try {
      if(typeof lang === 'string' && (lang === 'en' || lang === 'ja' || lang === 'es')) return lang;
    } catch (e) {}
    return 'es';
  }
  function smLoc(entry, loc){
    if(!entry) return { value: '', cond: '' };
    const L = loc || smLang();
    return entry[L] || entry.en || entry.es || { value: '', cond: '' };
  }
  function smCompactText(s){
    if(s == null) return '';
    let t = String(s).trim();
    if(!t) return '';
    t = t.replace(/(\d)\s*-\s*(?=\d)/g, '$1–');
    t = t.replace(/(\d)\s+-\s+(?=\S)/g, '$1–');
    t = t.replace(/。/g, ' · ');
    /* Sentence breaks after a unit, never after abbreviations (aprox. / approx.). */
    t = t.replace(/(V|Ω|ohm|°C|°F|rpm)\)?\.(?=\s+\S)/g, '$1 ·');
    t = t.replace(/\s+·\s+/g, ' · ').replace(/\s{2,}/g, ' ').trim();
    t = t.replace(/[·\s]+$/g, '').trim();
    return t;
  }
  function smConnDict(){
    if(typeof CONN !== 'undefined' && CONN && typeof CONN === 'object' && Object.keys(CONN).length) return CONN;
    if(typeof CONN_BASE !== 'undefined' && CONN_BASE) return CONN_BASE;
    return {};
  }
  function smCardCodes(cid){
    const f = smConnDict()[cid];
    const out = [];
    const add = (vw) => { if(vw && vw.c) out.push(String(vw.c)); };
    if(!f) return out;
    add(f.view);
    if(f.viewByTrans){
      Object.keys(f.viewByTrans).forEach((k) => add(f.viewByTrans[k]));
    }
    return out;
  }
  function smParsePinRefs(pins){
    const ecm = [];
    const cavs = [];
    const seenE = Object.create(null);
    const seenC = Object.create(null);
    const s = String(pins || '');
    const ecmRe = /\bECM\s+(\d+)\b/g;
    let m;
    while((m = ecmRe.exec(s))){
      const n = Number(m[1]);
      if(!seenE[n]){ seenE[n] = true; ecm.push(n); }
    }
    const cavRe = /\b([A-Z]{1,3}\d+[A-Z]?)\s*·\s*(\d+[A-Z]?)/g;
    while((m = cavRe.exec(s))){
      const key = m[1] + '·' + m[2];
      if(!seenC[key]){ seenC[key] = true; cavs.push({ code: m[1], id: m[2] }); }
      const after = s.slice(m.index + m[0].length);
      const range = after.match(/^\s*[–-]\s*(\d+[A-Z]?)/);
      if(range){
        const key2 = m[1] + '·' + range[1];
        if(!seenC[key2]){ seenC[key2] = true; cavs.push({ code: m[1], id: range[1] }); }
      }
    }
    return { ecm: ecm, cavs: cavs };
  }
  function smIsEcmTerminalEntry(entry){
    if(!entry || entry.none) return false;
    if(/\bECM\s+\d+\b/.test(entry.pins || '')) return true;
    const blob = [entry.es && entry.es.cond, entry.en && entry.en.cond, entry.ja && entry.ja.cond].filter(Boolean).join('\n');
    return /terminal(?:es)? del ECM|ECM terminal|tabla de terminales del ECM|ECM端子/i.test(blob);
  }
  function smValueParts(entry, loc){
    const locn = smLoc(entry, loc);
    const compact = smCompactText(locn.value);
    if(!compact) return [];
    /* Split a multi-cavity value only when the FSM text itself names each cavity. */
    const re = /·(\d+)\s*\/\s*ECM\s*(\d+)\s*([^;]+?)(?=;|\s*·\d+\s*\/\s*ECM|$)/g;
    const hits = [];
    let m;
    while((m = re.exec(compact))){
      hits.push({ cav: m[1], ecm: Number(m[2]), text: compact.slice(0, compact.search(/·\d+\s*\/\s*ECM/)).replace(/:\s*$/, '').trim(), chunk: smCompactText(m[3]) });
    }
    if(hits.length >= 2){
      const prefix = hits[0].text;
      return hits.map((h) => ({
        cav: h.cav,
        ecm: h.ecm,
        text: smCompactText((prefix ? prefix + ': ' : '') + h.chunk)
      }));
    }
    return [{ cav: null, ecm: null, text: compact }];
  }
  function smEntryLine(entry, loc, partText){
    const text = partText != null ? partText : (smValueParts(entry, loc)[0] || {}).text || '';
    return { text: text, src: entry && entry.src ? entry.src : '', pins: entry && entry.pins ? entry.pins : '', cond: (smLoc(entry, loc).cond || '') };
  }
  let _smIndex = null;
  function smResetIndex(){ _smIndex = null; }
  function smIndex(){
    if(_smIndex) return _smIndex;
    const byEcm = Object.create(null);
    const byCav = Object.create(null);
    const byCard = Object.create(null);
    Object.keys(SM_VALUES).forEach((cid) => {
      const rows = SM_VALUES[cid];
      if(!rows || rows.none){
        byCard[cid] = rows && rows.none ? { none: true, entry: rows } : { none: true, entry: null };
        return;
      }
      if(!Array.isArray(rows)) return;
      byCard[cid] = { none: false, entries: rows };
      rows.forEach((e) => {
        const refs = smParsePinRefs(e.pins);
        refs.ecm.forEach((n) => {
          (byEcm[n] || (byEcm[n] = [])).push({ cid: cid, entry: e });
        });
        refs.cavs.forEach((c) => {
          const k = c.code + '·' + c.id;
          (byCav[k] || (byCav[k] = [])).push({ cid: cid, entry: e });
        });
        const termRe = /Terminal(?:es)?\s+(\d+)(?:\s*(?:y|and|–|-)\s*(\d+))?/gi;
        let tm;
        while((tm = termRe.exec(e.pins || ''))){
          const ids = [tm[1]];
          if(tm[2]) ids.push(tm[2]);
          smCardCodes(cid).forEach((code) => {
            ids.forEach((id) => {
              const k = code + '·' + id;
              (byCav[k] || (byCav[k] = [])).push({ cid: cid, entry: e });
            });
          });
        }
      });
    });
    _smIndex = { byEcm: byEcm, byCav: byCav, byCard: byCav && byCard };
    _smIndex.byCard = byCard;
    return _smIndex;
  }
  function smUniqueEntries(list){
    const out = [];
    const seen = Object.create(null);
    (list || []).forEach((item) => {
      const e = item.entry || item;
      const key = (item.cid || '') + '\0' + (e.pins || '') + '\0' + (e.src || '');
      if(seen[key]) return;
      seen[key] = true;
      out.push({ cid: item.cid, entry: e });
    });
    return out;
  }
  function smPinVoltFallback(pin, loc){
    if(!pin) return '';
    const L = loc || smLang();
    const v = L === 'en' ? (pin.volt_en || pin.volt) : L === 'ja' ? (pin.volt_ja || pin.volt) : (pin.volt || '');
    return smCompactText(v || '');
  }
  function smEntriesForCavity(cid, cavId, pin){
    const idx = smIndex();
    const hits = [];
    const card = idx.byCard[cid];
    const codes = smCardCodes(cid);
    const cav = String(cavId == null ? (pin && pin.id) : cavId);
    if(card && !card.none && card.entries){
      card.entries.forEach((e) => {
        const refs = smParsePinRefs(e.pins);
        const onCav = refs.cavs.some((c) => String(c.id) === cav && (!c.code || codes.indexOf(c.code) >= 0 || !codes.length));
        const term = /Terminal(?:es)?\s+(\d+)(?:\s*(?:y|and|–|-)\s*(\d+))?/gi;
        let tm; let onTerm = false;
        while((tm = term.exec(e.pins || ''))){
          if(String(tm[1]) === cav || (tm[2] && String(tm[2]) === cav)) onTerm = true;
        }
        if(onCav || onTerm || (!refs.cavs.length && !onTerm && pin && pin.ecm != null && refs.ecm.indexOf(Number(pin.ecm)) >= 0)){
          hits.push({ cid: cid, entry: e });
        }
      });
    }
    codes.forEach((code) => {
      (idx.byCav[code + '·' + cav] || []).forEach((item) => hits.push(item));
    });
    if(pin && pin.ecm != null && pin.ecm !== ''){
      const n = Number(pin.ecm);
      (idx.byEcm[n] || []).forEach((item) => {
        if(smIsEcmTerminalEntry(item.entry)) hits.push(item);
      });
    }
    return smUniqueEntries(hits);
  }
  function smEntriesForEcm(n){
    const idx = smIndex();
    const list = (idx.byEcm[Number(n)] || []).filter((item) => smIsEcmTerminalEntry(item.entry));
    return smUniqueEntries(list);
  }
  function smLinesForEntries(entries, loc, pin){
    const lines = [];
    const seen = Object.create(null);
    (entries || []).forEach((item) => {
      const parts = smValueParts(item.entry, loc);
      parts.forEach((part) => {
        if(pin){
          const cav = pin.id != null ? String(pin.id) : '';
          const ecm = pin.ecm != null && pin.ecm !== '' ? Number(pin.ecm) : null;
          if(part.cav && cav && String(part.cav) !== cav) return;
          if(part.ecm && ecm != null && part.ecm !== ecm) return;
        }
        const line = smEntryLine(item.entry, loc, part.text);
        if(!line.text || seen[line.text + '\0' + line.src]) return;
        seen[line.text + '\0' + line.src] = true;
        lines.push(line);
      });
    });
    return lines;
  }
  function smPinLines(cid, pin, loc){
    const L = loc || smLang();
    const lines = smLinesForEntries(smEntriesForCavity(cid, pin && pin.id, pin), L, pin);
    if(lines.length) return lines;
    let fb = smPinVoltFallback(pin, L);
    if(!fb && pin && pin.ecm != null && pin.ecm !== ''){
      const pwr = (smConnDict().ecm_power && smConnDict().ecm_power.pins) || [];
      const qp = pwr.find((q) => Number(q.ecm != null ? q.ecm : q.id) === Number(pin.ecm));
      fb = smPinVoltFallback(qp, L);
    }
    return fb ? [{ text: fb, src: '', pins: '', cond: '' }] : [];
  }
  function smEcmLines(n, loc){
    const L = loc || smLang();
    const pinFb = (function(){
      const dict = smConnDict();
      const pwr = dict.ecm_power;
      if(!pwr || !pwr.pins) return '';
      const pin = pwr.pins.find((q) => Number(q.ecm != null ? q.ecm : q.id) === Number(n));
      return smPinVoltFallback(pin, L);
    })();
    const lines = smLinesForEntries(smEntriesForEcm(n), L, { ecm: Number(n), id: String(n) });
    if(lines.length) return lines;
    return pinFb ? [{ text: pinFb, src: '', pins: '', cond: '' }] : [];
  }
  function smPinLine(cid, pin, loc){
    return smPinLines(cid, pin, loc).map((x) => x.text).join(' · ');
  }
  function smEcmLine(n, loc){
    return smEcmLines(n, loc).map((x) => x.text).join(' · ');
  }
  function smWrapPinText(text, maxChars){
    const t = smCompactText(text || '');
    if(!t) return [];
    const max = Math.max(8, maxChars || 22);
    const chunks = t.split(/\s*·\s*/).filter(Boolean);
    /* 2–3 FSM conditions: one line each, so every range stays visible. Long lines are clipped by the pin, not mid-word. */
    if(chunks.length >= 2 && chunks.length <= 3){
      return chunks;
    }
    if(t.length <= max) return [t];
    const lines = [];
    let cur = '';
    const push = (s) => { if(s) lines.push(s); };
    chunks.forEach((ch) => {
      if(!cur) cur = ch;
      else if((cur + ' · ' + ch).length <= max) cur = cur + ' · ' + ch;
      else { push(cur); cur = ch; }
    });
    push(cur);
    const breakLong = (ln) => {
      if(ln.length <= max) return [ln];
      const out = [];
      let rest = ln;
      while(rest.length > max){
        let cut = rest.lastIndexOf(' ', max);
        if(cut < 1){
          const sp = rest.indexOf(' ');
          cut = sp > 0 ? sp : max;
        }
        out.push(rest.slice(0, cut).trim());
        rest = rest.slice(cut).trim();
      }
      if(rest) out.push(rest);
      return out;
    };
    const out = [];
    lines.forEach((ln) => breakLong(ln).forEach((x) => out.push(x)));
    if(out.length > 3){
      const head = out.slice(0, 2);
      const last = out.slice(2).join(' · ');
      head.push(last.length > max + 8 ? last.slice(0, max + 7) + '…' : last);
      return head;
    }
    return out;
  }
  function smRowsForCard(cid){
    const idx = smIndex();
    const card = idx.byCard[cid];
    if(card && card.none) return card.entry || SM_NONE;
    if(card && card.entries && card.entries.length) return card.entries;
    const f = smConnDict()[cid];
    if(!f || !f.pins) return null;
    const collected = [];
    (f.pins || []).forEach((p) => {
      smEntriesForCavity(cid, p.id, p).forEach((item) => collected.push(item));
    });
    const uniq = smUniqueEntries(collected);
    return uniq.length ? uniq.map((x) => x.entry) : null;
  }
  function smIsJointCard(cid){
    if(!cid) return false;
    if(String(cid).startsWith('ix_')) return true;
    const f = smConnDict()[cid];
    return !!(f && f.sub === 'intermedias');
  }

  global.sm = sm;
  global.SM_NONE = SM_NONE;
  global.SM_VALUES = SM_VALUES;
  global.smLoc = smLoc;
  global.smCompactText = smCompactText;
  global.smPinLine = smPinLine;
  global.smPinLines = smPinLines;
  global.smEcmLine = smEcmLine;
  global.smEcmLines = smEcmLines;
  global.smEntriesForCavity = smEntriesForCavity;
  global.smEntriesForEcm = smEntriesForEcm;
  global.smRowsForCard = smRowsForCard;
  global.smWrapPinText = smWrapPinText;
  global.smResetIndex = smResetIndex;
  global.smIsJointCard = smIsJointCard;
  global.smCardCodes = smCardCodes;
  global.smParsePinRefs = smParsePinRefs;
})(typeof window !== 'undefined' ? window : globalThis);
