# Roadmap

## v0.1 (this repo) — Playable multiplayer prototype ✅

All 7 rounds, 15 items, chests, missions, mutiny, reveal queue, bots, debug panel,
neon pirate visual pass, tests for core logic.

## v0.2 — Playtest response

- Tune scoring/odds from real playtests (`docs/PLAYTEST_NOTES.md`).
- Loot Drop reef modifiers (Reef Tax / Warning / Bait / Reveal) + Captain's Call twist.
- Captain's Chase shortcut question.
- False Map variants: Double Bluff Map, Decoy Truth, Cursed Translator.
- Remaining missions: Loud Liar, Fake Panic, Save the Sucker, Herd Trap, Double Cross.
- Auction: trap lots, secret-mission lots, occasional double-lot rounds.
- Spectator-safe reconnect (rejoin mid-round into the correct sub-phase view).
- Sound design: reveal stings, chest fanfares, mutiny horn.

## v0.3 — Robustness

- Redis (or similar) room persistence so server restarts don't kill games.
- Server-side rate limiting and payload schema validation (zod).
- More Playwright coverage (full game loop with bots).
- Question bank expansion + category picker; difficulty curves per round.
- Reduced-motion audit; colour-blind-safe island markers.

## v1.0 — Product

- Native iPhone wrapper (the UI is already portrait-first).
- Seasonal question packs, cosmetic ship/avatar unlocks (no pay-to-win).
- Public room browser + friend invites.
- Telemetry on win-rate vs. trivia accuracy to verify the "knowledge wins ~75%" target.
