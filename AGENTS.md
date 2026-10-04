# 350Z harness

The 2005 Nissan 350Z FSM is the source of truth for wire colors, pin numbers, connector faces, and photos. When a photo, a color, or a pin number disagrees with the FSM, the FSM wins. A measurement from the car stays off the page until the maintainer asks for it.

The maintainer writes in Spanish. Reply in Spanish. Keep this file in English.

Grok loads this file at the start of a session in this repo. `.grok/agents/harness.md` is the same rule set for the project agent.

## Where the code lives

Connector cards are `data/conn.js`. Translations are `data/i18n.js`. Click and highlight behavior is `js/selection.js`. The page is `index.html`. Its script is classic, loaded with `script src`. Load order is `data/conn.js`, `data/i18n.js`, `js/selection.js`, then the inline script. A later classic script can read a top-level `const` from an earlier file. That binding does not appear on `window`.

Edit a card or a string in its data file. Edit a highlight in `js/selection.js`. Copying the neighboring card inside `index.html` is how the old mistakes came back.

Run `/correct`, then the architect skill, before a structural edit. Answer a file-URL or loader question with a prototype. Ask the maintainer before changing a product rule.

## How we work

Do not commit or push unless the maintainer asks. Trunk is `main`. Graphite is installed. Do not repeat tokens, and do not reopen pull requests 4–13.

Do not recreate `PENDIENTES.md` or `docs/plans/`. The split landed in `09e0d17`.

Do not put the maintainer's name in agent-facing docs. Photo credits in `faces/SOURCES.md`, comments in `index.html`, and the tests stay until the maintainer asks to change them.

On Windows, static tests are `$env:HARNESS_SKIP_BROWSER='1'; node test/harness_page_tests.mjs`. `npm run test:static` uses bash syntax. The main checkout has no `puppeteer-core` installed. Known red checks in the harness suite stay red.

One-off browser probes go under the temp directory and get deleted. Do not commit them.

## Page rules

English and Japanese do not fall back to Spanish on the page. `t()`, circuit titles, and circuit notes do not fall back. The print pack falls back English, then Spanish.

Alim stays off unless `localStorage` `z33_railRelPower` is `'1'`.

Do not put 12 V intermediates in `circuit.conn` for control pins. Do not add ECM pin 77 to every coil or injector. Do not add 89 to the starter circuit. Do not set E8-39 `circ` to `fp_relay`.

Sub `fuses` is `fuse_link_box`, `jb_fuse_block`, `fuse_link_holder`. Do not put `jb_10a_inj`, `jb_15a_ht`, or `fuse36_alt` back.

Do not rebuild the IPDM grid from commit `4c99371`. Below 480px it is one column. At 480px and up the cover is column 1 rows 1–3, E3 E4 E5 stack in column 2, E6 is column 1 row 4, E7 is column 2 row 4 spanning 2, E8 is column 1 row 5, and E9 spans both columns on row 6. Columns are `minmax(0, 1fr)`. The fuse note stays off the card. `.ipdm-grid .note-body` stays hidden.

Do not unhide `ipdm_legend`. Do not add the two 20-pin joint boxes. Do not redo Slack.

`FACE_SHARE_OK` grows only when the maintainer confirms the shared photo is the same part. Do not swap a shared photo without that confirmation. There is no ECM face photo. Do not invent one.

View lines (`Vista` / `View` / `表示`) stay out of the visible card and out of the description. Leave `.view-note` in the card DOM, hidden, and leave the view data in `data/conn.js`. Connector notes that are not view lines go in the description.

Card notes and circuit notes leave out the pin-to-pin route. The power, ground, and signal tags already show that. More than two sentences is fine. Keep the fact a person cannot see on the tags: an equipment gate, a colour change across a connector, an FSM disagreement, an empty fuse slot, and the FSM page. Do not shorten pin notes in that cut.

Fichas have a mirror icon the same size as the location and camera icons. Shapes `note`, `ixnote`, `ring`, `ipdm_cover`, and `fusebox` have no mirror icon. IPDM E3–E9 drawings are never mirrored. Only `ecm_f101_can` follows the ECM orientation control, and that card does not also get a CSS mirror. Per-ficha mirror state is `localStorage` `z33_fichaMirror`. ECM orientation is `z33_ecm_orient`.

The ECM orientation dropdown stays in the DOM, hidden, default `invertida` (pin 121 on the left). `fsm` is the horizontal mirror (pin 1 on the left). The ECM location icon opens PG-56. The cover camera, with the orange box on fuses 71–89, is on the Seleccionados clone only. IPDM E3–E9, `ipdm_cover`, `ipdm_legend`, and `feed_af_12v` have no location icon.

A 12 V path highlight does not use `markFichaHL`. Clicking the F102 card does not open every circuit that crosses it. Do not fan out from a shared cavity or a shared ficha. Empty declared F102 cavities means do not auto-attach F102. The Datos related attach adds ECM pins only and does not merge `.path`. Do not mix a circuit retarget with rail mode. Auto-open of a closed group is not written to `localStorage`. Do not restore collapsed groups before applying the selection.

Find those rules by the comment text. Do not delete the comments.
