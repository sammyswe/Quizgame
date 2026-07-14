---
name: higgsfield-2d-game-assets
description: Generate Treasure Trap 2D art and animation assets with Higgsfield, provenance, mobile readability and fallbacks.
---

# Higgsfield 2D game assets

**Always pair generated art with procedural fallbacks** so the game never
breaks if MCP is down or files are missing.

## Workflow

1. **Check MCP** — `balance` on Higgsfield server; `models_explore` or cost
   preflight to find a working model (`nano_banana_pro` worked at 2 credits).
2. **Generate** with consistent global art direction appended to every prompt.
3. **Write a complete event brief** from `docs/context/ANIMATION_AND_ASSETS.md`.
4. **Save** to `client/src/assets/higgsfield/<feature>/`.
4. **Chroma-key** solid backgrounds (models don't emit alpha):

   ```bash
   python3 scripts/chroma_key.py path/to/sheet.png
   # → path/to/sheet-cut.png (flood-fill from edges)
   ```

6. **Register** in the active React asset map/component and feature `asset-manifest.json`.
7. **Resolve at runtime** with a fallback; dynamic state stays outside baked video.
8. **Document** job IDs in `asset-manifest.json` + prompts in
   `docs/HIGGSFIELD_PROMPTS.md`. If MCP unavailable, write
   `docs/HIGGSFIELD_ASSET_TODO.md` with exact prompts — never pretend it ran.

## Prompt context (append the matching zone suffix)

Default: cartoon pirate excursion, warm storybook sea, expressive fleet, chunky silhouettes,
thick outlines and mobile readability. Neon casino/slot-machine treatment is reserved for
loot-box, jackpot and approved high-stakes reward beats. Copy the exact suffixes from
`docs/context/ANIMATION_AND_ASSETS.md`; include mechanic trigger, source, target and meaning.

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
| Full excursion background | ✅ | gradient ocean |
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

The active client must render a coherent fallback for every optional asset and continue when
the `higgsfield/` folder is unavailable. Do not add production registrations only to archived
Phaser manifests.

## Honesty rule

Document in manifest whether each asset is `usedInGame: true` or reference-only
with a `reason`. Update `VISUAL_SELF_REVIEW.md` after each art pass.
