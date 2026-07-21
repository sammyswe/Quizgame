# Agent loop roadmap — greenfield rebuild

Status: **LOCKED plan skeleton** (owner restart 2026-07-21)  
Audience: Cursor cloud / loop engineering agent teams  
Companion: `RESTART.md`, `docs/context/INDEX.md`, `obsidian/_MOCs/Home.md`

## How to use this document

Work **one phase at a time**. A phase is done only when its **exit gate** is evidenced.

Each agent session should:

1. State which phase + workstream it owns
2. Load only the docs listed for that phase
3. Implement in the **engineering repo** (not this design repo)
4. Verify with the listed checks
5. Open / update a PR with evidence (screenshots for visual gates)
6. Update `docs/context/HANDOFF.md` **here** only if a decision changed

Do not start Phase N+1 because Phase N “feels mostly done.”

---

## North star (acceptance of the whole rebuild)

Two phones (or 1 phone + bot) complete:

`create/join → lobby → 10 voyage questions → Loot Drop → winner`

Visual bar: Coin Master feel, Brawl Stars silhouettes, Clash Royale travel readability.  
Layout bar: all four islands fully visible; sea and Q&A never overlap.  
Product bar: knowledge usually wins; multiplayer never removed.

---

## Workstreams (can parallelize inside a phase)

| ID | Owner focus | Touches |
| --- | --- | --- |
| W-NET | Rooms, sync, authority, reconnect | server, shared types |
| W-LOOP | Question / reveal / travel / scoreboard timing | shared game + server |
| W-SEA | Voyage scene, ships, lanes, island boxes | client voyage renderer |
| W-ART | Higgsfield (or equiv.) plates, ships, VFX, provenance | assets + manifests |
| W-SFX | Commit / dock / biome win / travel / UI sounds | audio |
| W-LOOT | Loot Drop allocate → lock → staged reveal → wildcards | special round |
| W-QA | Smoke, two-device, visual regression notes | tests + playtest notes |

---

## Phase 0 — Spec freeze & engineering skeleton

**Goal:** A new engineering repo exists; agents can build without reading failed prototypes.

### Do

- [ ] Create engineering repo (TypeScript strict monorepo or agreed stack)
- [ ] Wire `AGENTS.md` to point at **this** design repo as decision source
- [ ] Shared types + config stubs; authoritative server stub; blank mobile client shell
- [ ] CI: typecheck, lint, unit test, build
- [ ] Copy status vocabulary; forbid shipping IDEA without promotion

### Read

`RESTART.md`, `docs/context/STATUS.md`, `docs/context/VISION.md`, `docs/context/ARCHITECTURE.md` (authority principles only)

### Exit gate

- Fresh agent can state product in 12 lines from `INDEX.md` without opening Archive
- Empty client boots on phone-width viewport with sea band + Q&A band placeholders (**no overlap**)
- CI green on empty skeleton

---

## Phase 1 — Multiplayer spine (ugly OK, correct sync)

**Goal:** Create / join / rejoin / host start / nicknames work on two devices.

### Do

- [ ] Room codes (4-char), host migration, bot join for solo testing
- [ ] Intent-only client; server owns phase + scores
- [ ] Soft timers with server deadlines
- [ ] Reconnect restores public + private view correctly

### Read

`docs/context/ARCHITECTURE.md`, Obsidian `MOC - Multiplayer & Social`

### Exit gate

- Two browsers: create + join + start + disconnect/rejoin without desync
- Automated or scripted smoke for room lifecycle

**Visual quality is out of scope** except that layout placeholders remain non-overlapping.

---

## Phase 2 — One beautiful voyage question (the visual contract)

**Goal:** Prove the look. One scene, four islands, ships, commit, reveal, travel, board.

### Do

- [ ] Portrait layout: **separate sea band / Q&A band**; all 4 islands fully on-screen
- [ ] One LOCKED-quality baked sea (Higgsfield or equivalent) + authored lanes + island boxes
- [ ] Ships sail middle → dock **edge** (never onto land); ≥16 facings preferred
- [ ] Commit juice ≤100ms (wake / squash / SFX / haptic)
- [ ] Reveal: ~2s synced full-scene cutscene (win + sad losers baked in); ships frozen on edges;
      **no gold sparkle overlays** hiding the win island
- [ ] Then: ships → middle → sail away → **full-screen leaderboard** → next (stub) scene
- [ ] Unique happy biome SFX for correct island

### Read

`docs/decisions/voyage/VOYAGE_VISUAL_DIRECTION.md`  
`docs/decisions/voyage/REVEAL_CUTSCENE.md`  
`docs/decisions/voyage/COIN_MASTER_POLISH.md`  
`docs/decisions/voyage/STYLE_FORMULA.txt`  
`docs/context/VISUAL_DIRECTION.md`  
`docs/context/ANIMATION_AND_ASSETS.md`

