# Treasure Trap — Game Design (historical prototype v0.1)

> **Superseded:** Current confirmed mechanics and implementation mismatches live in
> `docs/context/MECHANICS.md`, `ITEMS.md` and `SPECIAL_ROUNDS.md`. This file preserves the
> earlier seven-round design for reference only.

This documents what the prototype implements, what is simplified, and the intended final
versions. Config sources of truth: `shared/src/config/*`.

## Score model

- `score` — banked, safe from most attacks.
- `roundLoot` — unbanked loot earned during the current round. Vulnerable to Treasure
  Switch, Shipwreck, and chase captures. Banked automatically at each leaderboard.
- Final Plunder: everything is banked, then each question a % is **protected** by rank
  (1st 70%, 2nd 60%, middle 50%, bottom 40%). Attacks only bite unprotected points.
- Scores never go below 0 (`SCORING.MIN_SCORE`).

## The 7 rounds

### 1. Loot Drop (2 questions)

Split 100 loot across the 4 answer islands. Correct island survives; the rest is plundered.

- ✅ Confidence token: public bravado — +40 if ≥half your loot survives, −30 if not.
- ✅ Trust pacts: offer/accept; if both biggest piles hit the true island: +40 each + Honour Chest.
- ✅ Sunken Chest to the biggest loser (comeback).
- ⚠️ Simplified: Reef Tax / Reef Warning / Reef Bait / Reef Reveal / Captain's Call twists
  are **not** in v1. Intended: random reef modifiers announced (or hidden) per question that
  tax/bait specific islands; Captain's Call gives the leader a secret forced-island twist.
- ⚠️ Reputation streak = global streak system (3-in-a-row Streak Chest) rather than a
  Loot-Drop-specific ladder.

### 2. Treasure Auction (1 question)

A lot is drawn (weighted): Mystery Chest, Spyglass, Double Bounty, Whispered Clue, Iron
Strongbox (loot protection), or — 5% — the cursed Glittering Crate (sand). Players bid
secretly from their total; highest bid wins & pays (earliest bid breaks ties), then the
question plays.

- ⚠️ Simplified: single lot per round; "place a trap" and "buy secret mission" lots not in v1.

### 3. False Map (1 question)

Two announced Captains receive private clues — one true, one false (identities secret).
Everyone gets a **secret mission**. Talk, follow, lie. Mutiny accusations live here.

- ✅ Variant implemented: _Two Captains, Two Maps_.
- ⚠️ Stubs: Double Bluff Map, Decoy Truth, Cursed Translator — intended as rotating
  variants of the private-info distribution.

### 4. Obscure Island (1 question)

Multiple options are correct; rarer picks pay more (solo +200, 2–3 players +120, 4+ +80).
One **Fool's Gold** option looks obscure but is wrong. Solo correct pick also earns a
Captain's Chest.

### 5. Split or Plunder (1 question)

Random pairs answer; then each secretly picks Split / Plunder / Guard.

- Split/Split: +100 each (+ Honour Chests)
- Split/Plunder: 20 / 160 (victim gets a Revenge Chest)
- Plunder/Plunder: +40 each (cursed)
- Guard/Plunder: guard +60, plunderer 0
- Guard/Split: splitter +100, guard +70
- Only-correct player takes +100 uncontested; odd player out hunts solo for +100.

### 6. Captain's Chase (3 questions)

Leader = Captain, starts 3 lengths ahead on a sea track. Captain correct → +1 ahead.
Chaser correct → +1 closer and +50. First chaser to reach the Captain steals up to 200.
Captain survives 3 questions → +250 escape bonus.

- ⚠️ Simplified: the Captain's _shortcut_ (harder question for a bigger escape) is not in
  v1 — intended as an opt-in harder question with double movement.

### 7. Final Plunder (3 questions)

Before each question every player secretly picks 1 of 3 actions offered by tier:

- Leaders: Bank the Booty, Captain's Shield, Captain's Curse, False Treasure, Double Cross
- Middle: Bank, Bodyguard, Follow Me, Betray the Crew, Black Flag, Spy the Deck, Blame Game
- Bottom: Last Cannon, Crown Heist, All-In Plunder, Black Flag, Betray, Spy, Cursed Chest
  Correct answers pay 120. Attacks resolve bottom-rank-first, capped by unprotected pools,
  countered by Shield (block), Curse (reverse), Bodyguard (intercept + both bonus),
  False Treasure (attacker pays the "victim").
