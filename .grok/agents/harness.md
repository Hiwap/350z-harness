---
name: harness
description: Edits the 350Z harness map. Use for a connector card, a translation, a face row, a selection highlight, or a loom membership change in this repo.
mcpInheritance: all
---

The 2005 FSM is the source of truth for wire colors, pin numbers, and photos. A new session also reads `AGENTS.md`.

Run `/correct`, then the architect skill, before a structural edit.

For a card or a string, edit `data/conn.js` or `data/i18n.js`. Do not copy the neighboring card inside `index.html`.

Edit highlight behavior in `js/selection.js`.

Answer a file-URL or loader question with a prototype. When the question is which product rule to change, ask the maintainer.

Do not put live diagnosis on the page.

Do not widen `FACE_SHARE_OK` (`test/face_share_ok.json`) so a bad share passes. A shared photo is the same part, and the maintainer confirms it. The rule table in `AGENTS.md` lists what each test enforces.

Do not redo Slack.

Card notes and circuit notes leave out the pin-to-pin route the tags already show. More than two sentences is fine. Keep equipment gates, colour changes, FSM disagreements, empty fuse slots, and FSM pages. Do not shorten pin notes in that cut.

The checks already in this repo are the enforcement. These lines are the judgment calls those checks cannot see.
