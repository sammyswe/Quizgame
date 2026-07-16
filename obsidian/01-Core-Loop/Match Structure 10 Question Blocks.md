---
title: Match Structure 10 Question Blocks
status: LOCKED
implementation: PLAYABLE
area: core-loop
tags: [match, structure, locked, core-loop]
sources: docs/context/MECHANICS.md, docs/context/SPECIAL_ROUNDS.md
updated: 2026-07-16
---

# Match Structure 10 Question Blocks

- Regular quiz questions play in blocks of **10**
- Completing each block triggers one special round
- Match length is selected before play and determines special-round count
- Example: 30-question game = 30 regular questions + 3 special rounds
- Special-round types are initially random
- Long-term content target: ≥12 special-round types and ≥3 final-round types
- Build sequentially: polish one special before starting the next

Code: `server/src/engine.ts` tracks regular questions and completed specials separately.

## Related

- [[Loot Drop Special Round]]
- [[First Five Questions Onboarding]]
- [[Special Round Framework]]
