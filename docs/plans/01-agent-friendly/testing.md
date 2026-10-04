# Testing

[Overview](overview.md)

The page has no typecheck and no lint script. Static means the node tests below. Runtime means Chrome on a file URL, or a PDF when the phase does not draw.

Install once before a browser phase.

```
npm install
```

`puppeteer-core` is declared and was not present in `node_modules` when this plan was written. Tests look in the repo `node_modules`, then `%TEMP%\z33-verify`. They do not look in `%TEMP%\z33-pup`.

## Commands

| Check | Command | Phases |
| --- | --- | --- |
| FSM routes | `node test/fsm_routes.mjs` | 1, 3 |
| Variants | `node test/variants.mjs` | 1, 3 |
| i18n | `node test/i18n.mjs` | 2, 4 |
| Static page tests | `$env:HARNESS_SKIP_BROWSER='1'; node test/harness_page_tests.mjs` | 5, 7, 9 |
| Source-text limit | `node test/html_source_limit.mjs` | 8, 9 |
| Bug list | `node test/verify_harness_bugs.mjs` | 9 |
| Language UI | `node test/ui-lang.mjs` | 4 |
| Selection | `node test/sel_outline.mjs` and `node test/f102.mjs` | 3, 7, 9 |
| Print pack | `$env:PRINT_PACK_OUT` in the temp dir, then `python make_print_pack.py --lang es` and the same for `en` and `ja` | 2, 6 |

`npm run test:static` is bash env syntax. In PowerShell set `$env:HARNESS_SKIP_BROWSER='1'` and run node.

Pre-existing failures in `verify_harness_bugs.mjs` were reported before the fast-forward to `ad1937d` and were not re-run for this plan. Phase 9 re-runs that file and does not "fix" a failure that is not the set-literal assert.

## What each class has to fail on

| Class | Fails when | Passes when |
| --- | --- | --- |
| Loader anchor | `const CONN_FACE = {` is renamed | The real file loads 103 cards |
| Missing translation | A fixture pin drops `note_ja` | The real tables match the counts in the overview |
| `backup_sw` shape | `en` is an object | `en` and `ja` are strings and the English title is readable |
| Spanish fallback | A fixture key exists only in `I18N.es` and English shows the Spanish sentence | English shows the key |
| Face function copied back | `function svgF33` exists | The six cards carry the `faceRows` in phase 5 |
| Print pack second order | The pack draws A/F from a private list | The pack draws A/F from `faceRows` |
| Source-text lock | `.test(html)` count is above the allowed number | The count is at or under the number recorded in phase 8, then lowered in phase 9 |
| Loom hide | The loaded set hides F20 or shows T21 | F20 is in the engine-harness view and T21 is not |

## Browser proof

A phase that edits `index.html`, `data/conn.js`, `data/i18n.js`, or `js/selection.js` is not done until Chrome has loaded the file URL and the phase file's click has been performed. `HARNESS_SKIP_BROWSER=1` is the static half only.

Phases 1, 2, 6, 8, and 10 do not change what a click does. Their runtime checks are the route evaluation, the temp PDF, the failing fixture, and the skill file on disk.
