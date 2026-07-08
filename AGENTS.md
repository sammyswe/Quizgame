# AGENTS.md — Treasure Trap

Rules for anyone (human or agent) working in this repo.

## What this project is

A multiplayer neon-pirate-casino party game. The current focus is a single
excellent vertical slice: the **Loot Drop** round, built as a real 2D
animated game scene in **Phaser 3**, with React only as the shell
(landing/lobby/game-over/debug) and a socket.io authoritative server.

## Hard rules

1. **The active gameplay scene must never be a static React card UI.**
   Gameplay visuals are Phaser game objects inside `client/src/game/`.
   React overlays are allowed only when they look like game HUD.
2. **Every player action gets immediate visual feedback** (tween, particle,
   sound event) — tap, drag, hover, lock, item use, everything.
3. **Reveals are sequential, animated cinematics**, orchestrated by
   `RevealDirector`. Never swap state instantly.
4. **Do not break multiplayer.** Room create/join, host start, nicknames,
   allocation sync, lock sync and reveal sync must keep working across two
   browsers. The server (`server/src/room.ts`) stays authoritative; clients
   render state, they don't decide outcomes.
5. **Focus stays on Loot Drop.** Do not rebuild the other six rounds or
   polish menus while the core scene can still improve.
6. **Placeholder art must still look intentional.** Procedural fallbacks in
   `generatedTextures.ts` exist for every texture; the game must boot with
   zero binary assets. Reference textures via `spriteKeys.ts` / manifest
   keys, never hardcoded paths.
7. **Use Higgsfield MCP for art when available** (style guide + prompts in
   `docs/HIGGSFIELD_PROMPTS.md`, workflow in `docs/HIGGSFIELD_ASSET_TODO.md`).
   If it is unavailable, document exact prompts for later — never pretend it
   was used.
8. **Preserve type safety.** Strict TypeScript everywhere; the socket
   contract lives in `shared/src/types.ts` and both sides must use it.
9. Respect `animationIntensity` (`reduced | normal | chaos`) in any new
   effect: scale particle counts/shake through `intensityScale()`.

## Where things live

See `docs/PHASER_ARCHITECTURE.md`. Quick map: scenes in `game/scenes/`,
game objects in `game/objects/`, cross-cutting systems (VFX, camera, reveal,
assets, sound) in `game/systems/`, procedural art + manifest in
`game/assets/`, socket client in `net/`, React shell in `ui/`.

## Verification

`npm run typecheck` and `npm run build` must pass. For gameplay changes run
the two-browser smoke tests (`node scripts/smoke-test.mjs`,
`node scripts/smoke-test-interactions.mjs` with `npm run dev` running) and
walk `docs/PLAYTEST_VISUAL_CHECKLIST.md`.

## Agent skills (learnings from the Loot Drop rebuild)

Persistent skills in `.cursor/skills/` — read the relevant one before starting:

| Skill | When to use |
|-------|-------------|
| `treasure-trap-loot-drop` | Any work in this repo's game scene or multiplayer |
| `phaser-vertical-slice` | React shell + Phaser scene + bridge architecture |
| `game-feel-and-juice` | Particles, camera, reveals, physical interactions |
| `higgsfield-2d-game-assets` | MCP art generation + procedural fallback pipeline |

These complement `.cursor/rules/*.mdc` (lint-style constraints) with
workflows and patterns learned from the vertical slice pass.
