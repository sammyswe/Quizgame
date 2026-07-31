---
id: HAND-001
title: Current agent handoff
status: PILOT
scope: active branch
updated: 2026-07-20
---

# Current handoff

## Current truth (owner LOCKED 2026-07-20)

- **Primary product direction is Path B:** build Treasure Trap natively in the
  **Higgsfield Game Generator** (`hf-treasure-trap/`), not Phaser polish.
- Live game: https://lazy-crane-142.higgsfield.gg/ (update in place with `--game-id`).
- Mobile-first multiplayer party quiz; beauty bar Brawl Stars readability + Jackbox
  accessibility + Coin Master reward spectacle (rewards only).
- Beauty milestone: **3 polished questions + full LOCKED Loot Drop** (correct venture
  pays / wrong lost — not multiplier mini-game). Players **2–4** (bot demo OK first).
- Art bible + shot list: `hf-treasure-trap/design/ART_BIBLE.md`, `SHOT_LIST.md`.
- STYLE FORMULA: `hf-treasure-trap/design/STYLE_FORMULA.txt` (byte-identical prompts).

## Legacy root app

- Root `pnpm dev` (React + Phaser + Socket.IO) remains in the repo as historical /
  reference multiplayer implementation. It is **not** the target architecture going
  forward. Do not invest polish effort there unless the owner explicitly reopens Path A.

## Mechanics still LOCKED (product)

- Pirate excursion first; casino only for reward / high-stakes peaks.
- Full match fantasy remains 10Q blocks → specials; Loot Drop is first special to polish.
- Knowledge should usually win; authoritative server; ages 9+.
- Poseidon + Shark wildcards; unique shark item remains IDEA (ignore for beauty pass).

## Next implementation slice

1. Generate / cut in P0 Higgsfield heroes per shot list.
2. Ship polished `logic.js` + mobile diorama client with rivalry fog, wheel lock,
   venture-by-venture Loot Drop reveal.
3. Redeploy Path B; bot-only demo acceptable for first 8/10 gate.
4. Owner playtest physical commitment / rivalry / reward spectacle.
