# Self Review — v0.1 prototype

An honest assessment. This is a playable, visually polished prototype — **not** production
software.

## What works (verified)

- ✅ `pnpm typecheck`, `pnpm lint`, `pnpm test` (75 unit tests), `pnpm build` all green.
- ✅ Full 7-round game simulated end-to-end with two real socket clients (create → join →
  full voyage → winner screen), all phases and rounds exercised.
- ✅ Playwright smoke test: app loads, host creates a room, friend joins from a second
  browser context, host starts the game, both reach Round 1.
- ✅ Room codes, invite links (`?room=CODE`), nickname entry, 2–8 players, host migration
  on disconnect, refresh-rejoin via session storage.
- ✅ All 15 items usable with real effects and counterplay (curse reversal, agent shield,
  strongbox, guard, etc.).
- ✅ Position-based chest odds + 10 chest sources + chest-opening ceremony.
- ✅ Secret missions (7 auto-resolved), mutiny tokens/accusations, trust pacts,
  confidence tokens.
- ✅ Reveal event queue — every score change plays as an animated story beat.
- ✅ Dev bots + 🧪 playtest panel (add bot / skip timer / force chest / auto-answer /
  reset / state JSON). Hidden in production builds and refused by the production server.

## What is simplified (documented in GAME_DESIGN.md)

- Loot Drop reef modifiers (Reef Tax/Warning/Bait/Reveal) and Captain's Call are not in v1.
- Treasure Auction runs one lot per round; trap/mission lots not implemented.
- False Map ships only the _Two Captains, Two Maps_ variant.
- Captain's Chase has no shortcut question.
- 5 of 12 missions are stubs (need talk-detection or multi-round memory).
- Final Plunder: Blame Game and Double Cross pay simplified flat bonuses.
- Broadside Duel resolves on the shared question rather than a dedicated duel question.

## Known bugs / rough edges

- Rooms are in-memory: a server restart kills live games (fine for playtests).
- Reveal pacing is fixed-cadence; very long reveal queues (8 players, many items) can feel
  slow — host can skip, but per-event "next" control would be better.
- Rejoining mid-question restores state but not your in-progress (unsubmitted) allocation.
- If the host leaves during the winner screen, "Sail Again" requires the new host.
- Obscure Island bank is small (6 questions) — repeats possible across many games in one room.
- No payload schema validation (zod) on the server yet; inputs are type-checked defensively
  but not exhaustively.

## What to playtest first

1. Does discussion actually happen during questions? (The design bets everything on this.)
2. False Map: do people lie? Do accusations land? Is +150/-token tuned right?
3. Split or Plunder betrayal rates — does Guard get used?
4. Do the leaders feel hunted (in a fun way) in Captain's Chase + Final Plunder?
5. Chest cadence: too many? too few? Open-at-leaderboard flow clear?
6. 45s question timer with real table talk.

## What the next iteration should improve

1. Reveal queue: tap-to-advance for the host + score bar animating live on all screens.
2. Loot Drop reef twists — the round wants more per-question variety.
3. Remaining missions + False Map variants.
4. Sound design (reveal stings, chest fanfare, mutiny horn).
5. Zod validation + rate limiting on socket inputs.
6. Redis room store for resilience.
7. Win-rate telemetry to verify the "knowledge wins ~75%" target.

## How to run locally

```bash
pnpm install
pnpm dev          # client http://localhost:5173 · server http://localhost:3001
pnpm test         # unit tests
pnpm test:e2e     # playwright smoke (once: pnpm exec playwright install chromium)
```

## How to deploy for friend testing

Server (long-lived Node) → Render/Railway/Fly with
`pnpm --filter @treasure-trap/server start`, env `CORS_ORIGIN=<client origin>`.
Client → Vercel/Netlify, build `pnpm --filter @treasure-trap/client build`, output
`client/dist`, env `VITE_SERVER_URL=<server url>`. Plain static hosting alone cannot run
the Socket.IO server. Full steps in README.md.
