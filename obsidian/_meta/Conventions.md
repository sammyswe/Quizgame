---
title: Vault Conventions
status: LOCKED
area: meta
tags: [meta, locked]
updated: 2026-07-16
---

# Vault Conventions

This Obsidian vault is the **idea notebook + design source of truth** for Treasure Trap.
Agents also read `docs/` (especially `docs/context/`) for Cursor-integrated roadmap and progress.

## Dual sources

| Source | Role |
| --- | --- |
| `obsidian/` | Granular ideas, mechanics, meetings, MOCs, status-tagged notes |
| `docs/` + `docs/context/` | Compact agent routing, HANDOFF, INDEX, implementation ledgers |

When they conflict: **latest explicit product-owner decision wins**, then LOCKED notes in either place, then active `.cursor/rules/`, then shipped code.

## Status tags (decision)

Use exactly one:

- `#locked` / frontmatter `status: LOCKED` — confirmed; preserve
- `#pilot` / `status: PILOT` — playtesting; measure before promoting
- `#idea` / `status: IDEA` — brainstorm; do not ship unless asked
- `#rejected` / `status: REJECTED` — ruled out; keep the reason

## Implementation (independent)

`NOT_STARTED` · `PARTIAL` · `PLAYABLE` · `POLISHED` · `VERIFIED`

## Note shape

One mechanic or idea per note. YAML frontmatter required:

```yaml
---
title: Name
status: LOCKED|PILOT|IDEA|REJECTED
implementation: NOT_STARTED|PARTIAL|PLAYABLE|POLISHED|VERIFIED
area: core-loop|items|...
tags: [idea, items]
sources: path/to/origin
updated: YYYY-MM-DD
---
```

## Linking

- Prefer `[[Wiki Links]]` to related notes and MOCs
- Every area has a Map of Content under `_MOCs/`
- Meeting dumps go in `00-Inbox/` then get filed into atomic notes

## Promotion

IDEA → PILOT (define test + success signal) → LOCKED (owner confirmation after evidence).
Any → REJECTED (record why + replacement).
