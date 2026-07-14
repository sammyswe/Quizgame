---
name: game-feel-and-juice
description: Mobile arcade game feel — particles, camera, sequential reveals, physical interactions, avatar reactions. Use when adding juice, animations, VFX, or making interactions feel physical instead of menu-based.
---

# Game feel & juice

Target: **Brawl Stars / Clash Royale polish** in a lively cartoon pirate excursion. Reserve
**Coin Master casino excitement** for loot boxes, jackpots and selected high-stakes peaks.

## Every interaction needs feedback

| Action | Minimum juice |
|--------|----------------|
| Select answer island | Ship/wake commits toward island, island pulse, sound |
| Invalid action | Shake, "NO LOOT LEFT!" pop — never silent ignore |
| Hover island | Glow ramps up, island scales slightly |
| Lock in | Button squash → slam → camera punch → shockwave sparkles |
| Reveal wrong | Pirate-world consequence, impact/drop, comic loss sting, readable result |
| Reveal right | Treasure return, fleet cheer, warm burst, payout roll |
| Item on player | Target glow red, projectile, impact flash, scared jitter |

**Banned:** numeric inputs, dropdowns, checkboxes, plain buttons with no
animation, results appearing in one frame.

## Reveal = sequential cinematic, not a state swap

Use a cancellable staged sequence driven by received server state:

```
0s   zoom in + revealStart sound
0.5s islands pulse in sequence
1.5s correct island gold + camera pan + sparkles
2.3s wrong islands darken + red flash
2.9s enemy ships sail in (only islands with loot)
4.4s cannon volleys (3 per island) + shake + splash
6.2s plunder coin streams + avatar shocked/angry + "PLUNDERED -N"
7.8s ships retreat
8.2s payout streams + "+N" + score ticker roll + happy reactions
10.5s camera out + leaderboard slide + winner crown
```

Server reveal window must accommodate the client sequence without relying on it for outcomes.

## Camera patterns

- **Idle drift** — subtle breathing zoom while waiting (off in `reduced`).
- **lockInPunch** — 120ms zoom yoyo on slam.
- **zoomTo / panTo** — reveal framing.
- **shake** — cannon, plunder; scale strength with `intensityScale()`.
- **reset** — return to neutral after reveal.

## VFX building blocks

Reusable, self-destroying emitters:

- `coinBurst`, `sparkleBurst`, `smokePuff`, `cannonImpact`, `splash`
- `plunderTrail(from, to, count)` — staggered bezier coins
- `correctGlow`, `wrongFlash`, `scorePop`

Respect active intensity helpers and `prefers-reduced-motion`.

## Physical money

- Coins **arc and spin**, never teleport allocation numbers.
- Chip stacks **grow on islands** as loot lands.
- Score changes use a **rolling ticker** + floating text.
- Wrong answers are **attacked** (ships, cannons), not just greyed out.

## Avatar reactions

Map events to visual states: idle bob → thinking → locked → happy / shocked /
angry / scared / winner. Combine: emote bubble pop + squash/stretch + tint
flash. Persistent effects (scared) use looping tweens; clear on new question.

## Sound architecture

`SoundEventBus.emit("coinPlace" | "lockIn" | "revealStart" | …)` — synth
blips now, swap samples later without changing call sites.

## Performance

- Fire-and-forget effects must `destroy()` themselves.
- Remove bob/pulse tweens in `destroy()`.
- Unsubscribe bridge listeners on scene shutdown.
- Avoid per-frame allocations in `update()`.
