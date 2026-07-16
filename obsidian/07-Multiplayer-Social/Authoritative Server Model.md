---
title: Authoritative Server Model
status: LOCKED
implementation: PLAYABLE
area: multiplayer
tags: [multiplayer, architecture, locked]
sources: docs/context/ARCHITECTURE.md, .cursor/rules/game-engine.mdc
updated: 2026-07-16
---

# Authoritative Server Model

`server/src/engine.ts` is the single source of truth: phases, timers, allocations, scores, correct answer.

Clients render state and send **intents**; they never compute outcomes locally.

Clients never submit “I was correct,” score deltas, random results, or resolved item effects.

## Related

- [[Socket Contract]]
- [[Secret State Isolation]]
- [[Active Architecture]]
