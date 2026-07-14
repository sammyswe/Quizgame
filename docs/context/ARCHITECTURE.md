---
id: ARCH-001
title: Active architecture
status: LOCKED
scope: root application
updated: 2026-07-14
---

# Active architecture

## Runtime truth

The application launched by root `pnpm dev` is:

```text
React + Framer Motion client
        ↕ typed Socket.IO intents/state
Node authoritative server (`server/src/engine.ts`)
        ↕ pure inputs/results
Shared TypeScript types, config and game logic
```

The Phaser implementation in `experiments/loot-drop/` is archived reference material. Do not
import its paths into the active app or describe `client/src/game/` as existing. A future engine
migration requires a new explicit architecture decision and an end-to-end multiplayer plan.

## Ownership

- `shared/src/types/index.ts`: canonical public/private state and socket event types.
- `shared/src/config/*`: named balance/timing/odds constants.
- `shared/src/game/*`: deterministic, IO-free resolvers with Vitest coverage.
- `server/src/engine.ts`: phases, timers, legal actions, secrets, random rolls, scores and emits.
- `server/src/rooms.ts`: room lifecycle, reconnect and host migration.
- `client/src/`: renders state, gathers intents, stages audiovisual feedback.

## Invariants

1. Clients never submit “I was correct,” score deltas, random results or resolved item effects.
2. `correctIndex`, hidden allocations, mutiny choices and private inventories do not enter
   public state before reveal.
3. Every client payload is validated for room, player, phase, lock state, target and bounds.
4. Scores clamp at zero through shared scoring utilities.
5. Meaningful score/item/phase changes produce visible events; no silent mutation.
6. Reconnect receives enough public/private state to reconstruct the current phase.
7. Animation timelines cancel when a newer question/phase supersedes them.
8. Debug controls exist only in development builds and still use authoritative handlers.

## Multiplayer acceptance loop

Two separate clients can:

1. create/join/rejoin by 4-character room code;
2. preserve nickname and host migration;
3. configure length and start;
4. play ten regular questions;
5. receive the first item ceremony after question 5;
6. mutiny secretly after question 5;
7. resolve marooning and skip correctly;
8. enter Loot Drop with prior-block points;
9. allocate/lock privately and see a synced reveal;
10. continue into another block or winner state.

Automate this path where practical and manually verify it before public playtests.
