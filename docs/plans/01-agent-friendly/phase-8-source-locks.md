# Phase 8. Stop new source-text locks

[Overview](overview.md)

## Goal

`test/harness_page_tests.mjs` has 119 `.test(html)` calls. Several pass when the source text matches and the function never runs. New work must not add another one. The failure tells the author what to do instead.

## Changes

- Add `test/html_source_limit.mjs`. It counts `.test(html)` in `test/harness_page_tests.mjs`. The count may be 119 or less. Over 119, it exits 1. The error text says to assert the loaded value from `test/load_map.mjs`, and not to match a sentence of the page.
- Add that file to the `npm test` script in `package.json`, after `test/harness_page_tests.mjs`.

Do not rewrite the existing 119 in this phase. Phase 9 replaces the loom ones. The rest shrink when a later bug fix touches them.

Lower the allowed count in the same commit that deletes a `.test(html)` call, so the limit only tightens.

## Data structures

None.

## Verification

Static. The new test exits 0 on the current file. A temp copy of `test/harness_page_tests.mjs` with one extra `.test(html)` makes it exit 1 and prints the instruction. Do not commit the copy.

Runtime. No page change. Chrome is not the check. The runtime is the failing count on the temp copy.
