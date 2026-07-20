# Treasure Trap context index

This is the canonical **compact** router for product context. Read this file before changing
the game, then load only the documents listed for the task.

**Also read the Obsidian vault** at `obsidian/` (start: `obsidian/_MOCs/Home.md`). Docs keep
INDEX/HANDOFF/roadmap checklists for Cursor; Obsidian holds granular one-note-per-mechanic
ideas, MOCs, and meeting Inbox. Agents use both — see `.cursor/rules/obsidian-vault.mdc`.

Historical documents may describe an older seven-round prototype or an archived Phaser
experiment; they are not current product truth (`obsidian/Archive/` mirrors that warning).

## Status language

See [STATUS.md](STATUS.md). In short:

- **LOCKED** — confirmed direction; preserve unless the product owner explicitly changes it.
- **PILOT** — implemented or actively being tested; measure before promoting.
- **IDEA** — preserved for later discussion; do not silently ship it.
- **REJECTED** — deliberately ruled out; retain the reason.

## Current product in 12 lines

1. Treasure Trap is a 2–8 player, live multiplayer pirate party quiz (**Path B beauty
   milestone targets 2–4 on phones**).
2. The main fantasy is a **cartoon pirate excursion with a moving fleet**, not a casino reskin.
3. Casino energy is concentrated in rewards: loot boxes, rarity reveals, jackpots and selected
   high-stakes special-event moments.
4. A full game contains blocks of 10 quiz questions; a special round follows each block.
5. Match length is selected before play and determines the number of blocks/special rounds.
6. The first special round is Million Pound Drop / Loot Drop; polish it before adding another.
7. Regular questions use four answer islands and a visibly dwindling reward.
8. Mutiny and marooning create secret decisions, bluffing and table discussion.
9. Items are Mario Kart-style comeback and drama tools; knowledge should still usually win.
10. The server is authoritative. Clients send intents and never decide outcomes.
11. Every meaningful event needs readable motion, sound and an authored visual payoff.
12. **Primary build target is the Higgsfield Game Generator** (`hf-treasure-trap/`). Phaser
    root app is legacy reference, not the forward architecture. Higgsfield is the preferred
    art/animation pipeline with documented provenance and runtime fallback.

## Task router

| Task | Read first | Code truth |
| --- | --- | --- |
| Product or mechanic work | [VISION.md](VISION.md), [MECHANICS.md](MECHANICS.md) | `shared/src/config/*`, `shared/src/game/*` |
| Special rounds | [SPECIAL_ROUNDS.md](SPECIAL_ROUNDS.md) | `shared/src/config/arcade.ts`, `server/src/engine.ts` |
| Items or loot boxes | [ITEMS.md](ITEMS.md), [ANIMATION_AND_ASSETS.md](ANIMATION_AND_ASSETS.md) | `shared/src/config/powerups.ts` |
| UI, animation, sound or art | [UI_IMPLEMENTATION_SPEC.md](UI_IMPLEMENTATION_SPEC.md), [VISUAL_DIRECTION.md](VISUAL_DIRECTION.md), [ANIMATION_AND_ASSETS.md](ANIMATION_AND_ASSETS.md), [POLISH_PRODUCTION_PLAN.md](POLISH_PRODUCTION_PLAN.md), `hf-treasure-trap/design/ART_BIBLE.md` | `hf-treasure-trap/` (Path B), legacy `client/src/` |
| Visual quality / stack / Higgsfield handoff | [POLISH_PRODUCTION_PLAN.md](POLISH_PRODUCTION_PLAN.md) | `design/assets.csv`, `design/concept/` |
| Multiplayer or protocol | [ARCHITECTURE.md](ARCHITECTURE.md) | `server/src/engine.ts`, `shared/src/types/index.ts` |
| Planning or deployment | [ROADMAP.md](ROADMAP.md) | CI and hosting configuration |
| Brainstorming | [IDEA_BANK.md](IDEA_BANK.md), `obsidian/00-Inbox/`, area MOCs | none until promoted |
| Starting a new agent | this file, [HANDOFF.md](HANDOFF.md), `obsidian/_MOCs/Home.md` | current branch and tests |

## Canonical registry

| ID | Status | Scope | Document |
| --- | --- | --- | --- |
| CTX-001 | LOCKED | Status vocabulary and promotion rules | [STATUS.md](STATUS.md) |
| PROD-001 | LOCKED | Audience, pillars and product boundaries | [VISION.md](VISION.md) |
| MECH-001 | LOCKED/PILOT | Confirmed loop and exact mechanic state | [MECHANICS.md](MECHANICS.md) |
| MECH-002 | LOCKED/IDEA | Item catalogue, timing questions and item principles | [ITEMS.md](ITEMS.md) |
| MECH-003 | LOCKED/IDEA | Special-round framework and Loot Drop | [SPECIAL_ROUNDS.md](SPECIAL_ROUNDS.md) |
| VIS-001 | LOCKED | Excursion-first art direction and casino boundary | [VISUAL_DIRECTION.md](VISUAL_DIRECTION.md) |
| VIS-002 | LOCKED/PILOT | Animation, sound and Higgsfield production contract | [ANIMATION_AND_ASSETS.md](ANIMATION_AND_ASSETS.md) |
| VIS-003 | LOCKED | Screen-by-screen UI and animation decisions | [UI_IMPLEMENTATION_SPEC.md](UI_IMPLEMENTATION_SPEC.md) |
| VIS-004 | PILOT | Owner questions for the next visual iteration | [UI_REVIEW_QUESTIONS.md](UI_REVIEW_QUESTIONS.md) |
| VIS-005 | PILOT | Pro polish diagnosis, stack verdict, concept-art pipeline | [POLISH_PRODUCTION_PLAN.md](POLISH_PRODUCTION_PLAN.md) |
| ARCH-001 | LOCKED | Active runtime and authority boundaries | [ARCHITECTURE.md](ARCHITECTURE.md) |
| PLAN-001 | PILOT/IDEA | Playtest-to-public-web roadmap | [ROADMAP.md](ROADMAP.md) |
| IDEA-001 | IDEA | Unconfirmed mechanics preserved without polluting scope | [IDEA_BANK.md](IDEA_BANK.md) |
| HAND-001 | PILOT | Current state and immediate next work | [HANDOFF.md](HANDOFF.md) |

## Known historical material

- `experiments/loot-drop/` is an archived Phaser vertical slice. It is reference material,
  not the app launched by root `pnpm dev`.
- The root app uses React for lobby/shell HUD and Phaser 3 for in-round gameplay, with
  Socket.IO networking. Framer Motion may appear in shell transitions only.
- Older `docs/PRD.md`, `docs/GAME_DESIGN.md`, `docs/ARCHITECTURE.md` and related reviews contain
  useful history but may describe the superseded seven-round prototype. The context files
  above take precedence.
- Numeric values in prose are design intent. When prose and shipped numbers disagree, record
  the mismatch in `MECHANICS.md`; do not quietly rewrite either side.

## Context maintenance contract

When a decision changes:

1. Update the relevant canonical context document and its `updated` date.
2. Mark the old decision as superseded or rejected with a reason; do not erase history.
3. Update `.cursor/rules/` if the decision is a non-negotiable.
4. Update the relevant `.cursor/skills/` procedure.
5. Update code and tests when the decision affects shipped behaviour.
6. Add the evidence or unresolved question to `HANDOFF.md`.

Keep this index compact. Put detail in the routed document, not here.
