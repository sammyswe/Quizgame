---
title: Phaser In Round Gameplay
status: LOCKED
implementation: PLAYABLE
area: architecture
tags: [architecture, phaser, locked]
sources: docs/context/ARCHITECTURE.md, .cursor/skills/phaser-vertical-slice/SKILL.md
updated: 2026-07-16
---

# Phaser In Round Gameplay

Active in-round engine is Phaser 3 + TypeScript under `client/src/game/`.

React owns landing, lobby, intros, leaderboard, winner, modal overlays.

Do not migrate off Phaser unless 3D/native becomes a product requirement.

## Related

- [[Active Architecture]]
- [[GameEventBridge Boundary]]
