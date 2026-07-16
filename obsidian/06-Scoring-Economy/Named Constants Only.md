---
title: Named Constants Only
status: LOCKED
implementation: PLAYABLE
area: scoring
tags: [config, invariants, locked, scoring]
sources: AGENTS.md, .cursor/rules/code-quality.mdc
updated: 2026-07-16
---

# Named Constants Only

Scoring, odds, timing, and rarity values live in `shared/src/config/*`. No magic numbers in game logic.

Prose in this vault explains purpose and status; code holds numeric truth.

## Related

- [[Scoring Invariants]]
- [[Active Architecture]]
