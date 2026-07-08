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

Why some assets are reference-only is explained per-asset in
`asset-manifest.json` and in `docs/HIGGSFIELD_ASSET_TODO.md`.
