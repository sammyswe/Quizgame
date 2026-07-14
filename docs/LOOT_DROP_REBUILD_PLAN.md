# Loot Drop Rebuild Plan

## Step 1 audit — what actually existed

The task described an existing React multiplayer quiz prototype. **The
repository as cloned contained only a README with the text "# Quizgame"** —
no client, no server, no game state types, no styling, no animation
libraries. There was nothing to refactor, so the "rebuild" was executed as a
clean build that lands directly on the target architecture instead of
migrating away from a quiz-card UI.

Consequences of that finding:

- No legacy React quiz components needed replacing; the anti-goals (static
  answer cards, numeric inputs, emoji UI) were treated as constraints on the
  new build.
- The multiplayer stack had to be created (socket.io server with rooms,
  nicknames, host start, authoritative state, reveal sync).
- The audit step's value shifted into defining the target structure, which is
  documented in `docs/PHASER_ARCHITECTURE.md`.

## Target structure (implemented)

```
package.json           npm workspaces root (client + server)
shared/src/types.ts    shared socket contract + game constants
server/src/            socket.io authoritative game server
  index.ts             connection/room routing
  room.ts              GameRoom: phases, allocations, reveal, bots
  questions.ts         question bank
client/src/
  net/connection.ts    socket client, ack-based join/create
  state/useNetState.ts React store hook
  ui/                  Landing, Lobby, GameOver, DebugPanel (React shell)
  game/                Phaser world (see PHASER_ARCHITECTURE.md)
  assets/higgsfield/loot-drop/   generated art + manifest
```

## Game loop delivered in this slice

1. Host creates a room (4-letter code); friends join with nicknames.
2. Host starts the game: 5 Loot Drop questions.
3. Each question: 4 answer islands, 100 loot per player, 45s timer.
4. Players drag/tap coins onto islands, can reset, then slam LOCK IN.
5. Reveal: correct island glows gold, raider ships bombard and plunder wrong
   islands, payout coins fly to scores, leaderboard slides in.
6. Next question, then a final standings screen with "sail again".

Other Treasure Trap rounds are intentionally out of scope for this pass.
