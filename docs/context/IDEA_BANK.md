---
id: IDEA-001
title: Unconfirmed idea bank
status: IDEA
scope: future exploration
updated: 2026-07-14
---

# Idea bank

Nothing in this file is approved for production. Preserve the intent, ask focused questions,
and promote one idea at a time through a documented PILOT.

## Special-round wildcard themes

- **Atlantis** — submerged route/treasure reveal; exact player choice unknown.
- **Iceberg** — route obstruction or fleet split; avoid a passive random punishment.
- **Cave system** — branching hidden-information route.
- **Sirens** — temptation/misdirection with a clear signal and counterplay.
- **Piranhas** — escalating hazard around a venture.
- **Lifeboats** — rescue/protection allocation.

These are themes, not mechanics. Before promotion, define knowledge test, discussion incentive,
meaningful choice, affected players, counterplay, score cap and visual sequence.

## Sword Fight

Challenge a player to a duel while others place faith in a winner. Questions:

- Is the duel based on the same trivia answer, speed, or a follow-up?
- Is backing public or secret?
- What does each participant risk?
- Can a leader farm weaker players?
- How are spectators engaged without turning knowledge into betting randomness?

The live code contains a simpler one-on-one duel; that does not confirm this richer design.

## Streak bonus

Open decision: retain, redesign or remove point bonuses. Evaluate whether streaks:

- reward knowledge without making a leader run away;
- make White Flag strategically interesting;
- are understandable alongside the decaying reward;
- should grant items instead of points.

## Special round concept — second-most-popular

Goal: pick the **second most popular** answer.

- Most popular answer bankrupts the player's event stake.
- Other answers preserve a percentage based on their share of guesses.
- Reveal answers and popularity slowly for tension.
- Example prompt category: US presidents; examples given were George Washington as most common
  and Donald Trump as a high-retention alternative.

Questions: how ties work, whether “bankrupt” means block stake only, how knowledge is rewarded,
how collusion/bluffing works, and whether percentages are revealed before selection.

## Special round concept — treasure grid

- Grid contains 15 correct and 5 wrong answers.
- Players take turns choosing loot.
- A wrong answer eliminates the player from the event.
- A particularly bold/respectable correct choice earns bonus points.

Questions: objective definition of “bold,” turn order catch-up, eliminated-player engagement,
question sourcing, reveal information and run length.

## Future match configuration

Players may eventually select which special rounds are included, while the server keeps their
order random. Keep this out of the early lobby until enough polished specials exist.

## Idea intake template

```md
Name:
Fantasy:
Player choice:
Knowledge rewarded:
Discussion/bluff created:
Comeback role:
Counterplay/limits:
Animation pitch:
Open questions:
Playtest success signal:
```
