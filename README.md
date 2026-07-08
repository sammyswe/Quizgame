# Treasure Trap

A multiplayer neon-pirate-casino party game. This repo currently contains the
**Loot Drop vertical slice**: one fully animated 2D game round built with
Phaser 3, wrapped in a thin React shell with a socket.io multiplayer server.

## How it plays

Each round, a question with 4 answers appears. The 4 answers are **treasure
islands** floating in an animated ocean. Every player gets **100 loot** and
drags coins from their treasure pile onto the islands (split across as many as
you like), then slams **LOCK IN**. On the reveal, raider ships sail in and
bombard the wrong islands, plundering everything on them — while loot on the
correct island pays out double and flies back into your score.

## Run it

```bash
npm install
npm run dev
```

- Client: http://localhost:5173
- Server: http://localhost:3001

`npm run dev` starts both (Vite client + socket.io server) via workspaces.

## Play with a friend (two laptops)

1. Run `npm run dev` on the host machine.
2. Find the host's LAN IP (e.g. `192.168.1.20`).
3. Friend opens `http://192.168.1.20:5173` — the client automatically connects
   to the game server on the same hostname, port 3001.
4. Host creates a room, friend joins with the 4-letter code, host presses
   **START LOOT DROP**.

To point the client at a different server entirely, set `VITE_SERVER_URL`.

## Debug tools

In dev builds (or with `?debug` in the URL) a wrench button / backtick key
opens the debug panel: add bots, skip the timer, force the reveal, grant the
Fear Shot item, switch animation intensity (`reduced | normal | chaos`) and
toggle between Higgsfield and procedural art.

## Docs

- `docs/GAME_ENGINE_DECISION.md` — why Phaser 3
- `docs/PHASER_ARCHITECTURE.md` — scene/object/system layout
- `docs/LOOT_DROP_VISUAL_PRD.md` — the visual bar for this slice
- `docs/HIGGSFIELD_PROMPTS.md` — exact prompts used to generate art
- `docs/ANIMATION_SYSTEM.md` — juice/VFX/camera systems
- `docs/PLAYTEST_VISUAL_CHECKLIST.md` — what to verify before a playtest
- `docs/VISUAL_SELF_REVIEW.md` — honest assessment + next steps
