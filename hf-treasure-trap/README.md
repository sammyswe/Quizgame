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
3. **10** unique baked-island seas (`assets/voyage-v2/`) with authored water lanes
4. Hero ships ~9% screen width, 16 facings, hull names (12 chars), commit travel ~1.1s
5. After each question: sail **off the top** (~2s) → leaderboard 3s → next destination
6. **LOCKED Loot Drop**: below-deck gold split (no ships) → loot-voyage fleet sail → Poseidon / sharks
7. Winner → rematch

## Direction (owner 2026-07-20) — LOCKED

See `design/VOYAGE_VISUAL_DIRECTION.md` + `design/COIN_MASTER_POLISH.md`.

- Path B only — Phaser is not the forward architecture
- References: **(1) Coin Master**, (2) Brawl Stars, (3) Clash Royale
- Primary goal: **smoothness and polish** (warm tropical archipelago for all 10 questions)
- Baked islands + predefined lanes — never muddy cutout composites on the voyage
- Target: top-grossing glossy mobile; asset budget 500+ gens (`VOYAGE_ASSET_PACK_PLAN.md`)

## Redeploy

Platform caps: **~128MB zip** and **~64MB uncompressed**. Large single zips often HTTP 502; small zips usually apply with `success: false` (mode `rules`). Prefer batched deploys (logic/`index.html` first, then `reveal/` scenes in groups of 4).

```bash
cd hf-treasure-trap
# Slim runtime zip (skip legacy ship-*-dirs)
zip -qr game-deploy.zip index.html logic.js assets README.md \
  -x 'assets/ship-*-dirs/*' -x 'raw/*' -x 'game*.zip'
higgsfield game deploy ./game-deploy.zip --game-id 001ac28c-b62c-4fca-9da9-9f9bda75b7c9 \
  --title "Treasure Trap: Voyage" --description "Cartoon pirate party quiz"
```

Reveal cutscenes: `assets/voyage-v2/reveal/SXX-L.mp4` (40). Biome SFX: `assets/voyage-v2/sfx/win-*.mp3`. Spec: `design/REVEAL_CUTSCENE.md`.
