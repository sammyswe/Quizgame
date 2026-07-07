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

Open http://localhost:5173, **Create a Voyage**, then open a second browser window (or
incognito) and **Join a Crew** with the room code. Solo? Use the 🧪 playtest panel
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
5. Create a voyage on one machine, join with the code on the other. Sail.

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

## How a game flows

1. **Lobby** — host picks Short (3), Medium (5) or Full (7 rounds), picks/randomises rounds.
2. Each round: **intro → question(s) (talk! lie! accuse!) → reveal queue → leaderboard**.
3. Rounds: 🪙 Loot Drop · 🔨 Treasure Auction · 🗺️ False Map · 💎 Obscure Island ·
   ⚖️ Split or Plunder · ⛵ Captain's Chase · 🏴‍☠️ Final Plunder (always last).
4. Earn mystery chests (losing big, streaks, schemes, revenge…), open them from the 🎒
   booty bag — lower ranks roll better rarities.
5. Final Plunder: protected score + secret actions + 3 questions of chaos. Richest pirate wins.

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
- [docs/SELF_REVIEW.md](docs/SELF_REVIEW.md) — honest state of the prototype
- [docs/PLAYTEST_NOTES.md](docs/PLAYTEST_NOTES.md) — log your playtests here
