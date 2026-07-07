# AGENTS.md — Treasure Trap

Instructions for AI agents (and humans) working in this repository.

## What this is

Treasure Trap is a **neon pirate casino party quiz** for 2–8 players. Friends on separate
laptops/phones join a room via a code, answer trivia, split loot, bluff with fake maps, betray
each other, open Mario Kart-style mystery chests, and survive a chaotic Final Plunder. The
richest pirate wins.

Read `docs/PRD.md` and `docs/GAME_DESIGN.md` before changing game behaviour.

## Repository layout

- `shared/` — TypeScript types, config constants, and **pure** game logic. No IO, no React,
  no sockets. Everything here is unit-testable. This is the source of truth for game rules.
- `server/` — Authoritative Node + Socket.IO server. Owns rooms, phases, timers, scores,
  items, chests, missions. Clients send **intents**; the server mutates state and broadcasts.
- `client/` — Vite + React + Tailwind + Framer Motion. Renders server state, never computes
  scores itself.

## Hard rules

1. **Never remove multiplayer** or make the game local-only without explicit instruction.
2. **Knowledge should usually win** (~75% of games). Items are comeback tools, not slot machines.
3. **Every attack must have counterplay.** No exceptions. Document the counter in the item/action config.
4. **Scores never go below 0.** All score changes go through `applyDelta`/`clampScore` in `shared/src/game/scoring.ts`.
5. **No silent score changes.** Every meaningful change must produce a `RevealEvent` rendered by the reveal queue.
6. **Secret info stays secret.** Missions, clues, and hands go only to the owning player via `player:privateState`. Never put `correctIndex` in public state during a question.
7. **Named constants only.** Scoring, odds, timing, and rarity values live in `shared/src/config/*`. No magic numbers in game logic.
8. **Strict TypeScript.** Do not weaken `tsconfig.base.json`.
9. **Keep shared types centralised** in `shared/src/types/index.ts`.
10. **Tests for scoring and item logic.** New mechanics need Vitest coverage in `shared/src/game/__tests__/`.

## Commands

```bash
pnpm install        # install everything
pnpm dev            # server (3001) + client (5173) together
pnpm dev:server     # server only
pnpm dev:client     # client only
pnpm typecheck      # strict TS across all packages
pnpm lint           # eslint
pnpm test           # vitest (shared game logic)
pnpm build          # all packages
```

## Verifying changes

Run `pnpm typecheck && pnpm lint && pnpm test && pnpm build` before finishing any task.
For gameplay changes, start `pnpm dev`, open two browser windows, create + join a room,
and use the 🧪 playtest panel (dev only) to add bots, skip timers, and force chests.

## Style

- Prefer readable game logic over clever abstractions. A junior dev should follow a round resolver top to bottom.
- Copy/tone: cheeky pirate, fast, funny, ages 9+ ("You have been absolutely robbed.").
- Animations must clarify game events, not hide them.
- Mobile-first, portrait-friendly UI. Big buttons. Readable text.
