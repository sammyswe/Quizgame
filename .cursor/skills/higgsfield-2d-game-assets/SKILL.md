---
name: higgsfield-2d-game-assets
description: Generate 2D mobile game assets with Higgsfield MCP — sprite sheets, backgrounds, chroma-key pipeline, procedural fallbacks. Use when creating art for Phaser/Pixi game scenes or documenting asset prompts.
---

# Higgsfield 2D game assets

**Always pair generated art with procedural fallbacks** so the game never
breaks if MCP is down or files are missing.

## Workflow

1. **Check MCP** — `balance` on Higgsfield server; `models_explore` or cost
   preflight to find a working model (`nano_banana_pro` worked at 2 credits).
2. **Generate** with consistent global art direction appended to every prompt.
3. **Save** to `client/src/assets/higgsfield/<feature>/`.
4. **Chroma-key** solid backgrounds (models don't emit alpha):

   ```bash
   python3 scripts/chroma_key.py path/to/sheet.png
   # → path/to/sheet-cut.png (flood-fill from edges)
   ```

5. **Register** in `assetManifest.ts` `FILE_MAP` with grid slicing info.
6. **Resolve at runtime** via `AssetManager` — prefer HF when loaded, else PROC.
7. **Document** job IDs in `asset-manifest.json` + prompts in
   `docs/HIGGSFIELD_PROMPTS.md`. If MCP unavailable, write
   `docs/HIGGSFIELD_ASSET_TODO.md` with exact prompts — never pretend it ran.

## Global art direction (append to every prompt)

> Cartoon 2D mobile arcade game art, neon pirate casino theme, bold shapes,
> thick outlines, glossy highlights, vivid colours, readable on small screens,
> Brawl Stars / Coin Master inspired energy, dark ocean background, glowing
> gold treasure, cyan and magenta neon accents, funny chaotic pirate mood,
> clean sprite-friendly composition.

## Prompt tweaks that work

| Ask for | Why |
|---------|-----|
| "plain solid dark background for easy cutout" | Models can't do real transparency |
| "sprite sheet 2x2 grid with clear spacing" | Enables automatic frame slicing |
| "no text, no UI" | Keeps assets game-ready |
| `aspect_ratio: "16:9"` for backgrounds | Full-screen scenes |
| `aspect_ratio: "1:1"` for sheets | Square sprite grids |

## What to generate vs procedural

| Asset | Higgsfield shines | Procedural is fine |
|-------|-------------------|-------------------|
| Full background | ✅ | gradient ocean |
| Island/ship sprites | ✅ (if chroma-keyed) | chunky Graphics shapes |
| Individual coins/chips | ✅ single sprites | circles with gloss |
| Particle VFX | reference only | additive spark/coin textures |
| HUD buttons | only if flat/straight-on | chunky Graphics button |
| Avatar portraits | ✅ distinct characters | colour-coded medallions |

Irregular sheet layouts → keep as reference, generate singles instead.

## PreloadScene slicing

After `load.image(key, url)`, slice grids into frames `q0`, `q1`, …:

```ts
const fw = Math.floor(img.width / cols);
const fh = Math.floor(img.height / rows);
tex.add(`q${i}`, 0, c * fw, r * fh, fw, fh);
```

Scene code uses `{ key: HF.islands, frame: "q2" }` via `AssetManager`.

## Procedural fallback requirement

`generatedTextures.ts` must define **every** texture key the scene references.
Boot scene calls `generateAllTextures()` before Preload. Game runs with an
empty `higgsfield/` folder.

## Honesty rule

Document in manifest whether each asset is `usedInGame: true` or reference-only
with a `reason`. Update `VISUAL_SELF_REVIEW.md` after each art pass.
