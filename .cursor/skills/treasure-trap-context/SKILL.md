---
name: treasure-trap-context
description: Load and maintain Treasure Trap's token-efficient product context bank without reviving stale designs.
---

# Treasure Trap context discipline

Use for planning, mechanics, architecture, roadmap or cross-cutting work.

## Load order

1. Read `docs/context/INDEX.md`.
2. Read `docs/context/HANDOFF.md`.
3. Open the matching Obsidian area MOC under `obsidian/_MOCs/` and the atomic notes for the
   mechanic (one note per idea). Check `obsidian/00-Inbox/` for fresh meeting capture.
4. Load only the 1–3 `docs/context/` documents routed for the task.
5. Verify implementation claims in code; prose status and code state are separate.

Do not begin with old root-level PRD/game-design/Phaser docs or `obsidian/Archive/`. They
contain useful history but describe competing prototypes.

Dual sources: `obsidian/` (granular notebook) + `docs/context/` (compact router/ledgers).
See `.cursor/rules/obsidian-vault.mdc` and `obsidian/_meta/How Agents Use This Vault.md`.

## Status discipline

- LOCKED: preserve; report implementation mismatch as a TODO.
- PILOT: keep scoped to its test; do not silently generalise.
- IDEA: preserve but do not ship unless the task promotes it.
- REJECTED: retain the reason and do not revive casually.

Every statement about a mechanic should distinguish decision status from implementation state.
Never use “implemented” to mean “confirmed,” or vice versa.

## Updating context

When a decision changes:

1. update the canonical context document **and** the matching Obsidian atomic note / MOC;
2. preserve the old decision as superseded/rejected with reason;
3. align applicable `.cursor/rules/`;
4. align the relevant skill;
5. update code/tests if behaviour changes;
6. refresh `HANDOFF.md` and keep `INDEX.md` compact;
7. file meeting capture from `obsidian/00-Inbox/` into atomic notes.

Numeric balance truth belongs in `shared/src/config/*`; docs explain purpose and status.

## Conflict resolution

Priority:

1. latest explicit product-owner decision;
2. LOCKED record in `obsidian/` or `docs/context/**`;
3. active `.cursor/rules/`;
4. shipped code (implementation truth, not necessarily design truth);
5. `obsidian/Archive/` and archived/root historical docs.

If two higher-priority sources conflict, record the conflict and ask one focused question.