- ⚠️ Simplified: Blame Game pays flat +60 (intended: half of target's loss); Double Cross
  pays flat +80 when the target picked an attack (intended: steal that attack's proceeds).

## Items (15)

See `shared/src/config/items.ts` for canonical text, rarity, timing, targeting, counterplay.

| Item               | Rarity    | Status                                                         |
| ------------------ | --------- | -------------------------------------------------------------- |
| 🐱‍👤 Copycat      | common    | ✅ full                                                        |
| 🔭 Spyglass        | common    | ✅ full                                                        |
| 🪙 Lucky Doubloon  | common    | ✅ full                                                        |
| 💀 Fear Shot       | rare      | ✅ full (blocks missions; absorbed by Double Agent)            |
| 🍾 Rum Rush        | rare      | ✅ full                                                        |
| 🪢 Sabotage        | rare      | ✅ full (locks target's answer after 5s; random if unanswered) |
| 🗺️ Sneak's Map     | rare      | ✅ full (trap a wrong option; Survivor Chest when dodged)      |
| 🔁 Treasure Switch | epic      | ✅ full (unbanked loot swap; blocked by Strongbox/Curse)       |
| 🗡️ Backstab        | rare      | ✅ full                                                        |
| 🎭 Double Agent    | epic      | ✅ full (new mission + 1 accusation/Fear Shot shield)          |
| 🚢 Shipwreck       | epic      | ✅ full                                                        |
| 👑 Crown Heist     | legendary | ✅ full (15% of leader's pool on a correct answer)             |
| 💣 Broadside Duel  | legendary | ✅ full (challenge up-rank; loser risks by rank)               |
| ⚫ Black Spot      | epic      | ✅ full                                                        |
| ☠️ Captain's Curse | legendary | ✅ full (reverses first attack on the warded player)           |

## Chests (10 sources)

Sunken, Captain's, Betrayal, Mutiny, Survivor, Streak, Underdog (auto at leaderboard for
last place, 3+ players), Auction, Honour, Revenge. Opening rolls rarity by current rank:

| Position | Common | Rare | Epic | Legendary |
| -------- | ------ | ---- | ---- | --------- |
| 1st      | 65%    | 30%  | 5%   | 0%        |
| 2nd–3rd  | 50%    | 35%  | 13%  | 2%        |
| Middle   | 35%    | 40%  | 20%  | 5%        |
| Last     | 20%    | 35%  | 35%  | 10%       |

## Secret missions (12)

Fully auto-resolved in v1: **False Friend** (pick mark + wrong answer), **Pied Piper**
(2+ follow your answer), **Honest Captain** (correct + 1 follower), **Snake Oil** (leader
wrong), **Pirate Prophet** (predict who fails), **Lone Treasure** (only correct),
**Mutiny Bait** (auto-fires when falsely accused).
Stubs (documented, assignable later): Loud Liar, Fake Panic, Save the Sucker, Herd Trap,
Double Cross — these need talk-detection or multi-round memory; intended designs noted in
`shared/src/config/missions.ts`.

## Mutiny & accusation

1 Mutiny Token per player per game. Accuse during a False Map question. Correct (target
holds a deceptive mission): +150, their scheme cancelled, Mutiny Chest. Wrong: token lost,
accused gets +25 and a Revenge Chest (and Mutiny Bait pays out).

## Counterplay map

| Attack                            | Counters                                                  |
| --------------------------------- | --------------------------------------------------------- |
| Sneak's Map / False Friend traps  | Mutiny accusation, Fear Shot, just answering correctly    |
| Treasure Switch / Shipwreck       | banking at leaderboard, Iron Strongbox, Captain's Curse   |
| Rum Rush / Double Bounty          | the drinker still has to be right                         |
| Backstab / Black Spot / Shipwreck | target answers correctly                                  |
| Crown Heist / Betray the Crew     | protected score, Shield, Curse, False Treasure, Bodyguard |
| Fear Shot                         | Double Agent shield, Captain's Curse                      |
| Broadside Duel                    | knowledge, Captain's Curse                                |
| Accusation                        | Double Agent cover, Mutiny Bait reversal                  |
| Plunder (pair round)              | Guard (blocks + counter-bonus)                            |

## Balance levers (tune in `shared/src/config/scoring.ts`)

BASE_CORRECT 100 · mission 150 · accusation 150 · obscure 200/120/80 · pot matrix ·
chase steal 200 / escape 250 · final correct 120 · protection percentages.
