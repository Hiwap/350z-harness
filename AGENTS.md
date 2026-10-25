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

Do not put the maintainer's name in agent-facing docs. Photo credits in `faces/SOURCES.md`, comments in `index.html`, and the tests stay until the maintainer asks to change them.

On Windows, static tests are `$env:HARNESS_SKIP_BROWSER='1'; node test/harness_page_tests.mjs`. `npm run test:static` uses bash syntax. The main checkout has no `puppeteer-core` installed. Known red checks in the harness suite stay red.

One-off browser probes go under the temp directory and get deleted. Do not commit them.

## Page rules

Do not redo Slack.

Do not swap a shared photo without the maintainer's confirmation. The ECM face is the FSM drawing of F101 (EC-367, `faces/fsm_f101.webp`), approved by the maintainer on 2026-10-15. There is still no ECM face photo. Do not add one without approval.

View lines (`Vista` / `View` / `表示`) stay out of the visible card and out of the description. Leave `.view-note` in the card DOM, hidden, and leave the view data in `data/conn.js`. Connector notes that are not view lines go in the description.

Card notes and circuit notes leave out the pin-to-pin route. The power, ground, and signal tags already show that. More than two sentences is fine. Keep the fact a person cannot see on the tags: an equipment gate, a colour change across a connector, an FSM disagreement, an empty fuse slot, and the FSM page. Do not shorten pin notes in that cut.

Fichas have a mirror icon the same size as the location and camera icons. Shapes `note`, `ixnote`, `ring`, `ipdm_cover`, and `fusebox` have no mirror icon. A card with one or two drawn cavities has no mirror icon either: count `faceRows`, each side of `faceRowsByTrans`, or `pins` when the face has no rows. F102 uses the same icon on its panel. IPDM E3–E9 drawings are never pre-mirrored. E3 is two cavities, so it has no icon. Only `ecm_f101_can` follows the ECM orientation control. That card is two cavities, so it has no icon of its own, and it does not get a CSS mirror. Nothing starts mirrored: the button is off, and the ECM grid stays `invertida`. Pressed on the ECM is `fsm`. Options has a mirror-all checkbox, off by default, labeled with `t('mirrorAll')`. Per-ficha mirror state is `localStorage` `z33_fichaMirror`. A stored id for a 1- or 2-cavity card is dropped on load. ECM orientation is `z33_ecm_orient`. SVG labels stay readable: unflip each `<text>` around its own box. Do not CSS-flip `<text>`.

The ECM orientation dropdown stays in the DOM, hidden, default `invertida` (pin 121 on the left). `fsm` is the horizontal mirror (pin 1 on the left). The ECM location icon opens PG-56. The cover camera, with the orange box on fuses 71–89, is on the Seleccionados clone only. IPDM E3–E9, `ipdm_cover`, `ipdm_legend`, and `feed_af_12v` have no location icon.

A 12 V path highlight does not use `markFichaHL`. Clicking the F102 card does not open every circuit that crosses it. Do not fan out from a shared cavity or a shared ficha. Empty declared F102 cavities means do not auto-attach F102. The Datos related attach adds ECM pins only and does not merge `.path`. Do not mix a circuit retarget with rail mode. Auto-open of a closed group is not written to `localStorage`. Do not restore collapsed groups before applying the selection.

Find those rules by the comment text. Do not delete the comments.

## Rules and what enforces them

`npm test` runs every check below. A rule here has no prose elsewhere: read the test for the detail, and fix the data or the code when it fails, never the test, unless the maintainer changed the rule.

| Rule | Enforced by |
|---|---|
| Speaker and tweeter cards draw only cavities 1 and 2. | `test/rules.mjs` speakers |
| The rear-glass defogger is one card per body with both terminals (D104/D211, B202/B203). | `test/rules.mjs` defogger |
| No VQ35HR part photo; eBay 206578549537 is banned (SOURCES.md, photo list, `CONN_FACE`). | `test/rules.mjs` photo sources |
| `FACE_SHARE_OK` is `test/face_share_ok.json`. A share needs the maintainer's confirmation: add its date and basis, then bump `FACE_SHARE_PINNED`. No stale entries. | `test/rules.mjs` face shares; `test/harness_page_tests.mjs` CONN_FACE share check |
| Optional-equipment pins are drawn dimmed (FSM colour, `OPT_OFF_OPACITY`, tooltip, live first line), never hidden, and clickable when on a circuit. Only the door speakers hide as whole cards (D4/D34 base, D5/D35 Bose). | `test/rules_browser.mjs` optional pins; `test/rules.mjs` door speakers |
| Fuse-box cells are the IPDM cover cell: number / what it feeds / amps, never a wire colour. | `test/rules.mjs` + `test/rules_browser.mjs` fuse cells |
| Body is one group; each system is a `BODY_NEST_ORDER` subgroup with its own `SUB_ACCENT`. Cards carry no `accent`. | `test/rules.mjs` body; `test/variants.mjs` (DOM) |
| IPDM E3–E9 each keep their own PG-26 photo icon; the location icon is only on the IPDM group header. | `test/rules_browser.mjs` IPDM; `test/f102.mjs` |
| The selected strip runs from the control module (ECM side) toward the sensor; ground points last. | `test/sel_order.mjs` (every circuit, both models) |
| Card, circuit and pin notes stay under `DESC_MAX` per language; the grandfathered `LONG_NOTES` only shrink. | `test/rules.mjs` descriptions |
| No `PENDIENTES.md` and no `docs/plans/`. | `test/rules.mjs` |
| The ECM 88 → F102·9H wire is not in the FSM and stays off the map. | `test/rules.mjs` ECM 88 |
| Every card is found by its code and its es/en/ja name. | `test/f102.mjs` search |
| English and Japanese do not fall back to Spanish. `t()` returns the key. A circuit title or note returns the circuit id. The print pack still falls back English, then Spanish. | `test/rules.mjs` i18n |
| Alim (`#railRelPower`) stays off unless `localStorage` `z33_railRelPower` is `'1'`. | `test/rules.mjs` Alim |
| A control circuit does not list a 12 V intermediate in `conn` (`feed_*`, a fuse card, `ipdm_cover`, `ipdm_e7`, `ix_e12_f3`). ECM 77 is only A/F B2 pin 2. The starter circuit has no ECM 89. E8·39 is not `circ` `fp_relay`. | `test/rules.mjs` control pins |
| `jb_10a_inj`, `jb_15a_ht`, and `fuse36_alt` stay gone. Sub `fuses` is `fuse_link_box`, `jb_fuse_block`, `fuse_link_holder`. | `test/rules.mjs` retired fuses |
| The IPDM grid stays the `4c99371` placement: one column under 480px, cover and E3–E9 cells at 480px, columns `minmax(0, 1fr)`, fuse note hidden. | `test/rules.mjs` IPDM grid |
| `ipdm_legend` stays hidden. `orange_box` and `blue_box` are not cards. | `test/rules.mjs` hidden cards |
| `?pin=` or `?cav=` opens that ECM pin or cavity. `cav` wins when both are set. A bad id selects nothing. A card absent from the chosen car shows `searchOffCarLong` and keeps the query. A later choice or a clear updates the query with `history.replaceState` and keeps `lang`. Auto-open is not stored. The canonical link stays the language URL. ECM 88 stays off the map. | `test/share_link.mjs` |
