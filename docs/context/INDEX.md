# Treasure Trap context index

This is the canonical **compact** router for product context. Read this file before changing
the game, then load only the documents listed for the task.

**Also read the Obsidian vault** at `obsidian/` (start: `obsidian/_MOCs/Home.md`). Docs keep
INDEX/HANDOFF/roadmap checklists for Cursor; Obsidian holds granular one-note-per-mechanic
ideas, MOCs, and meeting Inbox. Agents use both — see `.cursor/rules/obsidian-vault.mdc`.

**Engineering restart (2026-07-21):** implementation lives in a separate greenfield repo.
Follow `../../AGENT_LOOP_ROADMAP.md` and `../../RESTART.md`. Do not treat archived Phaser or
Path B prototypes as visual or architectural truth.

Historical documents may describe an older seven-round prototype or an archived Phaser
experiment; they are not current product truth (`obsidian/Archive/` mirrors that warning).

## Status language

See [STATUS.md](STATUS.md). In short:

- **LOCKED** — confirmed direction; preserve unless the product owner explicitly changes it.
- **PILOT** — implemented or actively being tested; measure before promoting.
- **IDEA** — preserved for later discussion; do not silently ship it.
- **REJECTED** — deliberately ruled out; retain the reason.

## Current product in 12 lines

1. Treasure Trap is a 2–8 player, live multiplayer pirate party quiz (beauty milestone targets 2–4 on phones).
2. The main fantasy is a **cartoon pirate excursion with a moving fleet**, not a casino reskin.
3. Casino energy is concentrated in rewards: loot boxes, rarity reveals, jackpots and selected high-stakes special-event moments.
4. A full game contains blocks of 10 quiz questions; a special round follows each block.
5. Match length is selected before play and determines the number of blocks/special rounds.
6. The first special round is Million Pound Drop / Loot Drop; polish it before adding another.
7. Regular questions use four answer islands and a visibly dwindling reward.
8. Mutiny and marooning create secret decisions, bluffing and table discussion.
9. Items are Mario Kart-style comeback and drama tools; knowledge should still usually win.
10. The server is authoritative. Clients send intents and never decide outcomes.
11. Every meaningful event needs readable motion, sound and an authored visual payoff.
12. **Primary goal now is a greenfield rebuild** that matches LOCKED voyage visuals; see `docs/decisions/voyage/` and `AGENT_LOOP_ROADMAP.md`.

## Task router

| Task | Read first | Notes |
| --- | --- | --- |
| Starting any agent | [HANDOFF.md](HANDOFF.md), `../../RESTART.md`, `../../AGENT_LOOP_ROADMAP.md` | Design bank only |
| Product or mechanic work | [VISION.md](VISION.md), [MECHANICS.md](MECHANICS.md) | Status ≠ code |
| Special rounds | [SPECIAL_ROUNDS.md](SPECIAL_ROUNDS.md) | Loot Drop first |
| Items or loot boxes | [ITEMS.md](ITEMS.md), [ANIMATION_AND_ASSETS.md](ANIMATION_AND_ASSETS.md) | |
| Voyage visual / reveal / layout | `../decisions/voyage/VOYAGE_VISUAL_DIRECTION.md`, `REVEAL_CUTSCENE.md`, [VISUAL_DIRECTION.md](VISUAL_DIRECTION.md) | Owner LOCKED 2026-07-20+ |
| UI, animation, sound or art | [UI_IMPLEMENTATION_SPEC.md](UI_IMPLEMENTATION_SPEC.md), [ANIMATION_AND_ASSETS.md](ANIMATION_AND_ASSETS.md), [POLISH_PRODUCTION_PLAN.md](POLISH_PRODUCTION_PLAN.md) | |
| Multiplayer or protocol | [ARCHITECTURE.md](ARCHITECTURE.md) | Authority principles |
| Planning | `../../AGENT_LOOP_ROADMAP.md`, [ROADMAP.md](ROADMAP.md) | Prefer agent-loop gates |
| Brainstorming | [IDEA_BANK.md](IDEA_BANK.md), `obsidian/00-Inbox/` | Do not ship IDEA |

## Canonical registry

| ID | Status | Scope | Document |
| --- | --- | --- | --- |
| CTX-001 | LOCKED | Status vocabulary and promotion rules | [STATUS.md](STATUS.md) |
| PROD-001 | LOCKED | Audience, pillars and product boundaries | [VISION.md](VISION.md) |
| MECH-001 | LOCKED/PILOT | Confirmed loop and exact mechanic state | [MECHANICS.md](MECHANICS.md) |
| MECH-002 | LOCKED/IDEA | Item catalogue and item principles | [ITEMS.md](ITEMS.md) |
| MECH-003 | LOCKED/IDEA | Special-round framework and Loot Drop | [SPECIAL_ROUNDS.md](SPECIAL_ROUNDS.md) |
| VIS-001 | LOCKED | Excursion-first art direction and casino boundary | [VISUAL_DIRECTION.md](VISUAL_DIRECTION.md) |
| VIS-002 | LOCKED/PILOT | Animation, sound and art production contract | [ANIMATION_AND_ASSETS.md](ANIMATION_AND_ASSETS.md) |
| VIS-003 | LOCKED | Screen-by-screen UI and animation decisions | [UI_IMPLEMENTATION_SPEC.md](UI_IMPLEMENTATION_SPEC.md) |
| VIS-006 | LOCKED | Voyage visual direction (Coin Master stack) | `../decisions/voyage/VOYAGE_VISUAL_DIRECTION.md` |
| VIS-007 | LOCKED | Reveal cutscene + island boxes + layout | `../decisions/voyage/REVEAL_CUTSCENE.md` |
| ARCH-001 | LOCKED | Authority boundaries (re-implement in greenfield) | [ARCHITECTURE.md](ARCHITECTURE.md) |
| PLAN-001 | SUPERSEDED | Older playtest roadmap — prefer agent-loop doc | [ROADMAP.md](ROADMAP.md) |
| PLAN-002 | LOCKED | Greenfield agent loop phases + gates | `../../AGENT_LOOP_ROADMAP.md` |
| IDEA-001 | IDEA | Unconfirmed mechanics | [IDEA_BANK.md](IDEA_BANK.md) |
| HAND-001 | LOCKED | Restart handoff | [HANDOFF.md](HANDOFF.md) |

## Context maintenance contract

When a decision changes:

1. Update the relevant canonical context document and its `updated` date.
2. Mark the old decision as superseded or rejected with a reason; do not erase history.
3. Update `.cursor/rules/` if the decision is a non-negotiable.
4. Update atomic Obsidian notes when both apply.
5. Keep this index compact.
