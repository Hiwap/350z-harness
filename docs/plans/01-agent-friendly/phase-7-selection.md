# Phase 7. Selection functions leave the page

[Overview](overview.md)

## Goal

The selection functions live in one classic script. Behavior does not change. The next agent adds a highlight branch in that file instead of inside the 9000 line page.

This is not a reducer. Four lets plus DOM classes stay the state. A reducer would be a second design and it is out of scope. **laziness-protocol**.

## Changes

Files are `js/selection.js` and `index.html`.

Move these function declarations unchanged. Start lines on `ad1937d` are the map. Re-read them in **how** before the move, because a later commit may have shifted them.

- `updateSelectedTop` at 7071
- `clearSelectionClasses` at 7301
- `clearSelection` at 7316
- `applyRailFilter` at 7699
- `selectCircuits` at 8202
- `paintFichaCavHL` at 8420
- `selectPin` at 8479
- `selectConn` at 8541
- `selectConnPin` at 8625

Load `js/selection.js` with `<script src>` after `data/conn.js` and `data/i18n.js`, and before the inline script. The inline script still declares `selKey`, `selFocusPin`, `lastSelConnIds`, and `lastCircIds`.

A prototype this session defined a function in an earlier classic file and declared `const` and `let` in a later script. The call returned `from-later-const` and `from-later-let` on a file URL. The functions must run on click, not while the file is parsing.

Keep every comment listed in the overview Constraints. Those lines move with the functions they describe.

Do not add a test that matches the text `function selectCircuits`. Phase 8 exists so that kind of lock stops growing.

## Data structures

No new state. The same lets and the same `hl` and `hl-group` classes.

## Verification

Static. `node --check js/selection.js`. `$env:HARNESS_SKIP_BROWSER='1'; node test/harness_page_tests.mjs` exits 0. If a source-text assertion breaks only because the function moved, change that assertion to call the loaded behavior. Do not paste the old sentence into the new file to satisfy a regex.

Runtime. `npm install`, then `node test/sel_outline.mjs` and `node test/f102.mjs`. The yellow outline stays on the clicked pin. ECM pin 85 is the regression those tests already cover. Click one IPDM cavity and one F102 cavity and confirm a stuck highlight does not survive deselect.
