# Game Feel

How Treasure Trap makes taps feel like actions and rounds feel like events.

## The toolkit

| Tool                      | File                                   | Job                                |
| ------------------------- | -------------------------------------- | ---------------------------------- |
| ParticleBurst / CoinBurst | `components/fx.tsx` (EmojiBurst)       | radial emoji explosions            |
| EmojiRain                 | `components/fx.tsx`                    | full-screen falling coins/confetti |
| ScreenShake               | `components/fx.tsx` (Shaker)           | 0.5s CSS shake on trigger change   |
| LockStamp                 | `components/fx.tsx`                    | rotated ink stamp ("LOCKED IN")    |
| ImpactFlash               | `components/gamefeel/ImpactFlash.tsx`  | full-screen colour flash           |
| FloatingText              | `components/gamefeel/FloatingText.tsx` | rising ±points / labels            |
| CannonBlast               | `components/effects/CannonBlast.tsx`   | fireball + shockwave + smoke       |
| SceneBackdrop             | `components/scenes/SceneBackdrop.tsx`  | per-round ambient world            |
| PirateAvatar              | `components/players/PirateAvatar.tsx`  | bobbing avatar with moods          |
| ItemCard / ItemUseOverlay | `components/items/`                    | rarity cards + use flourishes      |
| RaritySlot + chest stages | `components/ChestModal.tsx`            | the loot-box ceremony              |
| playSound                 | `lib/soundEvents.ts`                   | named audio vocabulary             |
| useGameFeel               | `lib/gameFeel.ts`                      | intensity: reduced/normal/chaos    |

## Feedback contract

Every player-visible cause must produce an effect the whole table can feel:

- **You act** (answer, bid, choice, item): instant local feedback — punch scale, stamp,
  burst, sound. Never wait for the server round-trip to acknowledge a tap.
- **The game resolves** (reveal events): server-ordered `RevealEvent[]` with `animation` +
  `intensity` metadata drives the reveal player. Scores only move on screen through
  reveal cards + AnimatedNumber rollups + HUD floating deltas.
- **State you carry** (items, chests, missions): idle glow/bob so the bag always feels
  slightly alive; drawers and cards animate open.

## Moods

`PirateAvatar` moods broadcast table state: `answered` (green ✅), `nervous` (wobble 💭),
`attacked` (red 💥), `protected` (cyan 🛡️), `cursed` (green ☠️), `accused` (red ⚔️),
`winner` (gold 👑). Use moods instead of inventing new per-screen status chips.

## Intensity

All particle counts go through `particleCount(base, intensity)` and every shake through
`shakeAllowed(intensity)`. Ambient scene layers check `ambientAllowed`. Never bypass
these — they are the accessibility contract.

## Sound

Fire semantic events (`playSound("cannonFire")`), not raw synth calls, from new code.
The names in `lib/soundEvents.ts` are the future native sound/haptic mapping.
