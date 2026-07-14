---
id: PLAN-001
title: Roadmap to public web playtests
status: PILOT
scope: active prototype
updated: 2026-07-14
---

# Roadmap to public web playtests

The sequence protects a complete multiplayer loop and builds one polished special round before
expanding content. A phase exits on evidence, not on the number of features started.

## Phase 0 — one source of truth

- [x] Establish the context index and LOCKED/PILOT/IDEA vocabulary.
- [x] Record the excursion-first/casino-reward visual decision.
- [x] Record confirmed mechanics and implementation mismatches.
- [ ] Relabel or archive remaining seven-round/Phaser-era docs.
- [ ] Remove stale always-on rules that point agents at nonexistent active paths.

**Exit:** a new agent can identify the live architecture and active mechanic loop without
reading historical docs.

## Phase 1 — correct 10-question vertical slice

- [ ] Track 10 regular questions separately from the following special round.
- [ ] Make 10/30/etc. lengths count regular questions, not specials.
- [ ] Disable mutiny/marooning in questions 1–5.
- [ ] Give the first item in a staged ceremony after question 5.
- [ ] Implement exact secret mutiny outcomes and answer forfeiture.
- [ ] Ensure marooning skips the next regular question.
- [ ] Add server-level tests for phase, secrecy, reconnect and score invariants.

**Exit:** two devices repeatedly complete one block plus Loot Drop with no state divergence.

## Phase 2 — pirate fleet question experience

- [ ] Replace generic answer presentation with moving fleet + four world islands.
- [ ] Make reward decay visible and urgent.
- [ ] Add correct/wrong/commit/captain motion and sound.
- [ ] Integrate distinct maroon cinematics.
- [ ] Support portrait, reduced motion, keyboard/touch and readable distortions.
- [ ] Add screenshot/performance checks for 2, 4 and 8 players.

**Exit:** first-time players understand the round from staging and the game does not resemble a
generic quiz site.

## Phase 3 — Loot Drop production slice

- [ ] Wager points earned in the previous 10-question block.
- [ ] Turn allocation into sending pirate forces/treasure on ventures.
- [ ] Add reconnect-safe private allocation and lock states.
- [ ] Implement Poseidon's Rescue in Loot Drop.
- [ ] Implement Shark Attack and redesign its unique item.
- [ ] Produce the cancellable reveal sequence and sound mix.
- [ ] Complete the Loot Drop polish gate in `SPECIAL_ROUNDS.md`.

**Exit:** at least three observed groups complete the event and ask to replay; all confusion and
fun moments are logged.

## Phase 4 — items and loot-box ceremony

- [ ] Finalise timing classes and inventory limits.
- [ ] Add Barnacle variants and align Telescope.
- [ ] Add counterplay/limit metadata and score-gap-aware item odds.
- [ ] Complete the slot-machine chest ceremony.
- [ ] Integrate one bespoke fleet animation per confirmed item.
- [ ] Test item value by leader/middle/last and prevent hoarding/sandbagging.

**Exit:** every item is legible to user, victim and bystanders; no item can erase a player's
game or leak secret state.

## Phase 5 — deployable remote alpha

- [ ] Full root quality gate: typecheck, lint, unit tests and production build.
- [ ] Automated create/join/start/block/event/reconnect smoke test.
- [ ] Configure production client URL and long-lived Socket.IO server.
- [ ] Set strict `CORS_ORIGIN`, health endpoint and environment validation.
- [ ] Deploy server to a WebSocket-capable host (Render/Railway/Fly or equivalent).
- [ ] Deploy static client to Vercel/Netlify or equivalent with `VITE_SERVER_URL`.
- [ ] Add error monitoring, structured server logs and privacy-safe playtest telemetry.
- [ ] Add a visible feedback link and playtest build/version.
- [ ] Verify mobile networks, two browsers, reconnect and host disconnect on the public URL.

**Exit:** invited players need only a URL and room code, and failures can be diagnosed from a
build ID plus logs.

## Phase 6 — measured playtesting

For every session record:

- player count, game length and build;
- completion/reconnect failures;
- trivia accuracy vs final rank;
- mutiny declarations and whether they caused discussion;
- item use/hold/discard by position;
- Loot Drop allocation patterns and wildcard reactions;
- confusion, delight, frustration and requests to replay.

Promotion targets:

- complete-game rate is high enough for unattended friend tests;
- knowledge remains the strongest predictor of winner;
- mutiny creates talk without dominating every question;
- players can explain item effects after seeing them once;
- chest opening remains exciting after repeats;
- no high-severity secret-state or score-authority bug.

## Phase 7 — content expansion

Only after the first slice is stable:

1. promote one special-round IDEA to PILOT;
2. define its unique knowledge/discussion choice, 3–5 wildcards and item;
3. build and playtest it to the same quality gate;
4. repeat toward 12 specials and 3 finals.

Do not parallel-build a catalogue of shallow rounds.
