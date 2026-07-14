---
id: MECH-001
title: Core mechanic specification and implementation ledger
status: LOCKED
scope: active arcade game
updated: 2026-07-14
---

# Core mechanics

This file separates confirmed design from shipped behaviour. It is the mechanic TODO ledger,
not permission to fill undecided balance values with guesses.

## Match structure

**Decision: LOCKED · Implementation: PLAYABLE**

- Regular quiz questions are played in blocks of **10**.
- Completing each 10-question block triggers one special round.
- Match length is selected before play and determines special-round count. A 30-question game
  contains 30 regular questions and 3 special rounds.
- Special-round types are initially random. A future option may let players choose the set of
  special rounds, but never their order.
- Long-term content target: at least 12 special-round types and at least 3 final-round types.
- Build sequentially: fully polish one special round before starting the next.

`server/src/engine.ts` tracks regular questions and completed specials separately; a 30-question
match contains 30 regular questions and 3 specials.

## First five questions and item onboarding

**Decision: LOCKED · Implementation: PLAYABLE**

- Mutiny and marooning are unavailable during questions 1–5.
- The first item ceremony occurs immediately after question 5 to introduce items deliberately.
- Items may have different legal timing windows; the final timing model is not decided.

The live game now grants each player the onboarding item after question 5 and gates social
mechanics until question 6.

## Regular question

**Decision: LOCKED · Implementation: PLAYABLE/PARTIAL**

1. The fleet encounters a question and four answer islands.
2. Each player sails/selects one island.
3. The correct island holds treasure.
4. The available treasure visibly dwindles with time so speed matters.
5. Correct players receive the amount remaining when they committed.
6. The reveal clearly communicates correct/wrong, payout and fleet consequences.

The current linear decaying pot is a valid PILOT for the reward curve. The exact curve and
minimum/maximum are balance values, not locked design. The visual representation must make
decay legible without requiring players to parse a small number.

### Required feedback

- Correct: celebratory island/ship animation, readable payout, satisfying positive sound.
- Wrong: casino-style loss sting used sparingly, an upsetting but age-appropriate sound, and
  a physical consequence in the pirate world.
- Answer lock: immediate within-frame feedback.
- New question: all stale effects/timers are cancelled before state rehydrates.

## Captain

**Decision: LOCKED · Implementation: PLAYABLE**

- The player in first place is Captain of the Fleet.
- Ties use a deterministic server-owned rule.
- The captain cannot mutiny.
- Captain status must be obvious in the fleet without obscuring score or answer state.
- Additional captain powers are future IDEAS, not implicit permissions.

## Mutiny

**Decision: LOCKED · Implementation: PLAYABLE**

Mutiny exists to create discussion, deception and bluffing around difficult questions.

- Available on every regular question after question 5.
- Every non-captain may secretly press an ever-present mutiny action.
- No player receives a public indicator of who has mutinied before reveal.
- Declaring mutiny forfeits that player's chance to answer the current question.
- Players may discuss or lie about their intent out loud.

Resolution:

| Secret mutineer count | Outcome |
| --- | --- |
| 0 | Normal question. |
| Exactly 1 | The lone mutineer forfeits the answer and becomes marooned. |
| 2 or more, but not all eligible non-captains | Mutineers forfeit their answers; no additional mutiny payout or punishment. |
| All eligible non-captains | Only the captain answers. Captain correct: normal captain reward, others get nothing. Captain wrong: captain pays a server-configured tax distributed to all other players. |

The server rejects/removes answers from mutineers and resolves the count table above.

## Marooning

**Decision: LOCKED · Implementation: PLAYABLE/PARTIAL**

Marooned players miss the next regular question. A special round must not consume the skipped
question; defer the skip to the next regular question if needed.

Triggers after question 5:

1. Exactly one active player answers incorrectly while everyone else answers correctly.
2. Exactly one eligible player declares mutiny.

Each trigger has a distinct authored cinematic:

- **Sole wrong answer:** their ship drifts away from the fleet, crashes/grounds at a deserted
  island, and the fleet sails onward.
- **Lone mutineer:** the fleet fires warning cannon volleys; the mutineer's damaged ship flees
  and they hide on a deserted island.

The live game already tracks the skip and both triggers, but uses a generic presentation and
allows triggers in the first five questions.

## Streaks

**Decision: IDEA · Implementation: PLAYABLE PILOT**

The live game has escalating point bonuses, a three-answer chest and White Flag cash-out.
The product owner has not confirmed whether streak scoring should remain or what its values
should be. Keep it playable for comparison, label it as a pilot in playtests, and do not build
new systems around it until promoted.

## Items

See [ITEMS.md](ITEMS.md). The existence of items, underdog weighting and bespoke use
animations are LOCKED. Exact acquisition frequency, timing classes and some effects remain
PILOT/IDEA.

## Special rounds and wildcard events

See [SPECIAL_ROUNDS.md](SPECIAL_ROUNDS.md). Wildcards exist inside special rounds, generally
helping players who are behind or applying bounded pressure to leaders. They must remain
readable and cannot silently alter scores.

## Cross-mechanic invariants

- Server owns phase, legal actions, secrets, outcomes and score mutation.
- Exact answers, mutiny decisions and private item information remain private until reveal.
- Every score change emits a reveal event; scores clamp at zero.
- Catch-up effects are bounded. Knowledge remains the main route to winning.
- Every attack documents counterplay/limits.
- Every mechanic has a visual and audio communication plan before it is called polished.

## Implementation queue

- [x] Separate regular-question count from special-round count.
- [x] Disable mutiny and marooning for questions 1–5.
- [x] Replace first-correct-in-window reward with the post-question-5 item ceremony.
- [x] Make mutiny declaration forfeit answering.
- [x] Implement the four exact mutiny outcomes above and test pure resolution.
- [x] Ensure maroon skips the next regular question, not a special.
- [ ] Commission and integrate both distinct maroon cinematics.
- [ ] Replace generic regular-question answer chrome with a legible moving fleet/island scene.
- [ ] Playtest the decaying reward curve.
- [ ] Decide whether streaks graduate, change or are rejected.
