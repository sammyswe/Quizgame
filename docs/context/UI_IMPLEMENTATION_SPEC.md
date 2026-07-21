---
id: VIS-003
title: Confirmed UI implementation specification
status: LOCKED
scope: active prototype UI
updated: 2026-07-14
---

# Confirmed UI implementation specification

This document preserves the product owner's complete UI direction from the July 14 design
interview. It overrides older neon-casino and React-gameplay assumptions.

## Experience and platform

- Primary device: ordinary laptop; landscape 16:9.
- Presentation: polished Clash Royale-level mobile arcade feel, responsive game interface mixed
  with a shared board.
- Active gameplay renderer: Phaser. React remains the shell for landing/lobby and small overlays.
- Default view: one shared three-quarter side-view fleet camera.
- Main fantasy: cool, fun cartoon pirate excursion through changing seas, weather and locations.
- Neon/casino intensity is reserved for chest/item-box gambling moments.
- Most of the screen is world art. HUD remains compact at the bottom; scores remain on the side.
- Cinematics last 3–10 seconds, stay clear and sequential, and are not skippable in the first build.

## Player identity and fleet

- Players choose one of distinct pirate avatars; prototype customisation is not required.
- Each avatar has a visually distinct ship with the nickname on its hull.
- Fleet formation continuously reflects leaderboard order.
- Captain leads with golden sails, crown and unmistakable flagship treatment.
- Public item ownership is visible on ships. Active item effects are visibly attached to targets.
- Streak status is visible but does not overpower the fleet.
- Marooned ships disappear from the shared fleet for the skipped question.

## Landing and lobby

- Existing landing flow may remain structurally, but shift away from neon casino.
- Create/join/lobby take place on the deck of the player's ship.
- Other joined players' ships are visible beyond the deck.
- Room code uses a clear conventional panel at the top.
- Waiting players can change avatar and inspect game settings.
- Host length/settings may use a straightforward menu presented on a pirate map/chart.
- Special rounds are not teased.
- Start transition zooms out from the deck to reveal the complete fleet setting sail.
- Emotes, ship inspection and harmless lobby interactions are later ideas.

## Regular-question world

1. Fleet continuously sails between archipelagos.
2. New question arrives in a sky banner.
3. Four islands appear; answer text appears on island signs.
4. A shaking chest visibly drains coins as the 20–30 second reward timer falls.
5. Player selects an island, then explicitly confirms. Confirmation is final.
6. Choices remain secret; ships do not move until reveal.
7. Once everyone answered or mutinied, ships sail to hidden choices.
8. Faster answers sail faster and receive more treasure.
9. Correct ships collect a short stream of gold; wrong ships simply find no treasure.
10. Common reveal remains quick, then the game pauses on the leaderboard.

Permanent information:

- side leaderboard with every score and captain;
- timer;
- local inventory (3–5 visible slots, including empty slots);
- local streak;
- captain state.

## Mutiny

- Compact black-flag control, available after question 5.
- Requires press then confirmation.
- Declaration and prepared cannons are visible only to the mutineer before reveal.
- Mutiny forfeits answering; round advances when everyone answered or mutinied.
- Partial mutiny: mutineer prepares cannons; loyal fleet/captain destroys the attempt and visibly
  damages the mutineer's ship.
- Unanimous mutiny: every eligible ship fires at the captain.
- Captain correct: flagship evades the cannon fire.
- Captain wrong: shots hit, mutineers board the flagship and physically carry tax treasure away.

## Marooning

- Sole-wrong or lone-mutineer ship comically crashes/grounds on an island while the fleet leaves.
- Lone-mutineer variant begins with a light cartoon cannon attack and damaged escape.
- Castaway receives a private island scene, cannot see the skipped question, discovers a chest
  and opens it privately.
- After the skipped regular question, the repaired ship rejoins the fleet.
- Marooning is primarily a punishment with an uncertain item-based consolation.

## Chest and item-box ceremony

- Treasure chest is the universal item-box object; one chest design is enough initially.
- Private ceremony only.
- Tap chest; key turns, chains break, item symbols cycle, then chest bursts open.
- Short, sharp and identical duration on repeat openings.
- Mario Kart-like item cycling; near misses may be introduced after item literacy improves.
- Common: small burst. Rare: stronger burst. Epic: fireworks. Legendary: exceptional full-screen
  spectacle.
