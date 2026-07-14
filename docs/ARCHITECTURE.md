# Architecture

## Overview

```
┌──────────────┐   intents (answer:submit, item:use, ...)   ┌──────────────────┐
│ client (Vite │ ─────────────────────────────────────────▶ │ server (Node +   │
│ React + Zu-  │ ◀───────────────────────────────────────── │ Socket.IO)       │
│ stand + FM)  │   game:state / player:privateState / ...   │ authoritative    │
└──────────────┘                                            └────────┬─────────┘
        ▲                                                            │
        └────────────── shared (@treasure-trap/shared) ◀─────────────┘
                types · config · pure game logic · questions
```

- **Clients send intents, never mutate state.** The server validates, mutates, and
  broadcasts. The client is a renderer + input surface.
- **`shared/` is pure.** All scoring/resolution functions take plain inputs and return
  `{ events, deltas, chests }`. They are unit-tested without React or sockets.
- **The server orchestrates.** `server/src/engine.ts` owns the phase state machine,
  timers, and applies resolutions from shared modules.

## Server

- `state.ts` — `ServerRoom` / `ServerPlayer` shapes (full, private data included).
- `roomManager.ts` — room registry, create/join, TTL cleanup.
- `engine.ts` — phase machine:
  `lobby → round_intro → [auction | final_action]? → question → [pair_choice]? → reveal → … → leaderboard → next round → winner`.
  Each phase sets a timer + continuation (`onPhaseEnd`); host advance / debug skip runs the
  continuation early. All-players-answered ends questions early with a 1.5s grace.
- `sockets.ts` — Socket.IO wiring, input validation, host-only guards, host migration on
  disconnect, debug handlers (disabled when `NODE_ENV=production`).
- `bots.ts` — dev bots: ~60% accuracy, random legal choices, humanised delays.

### State sanitisation

`publicState()` strips `correctIndex`, bids' amounts, missions, and clues.
`privateState(player)` carries items, chests, mission (+def), disabled options, clue,
offered final actions. Sent only to that player's socket.

## Client

- `net/socket.ts` — singleton socket (`VITE_SERVER_URL` or Vite proxy).
- `store/gameStore.ts` — Zustand store fed by socket events; also session persistence for
  refresh-rejoin (`room:rejoin`).
- `App.tsx` — phase → screen router with animated transitions.
- `screens/` — one component per phase; `QuestionScreen` branches per round type
  (loot allocator, choice grid, chase track, false-map banners, accuse/pact panels).
- `components/` — HUD, reveal cards, chest ceremony modal, booty bag drawer, playtest panel.

## Timers

The server is the clock: every phase broadcast includes `timerEndsAt` (epoch ms). Clients
render countdowns from it; the server fires the continuation regardless of client state.

## Reveal queue

Round resolvers emit ordered `RevealEvent[]`. The server applies score changes when the
reveal phase starts, then clients animate the events one-by-one on a shared cadence
(`TIMING.REVEAL_STEP_MS`). The reveal phase length = events × step + buffer.

## Deployment shape

Static client (Vercel/Netlify) + long-lived Node server (Render/Railway/Fly). The client
needs `VITE_SERVER_URL`; the server needs `PORT` and `CORS_ORIGIN`. No database — rooms
are in-memory (acceptable for a prototype; a restart drops live games).
