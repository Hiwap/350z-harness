# Agent-friendly map

Plan for the next agent. The maintainer reviews it before any code moves. Nothing in this directory is implemented yet.

HEAD is `ad1937d`. The working tree was clean when this was written. Evidence is `git log` on that commit, measurements run in this session, and corrections from this chat. GitHub issues and pull requests were not queried. A session search skipped this chat on purpose and found no other human corrections. Two older plan sessions from September had empty summaries and no user messages.

## Context

`index.html` is 9484 lines. 343 of 374 commits edit it. The page is one classic script from line 1254 through 9225. Connector cards, English and Japanese strings, face drawings, and click handling sit in that script.

An agent that opens one connector loads the whole page and copies the nearest block. That copy is how the repeated mistakes below got into the history. The fix is one owner per table, checks that fail on the old mistake, and a thin project agent last.

## Scope

In scope is the 350z-harness repo only. The work makes the next edit of a connector, a translation, or a face order happen in a small file, with a check that fails when the old mistake comes back.

Out of scope:

- Live diagnosis text on the page.
- Slack, the two 20-pin joint boxes, and inventing fuse slots.
- Rebuilding the IPDM grid. Commit `4c99371` already places the cover with E3, E4, and E5 beside it.
- A selection reducer. The current functions move unchanged.
- A bundler, Vite, or a component framework.
- Rewriting Spanish circuit prose.
- Creating `index.js`. `package.json` names it as `main`, and the file is not in the tree. Leave that alone.
- Running this plan. Implementation starts only after the maintainer approves, and only with the playbook they pick.

Done means the page still opens as a local file, `node test/fsm_routes.mjs` still matches `test/fsm_ecm_routes.json`, and each mistake class below has the check named in the table.

## Constraints

The README tells a person to open `index.html`. Browser tests open that file with `pathToFileURL`. A local file has to keep working.

Loaders find tables by source text. `test/fsm_routes.mjs` slices `const CONN_BASE = {` through `const CONN_FACE = {`. Renaming the second anchor throws `anchor missing`. That slice is 209321 characters. `make_print_pack.py` slices `CONN_BASE` through `const LS_LOOM`, which is line 3058 and includes `CONN_FACE`. `test/i18n.mjs` slices `const I18N = {` through `const TITLES_I18N`. Wrapping the inline script in an IIFE, or moving a declaration past its end anchor, breaks those tools.

`package.json` is `"type": "module"`. That applies to `test/*.mjs`. The page script is not a module.

`puppeteer-core` is a devDependency and is not installed under the repo `node_modules`. A copy used for this session lives at `%TEMP%\z33-pup`. Chrome is `C:\Program Files\Google\Chrome\Application\chrome.exe`. `npm test` runs `node test/harness_page_tests.mjs`. No GitHub workflow runs it. The only workflow is Slack on new issues.

`gt` is not on PATH. Skip Graphite. A later stack playbook needs Graphite installed, or a plain git branch chain with that fact stated.

Pin fields stay flat strings while the print pack parses them flat.

These comments are spec for the next agent. Do not "clean them up".

- Line 2985. Do not swap a shared photo without Ezequiel confirming.
- Line 6840. Auto-open of a closed group is not written to localStorage.
- Line 6865. Do not restore collapsed groups before applying the selection.
- Line 7539. A ground-path attach adds ECM pins only and must not merge `.path`.
- Line 7712. Do not mix a circuit retarget with rail mode.
- Line 7922. Empty declared F102 cavities means do not auto-attach F102.
- Line 8413. A 12 V path highlight must not use `markFichaHL`.
- Line 8549. Clicking the F102 card must not open every circuit that crosses it.
- Lines 8766 and 9094. Do not fan out from a shared cavity or a shared ficha.
- `faces/SOURCES.md` and `FACE_SHARE_OK` in `test/harness_page_tests.mjs` around line 398. A new shared photo fails until that allowlist grows, and the allowlist grows only after Ezequiel confirms the parts match.

Alim stays off unless `localStorage` `z33_railRelPower` is `'1'`. Sub `fuses` stays exactly `jb_10a_inj`, `jb_15a_ht`, `fuse36_alt`.

## What the commits show

A class counts when it happened twice. The highest fix is a structure the next agent cannot copy around. A prose rule comes last.

