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

## Important implementation mismatches

1. Live total rounds include specials; confirmed totals count regular questions.
2. Live first item is earned on first correct answer in questions 1–5; confirmed ceremony is
   after question 5.
3. Live mutiny is available immediately and uses earlier transfer rules; confirmed mutiny
   starts after question 5, forfeits answering and has four count-based outcomes.
4. Live Loot Drop uses fixed 100 gold; confirmed design wagers the previous block's earnings.
5. Live Poseidon grants +50 on regular reveals; confirmed Poseidon rescues Loot Drop wagers.
6. Shark Attack and Barnacle items are not implemented.
7. Streak bonuses are playable but remain an unconfirmed pilot.

## Asset status

- Higgsfield is the required preferred pipeline.
- On 2026-07-14 the MCP server was discoverable, but two balance calls failed.
- No new assets were generated in this documentation pass; do not claim otherwise.
- Generate event-by-event using `ANIMATION_AND_ASSETS.md` and record real provenance.

## Next implementation slice

Implement Phase 1 from `ROADMAP.md` as one server-authoritative migration with shared tests:

1. separate regular and special counters;
2. post-question-5 item ceremony;
3. gate mutiny/marooning;
4. exact mutiny resolution and answer forfeiture;
5. next-regular-question maroon skip;
6. two-device smoke path.

## Do not regress

- Create/join/rejoin and host migration.
- Secret state and authoritative server outcomes.
- Reveal queue and non-negative scores.
- Dev playtest panel absent from production.
- Mobile readability and reduced-motion behaviour.

Update this file whenever implementation truth or the immediate next slice changes.
