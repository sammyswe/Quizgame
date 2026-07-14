# Animation Self-Review (visual overhaul pass)

## What was upgraded

- **Game-feel system**: `lib/animationPresets.ts` (shared springs/staggers),
  `lib/rarityStyles.ts` (rarity frames/glows/banners), `lib/gameFeel.ts` (intensity:
  reduced/normal/chaos, persisted, prefers-reduced-motion aware), `lib/soundEvents.ts`
  (named audio vocabulary for future native sounds/haptics).
- **Reveal metadata**: shared `RevealEvent` now carries `animation` + `intensity`
  hints, auto-inferred in `shared/src/game/reveal.ts` — servers stayed untouched.
- **Per-round scenes** (`components/scenes/SceneBackdrop.tsx`): glowing bobbing islands
  - circling ship (Loot Drop), sweeping casino spotlights + drifting coins + BLACK MARKET
    sign (Auction), cursed red vignette + rising embers + self-drawing fake route
    (False Map), drifting fog banks + emerging island (Obscure), stalactites + emerald
    sparkle cave (Split or Plunder), storm vignette + random lightning + racing ships +
    fast waves (Chase), vault bars + watching skulls + doom pulse + gold hoard glow
    (Final Plunder).
- **Players**: `PirateAvatar` — colour-ringed emoji pirates with tricorn hats, idle
  bobbing, and mood states (answered/nervous/attacked/protected/cursed/accused/winner).
  Integrated into HUD, lobby, question status row, leaderboard, winner screen.
- **Items**: `ItemCard` rarity power-up cards (frames, corner ribbons, timing chips,
  legendary shimmer) + `ItemUseOverlay` use flourishes (projectile + cannon impact for
  attacks, expanding auras for buffs, whirling bag swap, sneaky slide-ins).
- **Chest ceremony**: slam-drop with impact flash → chains snap off → escalating shake +
  glow → slot-machine rarity spin that decelerates → burst (flash + coin explosion) →
  item card flies out under a rarity banner. Skippable after 1.2s.
- **Reveal player**: consumes animation metadata — CannonBlast (fireball/shockwave/smoke),
  sinking-coin plunders, green curse auras, MUTINY! ink stamps, bomb-collision duels,
  3D map-flip entrances, colour impact flashes, intensity-scaled particles and shake.
- **Leaderboard**: NEW LEADER banner with crown burst + alarm, rank-movement arrows
  (▲2/▼1) vs. last round, danger glow + "shark territory" on last place, racing score
  bars, avatar moods.
- **HUD**: floating ±delta popups on every personal score change + counter punch scale.
- **Debug**: live FX intensity toggle (reduced/normal/chaos) in the playtest panel.

## What still feels weak

- Loot Drop wrong-island plunder is told through reveal cards + sinking coins, not
  literal ships attacking the specific islands on the allocator screen.
- Auction win lacks a gavel-slam moment on the auction screen itself (drama lives in the
  reveal recap).
- Split or Plunder choice screen has no cave-side "two pirates at one chest" tableau.
- Item use overlays play only for the caster; other players learn from ticker + reveal.
- Avatar hats are a single tricorn shape; expressions are badge-based, not facial.

## Which animations are placeholder

All of them, by design: emoji glyphs (coins, chests, bombs, skulls), inline SVG
(ships, islands, hats), CSS gradients. See docs/ASSET_PIPELINE.md for the exact
placeholder → professional-art swap map. The motion design is intended to survive the
art swap unchanged.

## How to playtest the visual changes

```bash
pnpm dev   # two browser windows, create + join
```

1. Watch the landing title letters drop in; check the ocean never sits still.
2. Start a Short voyage with Loot Drop — islands + circling ship at the bottom.
3. Use the 🧪 panel: add bots, force a chest, open it from the 🎒 bag — full ceremony.
4. Play an attack item (e.g. Backstab) — projectile + cannon impact overlay.
5. Sit through a reveal: shakes on attacks, MUTINY stamps in False Map, coins sinking.
6. Toggle FX intensity in the 🧪 panel (reduced/normal/chaos) mid-game.
7. Finish a game — new-leader banners, coin-rain winner celebration.

## Known performance concerns

- Ambient layers use blur + infinite CSS animations: fine on laptops/modern phones,
  but `reduced` intensity exists as the escape hatch for weak devices.
- Framer Motion spring counts spike on 8-player leaderboards (~30 concurrent springs) —
  acceptable in profiling, but avoid adding per-frame JS animation loops.
- EmojiBursts mount/unmount many motion spans; counts are already intensity-capped.
  Keep bursts ≤ ~16 particles at normal.
- No canvas/PixiJS was added; if particle needs grow (coin storms per island), a single
  canvas layer would be the next step rather than more DOM nodes.
