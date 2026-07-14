---
name: treasure-trap-loot-drop
description: Work on Treasure Trap's active Loot Drop special round and surrounding 10-question multiplayer block.
---

# Treasure Trap — Loot Drop

Loot Drop is the first special round in a **cartoon pirate excursion party quiz**. It follows
10 regular questions and wagers the treasure earned in that block. Casino intensity is an
earned accent during lock/reveal; the base fantasy is sending pirate forces on ventures.

## Mental model

```
React + Framer Motion client
    ↕ typed Socket.IO intents/state
Authoritative server (`server/src/engine.ts`)
    ↕
Pure shared rules/config
```

- Read `docs/context/INDEX.md`, `SPECIAL_ROUNDS.md`, `MECHANICS.md`,
  `VISUAL_DIRECTION.md` and `ANIMATION_AND_ASSETS.md`.
- Server decides allocation validity, lock, wildcards, payout and reveal.
- Do not build the next special before Loot Drop passes its polish gate.
- `experiments/loot-drop/` is archived Phaser reference, not the active root runtime.

## Run & verify

```bash
pnpm dev
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Verify two clients through create → join → 10 regular questions → prior-block wager →
allocation/lock → wildcard/reveal → next block. Add automation if the root smoke path does not
cover the changed behaviour.

## Key files

| Area | Path |
|------|------|
| Active client | `client/src/screens/QuestionScreen.tsx`, `client/src/components/` |
| Socket contract | `shared/src/types/index.ts` |
| Server orchestration | `server/src/engine.ts` |
| Pure allocation rules | `shared/src/game/lootDrop.ts` |
| Arcade/block config | `shared/src/config/arcade.ts` |
| Higgsfield art | `client/src/assets/higgsfield/` |
| Canonical spec | `docs/context/SPECIAL_ROUNDS.md` |

## Loot Drop gameplay loop

1. Pool = points earned in the preceding 10 regular questions (fixed 100 is a current PILOT).
2. Allocate through pirate ventures, not a numeric form.
3. Lock commits server-side; exact allocation remains private until reveal.
4. Resolve correct return and wrong losses sequentially.
5. Check Poseidon's Rescue, then Shark Attack, through named shared config and pure tests.
6. Emit visible reveal events for every score/item consequence.

## Hard no's

- Numeric inputs, emoji-as-final-art, instant state swaps.
- Breaking room create/join, host start, allocation sync, reveal sync.
- Exposing exact allocations/correct answer early.
- Treating a generated video as dynamic game state.
- Starting other specials while this gate is open.

## Asset and animation workflow

Use Higgsfield with the complete prompt context in `ANIMATION_AND_ASSETS.md`. Prefer composable
sprites/keyframes for dynamic players/targets. Record real job provenance and ship a fallback.
Every timeline cancels on newer server state and has a reduced-motion equivalent.
