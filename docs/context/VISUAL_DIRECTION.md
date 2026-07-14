---
id: VIS-001
title: Visual direction
status: LOCKED
scope: global
updated: 2026-07-14
---

# Visual direction

## The visual sentence

**A warm, exaggerated cartoon pirate excursion that erupts into jewel-bright casino spectacle
when treasure, rarity or high stakes deserve it.**

The contrast is essential. If everything glows like a slot machine, loot boxes stop feeling
special and the voyage loses its identity.

## Zone A — pirate excursion (default)

Use for regular questions, fleet travel, answer islands, mutiny, marooning, item attacks and
most special-round staging.

- Storybook tropical sea, painted skies, weather, reefs, cliffs and distant silhouettes.
- Chunky, expressive ships with readable player colours, sails and captain markers.
- Warm sunlit gold, ocean blue/teal, coral, sail cream, timber brown and danger red.
- Thick outlines, simple silhouettes, glossy highlights and squash/stretch.
- Constant environmental life: waves, wake, flags, clouds, birds, spray and bobbing ships.
- Composition communicates action spatially: source ship → path → target/island → consequence.
- UI resembles a captain's chart, carved plaque, sailcloth banner or ship instrument.

## Zone B — pirate casino spectacle (earned)

Use primarily for chest/loot-box opening and jackpot rewards; optionally for brief high-stakes
reveal peaks.

- The world darkens; gold, gem colour and selective cyan/magenta lights become dominant.
- Slot-style anticipation: staged reels/ticks, accelerating/decelerating rhythm, near-miss pause,
  rarity escalation, burst, payout shower and lingering prize pose.
- Casino sounds and light must resolve into a concrete pirate reward, not abstract gambling.
- Never imply real-money purchase or cash-out. The game is suitable for ages 9+.
- Loss sequences are dramatic but brief; avoid shame, predatory purchase cues or fake scarcity.

## Typography and readability

- Use the fonts actually wired in the live client: Lilita One for display and Nunito 700/900
  for body/answers unless an explicit typography migration is approved.
- Answer text must remain readable at a glance on all devices.
- Art yields to readability: use scrims, plaques, strokes, scale and contrast.
- Do not use emoji as final game art. Emoji are acceptable in documentation/debug only.
- Colour is never the only state indicator.

## Motion grammar

| Meaning | Motion |
| --- | --- |
| Safe / waiting | slow bob, drift and breathing |
| Choice available | pulse, wake path and target glow |
| Commit | squash → snap/sail → confirmation wake |
| Correct | upward lift, warm burst, fleet cheer, treasure return |
| Wrong | impact/drop, desaturation beat, comic loss sting |
| Threat | directional warning, red rhythm, incoming silhouette/sound |
| Casino reward | tick escalation → held breath → rarity burst → payout |

Every pointer action responds within one frame. Invalid actions shake/flash and explain why.
State changes are staged, never swapped silently.

## Fleet scene requirements

- Every active player has an identifiable ship in the fleet.
- The captain leads visually but does not occlude answer information.
- Four answer islands are places in the world, not generic answer cards.
- Item animations originate from the user's ship and affect world objects.
- Marooning visibly separates one ship from the social group.
- Reconnect/late state can reconstruct the current visual state without replaying stale effects.

## Accessibility

- Reduced motion keeps timing and meaning while replacing long travel/shake with short fades,
  scale changes and static end poses.
- Audio cues always have visual equivalents; visual cues have text/state equivalents.
- Avoid rapid flashes and excessive camera shake.
- Distortion attacks preserve an accessible path to understand and answer.
- Mobile portrait is the primary constraint; landscape and desktop remain supported.

## Visual review questions

1. Does this look like a pirate adventure before reading any copy?
2. Is casino intensity reserved for a reward/high-stakes reason?
3. Can a new player infer the action from symbols and staging?
4. Can every player tell who acted, what was targeted and what changed?
5. Is answer text readable in one glance on a small phone?
6. Does the scene continue to feel alive while waiting?
