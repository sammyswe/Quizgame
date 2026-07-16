# Higgsfield Prompts

**Higgsfield MCP was connected and used.** All nine assets below were
generated on 2026-07-08 with model `nano_banana_pro` (2 credits each, 18
credits total). Files live in `client/src/assets/higgsfield/loot-drop/`
(processed) and `.../raw/` (originals); job IDs are recorded in
`asset-manifest.json`.

## Global art direction (appended to every prompt)

> Cartoon 2D mobile arcade game art, neon pirate casino theme, bold shapes,
> thick outlines, glossy highlights, vivid colours, readable on small
> screens, Brawl Stars / Coin Master inspired energy, dark ocean background,
> glowing gold treasure, cyan and magenta neon accents, funny chaotic pirate
> mood, clean sprite-friendly composition.

One deliberate deviation from the brief: "transparent background" was
replaced with **"plain solid dark background for easy cutout"** because image
models do not emit alpha channels; a solid background chroma-keys cleanly
(see `scripts/chroma_key.py`).

## A1 — Main Loot Drop background (`a1-background.png`, used in game)

> Full-screen cartoon 2D mobile game background for a neon pirate casino
> ocean scene. Four glowing treasure islands arranged around the scene, dark
> blue ocean, animated-feeling waves, distant pirate ships, neon casino
> lights, glowing moon, magenta and cyan highlights, golden treasure sparkle,
> no text, no UI, game-ready background, Brawl Stars meets Coin Master style,
> polished mobile game illustration. + global direction

## A2 — Answer island sprite set (`a2-islands-cut.png`, used in game)

> Set of four cartoon 2D pirate treasure island sprites for a mobile game,
> each island distinct but same style, thick outlines, glowing neon edges,
> small palm trees, rocks, treasure hints, top-down/three-quarter view, plain
> solid dark background for easy cutout, no text, sprite sheet layout in 2x2
> grid with clear spacing between sprites, readable at small size. + global

## A3 — Pirate ship sprites (`a3-ships-cut.png`, used in game)

> Cartoon 2D pirate ship sprites for a mobile arcade game, side/top
> three-quarter view, thick outlines, colourful sails, neon casino pirate
> theme, multiple colours for player ships and enemy ships, plain solid dark
> background for easy cutout, sprite sheet layout in grid with clear spacing,
> expressive and readable. + global

## A4 — Treasure coin/chip sprites (`raw/a4-coins.png`, reference only)

> Cartoon 2D gold coins and casino chips for a neon pirate mobile game,
> glowing highlights, thick outlines, multiple sizes, plain solid dark
> background for easy cutout, sprite sheet layout in grid with clear spacing,
> designed for flying particle animations. + global

## A5 — Treasure chest sprite set (`raw/a5-chests.png`, reference only)

> Cartoon 2D treasure chest sprite sheet for mobile game loot box animation,
> closed chest, shaking chest, glowing chest, open chest, coin burst, common
> rare epic legendary glow variants, neon pirate casino style, plain solid
> dark background for easy cutout, sprite sheet grid layout with clear
> spacing. + global

## A6 — Pirate avatar set (`raw/a6-avatars.png`, reference only)

> Set of 8 funny cartoon pirate avatar portraits for a mobile party game,
> diverse colours, expressive faces, thick outlines, neon pirate casino
> style, mischievous, scared, smug, angry, celebrating expressions, plain
> solid dark background for easy cutout, sprite sheet grid layout with clear
> spacing. + global

## A7 — Cannon / plunder VFX (`raw/a7-vfx.png`, reference only)

> Cartoon 2D mobile game VFX sprite sheet for pirate cannon fire, smoke puff,
> impact burst, splash, skull stamp, plunder effect, neon pirate casino
> style, plain solid dark background for easy cutout, sprite sheet grid
> layout with clear spacing. + global

## A8 — Lock-in button / casino lever (`raw/a8-lock-in.png`, reference only)

> Cartoon 2D mobile game UI asset for a giant lock-in button and casino
> lever, pirate casino theme, glowing gold and red, chunky, satisfying, plain
> solid dark background for easy cutout, no text. + global

## A9 — Rarity glow effects (`raw/a9-rarity.png`, reference only)

> Cartoon 2D mobile game rarity glow VFX, common blue, rare green, epic
> purple, legendary gold red, circular bursts, rays, sparkles, plain solid
> dark background for easy cutout, sprite sheet grid layout with clear
> spacing. + global

## Intro — Entering the Seven Seas (8s cinematic)

- Model: `kling3_0_turbo` text-to-video, 16:9, 8s
- Job: `bd7c25ee-cd7b-45f7-b7de-01d8fdb2d1f7`
- Runtime: `client/src/assets/higgsfield/intro/entering-seven-seas.mp4`
- Plays once on `RoundIntroScreen` (voyage start). Overlay copy only:
  `ENTERING THE SEVEN SEAS` + CTA `PLUNDER YER LOOT!`
