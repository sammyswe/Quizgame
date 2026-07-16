---
title: Active Architecture
status: LOCKED
implementation: PLAYABLE
area: architecture
tags: [architecture, runtime, locked]
sources: docs/context/ARCHITECTURE.md, .cursor/rules/game-engine.mdc
updated: 2026-07-16
---

# Active Architecture

```
React shell (landing/lobby/intros/leaderboard/winner/modals)
        ↕ Zustand snapshots
GameEventBridge
        ↕ state in / intents out
Phaser 3 in-round gameplay
        ↕ typed Socket.IO
Node authoritative server (server/src/engine.ts)
        ↕ pure inputs/results
Shared types, config, game logic
```

`experiments/loot-drop/` is archived reference — do not import its stale protocol.

Ownership:

- `shared/src/types/index.ts` — socket/state types
- `shared/src/config/*` — named constants
- `shared/src/game/*` — pure resolvers + Vitest
- `server/src/engine.ts` — authority
- `server/src/rooms.ts` — rooms/reconnect/host
- `client/src/game/` — Phaser
- `client/src/` — React shell

## Related

- [[GameEventBridge Boundary]]
- [[Authoritative Server Model]]
- [[Phaser In Round Gameplay]]
