# Phaser Architecture

Logical resolution is 1280x720, scaled with `Phaser.Scale.FIT`. The world is
tween-driven (no physics engine); the server is authoritative for all game
state.

```
client/src/game/
  PhaserGame.tsx        React wrapper; mounts/destroys the Phaser.Game
  createGameConfig.ts   game config (scale, scenes, context-menu off)
  GameEventBridge.ts    two-way bridge: network <-> scene (caches last state)
  settings.ts           animationIntensity / assetMode / sound settings store
  scenes/
    BootScene.ts        generates all procedural textures
    PreloadScene.ts     loads Higgsfield art if present, slices sheet frames
    BaseScene.ts        shared systems init + HUD panel helper
    LootDropScene.ts    the vertical slice: world, dock, HUD, interactions
  objects/
    AnswerIsland.ts     island sprite + plaque + chip stack + flags + states
    PlayerAvatar.ts     medallion avatar with reactions/emotes/scared loop
    PlayerShip.ts       bobbing dock ship
    CoinPile.ts         drag source; remaining-loot readout
    CoinChip.ts         flying coin with bezier arc flight
    EnemyShip.ts        raider: sailTo / fireCannon / retreat
    LockInButton.ts     pulse, squash, slam states
    ScoreTicker.ts      rolling number counter
    FloatingText.ts     pop/rise/fade text (+40, PLUNDERED -60)
    ConfidenceFlag.ts   player-coloured flag planted on lock-in
    TargetReticle.ts    spinning Fear Shot drag reticle
  systems/
    VfxSystem.ts        coinBurst/sparkle/smoke/impact/splash/plunderTrail/...
    CameraDirector.ts   idle drift, zoomTo, panTo, shake, lock-in punch
    RevealDirector.ts   the sequential reveal timeline
    AssetManager.ts     role -> texture key/frame resolution (HF vs procedural)
    SoundEventBus.ts    named game events -> Web Audio synth blips
  assets/
    generatedTextures.ts  all procedural fallback art (Phaser Graphics)
    assetManifest.ts      import.meta.glob discovery of Higgsfield files
    spriteKeys.ts         every texture key constant + player colours
```

## Data flow

```
socket.io server
   | state / reveal / item events
   v
net/connection.ts ---> GameEventBridge ---> LootDropScene.applyRoomState()
                            ^                        |
                            | sendLoot/sendLockIn/   v
                            | sendFearShot     RevealDirector.play()
                            +------------ player input (drag/tap/slam)
```

- The bridge caches `lastRoomState` so a scene that boots or restarts late
  (e.g. after toggling asset mode) re-hydrates instantly.
- Local allocations are optimistic; the server re-validates
  (`allocationsValid`) and its state is authoritative at reveal time.
- The reveal payload carries exact per-player splits, gains, losses and the
  leaderboard so all clients play the identical cinematic.

## Timing contract

The server holds `reveal` phase for 16s. `RevealDirector`'s timeline finishes
at ~14.5s, leaving margin before the next `allocating` state arrives. If a
new question arrives early, `startNewQuestion()` cancels the director and
resets the world.
