# Phase 4. Translations leave the page

[Overview](overview.md)

## Goal

String tables have one owner, `data/i18n.js`. A missing English or Japanese string fails a test. `backup_sw` stops being the shape an agent copies.

## Changes

- Add `data/i18n.js` as a classic script, top-level `const`, same rules as `data/conn.js`. Move `I18N`, `CONN_I18N`, `PIN_NAME`, `PIN_NAME_EN`, `PIN_NAME_JA`, `TITLES_I18N`, and `NOTES_I18N`.
- `index.html` drops those objects and loads `data/i18n.js` before the inline script. `t`, `circuitTitle`, `circuitNotes`, and `applyLang` stay in the page.
- Change `backup_sw` inside `TITLES_I18N` so `en` and `ja` are strings, like the other 167 titles. Use the `name` already stored on the object. `circuitTitle` returns `tr[lang]` and line 8255 inserts it into HTML. An object becomes a useless label.
- Delete the Spanish fallback in `t`, `circuitTitle`, and `circuitNotes`. A missing key shows the key. Spanish still comes from `cir.title` and `cir.notes` when `lang` is `es`. The print pack keeps its own fallback.
- Extend `test/i18n.mjs` so it fails when any of these are true. Prove each failure on a throwaway object, then point the test at the real file.
  - A `CONN_BASE` id has no `CONN_I18N[id].en` or `.ja`.
  - A pin `note` has no `note_en` or `note_ja`.
  - A `TITLES_I18N` or `NOTES_I18N` language value is not a string.
  - An `I18N.es` key is missing from `en` or `ja`.

Today those counts are clean. 103 cards, 260 notes, 209 chrome keys, one bad title. The check is for the next miss, and for `backup_sw` now.

Do not merge the three table shapes into one. `I18N` is three dictionaries. Card text is Spanish on the card plus `CONN_I18N`. Pin notes are three fields. Group labels in `SUB_I18N` are already `{es, en, ja}`. One phase that rewrites all of them is how an agent drops a language.

## Data structures

No new schema. `backup_sw` changes from `{en:{name, meta}, ja:{name, meta}}` to `{en:string, ja:string}`.

## Verification

Static. `node test/i18n.mjs` exits 0 on the real files and fails on a fixture card whose `note_ja` was removed. The fixture is not committed.

Runtime. `node test/ui-lang.mjs` after `npm install`. Then, in that same Chrome session, set the language to English, select the backup-lamp circuit, and read the title. It is the English string, not `[object Object]`, and not the Spanish sentence. Repeat for Japanese.
