# Phase 10. Project agent

[Overview](overview.md)

## Goal

Add the project agent the maintainer asked for, after the checks exist. The agent points at files and checks. It does not restate the whole FSM.

Use **create-skill** for the skill file. The body is the upstream `/correct` text, not a rewrite. The installed pstack `0.14.1-grok.2` does not ship that skill. Upstream added it on 2026-10-03 in cursor/plugins PR 494, commit `9511e60`. Copy from `https://raw.githubusercontent.com/cursor/plugins/main/pstack/skills/correct/SKILL.md` at implementation time, and record the commit hash in the phase note.

## Changes

- `.grok/agents/harness.md`. Project agent. Frontmatter follows the user guide for project agents. `name`, `description`, and `mcpInheritance`. No `mcpServers`, no hooks, no `permissionMode: bypassPermissions`.
- `.grok/skills/correct/SKILL.md`. The upstream skill, so `/correct` resolves in this repo.

The agent prompt tells the next agent to do these things.

- Run `/correct`, then the architect skill, before a structural edit.
- Edit `data/conn.js` or `data/i18n.js` for a card or a string. Do not copy the neighboring card inside `index.html`.
- Answer a file-URL or loader question with a prototype. Ask the maintainer when the question is which product rule to change.
- Do not put live diagnosis on the page.
- Do not let English or Japanese fall back to Spanish on the page.
- Do not widen `FACE_SHARE_OK` so a bad share passes. A shared photo is the same part, and Ezequiel confirms it.
- Do not rebuild the IPDM grid from `4c99371`.
- Do not unhide `ipdm_legend`, add the two 20-pin joint boxes, or redo Slack.
- Sub `fuses` stays `jb_10a_inj`, `jb_15a_ht`, `fuse36_alt`.
- Do not add ECM pin 77 to every coil or injector. Do not add 89 to the starter circuit. Do not set E8-39 `circ` to `fp_relay`.
- Alim stays off unless `z33_railRelPower` is `'1'`.

Keep the prompt short enough to read. The checks in phases 4, 5, 8, and 9 are the enforcement. The bullets above are the judgment calls those checks cannot see.

## Data structures

None.

## Verification

Static. The agent file is markdown with the frontmatter the user guide requires. The skill file has YAML frontmatter and the upstream steps for finding a class that happened twice and fixing it at the highest level.

Runtime. There is no page change. Confirm `/correct` resolves to `.grok/skills/correct/SKILL.md` in a new session. If slash commands load only at session start, say that in the phase note and do not claim the current session saw it.
