# Voyage v2 — Higgsfield provenance

Status: active Path B pack for LOCKED voyage visual direction (2026-07-20).  
Model: `nano_banana_pro` @ 2k via Higgsfield CLI (MCP unavailable in this environment).

## Style locks + 10 baked seas (`scripts/gen-voyage-v2.mjs`)

Manifest: `design/voyage-v2-jobs.json`

| Key | Role |
| --- | --- |
| `lock-water` | Empty water plate (90/10) |
| `lock-ship-0..3` | Initial 4×4 ship sheets (superseded by `ship16-*` where better) |
| `lock-wake` | Wake reference |
| `bg-S00…S09` | Full-bleed baked-island seas → `assets/voyage-v2/bg-SXX.jpg` |

## Ship / VFX expansion (`scripts/gen-voyage-v2-ships.mjs`)

Manifest: `design/voyage-v2-ships-jobs.json` (22 jobs)

| Key | Role |
| --- | --- |
| `ship16-0..3` | Strict 16-facing sheets → `assets/voyage-v2/ships/p{n}/` |
| `ship-idle-0..3` | 6-frame idle flaps |
| `ship-cheer-0..3` | Celebrate frames |
| `ship-sad-0..3` | Disappointed frames |
| `vfx-fireworks` / `vfx-treasure` / `vfx-wake-foam` | Reward + travel VFX |
| `ambient-birds` / `ambient-fish` | Ambient |
| `island-glow-correct` | Correct-island overlay |

Raw downloads stay in `raw/voyage-v2/` (gitignored). Runtime uses compressed JPG seas + sliced PNGs under `assets/voyage-v2/`.

## Lane authoring

`design/lanes/S00.json`…`S09.json` → `assets/voyage-v2/lanes.js` (`window.VOYAGE_LANES`).

## Budget note

This slice is the first ~38 generations toward the **500+** plan in `VOYAGE_ASSET_PACK_PLAN.md`. Regenerations continue when QA fails polish killers (muddy art, weak facings, cluttered HUD).

## Island overlays + sky plates (`scripts/gen-voyage-v2-islands.mjs`)

Manifest: `design/voyage-v2-islands-jobs.json`

- 10 biome hero islands + 2×2 state sheets (idle / highlight / correct / wrong)
- 4 sky plates for optional layering
- Skull-rock prompts kept wholesome (ages 9+) after one NSFW reject
