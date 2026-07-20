# Voyage Asset Pack Plan — 500+ Higgsfield calls

Primary goal: **smoothness and polish**. Reject muddy outputs; regenerate.

Model default: `nano_banana_pro` @ 2k. Aspect: backdrops `9:16`, sheets `1:1`.

## Style suffix (append every prompt)

Use `STYLE_FORMULA.txt` + excursion suffix from `docs/context/ANIMATION_AND_ASSETS.md`, plus:

> Coin Master gloss: jewel-bright saturation, soft specular highlights on water and sails,
> candy-clear silhouettes, warm golden-hour tropical light, no muddy browns, no photorealism,
> no text except blank plaque shapes.

## Generation batches

### A — Style locks (do first, human-review before mass gen) ~12 jobs

| # | Asset | Spec |
| --- | --- | --- |
| A1 | `lock-water-plate` | 9:16, 90% sparkling teal water, 10% warm sky, EMPTY of islands/ships |
| A2 | `lock-sky-plate` | 9:16 soft sky+clouds only, transparent-ready green bottom half |
| A3–A6 | `lock-ship-{0..3}` | 4×4 sheet, 16 facings, blank hull plaque, NO water, green key |
| A7 | `lock-island-palm` | Single island hero 4× ship scale, plaque zone, green key |
| A8 | `lock-wake-sheet` | 4×4 wake/foam frames, green key |
| A9 | `lock-vfx-splash` | Splash burst sheet |
| A10–A12 | retry reserve | |

### B — Ten scene backdrops (layered) ~40 jobs

For each scene `S00…S09`:

1. **Water+islands plate** (9:16) — baked 4 islands, corner-biased, clear water lanes, blank plaque rectangles on each island, NO ships, NO UI text  
2. **Sky plate** (optional reuse with tint variants)  
3. **Near foam/parallax strip**  
4. **Lane QA still** (same as plate; used only for authoring waypoints)

| Scene | Biome focus (4 islands) |
| --- | --- |
| S00 | palm, skull, shipwreck, lighthouse |
| S01 | volcano, palm, crystal, mangrove |
| S02 | temple, iceberg, palm, skull |
| S03 | lighthouse, shipwreck, crystal, volcano |
| S04 | mangrove, temple, palm, iceberg |
| S05 | skull, lighthouse, shipwreck, crystal |
| S06 | palm, volcano, temple, mangrove |
| S07 | iceberg, crystal, palm, skull |
| S08 | shipwreck, lighthouse, temple, volcano |
| S09 | remix festival: palm, skull, crystal, lighthouse + lanterns |

Each scene gets `design/lanes/SXX.json` with home berths, toA–toD curves, exitTop path, plaque anchors.

### C — Island overlay pack (~40 heroes × 4 states) ~160 jobs

Even with baked bases, overlays for highlight/correct/wrong/glow:

- 40 unique island heroes (cutout)  
- States: idle rim, highlight, correct glow, wrong dim — as multiply/add sheets or separate frames  

Batch as 4×8 sheets where possible (8 islands × state strip).

### D — Ship animation pack ~120 jobs

Per sail colour (4):

- 4×4 facing sheet (16 dirs) — travel  
- 4×4 idle bob/flap (reuse facings or 4 key dirs × 6 frames)  
- Celebrate sheet  
- Damaged/sad sheet  
- Crew layer sheet (cheer / sulk)

### E — Ambient + VFX ~100 jobs

Birds (3-frame), fish, clouds, flags, lanterns, splash, wake, foam, confetti, fireworks, sparkle, impact, speed lines, smoke, magical glow.

### F — QA regenerations ~70+ jobs

Budget reserved for remakes when review fails polish killers.

**Total target: 500+**

## Acceptance checklist (every asset)

- [ ] Phone-readable silhouette  
- [ ] No muddy brown sludge; Coin Master gloss  
- [ ] No unwanted text/logos  
- [ ] Ships: blank hull plaque zone  
- [ ] Backdrops: clear water lanes, islands not blocking centre exits  
- [ ] Consistent outline weight with STYLE FORMULA  

## Runtime composition

- Backdrop layers drawn bottom→top  
- Ships follow **authored lane polylines** only; stop at **island box edges**  
- Plaque letters are runtime text/sprites at JSON anchors  
- Fog rival, celebrate/sad ship swaps are sprite state changes  
- Correct-island celebration = **40 full-scene ~2s cutscenes** (`reveal/SXX-L.mp4`) with live ships overlaid — see `REVEAL_CUTSCENE.md`  
- Biome win SFX under `assets/voyage-v2/sfx/win-*.mp3`  

### G — Reveal cutscenes + SFX (LOCKED 2026-07-20) ~50 jobs

| # | Asset | Spec |
| --- | --- | --- |
| G1–G40 | `reveal/S00-A`…`S09-D` | Seedance 1.5 from baked `bg-SXX`, win+empty islands baked together, 9:16, no ships |
| G41–G49 | `sfx/win-{biome}` | Mirelo happy ~2s stings per biome |
