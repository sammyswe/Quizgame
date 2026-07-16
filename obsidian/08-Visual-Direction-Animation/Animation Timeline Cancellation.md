---
title: Animation Timeline Cancellation
status: LOCKED
implementation: PLAYABLE
area: visual
tags: [visual, architecture, locked]
sources: .cursor/rules/game-engine.mdc, docs/context/ARCHITECTURE.md
updated: 2026-07-16
---

# Animation Timeline Cancellation

Animation timelines must tolerate late/out-of-order state, cancel on phase/question changes, and reconstruct from current state after reconnect.

## Related

- [[Reconnect State Reconstruction]]
- [[Definition of Polished Event]]
