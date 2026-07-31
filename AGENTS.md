> **Greenfield restart (2026-07-21):** Owner direction is a clean engineering rebuild.
> Spec pack now on this repo: `RESTART.md`, `AGENT_LOOP_ROADMAP.md`, `docs/decisions/voyage/`.
> Until a separate IQ-Party design repo is wired, treat those files as the decision source for new work.
> Do not treat Path B / `hf-treasure-trap` presentation as visual truth.

# AGENTS.md — Treasure Trap

Instructions for AI agents (and humans) working in this repository.

## What this is

Treasure Trap is a **cartoon pirate excursion party quiz** for 2–8 players (Path B beauty
milestone: 2–4 on phones). Friends on separate devices sail as a fleet, race toward answer
islands, bluff, mutiny, fire pirate power-ups and survive high-stakes special rounds. Casino
spectacle is deliberately concentrated in loot-box and jackpot moments; it is not the global
visual skin.

**Forward build target (LOCKED 2026-07-20):** Higgsfield Game Generator Path B in
`hf-treasure-trap/`. Root React/Phaser (`pnpm dev`) is legacy reference, not the polish target.

Start at `docs/context/INDEX.md`, `docs/context/HANDOFF.md`, and `hf-treasure-trap/design/ART_BIBLE.md`
plus `obsidian/_MOCs/Home.md`.

## Repository layout

- `hf-treasure-trap/` — **Path B primary**: Higgsfield-hosted multiplayer game (logic.js + canvas).
- `obsidian/` — Obsidian vault: working design notebook + granular source of truth for ideas
  and direction. Open this folder in Obsidian. See `obsidian/README.md`.
- `docs/` / `docs/context/` — Compact agent routing (`INDEX.md`), `HANDOFF.md`, roadmaps.
- `shared/` — TypeScript types, config constants, and **pure** game logic (legacy root app).
- `server/` — Legacy authoritative Node + Socket.IO server for root `pnpm dev`.
- `client/` — Legacy Vite + React + Phaser shell for root `pnpm dev`.
- `experiments/loot-drop/` — archived Phaser reference slice.

## Hard rules

1. **Never remove multiplayer** or make the game local-only without explicit instruction.
2. **Knowledge should usually win** (~75% hypothesis). Items are bounded comeback tools.
3. **Every attack must have counterplay.** No exceptions. Document the counter in the item/action config.
4. **Scores never go below 0.** All score changes go through `applyDelta`/`clampScore` in `shared/src/game/scoring.ts`.
5. **No silent score changes.** Every meaningful change must produce a `RevealEvent` rendered by the reveal queue.
6. **Secret info stays secret.** Mutiny choices, allocations, clues and inventories go only to
   their owners. Never put `correctIndex` in public state during a question.
7. **Named constants only.** Scoring, odds, timing, and rarity values live in `shared/src/config/*`. No magic numbers in game logic.
8. **Strict TypeScript.** Do not weaken `tsconfig.base.json`.
9. **Keep shared types centralised** in `shared/src/types/index.ts`.
10. **Tests for scoring and item logic.** New mechanics need Vitest coverage in `shared/src/game/__tests__/`.
11. **Status is explicit.** Existing code is not automatically confirmed design. Use
    LOCKED/PILOT/IDEA/REJECTED from `docs/context/STATUS.md` and Obsidian note frontmatter.
12. **Animation communicates rules.** Every shipped event needs immediate feedback, a readable
    staged result, sound, reduced motion and documented Higgsfield/fallback assets.
13. **Read Obsidian + docs.** Granular direction lives in `obsidian/`; compact routing and
    handoff live in `docs/context/`. Do not implement IDEA notes unless asked to promote them.

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
- Default art is a lively cartoon pirate voyage. Reserve neon slot-machine intensity for earned
  treasure/reward peaks so it keeps its impact.
