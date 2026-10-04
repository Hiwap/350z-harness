# Phase 2. Print pack and i18n call the loader

[Overview](overview.md)

## Goal

`make_print_pack.py` and `test/i18n.mjs` stop carrying their own copies of the slice. They ask `test/load_map.mjs`. The tables still live in `index.html`.

## Changes

- Extend `test/load_map.mjs` so a caller can also take `I18N`, `CONN_I18N`, `TITLES_I18N`, and `NOTES_I18N`. Use the end anchors those callers use today. `I18N` ends at `const TITLES_I18N`. `CONN_I18N` ends at `const IPDM_DISPLAY_ORDER`.
- For `CONN_BASE`, compare the object from the `CONN_FACE` slice with the object from the `LS_LOOM` slice. This session both paths return 103 keys. If the JSON differs, stop and keep the wider slice for the print pack. If it matches, the print pack uses the loader and the inline `node -e` script in `_load_map_i18n` goes away.
- Point `test/i18n.mjs` at the loader for the `I18N` object. Keep its current assertions.

Do not change PDF wording. The print pack `t` falls back from the pack language to English and then Spanish. That fallback stays in the print pack. Do not copy it into the page.

## Data structures

The loader gains named extracts. Each extract is the object the page already declares. No new schema.

## Verification

Static. A small node command prints `Object.keys(CONN_BASE).length` and the three `I18N` key counts. Expected numbers from this session are 103 cards and 209 keys per language. `node test/i18n.mjs` exits 0.

Runtime. `PRINT_PACK_OUT` points at a temp pdf. `python make_print_pack.py --lang es` exits 0 and the temp pdf is a non-trivial file. Then the same for `en` and `ja`. Do not overwrite `350Z_2005_PRINT_PACK.pdf` or the `_es` and `_ja` copies. There is no click in this phase.
