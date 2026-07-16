---
title: Chroma Key Cutout Workflow
status: LOCKED
implementation: PLAYABLE
area: art-pipeline
tags: [higgsfield, pipeline, locked, art-pipeline]
sources: .cursor/rules/higgsfield-assets.mdc
updated: 2026-07-16
---

# Chroma Key Cutout Workflow

Ask for a plain solid dark background for easy cutout (models cannot emit alpha), then run:

`python3 scripts/chroma_key.py <file>`

Produces transparent `-cut` version. Keep raw generations in appropriate `raw/` folders under `client/src/assets/higgsfield/`.

## Related

- [[Higgsfield Mandate]]
- [[Asset Provenance Record]]
