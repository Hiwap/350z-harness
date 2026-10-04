# Phase 9. Loom tests load the set

[Overview](overview.md)

## Goal

Hiding the wrong connector happened twice. `0f746cc` hid F20. `efe5dd5` showed it again. `0368022` hid T21 the way T20 is hidden. The tests that should catch the next hide match the source text of `LOOM_BODY_EXTRA`, so a formatting change fails and a behavior-preserving rewrite of the set also fails.

Assert who is in the set. Leave the set where it is. A membership redesign is a different plan.

## Changes

Files are `test/harness_page_tests.mjs` and `test/verify_harness_bugs.mjs`. Read both with **how** and touch only assertions that match the literal `new Set([...])` text.

Known locks in `test/harness_page_tests.mjs` include the `LOOM_BODY_EXTRA` regex near line 130 and the per-fuse `new RegExp` near line 146. Replace those with assertions on the evaluated set.

Membership the current page must keep:

- F20 is in the engine-harness view. `efe5dd5` put it back.
- T21 is hidden in that view. `0368022`.
- Every fuse card id the current test lists is still in `LOOM_BODY_EXTRA`.

If `verify_harness_bugs.mjs` has no set-literal assert, do not edit it for company.

Lower the phase 8 count by the number of `.test(html)` calls this phase deletes.

## Data structures

`LOOM_BODY_EXTRA` stays a `Set` of connector ids in `index.html`. The test loads it. The test does not store a second copy of the whole set as a string.

## Verification

Static. Both test files exit 0. The phase 8 limit test exits 0 at the new lower count.

Runtime. `node test/f102.mjs` covers the loom toggle. In that run, F20 is present in the engine-harness view and T21 is absent. If `f102.mjs` does not already look at those two ids, add those two asserts there only if the file is already the loom browser test. Otherwise drive the same check with a short puppeteer script that is not committed, and paste the result into the phase note. Do not add a third harness for one lookup.
