# AGENTS.md — IQ Party Design Spec

Instructions for AI agents working from this **design-only** repository.

## What this repo is

Canonical decisions for Treasure Trap. **No game binary lives here.**

Agents use this repo to:

1. Load LOCKED / PILOT / IDEA / REJECTED product and visual truth
2. Follow the phased rebuild in `AGENT_LOOP_ROADMAP.md`
3. Implement in a **separate engineering repository** (greenfield)

## Load order (every session)

1. This file
2. `RESTART.md` (what not to copy from failed prototypes)
3. `docs/context/INDEX.md` → `docs/context/HANDOFF.md`
4. Relevant Obsidian area MOC under `obsidian/_MOCs/`
5. Matching `docs/context/*.md` and `docs/decisions/voyage/*` when visual/voyage work
6. Verify claims against the engineering repo’s code — never against obsolete prototypes alone

## Non-negotiables

1. **Never remove multiplayer** or make the game local-only without explicit owner instruction.
2. **Knowledge should usually win** (~75% hypothesis). Items are bounded comeback tools.
3. **Every attack must have counterplay.** Document the counter.
4. **Scores never go below 0.**
5. **No silent score changes.** Meaningful changes produce staged reveal events.
6. **Secret info stays secret** (mutiny, allocations, inventories). Never expose `correctIndex`
   in public state during a question.
7. **Named constants only** for scoring, odds, timing, rarity.
8. **Status is explicit.** Shipped code ≠ confirmed design.
9. **Animation communicates rules.** Immediate feedback, readable staged results, sound,
   documented art + fallbacks.
10. **Do not ship IDEA notes** unless the owner promotes them.
11. **Do not revive REJECTED** casually; keep the rejection reason.
12. **Sea and Q&A are separate viewports** on mobile — all four answer islands must be fully
    visible above the question sheet at all times (owner LOCKED 2026-07-20 / reinforced 2026-07-21).

## Dual sources

| Path | Role |
| --- | --- |
| `obsidian/` | Granular notebook |
| `docs/context/` | Compact router / ledgers |
| `docs/decisions/voyage/` | Voyage visual LOCKED pack |

## Conflict resolution

1. Latest explicit product-owner decision
2. LOCKED record in `obsidian/` or `docs/`
3. Active `.cursor/rules/`
4. Engineering-repo code (implementation truth, not design truth)
5. `obsidian/Archive/` and historical docs

## Loop engineering protocol

Treat each roadmap phase as a closed loop:

1. **Brief** — read only the docs listed for that phase
2. **Plan** — acceptance criteria from the phase exit gate
3. **Implement** — in the engineering repo only
4. **Verify** — typecheck/lint/test/build + two-device (or bot) play of the phase loop
5. **Evidence** — screenshots / short notes in engineering PR; update `docs/context/HANDOFF.md` here if decisions change
6. **Stop** — do not start the next phase until the exit gate passes

Prefer small PRs that complete one gate. Do not “polish everything.”

## Visual references (voyage)

Ranked: **Coin Master** (feel) → **Brawl Stars** (silhouette) → **Clash Royale** (travel).
See `docs/decisions/voyage/VOYAGE_VISUAL_DIRECTION.md`.

## What not to do

- Do not treat Phaser root app or `hf-treasure-trap` Path B as architecture to preserve.
- Do not copy muddy AI composites, overlapping Q&A/sea layouts, or chest-on-reveal as default.
- Do not expand special rounds beyond Loot Drop until its polish gate passes.
- Do not weaken TypeScript strictness in the engineering repo.
