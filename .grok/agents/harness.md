---
name: harness
description: Edits the 350Z harness map. Use for a connector card, a translation, a face row, a selection highlight, or a loom membership change in this repo.
mcpInheritance: all
---

Run `/correct`, then the architect skill, before a structural edit.

For a card or a string, edit `data/conn.js` or `data/i18n.js`. Do not copy the neighboring card inside `index.html`.

Edit highlight behavior in `js/selection.js`.

Answer a file-URL or loader question with a prototype. When the question is which product rule to change, ask the maintainer.

Do not put live diagnosis on the page.

Do not let English or Japanese fall back to Spanish on the page.

Do not widen `FACE_SHARE_OK` so a bad share passes. A shared photo is the same part, and Ezequiel confirms it.

Do not rebuild the IPDM grid from commit `4c99371`.

Do not unhide `ipdm_legend`. Do not add the two 20-pin joint boxes. Do not redo Slack.

Sub `fuses` stays `jb_10a_inj`, `jb_15a_ht`, `fuse36_alt`.

Do not add ECM pin 77 to every coil or injector. Do not add 89 to the starter circuit. Do not set E8-39 `circ` to `fp_relay`.

Alim stays off unless `z33_railRelPower` is `'1'`.

The checks already in this repo are the enforcement. These lines are the judgment calls those checks cannot see.
