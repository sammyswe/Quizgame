# Implementation Plan (v0.1)

Loop-engineering plan used to build the prototype. Status reflects the shipped v0.1.

## Milestones

1. **Repo setup** ✅ — pnpm workspace (client/server/shared), strict TS, ESLint flat
   config, Prettier, Tailwind, Vitest, scripts (`dev`, `dev:client`, `dev:server`,
   `build`, `test`, `lint`, `typecheck`).
2. **Shared types/config** ✅ — `shared/src/types/index.ts` (Player, Room, GameState,
   Question, Item, Chest, Mission, RevealEvent, Auction, Pact, Accusation…);
   config constants for scoring, timing, chest odds, items, missions, final actions.
3. **Server rooms/realtime** ✅ — Socket.IO, room codes, join/rejoin, host migration,
   authoritative phase machine with server-side timers.
4. **Client shell/navigation** ✅ — Vite + React + Zustand store fed by socket events,
   phase-driven screen router, neon theme.
5. **Lobby/create/join** ✅ — landing, create/join with deep-link `?room=CODE`, lobby
   with crew grid, voyage length + round picker, host start.
6. **Game engine (vertical slice)** ✅ — Loot Drop question → allocation → reveal →
   leaderboard, playable with 2 browsers before other rounds were added.
7. **Question bank** ✅ — 60 MCQs (15 general/15 geo/10 sci/10 sport/10 culture) +
   6 multi-correct Obscure questions with Fool's Gold.
8. **Rounds** ✅ — all 7 in playable form (simplifications documented in GAME_DESIGN.md).
9. **Items/chests** ✅ — 15 items with effects + counterplay, 10 chest sources,
   position-based odds, booty bag UI, chest ceremony.
10. **Reveal queue** ✅ — ordered RevealEvents, animated one-by-one, host skip.
11. **Visual polish** ✅ — neon glows, animated counters, chest shake/wheel/pop, chase
    track, confetti, pirate copy.
12. **Tests** ✅ — 75 Vitest tests over scoring/chests/rounds/items/missions/mutiny/final;
    Playwright smoke test (create → join → start).
13. **Final review** ✅ — docs/SELF_REVIEW.md, typecheck/lint/test/build green.

## Build order rationale

Vertical slice first (6) so multiplayer plumbing was proven before breadth; rounds were
then added one resolver at a time, each with tests before UI. Items landed as a single
pure resolver (`resolveQuestion`) so counterplay interactions (curse reversal, shields,
strongbox) live in one auditable place.
