---
title: Scores Never Go Below Zero
status: LOCKED
implementation: PLAYABLE
area: scoring
tags: [scoring, invariants, locked]
sources: AGENTS.md, .cursor/rules/product.mdc
updated: 2026-07-16
---

# Scores Never Go Below Zero

All score changes go through shared scoring utilities. Attacks must never destroy an entire player's game.

## Related

- [[Scoring Invariants]]
- [[Item Design Principles]]
