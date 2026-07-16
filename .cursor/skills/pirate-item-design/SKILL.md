---
name: pirate-item-design
description: Design or implement Treasure Trap power-ups with Mario Kart-style comeback balance, pirate readability and bespoke fleet animations.
---

# Pirate item design

Read `docs/context/ITEMS.md`, `MECHANICS.md`, `VISUAL_DIRECTION.md` and
`ANIMATION_AND_ASSETS.md`.

## Design pass

For each item define:

- pirate fantasy and one-sentence effect;
- legal timing window;
- target rule;
- position need (leader, middle, trailing);
- score-gap/rank acquisition weights;
- warning and private/public information;
- counterplay, cap, scarcity and recovery;
- inventory/duplicate behaviour;
- source → travel → impact → result animation;
- victim and bystander readability;
- reduced-motion/accessibility equivalent;
- playtest success/failure signal.

Reject or simplify an item that needs a paragraph in the UI, duplicates another item's role,
erases a player's game, or makes trivia irrelevant.

## Implementation pass

1. Add/adjust shared types first.
2. Put odds, caps and timing in named shared config.
3. Resolve effect in pure shared logic when possible.
4. Validate ownership, phase, target and limits on the server.
5. Send only an intent from the client.
6. Keep secrets in private state.
7. Emit reveal/fire events for every consequence.
8. Add shared tests by leader/middle/last and edge cases.
9. Integrate the Higgsfield-authored/fallback animation.
10. Verify two-client sync, reconnect and reduced motion.

## Playtest matrix

Observe the item as:

- leader user / leader victim;
- middle-pack user / victim;
- distant-last user;
- repeated/duplicate draw;
- held across timing windows;
- invalid target;
- countered;
- 2-player and 8-player game.

Record whether user, victim and bystanders could explain what happened.
