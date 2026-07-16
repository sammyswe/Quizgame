---
title: Reconnect State Reconstruction
status: LOCKED
implementation: PLAYABLE
area: multiplayer
tags: [multiplayer, reconnect, locked]
sources: docs/context/ARCHITECTURE.md, .cursor/rules/game-engine.mdc
updated: 2026-07-16
---

# Reconnect State Reconstruction

Client effects tolerate out-of-order/late state: cancel running timelines on phase/question changes and rehydrate from Zustand/socket state after reconnect.

Reconnect receives enough public/private state to reconstruct the current phase. Visual state reconstructs without replaying stale effects.

## Related

- [[Room Create Join Rejoin]]
- [[Animation Timeline Cancellation]]
