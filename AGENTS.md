> **Greenfield restart (2026-07-21):** Owner direction is a clean engineering rebuild.
> Spec pack now on this repo: `RESTART.md`, `AGENT_LOOP_ROADMAP.md`, `docs/decisions/voyage/`.
> Until a separate IQ-Party design repo is wired, treat those files as the decision source for new work.
> Do not treat Path B / `hf-treasure-trap` presentation as visual truth.

# AGENTS.md — Treasure Trap

Instructions for AI agents (and humans) working in this repository.

## What this is

Treasure Trap is a **cartoon pirate excursion party quiz** for 2–8 players. Friends on separate
devices sail as a fleet, race toward answer islands, bluff, mutiny, fire pirate power-ups and
survive high-stakes special rounds. Casino spectacle is deliberately concentrated in loot-box
and jackpot moments; it is not the global visual skin.

Start at `docs/context/INDEX.md` **and** `obsidian/_MOCs/Home.md`. Docs provide the compact
Cursor router and progress ledgers; the Obsidian vault is the granular idea/design notebook
(one mechanic per note, MOCs, Inbox, status tags). Agents must use **both**. Older root-level
docs and `obsidian/Archive/` may describe the superseded seven-round prototype.

## Repository layout

- `obsidian/` — Obsidian vault: working design notebook + granular source of truth for ideas
  and direction. Open this folder in Obsidian. See `obsidian/README.md`.
- `docs/` / `docs/context/` — Compact agent routing (`INDEX.md`), `HANDOFF.md`, roadmaps.
- `shared/` — TypeScript types, config constants, and **pure** game logic. No IO, no React,
  no sockets. Everything here is unit-testable. This is the source of truth for game rules.
- `server/` — Authoritative Node + Socket.IO server. Owns rooms, phases, timers, scores,
  items, chests, missions. Clients send **intents**; the server mutates state and broadcasts.
- `client/` — Vite + React + Tailwind + Framer Motion. Renders server state, never computes
  scores itself.
- `experiments/loot-drop/` — archived Phaser reference slice, not the root runtime.

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

## Agent skills

Installed from [mattpocock/skills](https://github.com/mattpocock/skills) under `.agents/skills/`
(symlinked into `.cursor/skills/` for Cursor). Treasure Trap–specific skills remain under
`.cursor/skills/` only.

### Issue tracker

GitHub Issues on `sammyswe/Quizgame` via `gh`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default roles: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`.
See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: root `CONTEXT.md` + `docs/adr/`, routed into existing `docs/context/` + Obsidian.
See `docs/agents/domain.md`.

### Useful invocations

- `/ask-matt` — which skill/flow fits
- `/grill-me` or `/grill-with-docs` — align before a change
- `/tdd` — red-green-refactor for shared/server logic
- `/diagnosing-bugs` — hard bugs / perf
- `/to-spec` → `/to-tickets` → `/implement` — plan then ship
- `/handoff` — compact for the next agent session
- `/code-review` — standards + spec check before merge