### Exit gate (owner visual review)

Screenshots / short capture must show:

1. Islands A–D **fully** visible above Q&A (no crop through C/D)
2. Ships readable; local player identifiable
3. Reveal reads as the **world animating**, not a UI panel
4. Leaderboard is full-screen between seas

If the owner rejects the look, **stay in Phase 2**. Do not add questions 2–10 yet.

---

## Phase 3 — Ten-question voyage block

**Goal:** Repeat Phase 2 quality across 10 destinations without layout regression.

### Do

- [ ] 10 unique seas (biomes per voyage pack plan); lanes + boxes per scene
- [ ] 40 reveal cutscenes (10×4) or equivalent generative pipeline with fallbacks
- [ ] Rival fog until local player commits; emotion on reveal
- [ ] Score + speed bonus; dwindling chest/timer readable in chrome (not covering islands)
- [ ] Visual regression checklist after each scene add (C/D never clipped)

### Read

`docs/decisions/voyage/VOYAGE_ASSET_PACK_PLAN.md`, `docs/context/MECHANICS.md`

### Exit gate

- Full 10Q block on two devices with no phase desync
- Spot-check scenes 1, 5, 10: all islands fully visible; smooth travel timings

---

## Phase 4 — Loot Drop special (only special until gate passes)

**Goal:** Production-quality first special round.

### Do

- [ ] Wager points earned in the preceding block (not a fake fixed purse long-term)
- [ ] Physical allocation (drag treasure / send crews — **no numeric forms**)
- [ ] Lock-in spectacle; private allocations until reveal
- [ ] Staged venture reveals; Poseidon + Shark wildcards per LOCKED notes
- [ ] Casino intensity only at lock/reveal peaks; scene stays pirate excursion

### Read

`docs/context/SPECIAL_ROUNDS.md`, Obsidian `MOC - Special Rounds`, loot-drop rules

### Exit gate

- Complete create→10Q→Loot Drop→winner on two devices
- Owner playtest: allocation feels physical; reveal is readable; want to replay

---

## Phase 5 — Mutiny, items, ceremony (after voyage + Loot Drop feel right)

**Goal:** Add drama systems without wrecking the visual loop.

### Do

- [ ] Mutiny/marooning after Q5; secrecy + counters
- [ ] First item ceremony; score-gap-aware odds; bounded attacks with counterplay
- [ ] Every attack has a bespoke readable animation (no generic card flash)

### Read

`docs/context/ITEMS.md`, `docs/context/MECHANICS.md`, Obsidian items / mutiny MOCs

### Exit gate

- Knowledge still usually wins in playtests
- No attack deletes a player’s whole game; scores ≥ 0

---

## Phase 6 — Public playtest readiness

**Goal:** Remote friends can play without a developer babysitting.

### Do

- [ ] Deploy preview URL; observability; reconnect under bad wifi
- [ ] Content pack enough for one full match
- [ ] Known issues list; no silent failures

### Read

`docs/context/ROADMAP.md` (historical sequencing — prefer this file’s gates), public-playtest skill if present in engineering repo

### Exit gate

- External playtest session completed; feedback filed into `obsidian/00-Inbox/` then atomic notes

---

## Anti-patterns (agent kill list)

| Anti-pattern | Why it fails |
| --- | --- |
| Polishing lobby before Phase 2 sea looks right | Owner already rejected “menus over core” |
| Full-screen canvas under a translucent Q&A sheet | Crops islands C/D — owner rejected |
| Gold sparkles over reveal cutscene | Hides the animation — owner rejected |
| Starting a second special round early | Violates Loot Drop vertical-slice rule |
| Porting Path B HTML as the new architecture | Restarts the same dead end |
| Shipping IDEA notes | Scope pollution |
| Huge PRs spanning multiple phases | Gates become fake |

---

## Suggested agent team shape (per phase)

| Agent | Responsibility |
| --- | --- |
| **Captain** | Phase ownership, gate checklist, HANDOFF updates |
| **Net** | W-NET |
| **Sea** | W-SEA + layout invariants |
| **Art** | W-ART + provenance |
| **Loop** | W-LOOP timings / scoring purity |
| **Reviewer** | Exit-gate evidence; rejects phase advance without proof |

Run Sea + Art tightly coupled in Phase 2–3. Net can lead Phase 1 alone.

---

## Decision change protocol

If implementation discovers a conflict with LOCKED docs:

1. Stop and record in engineering PR
2. Propose a one-paragraph decision change
3. Only after owner confirmation: update Obsidian note **and** `docs/context/` / `docs/decisions/`
4. Never silently “fix” LOCKED layout or fantasy in code only