- Cinematic fleet names (not live nicknames): RUBY, COBALT, AMBER, VIOLET

## Voyage — ship sail smooth (video → 24-frame sheet)

- Model: `kling3_0_turbo` image-to-video (locked framing retry)
- Job: `79ee78a9-5500-4681-9174-9a02814a24bb`
- Start image media: `9e1ef127-d719-4e2e-b0ed-f2ac7c69bb2c`
- Runtime: `client/src/assets/higgsfield/voyage/anim-ship-sail-smooth.webp` (6×4)
- Source mp4: `design/concept/video/ship_sail_smooth_v2.mp4`
- Rejected: first pass `d989602b-…` (turntable / orbit — not used)

> CRITICAL CONSTRAINTS: fixed camera, locked framing, NO orbit, NO rotation,
> NO turntable. Same 3/4 side angle facing right every frame. Only waterline
> bob, sail flutter, white wake foam. Seamless 2D game unit loop. Treasure Trap
> pirate excursion, thick outlines, ages 9+, plain solid dark navy background.

Why some assets are reference-only is explained per-asset in
`asset-manifest.json` and in `docs/HIGGSFIELD_ASSET_TODO.md`.

## Quiz screen — pot / pirates / plunder (2026-07-14)

Model: `nano_banana_pro`. Excursion suffix from `ANIMATION_AND_ASSETS.md`.

| Asset | Job ID | Runtime |
|-------|--------|---------|
| pot drain 3×3 (open chest full→empty) | `ae7b619e-7a95-4853-8907-14b389b80e66` | `voyage/sheet-pot-drain.webp` |
| pirate walk/smash/loot 4×2 | `3bcc8f2f-8a0f-4e12-8aa2-c4db91a2b02e` | `voyage/sheet-pirates.webp` |
| plunder vignettes ×8 biomes | `a817e15e-a69c-426e-ba8d-918870d40b05` | `voyage/sheet-plunder-biomes.webp` |
| loot particles 4×2 | `d5fbfb3e-ddee-43e7-8dcc-05534e6b1c1b` | `voyage/sheet-loot-particles.webp` |
| HUD chest full (single) | `d8d1b738-aef3-412d-bfff-5e3d86328ec1` | `voyage/ui-chest-full.webp` |
| HUD chest empty (single) | `bb458958-8c4f-4907-88dc-e5f40364ae4f` | `voyage/ui-chest-empty.webp` |
| smash FX ×8 biome flavours | `dd9f1e15-4ff7-42d4-90cf-6e551a67e2bd` | `voyage/sheet-smash-fx.webp` |
| wrong-island reactions | `3ecd2216-20c0-48d6-8f49-708036c0bb69` | `voyage/sheet-wrong-react.webp` |

Raw inbox: `design/concept/inbox/quiz/`.

## Quiz reveal — per-biome plunder cinematics (2026-07-14)

Model: `kling3_0_turbo`, 5s, 16:9 text-to-video → ByteDance **4K** upscale
(`3840×2160`, preset `aigc`). Runtime folder:
`client/src/assets/higgsfield/voyage/plunder/`. Full-bleed on reveal (lazy-loaded).

| Biome | Source job | 4K upscale job | File |
|-------|------------|----------------|------|
| volcano | `700d1020-…` | `1f3fd4b9-278a-4a99-a0c7-55d8376e37ac` | `plunder-volcano.mp4` |
| jungle | `33c2cf71-…` | `ae3036d1-9fb1-4b45-83c2-4b8ba8efe246` | `plunder-jungle.mp4` |
| skull | `3125c854-…` | `046c9858-bba5-410e-a9be-ee3779f35502` | `plunder-skull.mp4` |
| lagoon | `3a8e0a11-…` | `eb988e87-e653-4fe1-aa4a-b922f2158fa8` | `plunder-lagoon.mp4` |
| shipwreck | `6f3efaad-…` | `2c65ba80-0887-4128-8f21-6d6faa755eff` | `plunder-shipwreck.mp4` |
| ruins | `6e396684-…` | `09441cc8-254f-4305-8ecc-ea1b8e85ae72` | `plunder-ruins.mp4` |
| lighthouse | `327c472f-…` | `409c7c21-8b26-4722-a5e0-72636c78d810` | `plunder-lighthouse.mp4` |
| mangrove | `c329d9e7-…` | `7f515be2-7f9d-459a-a53e-dd04a0b48d20` | `plunder-mangrove.mp4` |

Intro Seven Seas also upscaled to 4K: source `bd7c25ee-…` →
`31c95d43-2486-45ac-b8c9-fcd0ddfd55b9` → `intro/entering-seven-seas.mp4`.

Beat: ship beaches → pirates ashore → smash/loot → leap aboard → sail away.
