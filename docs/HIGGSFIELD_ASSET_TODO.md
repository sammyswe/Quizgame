# Higgsfield Asset TODO

Higgsfield MCP **was** available and used for this pass (see
`HIGGSFIELD_PROMPTS.md`). This file tracks what to generate or re-generate
next so the remaining procedural placeholders can be replaced. Every prompt
is ready to paste; keep the global art direction from `HIGGSFIELD_PROMPTS.md`
appended.

## 1. Coin + chip singles (replace procedural coins everywhere)

The A4 sheet came back with an irregular grid that can't be auto-sliced.
Generate *individual* sprites instead, one per generation, centred:

> A single cartoon 2D gold pirate coin with a skull emblem, game icon,
> centered, fills 80% of frame, plain solid dark background for easy cutout,
> no text, thick outline, glossy highlight.

Repeat for: gold coin (anchor emblem), magenta casino chip, cyan casino chip.
Save as `coin-skull.png`, `coin-anchor.png`, `chip-magenta.png`,
`chip-cyan.png`, run `python3 scripts/chroma_key.py <files>` and add entries
to `FILE_MAP` in `client/src/game/assets/assetManifest.ts`.

## 2. Straight-on lock-in button (replace procedural button)

A8 came back angled/perspective which fights the flat HUD. Re-generate:

> A giant chunky rectangular rounded slam button for a mobile game HUD,
> viewed perfectly straight-on and flat, red glossy top with gold rim and
> rivets, pirate casino style, no text, no perspective, no rotation, centered,
> plain solid dark background for easy cutout.

## 3. Pirate avatar portraits with colour variety (replace medallions)

A6 generated one pirate with nine expressions. For player identity we need
distinct characters. Generate 8 separate portraits:

> A single funny cartoon pirate face portrait in a circular gold medallion
> frame, [VARIANT], thick outlines, neon pirate casino style, centered, plain
> solid dark background for easy cutout, no text.

Variants: "young woman with cyan bandana", "old man with magenta tricorn hat",
"woman with gold hoop earrings and eye patch", "big bearded man with lime
bandana", "parrot wearing a pirate hat", "skeleton pirate with orange scarf",
"kid pirate with purple cap", "robot pirate with blue visor".

Keep the A6 expression sheet: slice it later as a reaction-overlay set.

## 4. Reaction expression overlays (upgrade avatar reactions)

Use `raw/a6-avatars.png` (3x3: wink-grin, worried, smug, angry, wide-eyed,
skeptical, celebrating, sleeping, laughing) as frames swapped by
`PlayerAvatar.react()`. Needs manual crop verification; grid is regular.

## 5. Chest + rarity glows (for the chest reward feature, next pass)

`raw/a5-chests.png` and `raw/a9-rarity.png` are already generated and decent.
When the chest reward is implemented, slice them (3x3 / 2x2) and add to
`FILE_MAP`.

## 6. Animated water/ambience (optional, video)

Higgsfield video models could produce a looping ocean shimmer. Video-to-
sprite-sheet conversion is manual work (extract frames with ffmpeg, pick 8-12
loopable frames); only worth it if the tween-driven waves feel insufficient.

## Process reminder

1. Generate with `nano_banana_pro` (or better), solid dark background.
2. `python3 scripts/chroma_key.py <file.png>` -> `<file>-cut.png`.
3. Drop into `client/src/assets/higgsfield/loot-drop/`.
4. Register in `FILE_MAP` (`assetManifest.ts`) with grid info if a sheet.
5. Point the relevant `AssetManager` method at the new key/frame.
6. Update `asset-manifest.json` + `HIGGSFIELD_PROMPTS.md` with job id/prompt.