- Reveal includes final item art, dramatic spoken item name when available, and one plain-English
  sentence explaining use.
- Casino music/lights exist only here.

## Inventory and targeting

- Bottom HUD displays 3–5 compact slots at all times.
- Drag targetable items from the ship/HUD onto a valid ship.
- Global attacks require click then explicit use.
- Invalid timing/target explains the legal action.
- Item use does not pause the whole round; bystanders see source, target and animation.
- Target receives a concise explanation after impact, not advance warning.

## Confirmed item visuals

- **Eyepatch:** avatar wears patch; local view splits into dark and light sides, with the correct
  answer guaranteed in the light side.
- **Parrot:** bird flies to target ship, waits visibly, then returns and copies the chosen island.
- **Telescope:** pirate extends telescope toward target; private HUD reveals target choice.
- **Hook:** large rope hook crosses between ships and steals a visible deck item.
- **White Flag:** ship raises white flag, preserves streak, forfeits answering and points.
- **Secret X:** private treasure map opens with an X on the correct island; player closes it.
- **Rum Rush:** pirate drinks, powers up, then collects returned treasure at enhanced speed/value.
- **Walk the Plank:** before answers appear, target pirate is ordered onto plank and gets a short
  answer window with a slightly reduced maximum reward.
- **Cannonball:** drag to ship; cannon fires; target later sees only first/last letters.
- **Cannonball Barrage:** same fleet animation applied to all eligible opponents.
- **Barnacle:** net hits a ship; barnacles cover one answer before choices appear.
- **Barnacle Infestation:** fleet-wide version.
- A five-second item/setup window before answer choices is the intended final timing model for
  pre-answer attacks.

## Loot Drop

- Separate captain-cabin/deck scene centred on a private treasure map.
- Four random venture types: island, cave, port, enemy fort or temple.
- Drag coins to destinations; quick half/max actions are allowed.
- Exact allocation stays private until lock/reveal.
- Each 50 invested gold is represented by roughly one dispatched force/ship.
- On lock, forces travel farther than normal fleet answers.
- Correct venture: attackers loot location and return by ship with treasure.
- Wrong cave: collapse/trapped crew. Wrong temple: warriors counterattack. Wrong port/fort:
  defences destroy expedition. Each venture type eventually owns a distinct failure animation.
- Reveal lasts 5–10 seconds and remains pirate-adventure themed, not casino themed.

## Loot Drop wildcards

### Poseidon's Rescue

- Noble sea god surprises players after the correct destination and initial failure are clear.
- Giant wave destroys the wrong-location attackers and saves actual player ships.
- Shoal of fish guides those ships to the correct destination.
- Rescued forces then return normally with the successful fleet.

### Shark Attack

- Funny, non-frightening cartoon sharks circle the successful returning fleet.
- They attack/destroy a small percentage of every player's expedition ships.
- Last place privately receives a dramatic shark-tooth reward presentation.
- Working unique item name: **Shark Tooth**.

## Reveals and progression

- Outcomes occur in the world, one event at a time.
- Small concise cards explain what is happening without replacing world action.
- Side leaderboard remains visible while score changes animate.
- Rank changes animate in the list and reorder fleet formation.
- Leaderboard pause follows every question.
- First block intro: “The Seven Seas”; sunlit ocean opens and fleet sails into view.
- Future blocks have different location/weather intros.
- Special intro is a short mode title animation; players tap to continue.
- Winner: winning pirate holds trophy and celebrates; losing ships are damaged/on fire with sad
  crews.

## Audio and comfort

- Music mixes orchestral pirate adventure, sea-shanty rhythm and restrained arcade percussion.
- Casino music only during chest opening.
- No narrator. Items may receive a dramatic spoken name.
- Pirates make short vocal reactions.
- Master/music mute is required. Effects and animations remain part of gameplay.
- Avoid uncontrolled audiovisual clutter despite no dedicated accessibility settings.
- Cannonball/barnacle effects deliberately make answers harder to read.

## Art-production contract

- Higgsfield is the primary source for final art and event animation inputs.
- Generate coherent key art/sprites, then compose dynamic multiplayer state in Phaser.
- Every generation uses STYLE-001 from `design/assets.csv`.
- Existing emoji and old binary/procedural art are fallbacks only, not approved final art.
- Asset/auth failures must be documented honestly; never claim a generated sequence that did not
  complete.
