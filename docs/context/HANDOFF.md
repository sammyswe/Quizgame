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

- **Visual quality gate is open.** Current Phaser scenes use procedural/fallback art; this is
  why the game feels unfinished. Stack is not the root cause — see
  [POLISH_PRODUCTION_PLAN.md](POLISH_PRODUCTION_PLAN.md).
- Higgsfield is the preferred art pipeline. Cloud-agent `balance`/generate may still fail;
  owner Apps UI / handed concept art is the reliable path.
- `design/assets.csv` is the locked generation queue (STYLE-001).
- Drop owner-approved Phase-0 locks into `design/concept/approved/` before bulk regen.
- Existing Higgsfield binaries and Phaser-drawn art are explicit fallbacks, not final art.

## Next implementation slice

1. Wait for owner Phase-0 style locks (`STYLE_LOCK_SEA`, `STYLE_LOCK_SHIP`, `STYLE_LOCK_ISLAND`)
   in `design/concept/approved/`, then wire them into Phaser and kill matching fallbacks.
2. Integrate hero assets in the ROI order in POLISH_PRODUCTION_PLAN Phase 1.
3. Juice + SFX pass only after hero silhouettes exist.
4. Complete full canvas interaction e2e; review with `UI_REVIEW_QUESTIONS.md`.
5. Do **not** migrate off Phaser unless 3D/native becomes a product requirement.

## Do not regress

- Create/join/rejoin and host migration.
- Secret state and authoritative server outcomes.
- Reveal queue and non-negative scores.
- Dev playtest panel absent from production.
- Mobile readability and reduced-motion behaviour.

Update this file whenever implementation truth or the immediate next slice changes.
