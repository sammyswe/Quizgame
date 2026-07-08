---
name: phaser-vertical-slice
description: Build one incredible 2D game scene instead of a polished website — React shell + Phaser gameplay + event bridge. Use when turning a web app into a mobile-arcade-style game scene or scoping a vertical slice.
---

# Phaser vertical slice pattern

Learned from Treasure Trap Loot Drop: **do not spread effort across every
screen**. Pick one gameplay moment and make it feel like Brawl Stars / Coin
Master — prove the game works, then expand.

## Architecture

```
┌─────────────────────────────────────┐
│  React: lobby, connection, debug    │
│  (functional UI, not gameplay art)  │
└──────────────┬──────────────────────┘
               │ mount PhaserGame.tsx
┌──────────────▼──────────────────────┐
│  Phaser: Boot → Preload → GameScene   │
│  objects/  systems/  assets/          │
└──────────────┬──────────────────────┘
               │ GameEventBridge
┌──────────────▼──────────────────────┐
│  Network: authoritative multiplayer   │
└─────────────────────────────────────┘
```

## Why Phaser over DOM/CSS

Gameplay needs: camera pan/zoom/shake, particle bursts, bezier coin flights,
tile-sprite scrolling water, drag-and-drop, sequential reveal timelines.
DOM animation libraries fight you here; Phaser ships all of it.

PixiJS is renderer-only — you'd bolt on tweens, input, scenes yourself.

## Scene structure (copy this layout)

```
game/
  PhaserGame.tsx          # React wrapper, lifecycle only
  GameEventBridge.ts      # network ↔ scene, caches last state
  createGameConfig.ts
  scenes/
    BootScene.ts          # generate procedural textures
    PreloadScene.ts       # load optional art, slice sheets
    BaseScene.ts          # init AssetManager, Vfx, Camera
    *GameScene.ts         # the vertical slice
  objects/                # AnswerIsland, CoinPile, LockInButton, …
  systems/
    VfxSystem.ts
    CameraDirector.ts
    RevealDirector.ts     # cancellable delayedCall timeline
    AssetManager.ts
    SoundEventBus.ts
  assets/
    generatedTextures.ts  # MUST exist — game boots with no files
    assetManifest.ts
    spriteKeys.ts
```

## Bridge rules

1. Network pushes `state`, `reveal`, `item` → bridge → scene handlers.
2. Scene emits `sendLoot`, `sendLockIn`, `sendFearShot` → bridge → socket.
3. Bridge caches `lastRoomState` so scene restarts (asset toggle) re-hydrate.
4. **Never** import scene code from React or socket code from Phaser objects.

## Scoping discipline

| Do in the slice | Defer |
|-----------------|-------|
| One full animated scene | Other game modes |
| One interaction done excellently (drag + tap) | Every item type |
| One reveal cinematic | Every round's unique rules |
| Chunky lobby (create/join/start) | Beautiful menus |
| Debug panel for iteration | Production settings UI |

## Acceptance test

First playtest should produce: *"Okay, now it actually feels like a game."*

If it still feels like a website, you spread effort wrong — stop polishing
chrome and fix the scene.
