---
title: Runtime Composition Prefer Sprites
status: LOCKED
implementation: PARTIAL
area: art-pipeline
tags: [higgsfield, runtime, locked, art-pipeline]
sources: docs/context/ANIMATION_AND_ASSETS.md, design/concept/VIDEO_FIRST_MOTION.md
updated: 2026-07-16
---

# Runtime Composition Prefer Sprites

Generated video is not automatically production-ready. Prefer:

- Higgsfield-authored sprite/keyframe layers
- Transparent/cutout ships, characters, effects
- Short loopable WebM only for state-independent ambience
- Runtime composition in the active client
- Procedural fallbacks so missing binaries never stop play

Never place secret or variable game data inside baked video.

## Related

- [[Higgsfield Mandate]]
- [[Asset Provenance Record]]
