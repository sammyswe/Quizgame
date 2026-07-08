---
name: treasure-trap-loot-drop
description: Work on Treasure Trap's Loot Drop round — the Phaser 3 pirate casino vertical slice. Use when editing gameplay, multiplayer, assets, reveals, or anything in client/src/game for this repo.
---

# Treasure Trap — Loot Drop

This repo is a **multiplayer neon-pirate-casino party game**. The only polished
gameplay pass is **Loot Drop**: a full-screen animated Phaser scene, not a quiz
website.

## Mental model

```
React shell (landing, lobby, game-over, debug HUD)
    ↕ GameEventBridge
Phaser LootDropScene (everything the player sees during a round)
    ↕ socket.io
Authoritative server (server/src/room.ts)
```

- **Server decides outcomes.** Clients render state and send intents
  (allocate, lock, item use).
- **Never rebuild all seven rounds.** Improve Loot Drop until playtests say
  "this feels like a game."

## Run & verify

```bash
npm install
npm run dev          # :5173 client, :3001 server
npm run typecheck
npm run build
```

Two-browser smoke tests (with dev running):

```bash
node scripts/smoke-test.mjs
node scripts/smoke-test-interactions.mjs
```

Walk `docs/PLAYTEST_VISUAL_CHECKLIST.md` after visual changes.

## Key files

| Area | Path |
|------|------|
| Main scene | `client/src/game/scenes/LootDropScene.ts` |
| Reveal timeline | `client/src/game/systems/RevealDirector.ts` |
| VFX / camera | `client/src/game/systems/VfxSystem.ts`, `CameraDirector.ts` |
| React ↔ Phaser bridge | `client/src/game/GameEventBridge.ts` |
| Socket contract | `shared/src/types.ts` |
| Server logic | `server/src/room.ts` |
| Procedural art | `client/src/game/assets/generatedTextures.ts` |
| Higgsfield art | `client/src/assets/higgsfield/loot-drop/` |
| Docs | `docs/PHASER_ARCHITECTURE.md`, `docs/LOOT_DROP_VISUAL_PRD.md` |

## Loot Drop gameplay loop

1. 4 answer **islands** (not cards). Each player gets **100 loot** in steps of 10.
2. Drag coins from the pile or tap islands; right-click removes 10.
3. **LOCK IN** commits. Other clients see lock icon + confidence flag.
4. **Reveal**: correct island glows gold; raiders bombard wrong islands;
   loot plundered or paid out; leaderboard; next question.
5. **Fear Shot**: drag reticle onto another player (item targeting prototype).

## Hard no's

- Static React answer cards, numeric inputs, emoji-as-art, instant state swaps.
- Breaking room create/join, host start, allocation sync, reveal sync.
- Hardcoded texture paths (use `spriteKeys.ts` + `AssetManager`).
- Polishing lobby/menus while the Phaser scene still has obvious weaknesses.

## Intensity & assets

- `gameSettings.animationIntensity`: `reduced` | `normal` | `chaos` — scale
  particles/shake via `intensityScale()`.
- `gameSettings.assetMode`: `auto` (Higgsfield if present) | `procedural`.
  Game must boot with **zero** binary assets thanks to `generatedTextures.ts`.
