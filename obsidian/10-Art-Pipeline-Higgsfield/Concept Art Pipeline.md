---
title: Concept Art Pipeline
status: PILOT
implementation: PARTIAL
area: art-pipeline
tags: [higgsfield, pipeline, pilot, art-pipeline]
sources: docs/context/POLISH_PRODUCTION_PLAN.md, design/concept/README.md, design/concept/ANIMATION_PIPELINE.md
updated: 2026-07-16
---

# Concept Art Pipeline

- `design/assets.csv` is the locked generation queue
- Drop owner-approved Phase-0 locks into `design/concept/approved/` before bulk regen
- Owner Apps UI / handed concept art is the reliable path when cloud generate fails
- Existing Higgsfield binaries and Phaser-drawn art are explicit fallbacks, not final art

See also: `design/concept/SHELL_UI_BATCH.md`, `MOTION_BATCH.md`, `VIDEO_FIRST_MOTION.md`.

## Related

- [[Asset Provenance Record]]
- [[Voyage Art Integration Status]]
