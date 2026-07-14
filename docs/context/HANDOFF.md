---
id: HAND-001
title: Current agent handoff
status: PILOT
scope: active branch
updated: 2026-07-14
---

# Current handoff

## Current truth

- Root `pnpm dev` runs a React shell + active Phaser in-round client + Socket.IO server.
- Active gameplay: `client/src/game/`; `experiments/loot-drop/` remains archived reference.
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
- On 2026-07-14 the MCP server was reactivated by the owner but this cloud run still returned
  `Invalid or expired token` on a fresh `nano_banana_2` generation request.
- `design/assets.csv` contains the complete locked generation manifest and STYLE-001.
- Existing Higgsfield binaries and Phaser-drawn art are explicit fallbacks, not approved final art.
- Retry generation event-by-event after token propagation and record real provenance.

## Next implementation slice

1. Generate and integrate every row in `design/assets.csv` after Higgsfield authentication works.
2. Replace interim fallback art in `ArcadeGameplayScene`.
3. Complete a full automated block/special canvas interaction test.
4. Review every UI area using the questions supplied at handoff.

## Do not regress

- Create/join/rejoin and host migration.
- Secret state and authoritative server outcomes.
- Reveal queue and non-negative scores.
- Dev playtest panel absent from production.
- Mobile readability and reduced-motion behaviour.

Update this file whenever implementation truth or the immediate next slice changes.
