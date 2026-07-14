# Visual System

## Palette (Tailwind theme `client/tailwind.config.js`)

| Token            | Hex                         | Use                                  |
| ---------------- | --------------------------- | ------------------------------------ |
| abyss            | #070b1e                     | Page background                      |
| deep/deeper/card | #0d1233 / #0a0e28 / #131a45 | Panels, sheets, cards                |
| neon.cyan        | #22d3ee                     | Info, timers, water, trust           |
| neon.gold        | #fbbf24                     | Treasure, score, primary CTAs        |
| neon.pink        | #f472b6                     | Danger-adjacent accents, plunder     |
| neon.green       | #4ade80                     | Gains, honour, curses (poison green) |
| neon.purple      | #c084fc                     | Secrets, missions, epic rarity       |
| neon.red         | #fb7185                     | Losses, mutiny, last place           |

Orange (#fb923c) is reserved for cannon fire/explosions only.

## Typography

- Display: **Lilita One** (`font-display`) — chunky arcade headings, stamps, scores.
- Body: **Nunito** (`font-body`) — 700–900 weights for labels; never below text-xs
  (interactive text ≥ text-sm).

## Surfaces

- `.neon-card`: rounded-2xl, `border-white/10`, translucent card blue, backdrop blur.
- Emphasis = coloured border + matching `shadow-neon-*` glow. Selection adds
  `animate-ring-pulse`.
- Buttons: `.btn-gold/.btn-cyan/.btn-pink` gradient pills with glow + automatic shine
  sweep; `.btn-ghost` for secondary. Disabled = greyscale (chained look) via `.btn:disabled`.

## Rarity language (`lib/rarityStyles.ts`)

| Rarity    | Frame                      | Feel                  |
| --------- | -------------------------- | --------------------- |
| Common    | sky blue                   | clean, calm           |
| Rare      | emerald                    | fresh, lucky          |
| Epic      | purple                     | mysterious            |
| Legendary | gold→pink animated shimmer | illegal, alarm-worthy |

Item cards, chest banners and reveal ribbons all pull from the same table — never
restyle rarity ad hoc.

## Scene layers (bottom → top)

1. `Background` — global animated ocean (aurora, bubbles, sparks, waves). Always on.
2. `SceneBackdrop` — per-round world (islands/spotlights/embers/fog/cave/storm/vault).
3. Screen content (`Screen` wrapper, max-w-md, safe-area padded).
4. Overlays — HUD, item drawer, chest modal, toasts, impact flashes, item-use FX.

Ambient layers must stay ≤ ~20% perceived brightness and never contain interactive UI.

## Iconography

Emoji are the current placeholder icon set (see ASSET_PIPELINE.md for the upgrade path),
plus inline SVG for ships, islands, hats, and stalactites. Icons always pair with text
labels — never icon-only for meaning.
