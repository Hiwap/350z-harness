# Pendientes del mapa de arnés 350Z

Lista viva para que cualquiera pueda seguir el trabajo si se corta. Se actualiza en cada commit.
Regla: `npm test` en verde antes de cada push. Fuente de verdad: el FSM 2005 (EC / DI / PG) y `test/fsm_ecm_routes.json`.

## Hecho (esta sesión)

- `915c45c` — Caminos que no se conectaban: CKP/CMP (ECM 13/14/33) y 12 V del MAF en modo Sensor y Conector, 12 V del VTC B2 (ECM 10) y de bobinas/inyectores/EVAP encendidos y clicables; nuevo test `rel_sweep` (todos los pines × todas las opciones).
- `af093c0` — Texto del clic en una sola línea; el texto largo pasó a un bloque «Descripción» (primero dentro de la ficha; corregido en el commit siguiente).
- `2799c5f` — Notas de pines en lenguaje natural (es/en/ja): las cadenas «A → B → C» pasan a frases.
- `e820c5c` — B1/M12·42J (señal del nivel de combustible) ya conecta: B28·1 → B1/M12·42J → unified meter M49·28, y la masa B27·5 → 41J → M49·36. Fichas nuevas M49 y B28. `rel_sweep` exige que toda cavidad con circuito llegue a otro conector.
- `38516d4` — La «Descripción» va siempre al panel de detalles, debajo de la línea corta, nunca dentro de una ficha (ECM, F102, intermedios, DLC, IPDM, fusibles, carrocería). Con «Relacionados» encendido solo lo clicado queda en amarillo; la ruta y los compañeros usan el estilo de relacionado (arregla ECM 85 / línea K). Tests `popup_short` y `sel_outline`.
- `461f0f4` — Este archivo.
- `364674d` — Bobinas: cada una enciende un solo 12 V (bobina 1 = F18·6, bobina 3 = F18·5, las demás directas) y su propia masa (pin 2 → F23; bobinas 1 y 3 por F18/F201·1), con «Tierras». Antes las bobinas 1 y 3 encendían F18·5 y F18·6 a la vez, y la masa no salía. ETC (F31): los pines 3 y 6 (motor, ECM 4/5) muestran con «Alim.» el VMOT (ECM 3: IPDM E8·42 → E12/F3·8). Test `coil_etc_rails`; `rel_sweep` ahora exige la masa de chasis de cada componente (con «Tierras» + «Alim.», igual que el 12 V; un clic de señal solo sigue mostrando la señal). También: en ECM 85 la cavidad F102·4H vuelve a quedar en amarillo (lleva el mismo cable del pin), lo demás sigue en estilo relacionado.
- (este commit) — Textos cortos, tanda 1: avisos de vista (VQ35DE sin VTC de escape, VQ35HR, grid HR, rails activos) y notas de las fichas de sensores y actuadores (31 fichas: A/F, HO2S2, MAF, knock, CKP, CMP, ECT, ETC, EVAP, PSP, alternador, aceite, arranque, condensador, A/C, EVT, F242, A/T, marcha atrás, PNP, VTC escape, bomba) en es/en/ja. Una o dos frases, sin repetir lo que ya muestran las cavidades, el meta o la línea «Vista».

## Pendiente (en orden)

1. Revisar el 12 V del VTC B1 (F204): su nota dice «F18·5/6»; confirmar en EC-455 cuál de las dos cavidades usa.
2. Masas sin dibujar en el FSM: bomba de combustible (D105) y TCM (F23), ver lista `UNCONNECTED` en `test/rel_sweep.mjs`.
3. Textos más cortos (es/en/ja), siguientes tandas: (2) notas de pines del ECM y textos de circuitos («Descripción»); (3) fichas de intermedios, carrocería, fusibles, IPDM, masas y 12 V. Una frase (dos como mucho), sin repetir pin, color, destino ni nombre del conector.
4. GoatCounter: revisar que el contador de visitas siga funcionando (script al final de `index.html`, README).
5. Caras ronda 2: retomar el stash «WIP faces round-2 CONN_FACE + LOOM_MOTOR_KEEP E11 hide».
6. Colores de las fotos que no coinciden con el FSM en CMP, F18 y F21: revisar y anotar.
7. Número de pines de MAF y CMP: confirmar contra el FSM y la foto.
