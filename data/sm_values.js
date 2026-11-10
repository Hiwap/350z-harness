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
    f242_eot: SM_NONE, /* 35th Anniversary M/T only; 2005/2006 FSM publishes no numeric values (EC-123). */

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
    alt_e: SM_NONE, /* Ground terminal E211·2 to body ground E212; SC-22 / PG-53 give no voltage or resistance spec. */
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
    f6_at: SM_NONE /* A/T assembly connector; this Coupe M/T FSM has no component-inspection value at F6. */
  };

  global.sm = sm;
  global.SM_NONE = SM_NONE;
  global.SM_VALUES = SM_VALUES;
})(typeof window !== 'undefined' ? window : globalThis);
