# 🏴‍☠️ Treasure Trap

**The cartoon pirate excursion party quiz.** Sail as a fleet, race toward answer islands,
bluff, mutiny, fire pirate power-ups and open Mario Kart-style mystery chests. The voyage is
warm and adventurous; loot-box rewards erupt into jewel-bright casino spectacle.

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

## How a game flows (current arcade pilot)

1. **Lobby** — host picks the length: **Test (10)**, Short (30), Medium (50) or Long (70).
2. Every round is a fast trivia question with a **decaying pot** (answer instantly: 100 🪙,
   at the buzzer: 30 🪙). Streaks pay bonuses; 3 in a row earns a chest.
3. **Current pilot:** your first correct answer in the first 5 rounds triggers the jackpot
   chest. Confirmed final direction is one onboarding ceremony after question 5.
4. **Current pilot:** every 10th numbered round is a special event. Confirmed final direction
   is 10 regular questions followed by the special. The first is **Million Pound Drop**:
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
shared/              types · config · pure game logic · Vitest tests
server/              Socket.IO authoritative engine · rooms · bots · debug handlers
client/              React screens · Zustand store · pirate excursion UI · Playwright smoke
experiments/loot-drop/  archived Phaser 3 Loot Drop vertical slice (assets + systems)
docs/context/        canonical indexed product context and roadmap
docs/                historical/deep design, Phaser and Higgsfield notes
.cursor/             rules + skills for future Cursor work
```

## Docs

- [docs/context/INDEX.md](docs/context/INDEX.md) — start here; task router and status registry
- [docs/context/VISION.md](docs/context/VISION.md) — locked product and visual pillars
- [docs/context/MECHANICS.md](docs/context/MECHANICS.md) — confirmed rules vs implementation
- [docs/context/SPECIAL_ROUNDS.md](docs/context/SPECIAL_ROUNDS.md) — Loot Drop and event framework
- [docs/context/ITEMS.md](docs/context/ITEMS.md) — item catalogue and Mario Kart principles
- [docs/context/ANIMATION_AND_ASSETS.md](docs/context/ANIMATION_AND_ASSETS.md) — Higgsfield contract
- [docs/context/ROADMAP.md](docs/context/ROADMAP.md) — route to public web playtests

Older root-level design docs are preserved for history and may describe the superseded
seven-round prototype. The context index takes precedence.
