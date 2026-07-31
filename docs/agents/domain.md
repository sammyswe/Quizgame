# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

Treasure Trap keeps **two** agent-readable design sources. Matt Pocock skills that expect a single `CONTEXT.md` + `docs/adr/` should treat the root `CONTEXT.md` as the glossary entry point, then follow the links below into the real ledgers.

## Before exploring, read these

1. **`CONTEXT.md`** (repo root) — short ubiquitous-language / glossary entry for skills that look there first.
2. **`docs/context/INDEX.md`** — compact Cursor router; load only the 1–3 documents it lists for the task.
3. **`docs/context/HANDOFF.md`** — current session state and open risks.
4. Matching **Obsidian** area MOC under `obsidian/_MOCs/` and atomic notes for the mechanic.
5. **`docs/adr/`** — architectural decision records written by `/domain-modeling` / `/grill-with-docs`.
6. Existing product ADRs-of-sorts also live in `docs/context/` (STATUS, MECHANICS, ARCHITECTURE, SPECIAL_ROUNDS, etc.) — prefer those over inventing parallel truth.

If a file does not exist yet, **proceed silently**. Don't flag absence; `/domain-modeling` (via `/grill-with-docs`) creates glossary/ADR entries lazily when terms or decisions are resolved.

## Status vocabulary (project-specific)

Use LOCKED / PILOT / IDEA / REJECTED from `docs/context/STATUS.md` and Obsidian frontmatter. Existing code is not automatically confirmed design.

## Use the glossary's vocabulary

When your output names a domain concept (issue title, refactor proposal, hypothesis, test name), use the term as defined in `CONTEXT.md` and the linked `docs/context/` / Obsidian notes. Don't drift to synonyms the glossary explicitly avoids.

## Flag ADR conflicts

If your output contradicts an existing ADR or LOCKED context doc, surface it explicitly rather than silently overriding.
