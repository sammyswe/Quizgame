---
title: Scoring Invariants
status: LOCKED
implementation: PLAYABLE
area: scoring
tags: [scoring, invariants, locked]
sources: AGENTS.md, shared/src/game/scoring.ts, docs/context/MECHANICS.md
updated: 2026-07-16
---

# Scoring Invariants

- Server owns outcomes and score mutation
- Every score change emits a reveal event — **no silent score changes**
- Scores clamp at zero via `applyDelta` / `clampScore`
- Catch-up effects are bounded; knowledge remains main win route
- Numeric balance truth lives in `shared/src/config/*`

## Related

- [[Scores Never Go Below Zero]]
- [[Reveal Event Queue]]
- [[Knowledge Usually Wins]]
