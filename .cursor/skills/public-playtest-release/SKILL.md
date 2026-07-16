---
name: public-playtest-release
description: Prepare and verify Treasure Trap for remote web playtests with multiplayer, observability and deployment safeguards.
---

# Public playtest release

Read `docs/context/ROADMAP.md` and `ARCHITECTURE.md`.

## Release gate

1. `pnpm typecheck && pnpm lint && pnpm test && pnpm build`.
2. Run root e2e/smoke coverage for create, join, start, regular block, item onboarding,
   secret mutiny, maroon skip, Loot Drop and winner/next block.
3. Manually test two real browser contexts and one mobile viewport.
4. Verify reconnect and host disconnect/migration.
5. Verify debug tools are absent in production.
6. Verify reduced motion and readable answer effects.

## Hosting model

- Client: static Vite build on Vercel/Netlify/equivalent.
- Server: long-lived Node host with WebSocket support (Render/Railway/Fly/equivalent).
- Client uses `VITE_SERVER_URL`.
- Server uses platform `PORT` and strict `CORS_ORIGIN`.
- Validate environment at startup and expose a non-secret health/build endpoint.

Static-only hosting is insufficient for the Socket.IO server.

## Playtest observability

Include a build ID in client/server logs. Capture privacy-safe:

- room lifecycle and phase transitions;
- disconnect/reconnect;
- server errors and invalid intents;
- game completion;
- mechanic counts needed for explicit hypotheses.

Do not log question answers, hidden mutiny decisions or private inventories in production
telemetry unless aggregated after reveal and explicitly justified.

## Handoff

Provide the public client URL, supported browser note, known issues, feedback link and build ID.
Log playtest evidence; do not promote PILOT mechanics from anecdote without owner confirmation.
