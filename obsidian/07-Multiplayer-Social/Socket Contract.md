---
title: Socket Contract
status: LOCKED
implementation: PLAYABLE
area: multiplayer
tags: [multiplayer, protocol, locked]
sources: shared/src/types/index.ts, docs/context/ARCHITECTURE.md
updated: 2026-07-16
---

# Socket Contract

Socket contract lives in `shared/src/types/index.ts` (`ClientEvents` / `ServerEvents`).

Any protocol change updates that file first and both sides together. Do not rename events without updating client + server + shared types.

## Related

- [[Authoritative Server Model]]
- [[Active Architecture]]