| Class | What happened | After this plan |
| --- | --- | --- |
| Face order | `e8ef488`, `264bec4`, `d433534`, `57d9f9d`, `742951a`, `19ebb00`, `e64324f`, `73f64c7`. Each special drawer was corrected on its own. | Phases 5 and 6. Pin order lives on the card. One page drawer and the print pack read it. |
| Selection branches | `1cce34a`, `38516d4`, `c58e981`, `66f86b8`, `dec7c6f`, `2a80041`, `746258e`, `62635ab`, `8b91ffe`, `afc4143`. | Phase 7 moves the functions unchanged so the next agent edits one file. `test/sel_outline.mjs` and `test/f102.mjs` stay the proof. No reducer. |
| Shared photo, then revert | `e4e94ed` swapped in new crops. `6e6f95c` reverted them. `1f1e22b` used `faces/etc.webp` for A/F. `6ede843` gave A/F `faces/af.webp`. | Already enforced. `FACE_SHARE_OK` fails an unlisted share. No new phase. The project agent says not to widen the allowlist to hide a bad share. |
| Missing translation | `11f7e73`, `4a436a8`, `94538df`. The prose rewrite `018dcb6` is a product edit, not this class. | Phase 4. Today the tables are complete. The new check fails when the next card or pin note is not. |
| Route drift | `915c45c`, `e820c5c`, `b2d4690`. | Already enforced by `test/fsm_routes.mjs` and `test/rel_sweep.mjs`. No new checker. |
| Tall-card layout | `4c99371`, `635dd97`, `37eb288`. | Already on `main`. Do not reopen the IPDM grid. |
| Loom hide list | `0368022` hid T21. `0f746cc` hid F20 and F21. `efe5dd5` showed F20 again. `89c1634`, `44aedfc`. | Phase 9. Tests assert membership of the loaded set. The set itself stays a set. |
| Copy the neighbor | 343 commits edit the one file. `backup_sw` in `TITLES_I18N` is the only object-shaped title. The other 167 are strings. | Phases 1 to 4. |
| Source-text tests | 119 `.test(html)` calls in `test/harness_page_tests.mjs`. Several lock a sentence of implementation, including `if(onPathFeed) return relOn`. | Phase 8. The count may not grow. |

Counted this session, from the live page, not from a guess:

- 103 `CONN_BASE` keys, 103 `CONN_I18N` keys, none missing `en` or `ja`.
- 639 pins, 260 with `note`, zero missing `note_en` or `note_ja`.
- `I18N` has 209 keys in `es`, `en`, and `ja`.
- `TITLES_I18N` has 168 keys. 167 store a string per language. `backup_sw` stores `{name, meta}`.
- `circuitTitle` returns `tr[lang]` with no unwrap. Line 8255 inserts that value into HTML. For `backup_sw` in English or Japanese the value is an object.
- `t` at line 5622 falls back to `I18N.es`. With 209 matching keys that fallback is idle. It becomes the Spanish string the next time a key exists only in Spanish.
- 28 functions match `function svg[A-Za-z0-9]+`. The four commit magnets are `svgF33`, `svgF18`, `svgHo2s4`, and `svgAf6`. `svgFaceRows` already draws from `faceRows`. `svgRect6` already prefers `faceRows` and is not part of the conversion.
- `renderConnSvg` dispatches those four shapes at lines 4584 to 4587.
- `svgF18` paints the shell `#212121`. `svgHo2s4` uses a round shell. `svgFaceRows` already honors `faceRound` and has no shell fill.

`test/i18n.mjs` checks `I18N` key parity and a hardcoded list of chrome labels. It does not load `CONN_I18N` or pin notes.

## Prototypes

Open questions were run, not asked.

Classic script versus module, file URL, Chrome headless, no `--allow-file-access-from-files`:

- `<script src="lib.js">` set the body to `classic-ok`.
- `<script type="module">` left the body empty.
- The same module over HTTP returned `module-ok`.
- The module on a file URL also returned `module-ok` when Chrome was started with `--allow-file-access-from-files`. A double-click does not pass that flag.

A later classic script can read a top-level `const` from an earlier classic file. Measured body text was `const-value|no-window`. The binding is visible. `window.Z33` stays empty. `var` and `window.Z33 =` both show up as window properties.

