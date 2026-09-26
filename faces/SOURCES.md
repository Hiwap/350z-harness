# Connector face photo sources

Interim vendor product faces for connector ID. Replace with loom photos when available.

| file | source vendor | maps to | original product |
|------|---------------|---------|------------------|
| etc.webp | Wiring Specialties | etc | VQ35 Throttle 6-pin (F31) |
| af.webp | Connector Experts | af_b1, af_b2 | "Air Fuel Ratio Sensor" i-26377349 (SKU CE6043F-1), main image F215307345.jpg, https://connectorexperts.com/i-26377349-air-fuel-ratio-sensor.html · black 6-way (FSM F22/F34 B/6). Similar, not identical: Ezequiel says the lock differs on his car. Caption adds the localized note `faceNoteSimilarLock`. |
| inj.webp | Wiring Specialties | inj1–6 | VQ35 Injector Connector |
| coil.webp | Wiring Specialties | coil1–6 | VQ35 Coil Connector |
| maf.webp | Wiring Specialties | maf | VQ35 MAFS |
| ckp.webp | Wiring Specialties | ckp | VQ35 Crank Sensor Connector, SKU WRS-VQCRNK-BK (F10 B/3 · Nissan RK03FB shell, same part as Ballenger CONN-86050). Not cmp.webp (cam). |
| cmp.webp | Wiring Specialties | cmp_b1 | VQ35 Cam Sensor Connector Black |
| cmp_g.webp | Wiring Specialties | cmp_b2 | VQ35 Cam Sensor Connector Green |
| knock.webp | Wiring Specialties | knock | VQ35DE Knock Sensor Connector |
| ect.webp | Wiring Specialties | ect, iat | VQ35/VQ37 Coolant Temperature 2-pin (same shell as IAT) |
| ho2s.webp | Wiring Specialties | ho2s_b1, ho2s_b2, vtc_ex_b1, vtc_ex_b2 | VQ35 Oxygen Sensor 4-pin (F11/F12 HO2S · F40/F41 4-cavity) |
| oil.webp | Wiring Specialties | f21_oilp, psp, ac_press, evap_press, f38_evtc_b1, f42_evtc_b2 | 3-pin 5V/SIG/GND (PSP · A/C press · EVAP press · oil · EVT pos) |
| vtc.webp | Wiring Specialties | vtc_b1, vtc_b2 | VQ35DE VVT Connector |
| f1.webp | Wiring Specialties | ix_e10_f1 | VQ35 F1 Connector 9 pin |
| f2.webp | Wiring Specialties | ix_e11_f2 | VQ35DE F2 Connector 10 Pin |
| f3.webp | Wiring Specialties | ix_e12_f3 | VQ35DE F3 Connector 8 Pin (isolated female pigtail on that product page) |
| e12.webp | Wiring Specialties | (file only) | VQ35DE E12 Connector 8 Pin MALE (isolated male pigtail) |
| f102.webp | Wiring Specialties | ix_f102_m72 | 350Z/G35 Dash Plug SMJ F102 |
| f14.webp | Wiring Specialties | ix_f14_f229 | VQ35 Knock Sensor Sub Harness (sensor 2-pin + F14/F229) |
| f18.webp | Ballenger Motorsports | ix_f18_f201 | Sumitomo 6-way 2×3 sealed (CONN-75847) — interim ID for F18. Female housing + receptacle terminals = same half as F18 (EC-691/455 T.S., white guide = female), so no mirror note; photo housing is grey vs FSM F18 B (black). Ficha fixed 1-2-3 / 4-5-6. |
| f33.webp | EFI Hardware | ix_f221_f33 | "Nissan 8 Pin Injector Loom Male Pin Connector Grey" (SKU C08M-9001, "injector harness engine loom side"), https://www.efihardware.com/products/2207/Nissan-8-Pin-Injector-Loom-Male-Pin-Connector-Grey · 4th gallery thumbnail (images/3090, mating face with orange seal), chosen by Ezequiel. Replaced the earlier female-side photo. FSM gender (GI-15: black guide = male, white = female): F33 GY/8 has the **female** terminals (EC-278 T.S., white guide, 1-2-3-4 / 5-6-7-8); F221 has the **male** terminals (EC-279 T.S., black guide, 4-3-2-1 / 8-7-6-5). So this male photo is the F221 face; PG-55 lists F221 as G/8 (green) vs the grey product. The ficha shows Ezequiel's F33 female plug (EC-278 T.S., 1-2-3-4 / 5-6-7-8); the caption adds the localized `faceNoteMateMirror` note (mating male half, mirrored vs the ficha). |
| reverse.webp | Wiring Specialties | backup_sw, evap_purge | VQ35 Reverse Switch 2-pin (F36 B/2 · F5 GY/2 purge same 2-way) |
| alt.webp | Wiring Specialties | f20_alt | VQ35 Alternator Plug Connector |

FSM 2005 connector-face insets (isolated from the wiring-diagram strip; not product photos):

| file | FSM sheet | maps to |
|------|-----------|---------|
| fsm_f103.webp | EC-169 | gnd4 (F103) |
| fsm_f9.webp | SC-13 | f9_starter (F9 · E203 in the same FSM box) |
| fsm_f16.webp | EC-689 | f16_cond (F16) |

Not mapped in CONN_FACE:

- vtc_ex_b1.webp / vtc_ex_b2.webp — catalog “Rev-Up VTC” shots are 6-pin shells, not F40/F41. F40/F41 use ho2s.webp (4-pin).
- ConceptZ and eBay pigtail search pages returned 403; no extra faces from those URLs.

Do not use the in-bay F1/F2/F3 location photo (IMG_4403) as F3/E12 faces.
Do not replace a real product/loom photo with an FSM inset.
Shared photos (af, inj, coil, ho2s, oil, reverse, vtc) are intentional: same connector part. Every share is allowlisted in FACE_SHARE_OK (test/harness_page_tests.mjs); do not swap one without Ezequiel confirming.
