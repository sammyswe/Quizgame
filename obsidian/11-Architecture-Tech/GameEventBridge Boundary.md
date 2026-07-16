---
title: GameEventBridge Boundary
status: LOCKED
implementation: PLAYABLE
area: architecture
tags: [architecture, phaser, locked]
sources: .cursor/rules/game-engine.mdc
updated: 2026-07-16
---

# GameEventBridge Boundary

`client/src/game/GameEventBridge.ts` is the only React/network ↔ Phaser boundary.

Phaser consumes snapshots and emits intents; scenes never import sockets or Zustand.
`PhaserGame.tsx` owns canvas lifecycle only.

## Related

- [[Active Architecture]]
- [[Phaser In Round Gameplay]]