A function in an earlier file can read a `const` or `let` declared in a later inline script. Measured returns were `from-later-const` and `from-later-let`. That is the selection split. The functions must not run at parse time, or the later `let` is still in the temporal dead zone.

Choice, from **exhaust-the-design-space** and **laziness-protocol**. Data files are classic scripts with top-level `const`, loaded by `<script src>` before the inline script. No bundler. No `type="module"`. The loader evaluates each file once and returns the binding. It does not read `window.CONN_BASE`, because that property stays empty.

## Alternatives

**A. A project agent and nothing else.** A markdown file in `.grok/agents/` tells the next agent what not to do. Nothing in `npm test` fails when the agent ignores it. **encode-lessons-in-structure** says a repeated instruction with no check is the bug.

**B. Chosen.** One loader. Then move each table into a classic script the page already knows how to run. Checks fail on the measured mistakes. The project agent is the last phase and stays thin. **redesign-from-first-principles** says each table has one owner. **foundational-thinking** says the loader lands before the move. **subtract-before-you-add** says the string anchors and the extra drawers go away as the callers switch. **build-the-lever** is `test/load_map.mjs`.

**C. Vite, a component framework, or ES modules.** Rejected. The file-URL module body was empty. The README and the browser tests use a file URL.

**model-the-domain** is why face order becomes a field on the card and loom membership stays data the tests load, rather than a paragraph in the agent file.

## Applicable skills

The implementer uses these by name.

- **how**, before editing a subsystem they have not read in that phase.
- **interrogate**, on the loader boundary and on the face-row conversion. Both will be argued.
- **unslop**, on this plan if it is edited, and on any prose the phases add.
- **show-me-your-work**, for the decision trail across ten phases.
- **babysit**, after a pull request is open.
- **create-skill**, in phase 10, because that phase adds a skill.

## Phases

1. [Shared loader](phase-1-loader.md)
2. [Print pack and i18n call the loader](phase-2-callers.md)
3. [Connector cards leave the page](phase-3-conn.md)
4. [Translations leave the page](phase-4-i18n.md)
5. [Four face drawers become rows](phase-5-faces.md)
6. [Print pack reads those rows](phase-6-print-faces.md)
7. [Selection functions leave the page](phase-7-selection.md)
8. [Stop new source-text locks](phase-8-source-locks.md)
9. [Loom tests load the set](phase-9-loom-asserts.md)
10. [Project agent](phase-10-agent.md)

Each phase is shippable on its own. Later phases assume the earlier files exist. They are a chain, not ten independent pulls. **sequence-verifiable-units** is why the loader is phase 1 and the agent is phase 10.

## Verification

Project commands, from the repo root:

- `node test/fsm_routes.mjs`
- `node test/i18n.mjs`
- `node test/variants.mjs`
- `$env:HARNESS_SKIP_BROWSER='1'; node test/harness_page_tests.mjs` in PowerShell. `npm run test:static` uses bash env syntax.
- Browser phases need `npm install` so `puppeteer-core` resolves, then `node test/sel_outline.mjs` and `node test/f102.mjs`.
- Print pack phases write to `PRINT_PACK_OUT` under the temp directory so the committed PDFs stay untouched.

Per-phase static and runtime checks are in the phase files and in [testing.md](testing.md).

## Implementation guidance

- Read **how** before changing loaders, face drawing, or selection.
- Run **interrogate** on phase 3 and phase 5 before those diffs land.
- Run **unslop** on prose. The page copy is product text and is not an unslop target.
- Keep a **show-me-your-work** note per phase with the command output that proved it.
- **babysit** the pull request after it is open.
- **outcome-oriented-execution** means a phase is done when its check fails on the old mistake and passes on the new tree. A phase that only moves code is not done.
- **prove-it-works** means a page change is exercised in Chrome. Static tests do not prove a click still selects a pin.
- **guard-the-context-window** means the implementer reads the phase file and the files it names, not all 9484 lines, unless **how** says the behavior is in the inline script.
- **never-block-on-the-human** means a question about file URLs, script scope, or a missing translation gets a prototype or a count. Product rules already listed in Constraints stay put.
- Do not commit unless the maintainer asks.
- Skip Graphite. `gt` is not installed.
