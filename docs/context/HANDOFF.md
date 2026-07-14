---
id: HAND-001
title: Current agent handoff
status: PILOT
scope: active branch
updated: 2026-07-14
---

# Current handoff

## Current truth

- Root `pnpm dev` runs the React + Socket.IO arcade game.
- `experiments/loot-drop/` is archived Phaser reference code.
- Product direction is cartoon pirate excursion first; casino spectacle is concentrated in
  loot-box/jackpot rewards and selected high-stakes peaks.
- Confirmed match design is 10 regular questions followed by a special round.
- Loot Drop is the only special round to polish now.

## Current implementation status

1. Match lengths now count regular questions; each 10-question block is followed by a special.
2. Every player receives the onboarding item ceremony after question 5.
3. Mutiny begins after question 5, forfeits the answer and follows the confirmed count outcomes.
4. Maroon skips defer across specials to the next regular question.
5. Loot Drop wagers each player's positive earnings from the preceding block in 10-point steps.
6. Poseidon rescues eligible Loot Drop wagers and never targets the leader.
7. Shark Attack is implemented; last place currently receives an underdog chest while the
   unique shark item remains an explicit IDEA requiring redesign.
8. Barnacle items are not implemented.
9. Streak bonuses remain a playable but unconfirmed pilot.

## Asset status

- Higgsfield is the required preferred pipeline.
- On 2026-07-14 the MCP server was discoverable, but two balance calls failed.
- No new assets were generated in this documentation pass; do not claim otherwise.
- Generate event-by-event using `ANIMATION_AND_ASSETS.md` and record real provenance.

## Next implementation slice

1. Add a full automated block/special integration test (the current Playwright smoke reaches
   round 1; `scripts/simulate-arcade.mjs` covers the headless full test game).
2. Replace the temporary Shark Attack chest with a playtested unique item.
3. Implement Barnacle and Barnacle Infestation with accessible answer treatment.
4. Begin Phase 2 fleet/island visual work event-by-event through Higgsfield.

## Do not regress

- Create/join/rejoin and host migration.
- Secret state and authoritative server outcomes.
- Reveal queue and non-negative scores.
- Dev playtest panel absent from production.
- Mobile readability and reduced-motion behaviour.

Update this file whenever implementation truth or the immediate next slice changes.
