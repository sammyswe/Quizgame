---
id: VIS-002
title: Animation, sound and Higgsfield production contract
status: LOCKED
scope: global
updated: 2026-07-14
---

# Animation, sound and Higgsfield

Animation is part of the rules communication, not decoration added after implementation.
Every player action and game event needs anticipation, action, impact, result and recovery.

## Higgsfield mandate

Use the Higgsfield MCP as the preferred authored visual source for characters, ships, islands,
event keyframes, sprite sheets and animation/video references. Prompts must include:

1. the Treasure Trap product sentence;
2. whether the asset is in the **pirate excursion** or **casino reward** zone;
3. the mechanic, trigger, source, target and player-facing meaning;
4. camera/framing, duration/frame needs and intended runtime composition;
5. readability at mobile size;
6. the full art-direction suffix below;
7. a plain solid contrasting background when a cutout is needed.

Do not send short context-free prompts such as “pirate ship animation.”

### Excursion prompt suffix

> Treasure Trap, a 2–8 player cartoon pirate party quiz. Premium 2D mobile arcade game art,
> adventurous storybook pirate excursion across tropical seas, warm daylight colour, expressive
> chunky shapes, thick dark outlines, glossy highlights, readable silhouettes at phone size,
> playful Brawl Stars-style energy, funny and dramatic but suitable for ages 9+, no text, no
> logos, no photorealism. Casino neon is absent unless explicitly requested for a reward beat.

### Casino reward prompt suffix

> Treasure Trap loot-box reward moment inside a cartoon pirate excursion. Premium 2D mobile
> arcade game art, pirate treasure transformed into a thrilling slot-machine-style ceremony,
> jewel-bright gold, controlled cyan and magenta lights, escalating rarity, glossy highlights,
> thick dark outlines, strong phone-size silhouette, Coin Master-like payout excitement without
> real-money imagery, funny and suitable for ages 9+, no text, no logos, no photorealism.

## Runtime composition

Generated video is not automatically production-ready game animation. Multiplayer state,
player colours, targets, timing, accessibility and aspect ratios are dynamic. Prefer:

- Higgsfield-authored sprite/keyframe layers;
- transparent/cutout ships, characters and effects;
- short loopable WebM only for state-independent ambience;
- runtime composition/timing in the active client;
- procedural fallback silhouettes/effects so missing binary assets never stop play.

Never place secret or variable game data inside a baked video.

## Event animation brief template

Each event gets a row in the asset backlog and a brief:

```md
Event:
Player meaning:
Trigger and server event:
Zone: excursion | casino reward
Duration budget:
Shot 1 — anticipation:
Shot 2 — action/travel:
Shot 3 — impact:
Shot 4 — result/readability:
Loop or one-shot:
Dynamic layers:
Sound beats:
Reduced-motion equivalent:
Higgsfield prompt:
Generation job/model:
Runtime asset paths:
Fallback:
Acceptance evidence:
```

## Required event bank

### Core loop — highest priority

- [ ] Fleet ambient travel loop.
- [ ] Question/islands arrive and choices become actionable.
- [ ] Dwindling treasure visual with escalating urgency.
- [ ] Ship commits to an island.
- [ ] Correct answer and treasure return.
- [ ] Wrong answer/loss sting.
- [ ] Captain crown/leadership transition.
- [ ] Sole-wrong maroon cinematic.
- [ ] Lone-mutineer cannon/maroon cinematic.
- [ ] Full mutiny reveal: captain survives or pays the crew.
- [ ] Post-question-5 first loot-box ceremony.

### Item use

- [ ] Eyepatch, Parrot, Telescope, Hook, White Flag, Secret X, Rum Rush.
- [ ] Walk the Plank, Cannonball, Cannonball Barrage.
- [ ] Barnacle and Barnacle Infestation.
- [ ] Sword Fight only if promoted from IDEA.

### Loot Drop

- [ ] Crew/treasure allocation and lock.
- [ ] Ventures depart.
- [ ] Correct venture returns.
- [ ] Wrong venture eliminated/plundered.
- [ ] Poseidon rises, rescues and moves the wager.
- [ ] Shark warning, fleet attack, percentage loss and special-item award.

## Slot-machine reward sequence

Chest opening is the strongest casino beat:

1. **Approach:** chest lands; surrounding voyage sound ducks.
2. **Commit:** player slams/taps; latch responds instantly.
3. **Build:** light leaks, rhythmic ticks accelerate, rarity colours cycle.
4. **Near miss:** one short controlled pause; no deceptive purchase pressure.
5. **Reveal:** lid blast, rarity silhouette, bespoke item pose.
6. **Payout:** gold/light/particles and fanfare match rarity.
7. **Teach:** item performs a 1–2 second visual demonstration.
8. **Return:** reward goes visibly into the player's booty bag.

The sequence must be skippable after the result is server-known and shortened for repeated
openings. Reduced motion preserves sound hierarchy and rarity without flashes/camera shake.

## Sound direction

- Excursion bed: sea, timber, sail, gulls, percussion and adventurous pirate instrumentation.
- Interaction: immediate tactile click/thump/splash before decorative flourish.
- Correct: warm rising phrase and treasure texture.
- Wrong: descending comic/casino “bust” sting; disappointing, not humiliating.
- Mutiny: secret low cue on declaration; public horn/cannon rhythm only at reveal.
- Casino chest: mechanical latch, tick ladder, held breath, rarity fanfare and coin payout.
- Reserve the loudest/brightest sounds for rare moments to preserve dynamic range.

## Asset provenance

For every generated asset record:

- asset ID and mechanic;
- exact prompt;
- model and Higgsfield job ID;
- raw output path;
- processed runtime path;
- cutout/sheet dimensions;
- whether it is shipped, reference-only or rejected, and why;
- fallback path;
- licence/provenance notes if any external input was used.

Current MCP note (2026-07-14): Higgsfield tools are listed ready, but cloud-agent `balance` /
generate can still fail auth. Do not claim new generations as completed without a real job ID.
Owner Apps UI and files dropped in `design/concept/approved/` are valid production inputs.
See [POLISH_PRODUCTION_PLAN.md](POLISH_PRODUCTION_PLAN.md) for stack verdict and concept-art
queue. Manifest remains `design/assets.csv`.

## Definition of polished

An event is polished only when it is:

- driven by authoritative state;
- cancellable and reconnect-safe;
- visually readable on mobile;
- accompanied by appropriate sound;
- represented in reduced motion;
- performant under a full 8-player scene;
- backed by a fallback;
- documented with real generation provenance;
- observed in a two-device playtest.
