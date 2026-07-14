---
id: MECH-002
title: Item design and catalogue
status: LOCKED
scope: arcade power-ups
updated: 2026-07-14
---

# Items

Items are Mario Kart-inspired comeback, disruption and conversation tools. Their existence,
pirate symbolism, underdog weighting and unique animations are LOCKED. Timing classes,
acquisition frequency, balance and several effects remain PILOT/IDEA.

## Why Mario Kart items are fun

Research notes:

- Nintendo producer Hideki Konno described repeatedly playtesting each item with varied players
  and checking its effect at different race positions, rather than trusting the imagined effect.
- Earlier Mario Kart developers described giving better items to lower-ranked racers to provide
  hope and the thrill of an upset, while keeping the calculation simple enough to read on-screen.
- Mario Kart 8 distribution evidence indicates that distance from the leader, not rank alone,
  selects probability tables. Treasure Trap should likewise consider **score gap and rank**.
- Items serve different positional needs: leaders tend toward protection, the middle pack gets
  interaction tools, and distant players get bounded catch-up tools.
- A leader-targeting item may create party drama and give a losing player agency even when it
  does not directly help them win. That social value is real, but repeated unavoidable attacks
  feel arbitrary; warnings, scarcity, limits and counterplay matter.

Sources:

- Hideki Konno interview: https://www.nintendolife.com/news/2012/03/hideki_konno_discusses_mario_kart_7_and_its_development
- Super Mario Kart developer interview: https://shmuplations.com/supermariokart/
- Mario Kart 8 distribution tables: https://www.mariowiki.com/Mario_Kart_8_item_probability_distributions
- Blue Shell party-role investigation: https://www.eurogamer.net/does-mario-karts-blue-shell-even-work-an-investigation

## Treasure Trap item principles

1. **Read it in one glance.** Name, silhouette, target and effect use familiar pirate language.
2. **Fire it physically.** Drag/tap an item, show legal targets, then animate through the fleet.
3. **Match position need.** Use rank + score gap + recent item history, not rank alone.
4. **No dead rewards.** Avoid giving an unusable item without clearly banking it for later.
5. **No runaway leader arsenal.** Leaders get more defence/precision; trailers get stronger
   comeback and multi-target options.
6. **Bound every attack.** Cap score impact, preserve the victim's ability to answer, and define
   warning, counterplay, scarcity or recovery.
7. **Knowledge still matters.** Strong effects often still require the user or target to answer.
8. **Prevent hoarding/sandbagging exploits.** Limit inventory and avoid predictable thresholds
   that reward intentionally falling behind.
9. **Every item tells a story.** The whole table should understand what happened from animation
   and sound without reading a log.
10. **Playtest by position.** Record fun for user, victim and bystanders at leader/middle/last.

## Candidate timing model — not yet confirmed

| Window | Meaning | Status |
| --- | --- | --- |
| `PRE_QUESTION` | Before prompt; strategic setup with no answer information | IDEA |
| `PROMPT` | Prompt visible, choices hidden | IDEA |
| `CHOICES` | Choices visible, before answer commit | IDEA |
| `POST_COMMIT` | User committed; reactive information/defence only | IDEA |
| `REVEAL` | Cinematic resolution; no new hidden advantage | IDEA |

The live implementation currently allows power-ups during the broad `question` phase. Do not
pretend the finer timing classes are decided.

## Confirmed catalogue and decision ledger

| Item | Intended effect | Status | Live state / question |
| --- | --- | --- | --- |
| **Eyepatch** | 50/50: leave two options, one correct | LOCKED | PLAYABLE; timing TBD |
| **Parrot** | Blindly repeat a chosen player's selection | LOCKED | PLAYABLE |
| **Telescope** | See what another player committed | LOCKED | PLAYABLE |
| **Hook** | Steal another player's item | LOCKED | PLAYABLE |
| **White Flag** | Sit out one question while preserving the streak | LOCKED effect, streak dependency IDEA | PLAYABLE |
| **Secret X** | Privately reveal the correct answer | LOCKED | PLAYABLE; rarity/scarcity critical |
| **Rum Rush** | 2× the next correct answer | LOCKED | PLAYABLE |
| **Walk the Plank** | Force a target to answer quickly | LOCKED | PLAYABLE |
| **Cannonball** | Blast holes through answer words for one target | LOCKED | PLAYABLE |
| **Cannonball Barrage** | Blast answer words for all other players | LOCKED | PLAYABLE |
| **Barnacle** | Cover one of four options for one target | LOCKED | PLAYABLE; timing polish open |
| **Barnacle Infestation** | Barnacle everyone | LOCKED | PLAYABLE; timing polish open |
| **Sword Fight** | Challenge a player; others may back a winner | IDEA | A simpler live duel PILOT exists |

“Hole in words” and “cover an option” must preserve accessibility. Never make text literally
impossible to recover for colour-blind, dyslexic, screen-reader or reduced-motion users; use a
time-limited readable distortion with an accessibility-safe equivalent.

## Acquisition

**LOCKED goals**

- Item acquisition is random, dramatic and fun.
- Lower-ranked / far-behind players have better odds of powerful items.
- The first item ceremony occurs after question 5.
- Each special round has one unique item available only through that round.
- Opening a loot box is the game's strongest slot-machine/casino moment.

**Undecided**

- Exact chest frequency after the first item.
- Rank/score-gap probability tables and duplicate protection.
- Inventory limit and whether unused items persist between blocks.
- Which item belongs to each timing window.
- Whether players can earn items from regular streaks.

## Animation acceptance contract

Each item needs:

1. anticipation/selection pose;
2. legal target highlight and invalid-action response;
3. source ship animation;
4. readable travel path or world transformation;
5. impact on target ship/island/answers;
6. victim and bystander reaction;
7. result text and sound;
8. reduced-motion treatment;
9. Higgsfield generation record and runtime fallback.

Do not call an item polished when only an icon and toast exist.

## Item TODO

- [ ] Decide timing windows through playtest.
- [x] Implement Barnacle and Barnacle Infestation server-authoritatively.
- [x] Align Telescope with seeing another player's committed answer.
- [ ] Decide whether Sword Fight enters the confirmed catalogue.
- [ ] Design score-gap-aware rarity tables with duplicate/hoarding protection.
- [ ] Add explicit `counterplay`/limit metadata to the live power-up config.
- [ ] Produce one animation brief and asset bundle per item.
- [ ] Add use/victim/bystander playtest questions for every item.
