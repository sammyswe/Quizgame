# Animation Implementation Plan

## Audit (current state before this pass)

- **Stack**: React 18 + Vite + Tailwind + Framer Motion + Zustand. No canvas/PixiJS.
- **Screens**: phase-routed in `App.tsx` (landing, lobby, round intro, auction, question,
  pair choice, final action, reveal, leaderboard, winner) + HUD, item drawer, chest modal,
  toasts, debug panel.
- **Existing feel layer** (first juice pass): `components/Background.tsx` (aurora, bubbles,
  sparks, waves), `components/fx.tsx` (EmojiBurst, FloatingDelta, EmojiRain, Shaker,
  LockStamp), `lib/sfx.ts` (WebAudio synth), timer heartbeat, answer-card lock stamps,
  reveal slam-ins, chest shake→wheel→pop.
- **Reveal system**: server emits ordered `RevealEvent[]`; client plays them on a fixed
  cadence. No animation metadata on events yet.
- **Gaps vs. target**: no per-round scenes, no player avatars beyond emoji, item cards
  lack rarity framing/use animations, chest sequence missing chains/slam/burst-card-flyout,
  no animation intensity setting, no named sound-event architecture, leaderboard lacks
  new-leader drama, no cannon/smoke/map-flip effects, docs missing.

## Plan

1. **Libs** — `lib/animationPresets.ts` (springs, staggers, durations),
   `lib/rarityStyles.ts` (frames/glows/banners per rarity), `lib/gameFeel.ts`
   (intensity store: reduced/normal/chaos, persisted, respects prefers-reduced-motion),
   `lib/soundEvents.ts` (named events → synth calls; future native sound/haptics map).
2. **Shared types** — optional `animation` + `intensity` fields on `RevealEvent`,
   inferred by default in `shared/src/game/reveal.ts` so server resolvers stay untouched.
3. **Game-feel components** (`components/gamefeel/`) — `GameScene` (scene wrapper),
   `ImpactFlash`, `FloatingText`, `ScoreTicker` (HUD delta popups), re-exported
   `ParticleBurst`/`ScreenShake` primitives; (`components/effects/`) `CannonBlast`.
4. **Players** (`components/players/`) — `PirateAvatar`: colour ring by player, tricorn
   hat SVG, bobbing idle, moods (idle/answered/attacked/protected/cursed/accused/winner).
   Integrated into lobby, question status row, leaderboard, winner.
5. **Scenes** (`components/scenes/`) — `SceneBackdrop` with 7 treatments:
   islands+circling ship (Loot Drop), casino spotlights+coins (Auction), burning map
   vignette+embers (False Map), drifting fog (Obscure), cave stalactites+emerald sparkle
   (Split or Plunder), storm+lightning (Chase), vault bars+skull+red pulse (Final Plunder).
6. **Items** (`components/items/`) — `ItemCard` with rarity frame/glow/timing chip;
   item-use overlay animation (projectile/aura/swap per item class); drawer rebuilt on it.
7. **Chest** — full sequence: slam-drop → chains snap → escalating shake → rarity slot
   spin → burst (flash + coin explosion) → item card flies out with rarity banner → stash.
   Skip button after a short delay.
8. **Reveal player** — consumes `animation`/`intensity` metadata: cannon blasts, plunder
   smoke, curse flash, map flips, duel collisions; per-event sounds; running score strip.
9. **Leaderboard** — new-leader announcement, crown float, danger glow on last place,
   rank-change arrows vs. previous round snapshot.
10. **Docs + rules** — ANIMATION_DIRECTION, VISUAL_SYSTEM, GAME_FEEL, ASSET_PIPELINE,
    ANIMATION_SELF_REVIEW, `.cursor/rules/animation.mdc`, `.cursor/rules/game-feel.mdc`.
11. **Verify** — typecheck, lint, unit tests, build, Playwright smoke, screenshot review.

## Constraints honoured

- No game engine; Framer Motion + CSS keyframes + SVG + emoji placeholder art only.
- Server stays authoritative; clients animate from received events only.
- Readability first: all ambience sits behind content, `reduced` intensity kills shake
  and particle storms, prefers-reduced-motion collapses CSS loops globally.
