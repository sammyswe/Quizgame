# 🏴‍☠️ Treasure Trap

**The neon pirate casino party quiz.** Answer trivia, split loot across glowing islands,
bluff with fake maps, betray your friends, open Mario Kart-style mystery chests, and
survive the Final Plunder to become the richest pirate at the table.

2–8 players · separate laptops/phones · one room code · ages 9+ · zero mercy.

> Multiplayer web prototype: React + TypeScript + Vite + Tailwind + Framer Motion on the
> client, Node + Socket.IO authoritative server, shared pure game logic with Vitest tests.

---

## Quick start (local)

Requirements: Node 20+, pnpm 9+ (`corepack enable` gets you pnpm).

```bash
pnpm install
pnpm dev
```

- Client: http://localhost:5173
- Server: http://localhost:3001 (health check at `/health`)

Open http://localhost:5173, **Start a Game**, then open a second browser window (or
incognito) and **Join with a Code** using the room code. Solo? Use the 🧪 playtest panel
(bottom-left, dev only) to add bot pirates.

### All scripts

| Command                                        | What it does                                                               |
| ---------------------------------------------- | -------------------------------------------------------------------------- |
| `pnpm dev`                                     | server + client together                                                   |
| `pnpm dev:client` / `pnpm dev:server`          | each side alone                                                            |
| `pnpm build`                                   | typecheck server/shared + production client build                          |
| `pnpm test`                                    | Vitest unit tests (game logic)                                             |
| `pnpm test:e2e`                                | Playwright smoke test (needs `pnpm exec playwright install chromium` once) |
| `pnpm lint` / `pnpm typecheck` / `pnpm format` | hygiene                                                                    |

## Playing with a friend on another laptop (same network)

1. Run `pnpm dev` on your machine. Vite listens on all interfaces (`--host`).
2. Find your LAN IP (`ip addr` / `ipconfig`), e.g. `192.168.1.42`.
3. Friend opens `http://192.168.1.42:5173` on their laptop (same Wi-Fi).
4. The Vite proxy forwards the socket connection to your server — no extra config.
5. Start a game on one machine, join with the code on the other. Sail.

## Deploying for remote friends

The realtime server is a long-lived Node process — **static-only hosting (plain Vercel)
is not enough for the server**. Split it:

**Server → Render / Railway / Fly**

- Start command: `pnpm install && pnpm --filter @treasure-trap/server start`
- Env: `PORT` (platform-provided), `CORS_ORIGIN=https://your-client-domain`

**Client → Vercel / Netlify**

- Build command: `pnpm --filter @treasure-trap/client build`
- Output dir: `client/dist`
- Env: `VITE_SERVER_URL=https://your-server.onrender.com`

Copy `.env.example` / `client/.env.example` as starting points. Send friends the client
URL — room codes do the rest (invite links use `?room=CODE`).

## How a game flows (arcade mode)

1. **Lobby** — host picks the length: **Test (10)**, Short (30), Medium (50) or Long (70) rounds.
2. Every round is a fast trivia question with a **decaying pot** (answer instantly: 100 🪙,
   at the buzzer: 30 🪙). Streaks pay bonuses; 3 in a row earns a chest.
3. **First 5 rounds**: your first correct answer triggers the 🎰 **jackpot chest ceremony**
   and hands you a power-up.
4. **Every 10th round is a special event** — the first is 💷 **Million Pound Drop**:
   stack 100 gold on trapdoors, wrong doors open, that gold is gone.
5. **Mutiny is always on** — secretly demand the leader gets it right. Leader wrong: you
   profit. Leader right: you pay. Mutiny **alone** and you're **marooned** 🏝️ (skip a
   question, keep a pity chest). Get marooned too if you're the only one wrong.
6. **Power-ups** fire from the 🎒 booty bag — attacks are aimed by tapping a pirate's
   avatar: 🏴‍☠️ Eyepatch (50/50) · 🦜 Parrot (copy) · 🔭 Telescope (see events coming) ·
   🪝 Hook (steal) · 🏳️ White Flag (cash your streak) · ❌ Secret X (the answer) ·
   🍾 Rum Rush (double) · 🪵 Walk the Plank (5s or nothing) · ⚔️ Sword Fight (duel) ·
   💣 Cannonball / 🧨 Barrage (holes in the answers).
7. **Random sea events** strike at reveals: 🐬 Dolphin Burglary (too many right answers —
   everyone pays), 🦑 Kraken (drags the leader's gold under), 🔱 Poseidon (blesses a
   struggling pirate once per game). Atlantis and Iceberg are on the roadmap.
8. Richest pirate at the end wins.

## Repo map

```
shared/   types · config (scoring/odds/items/missions) · pure game logic · 75 unit tests
server/   Socket.IO authoritative engine · rooms · bots · debug handlers
client/   React screens · Zustand store · neon pirate UI · Playwright smoke test
docs/     PRD · GAME_DESIGN · ARCHITECTURE · ROADMAP · IMPLEMENTATION_PLAN · SELF_REVIEW · PLAYTEST_NOTES
.cursor/  persistent rules for future Cursor work
```

## Docs

- [docs/PRD.md](docs/PRD.md) — product requirements & principles
- [docs/GAME_DESIGN.md](docs/GAME_DESIGN.md) — every round/item/mission + what's simplified
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — how state flows
- [docs/ANIMATION_DIRECTION.md](docs/ANIMATION_DIRECTION.md) — the motion identity
- [docs/VISUAL_SYSTEM.md](docs/VISUAL_SYSTEM.md) — palette, typography, rarity language
- [docs/GAME_FEEL.md](docs/GAME_FEEL.md) — the feedback toolkit and contract
- [docs/ASSET_PIPELINE.md](docs/ASSET_PIPELINE.md) — placeholder → professional art map
- [docs/SELF_REVIEW.md](docs/SELF_REVIEW.md) — honest state of the prototype
- [docs/ANIMATION_SELF_REVIEW.md](docs/ANIMATION_SELF_REVIEW.md) — visual overhaul review
- [docs/PLAYTEST_NOTES.md](docs/PLAYTEST_NOTES.md) — log your playtests here
