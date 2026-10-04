# Phase 3. Connector cards leave the page

[Overview](overview.md)

## Goal

`CONN_BASE` has one owner, `data/conn.js`. The page loads it with a classic script tag. The next agent edits the card in that file instead of scrolling a 9484 line page.

**subtract-before-you-add.** The inline object and the anchor that existed only to find it go away in this same phase. `test/load_map.mjs` reads `data/conn.js`.

## Changes

- Add `data/conn.js`. Move the `CONN_BASE` object there as a top-level `const`. Do not use `export`. Do not assign `window.CONN_BASE`. A file-URL prototype this session showed a later classic script can read the `const`, and `window` does not see it.
- In `index.html`, delete the inline object. Add `<script src="data/conn.js"></script>` immediately before the inline script. The inline script still owns `let CONN`, `pinToCirc`, `connToCirc`, and `CONN_FACE`.
- Teach `test/load_map.mjs` to evaluate `data/conn.js` once and return `CONN_BASE`. `test/fsm_routes.mjs` keeps calling `loadMap`. It must not grow a second parser.

`CONN_FACE`, loom sets, and circuits stay in `index.html` until a later phase names them. This phase is the card table only.

Read **how** on `renderFichas` and `transPinsConf` before moving the object. Those functions copy `CONN_BASE` into `CONN`.

## Data structures

`CONN_BASE` stays a plain object keyed by connector id. Each value keeps `group`, `sub`, `name`, `meta`, `pins`, and the optional fields already on the card. Pin objects stay flat strings.

## Verification

Static. `node test/fsm_routes.mjs` and `node test/variants.mjs` exit 0. Card count is still 103.

Runtime. After `npm install`, open `index.html` as a file URL in Chrome the way `test/f102.mjs` does. A pin click still selects. Cards are visible before any click. `HARNESS_SKIP_BROWSER=1` does not prove this phase.

Run **interrogate** on the script order before shipping. The inline script must see `CONN_BASE`. A duplicate `const CONN_BASE` in `index.html` throws on load.
