# Treasure Trap: Voyage (Higgsfield Path B)

**Primary product build** — mobile-first multiplayer party quiz in the Higgsfield Game Generator.

## Live

**https://lazy-crane-142.higgsfield.gg/**

- Game id: `001ac28c-b62c-4fca-9da9-9f9bda75b7c9`
- Art bible: `design/ART_BIBLE.md` · Shot list: `design/SHOT_LIST.md`
- STYLE FORMULA: `design/STYLE_FORMULA.txt`

## Beauty milestone

1. **Play vs Bot** or invite 2–4 captains
2. Lobby ready → cast off
3. **10** voyage questions — each on a unique sea scene; sail-off / enter between questions
4. Bigger 16-direction ships with hull nameplates
5. **LOCKED Loot Drop**: below-deck gold split (no ships) → loot-voyage fleet sail → Poseidon / sharks
6. Winner → rematch

## Direction (owner 2026-07-20)

- Path B only — Phaser is not the forward architecture
- Brawl Stars readability · Jackbox accessibility · Coin Master reward peaks
- 2D runtime from 3D-look pre-rendered sprites
- Target quality **8/10** before friend shares

## Redeploy

```bash
cd hf-treasure-trap
zip -r game.zip index.html logic.js assets design scripts README.md -x 'raw/*' -x 'game.zip'
higgsfield game deploy ./game.zip --game-id 001ac28c-b62c-4fca-9da9-9f9bda75b7c9 \
  --title "Treasure Trap: Voyage" --description "…" \
  --thumbnail "<https>" --favicon "<https>"
```
