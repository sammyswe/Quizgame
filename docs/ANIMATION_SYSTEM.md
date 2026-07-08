# Animation System

Everything is tween/particle-driven (no physics). Three systems own motion;
game objects own their local idle/feedback animations.

## Global intensity

`client/src/game/settings.ts` exposes
`animationIntensity: "reduced" | "normal" | "chaos"` (default `normal`).
`intensityScale()` returns 0.35 / 1 / 1.9 and multiplies particle counts,
glow scales and camera amplitudes. `reduced` also disables idle camera drift
and screen shake entirely. Switch it live from the debug panel.

## CameraDirector (`systems/CameraDirector.ts`)

- `startIdleDrift()` — slow breathing zoom while waiting.
- `zoomTo`, `panTo` — reveal framing moves.
- `shake(strength, ms)` — cannon impacts, Fear Shot hits.
- `lockInPunch()` — 120ms zoom punch on the lock-in slam.
- `reset()` — return to neutral and resume drift.

## VfxSystem (`systems/VfxSystem.ts`)

`coinBurst`, `sparkleBurst`, `smokePuff`, `cannonImpact`, `splash`,
`plunderTrail(from, to, coins)` (staggered bezier coin stream, returns its
duration), `correctGlow`, `wrongFlash`, `scorePop`. All emitters are
fire-and-forget and self-destroy.

## RevealDirector (`systems/RevealDirector.ts`)

A `delayedCall`-based timeline (cancellable) that sequences the reveal beats
listed in `LOOT_DROP_VISUAL_PRD.md`, spawning `EnemyShip`s and driving
avatars, islands, ticker, leaderboard and camera. Finishes ~14.5s, inside the
server's 16s reveal window.

## Object-level juice

- **AnswerIsland** — staggered bob loop, hover glow + grow, receive-pulse
  squash, gold/red reveal states, skull stamp slam, chip stack growth.
- **PlayerAvatar** — idle bob; reactions (`happy/shocked/angry/scared/
  winner/locked`) combine emote bubble pop, squash/stretch or bounce, and a
  tint flash; persistent scared jitter loop; red target glow.
- **LockInButton** — pulse loop while armed, hover grow, press squash, slam
  bounce with tint.
- **CoinChip / plunder coins** — quadratic bezier arcs with spin and shrink.
- **ScoreTicker** — number roll + scale pop. **FloatingText** — back-ease pop,
  rise, fade.
- **Background** — three counter-scrolling wave tile-layers, drifting fog
  banks, twinkling moon, drifting horizon silhouettes, ambient additive
  sparkle emitter.

## SoundEventBus (`systems/SoundEventBus.ts`)

Named events (`coinPlace`, `lockIn`, `revealStart`, `correctIsland`,
`plunder`, `cannonFire`, `scoreGain`, `chestEarned`, `itemUse`,
`avatarReact`) map to short Web Audio oscillator blips. No audio files;
replacing blips with samples later requires no call-site changes. Toggleable
in the debug panel.
