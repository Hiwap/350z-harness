# Connector face photo sources

Interim vendor product faces for connector ID. Replace with loom photos when available.

| file | source vendor | maps to | original product |
|------|---------------|---------|------------------|
| etc.webp | Wiring Specialties | etc | VQ35 Throttle 6-pin (F31 GY/6) |
| inj.webp | Wiring Specialties | inj1–6 | VQ35 Injector Connector |
| coil.webp | Wiring Specialties | coil1–6 | VQ35 Coil Connector |
| maf.webp | Wiring Specialties | maf | VQ35 MAFS |
| ckp.webp | Wiring Specialties | ckp | VQ35 Crank Sensor Connector, SKU WRS-VQCRNK-BK (F10 B/3 · Nissan RK03FB shell, same part as Ballenger CONN-86050) |
| cmp.webp | Wiring Specialties | cmp_b1 | VQ35 Cam Sensor Connector Black |
| cmp_g.webp | Wiring Specialties | cmp_b2 | VQ35 Cam Sensor Connector Green |
| knock.webp | Wiring Specialties | knock | VQ35DE Knock Sensor Connector |
| ect.webp | Wiring Specialties | ect, iat | VQ35/VQ37 Coolant Temperature 2-pin (same shell as IAT) |
| ho2s.webp | Wiring Specialties | ho2s_b1, ho2s_b2 | VQ35 Oxygen Sensor 4-pin (F11/F12 HO2S) |
| oil.webp | Wiring Specialties | f21_oilp | WS "VQ35 Oil Pressure Sensor Connector" (WRS-VQOLPRSS-BK); WS uses the same photo as the crank connector, so this is the RK03FB 3-way. Unverified for F21. |
| vtc.webp | Wiring Specialties | vtc_b1, vtc_b2 | VQ35DE VVT Connector |
| f1.webp | Wiring Specialties | ix_e10_f1 | VQ35 F1 Connector 9 pin |
| f2.webp | Wiring Specialties | ix_e11_f2 | VQ35DE F2 Connector 10 Pin |
| f3.webp | Wiring Specialties | ix_e12_f3 | VQ35DE F3 Connector 8 Pin (isolated female pigtail on that product page) |
| e12.webp | Wiring Specialties | (file only) | VQ35DE E12 Connector 8 Pin MALE (isolated male pigtail) |
| f102.webp | Wiring Specialties | ix_f102_m72 | 350Z/G35 Dash Plug SMJ F102 |
| f14.webp | Wiring Specialties | ix_f14_f229 | VQ35 Knock Sensor Sub Harness (sensor 2-pin + F14/F229) |
| f18.webp | Ballenger Motorsports | ix_f18_f201 | Sumitomo 6-way 2×3 sealed (CONN-75847) — interim ID for F18 |
| f33.webp | EFI Hardware | ix_f221_f33 | Nissan 8 Pin Injector Loom Female Grey |
| reverse.webp | Wiring Specialties | backup_sw | VQ35 Reverse Switch 2-pin (F36 B/2) |
| alt.webp | Wiring Specialties | f20_alt | VQ35 Alternator Plug Connector |

FSM 2005 connector-face insets (isolated from the wiring-diagram strip; not product photos):

| file | FSM sheet | maps to |
|------|-----------|---------|
| fsm_f103.webp | EC-169 | gnd4 (F103) |
| fsm_f9.webp | SC-13 | f9_starter (F9 · E203 in the same FSM box) |
| fsm_f16.webp | EC-689 | f16_cond (F16) |
| fsm_f22.webp | EC-529 | af_b1 (F22 B/6) |
| fsm_f34.webp | EC-531 | af_b2 (F34 B/6) |
| fsm_f40.webp | EC-198 | vtc_ex_b1 (F40 B/4) |
| fsm_f41.webp | EC-200 | vtc_ex_b2 (F41 B/4) |
| fsm_f19.webp | EC-426 | psp (F19 B/3) |
| fsm_f38.webp | EC-445 | f38_evtc_b1 (F38 B/3) |
| fsm_f42.webp | EC-447 | f42_evtc_b2 (F42 GY/3) |
| fsm_f5.webp | EC-360 | evap_purge (F5 GY/2) |
| fsm_t21.webp | EC-379 | evap_press (T21 GY/3, Tail harness PG-63) |
| fsm_e252.webp | EC-717 | ac_press (E252 B/3; FSM draws E31 and E252 with one face) |

Not mapped in CONN_FACE:

- vtc_ex_b1.webp / vtc_ex_b2.webp — catalog “Rev-Up VTC” shots are 6-pin shells, not F40/F41. F40/F41 use the FSM faces (round 2×2, not the inline HO2S shell).
- ConceptZ and eBay pigtail search pages returned 403; no extra faces from those URLs.

Do not use the in-bay F1/F2/F3 location photo (IMG_4403) as F3/E12 faces.
Do not replace a real product/loom photo with an FSM inset.
One image = one physical connector. Only inj1–6, coil1–6, ho2s_b1/b2 and vtc_b1/b2 share a file (FACE_SHARE_OK in test/harness_page_tests.mjs).
Faces with a colour mismatch vs FSM (verify on the loom): cmp.webp black (F4 is GY/3, EC-331), cmp_g.webp green (F32 is B/3, EC-333).
