# Asset Pipeline

## Current state: Higgsfield art on the arcade client

The arcade React client ships a compressed WebP pack of Higgsfield Loot Drop art
under `client/src/assets/higgsfield/loot-drop/` (~0.9 MB total).

| Asset | File | Wired into |
| ----- | ---- | ---------- |
| A1 ocean | `a1-background.webp` | `Background.tsx` |
| A2 islands | `a2-islands-cut.webp` | Answer/`ChoiceGrid`, MPD trapdoors, `SceneBackdrop` |
| A3 ships | `a3-ships-cut.webp` | `SceneBackdrop` `PirateShip` |
| A5 chests | `a5-chests-cut.webp` | `ChestModal` ceremony |
| A6 avatars | `a6-avatars-cut.webp` | `PirateAvatar` mood frames |
| A9 rarity | `a9-rarity-cut.webp` | Chest rarity glow overlays |

Helpers: `client/src/lib/higgsfield.ts` + `client/src/components/higgsfield/HfSprite.tsx`.

Raw Higgsfield PNG masters + the archived Phaser slice live in
`experiments/loot-drop/` (reference only — not the default app entry).

## Reprocessing cutouts

```bash
python3 scripts/chroma_key.py path/to/raw-sheet.png
# then compress to WebP for the client (see prior agent commit / PIL recipe)
```

## Rules for new art

1. Keep filenames meaningful: `a2-islands-cut.webp`, `assets/items/crown-heist.webp`.
2. Prefer WebP for raster; SVG for new iconography when possible.
3. Swap at central shells (`Background`, `SceneBackdrop`, `PirateAvatar`, `ChestModal`,
   `ItemCard`) — avoid screen-level one-offs.
4. Respect the neon palette in `VISUAL_SYSTEM.md`.
5. Keep the packed client payload roughly under ~1–2 MB for the web prototype.
6. Sound: still WebAudio in `lib/sfx.ts` / `lib/soundEvents.ts`.
