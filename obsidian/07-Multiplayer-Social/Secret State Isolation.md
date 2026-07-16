---
title: Secret State Isolation
status: LOCKED
implementation: PLAYABLE
area: multiplayer
tags: [multiplayer, privacy, locked]
sources: AGENTS.md, docs/context/ARCHITECTURE.md
updated: 2026-07-16
---

# Secret State Isolation

Never expose during a question:

- `correctIndex`
- Other players' private state
- Mutiny choices
- Exact loot allocations
- Private inventories/clues

Exact loot splits stay private until reveal; only totals, lock status, and confidence flags are public.

## Related

- [[Authoritative Server Model]]
- [[Secret Mutiny]]
- [[Loot Drop Special Round]]
