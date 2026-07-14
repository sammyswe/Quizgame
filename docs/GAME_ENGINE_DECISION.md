# Game Engine Decision — Phaser gameplay active

> **Updated 2026-07-14:** Phaser now renders active in-round gameplay under `client/src/game/`.
> React remains the shell. The older implementation under `experiments/loot-drop/` is archived
> and must not supply network types. See `docs/context/ARCHITECTURE.md`.

## Decision: Phaser 3 (+ TypeScript) for the Loot Drop scene

Phaser `3.87` renders the entire active gameplay screen. React remains only
as the app shell (landing, lobby, game-over, debug overlay, connection chip).

## Why Phaser over the alternatives

**Phaser 3 (chosen)**

- Scene lifecycle, tween engine, camera system (pan/zoom/shake), particle
  emitters, tile sprites and input (drag, right-click) are all built in —
  every one of those is directly required by this slice's spec.
- `Graphics.generateTexture()` makes the procedural fallback asset system
  (`generatedTextures.ts`) trivial: the game boots with zero binary assets.
- Battle-tested for exactly this genre of 2D arcade/casino game feel.
- TypeScript types ship with the package.

**PixiJS (runner-up)**

- Excellent renderer, but it is only a renderer: cameras, tweens, particles,
  input gestures and scene management would each need extra libraries or
  hand-rolled systems. That is added integration risk with no visual upside
  for this scope.

**DOM/CSS/Framer Motion (rejected)**

- This is precisely the "React quiz app" trap the brief forbids. Coins flying
  along bezier curves, camera zoom/shake, particle bursts and 60fps ambient
  ocean motion are not sane in the DOM.

## Integration shape

- `client/src/game/PhaserGame.tsx` mounts the Phaser canvas in React and owns
  only its lifecycle.
- `client/src/game/GameEventBridge.ts` is the single boundary: the socket
  layer pushes authoritative room state / reveal payloads in; the scene emits
  player intents (allocations, lock-in, item use) out. Neither side imports
  the other's internals.
- The repo had no existing structure to conflict with, so there was no
  technical reason to fall back to PixiJS.
