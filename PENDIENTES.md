# Pendientes del mapa de arnés 350Z

Lista viva para que cualquiera pueda seguir el trabajo si se corta. Se actualiza en cada commit.
Regla: `npm test` en verde antes de cada push. Fuente de verdad: el FSM 2005 (EC / DI / PG) y `test/fsm_ecm_routes.json`.

## Hecho (esta sesión)

- `915c45c` — Caminos que no se conectaban: CKP/CMP (ECM 13/14/33) y 12 V del MAF en modo Sensor y Conector, 12 V del VTC B2 (ECM 10) y de bobinas/inyectores/EVAP encendidos y clicables; nuevo test `rel_sweep` (todos los pines × todas las opciones).
- `af093c0` — Texto del clic en una sola línea; el texto largo pasó a un bloque «Descripción» (primero dentro de la ficha; corregido en el commit siguiente).
- `2799c5f` — Notas de pines en lenguaje natural (es/en/ja): las cadenas «A → B → C» pasan a frases.
- `e820c5c` — B1/M12·42J (señal del nivel de combustible) ya conecta: B28·1 → B1/M12·42J → unified meter M49·28, y la masa B27·5 → 41J → M49·36. Fichas nuevas M49 y B28. `rel_sweep` exige que toda cavidad con circuito llegue a otro conector.
- (este commit) — La «Descripción» va siempre al panel de detalles, debajo de la línea corta, nunca dentro de una ficha (ECM, F102, intermedios, DLC, IPDM, fusibles, carrocería). Con «Relacionados» encendido solo lo clicado queda en amarillo; la ruta y los compañeros usan el estilo de relacionado (arregla ECM 85 / línea K). Tests `popup_short` y `sel_outline`.

## Pendiente (en orden)

1. Bobinas: encender la masa de cada bobina (pin 2 → F23; bobinas 1 y 3 pasan por F18/F201·1) junto con su 12 V, y que cada bobina muestre un solo 12 V (bobina 1 = F18·6, bobina 3 = F18·5, las demás sin F18; EC-689/691/693). Barrido general: todo componente con masa en el FSM enciende su masa donde se enciende su 12 V/5 V.
2. ETC (F31, «cuerpo mariposa»): pines 3 y 6 son el motor (ECM 4 y 5); no tienen 5 V ni masa propios. Mostrar como alimentación relacionada el VMOT (ECM 3, IPDM E8·42 → E12/F3·8). Comprobar que 5 V (pin 1, ECM 47) y masa de sensor (pin 5, ECM 66) salen solo con TPS1/TPS2 (pines 4 y 2). Ojo: F29 en el FSM es la bobina 6, no el ETC.
3. Textos más cortos (es/en/ja): notas de fichas, «Descripción», notas de pines y textos de cada vista. Una frase (dos como mucho), sin repetir pin, color, destino ni nombre del conector.
4. GoatCounter: revisar que el contador de visitas siga funcionando (script al final de `index.html`, README).
5. Caras ronda 2: retomar el stash «WIP faces round-2 CONN_FACE + LOOM_MOTOR_KEEP E11 hide».
6. Colores de las fotos que no coinciden con el FSM en CMP, F18 y F21: revisar y anotar.
7. Número de pines de MAF y CMP: confirmar contra el FSM y la foto.
