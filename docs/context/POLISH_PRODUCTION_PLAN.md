---
id: VIS-005
title: Professional polish production plan
status: PILOT
scope: global visual / animation pipeline
updated: 2026-07-14
---

# Professional polish production plan

This document answers: why the game looks unfinished today, whether Phaser is wrong,
what pro games actually do, which MCP tools matter, and the exact owner→agent art pipeline.

## Honest diagnosis

The stack and multiplayer loop are further along than the **pixels**. What players see now is
mostly:

1. **Procedural / drawn fallbacks** in `ArcadeGameplayScene` (shapes, letter badges, tweened
   primitives).
2. **Legacy neon-casino Higgsfield leftovers**, not the locked pirate-excursion STYLE-001.
3. **Tween juice on placeholder silhouettes** — shake, squash and particles cannot hide a weak
   hero sprite.

Clash Royale–level polish is not “more CSS animations.” It is a **consistent art bible +
pre-authored motion assets + layered juice + sound**, all wired into a capable 2D renderer.

| Layer | Clash-class games | Treasure Trap today |
| --- | --- | --- |
| Silhouette / palette | Fixed art direction, readable at phone size | Mixed fallback + old style |
| Hero assets | 3D→2D renders or hand-crafted sheets | Mostly code-drawn |
| Character / ship motion | Frame sheets and/or Spine bones | Position/scale tweens |
| VFX | Authored puff / sparkle / trail sheets | Simple emitters |
| Sound | Layered SFX + stingers synced to impact | Sparse / incomplete |
| Composition | Full-bleed world, clear focal hierarchy | Structure exists; art thin |

**Changing engine without changing this table will not fix perceived quality.**

## Tech stack verdict (do not rip and replace)

### Keep (for this product)

**React shell + Phaser 3 + Socket.IO server + shared TypeScript rules.**

Reasons (industry consensus for browser-first 2D, 2025–2026):

- Phaser is a full 2D game framework (scenes, tweens, camera, particles, audio, WebGL).
- Unity WebGL is heavier, slower to load, weaker on mobile browsers — only wins if we need
  full 3D mid-round.
- PixiJS alone would force re-building scene/input/tween systems we already have.
- Treasure Trap is a **2D cartoon party quiz**, not a 3D battle sim. Phaser matches the
  delivery target (browser, two laptops, party room).

### Add later when art exists (still on Phaser)

| Upgrade | When | Why |
| --- | --- | --- |
| **Sprite sheets** (8–12 frames) for ships, islands, chest, FX | Immediately after hero art lands | Biggest perceptual jump |
| **`@esotericsoftware/spine-phaser`** for captains / key characters | After Spine rig budget approved | Smooth loopable emotional poses without huge PNG banks |
| Authored particle textures + tiered shake/hitstop profile | With first hero set | Industry “juice” without new engine |
| Web Audio banks from `design/assets.csv` | Parallel to first art drop | Polish without pictures is incomplete |

### Only reconsider the engine if…

- The owner wants **real-time 3D ships** as the primary fantasy, or
- Native iOS/Android stores become primary (then Unity/Godot become packaging options),

…and even then: **re-skin Phaser with pro art first**. That validates look & feel cheaper.

## How Clash-class polish is made (research notes)

Supercell-style mobile polish (Clash Royale / CoC adjacent) typically:

1. **Locks a silhouette language** early (chunky, saturated, readable).
2. Builds **high-fidelity character/prop looks** (often 3D modeled + textured), then
   **pre-renders to 2D sprites / sheets** for runtime performance.
3. Animates key loops at ~24–30 fps on character sheets while the game renders at 60.
4. Layers **camera trauma, impact particles, squash/stretch, anticipation, and synced SFX**.
5. Treats marketing/cinematic 3D and in-game sprites as the **same design DNA**, different LOD.

For Treasure Trap without a 3D art team, the practical analogue is:

**Higgsfield concept → owner approve → clean cutout → game-ready sheet / keyposes → Phaser
composition → juice + SFX.**

Higgsfield video / motion_control are for **reference motion and marketing**, not for driving
live multiplayer state (players must stay data-driven sprites).

## Available MCP / tools (this environment)

### Higgsfield (primary art pipeline)

Server status: listed **ready**, but cloud-agent `balance` / generate may still fail auth.
Owner-driven generation in Apps UI is the reliable path until remote token is confirmed.

| Tool | Use for polish |
| --- | --- |
| `generate_image` | Hero stills, sheets, icons, backgrounds |
| `upscale_image` | 2K/4K game plates |
| `remove_background` | Transparent cutouts |
| `outpaint_image` | Extend 16:9 seas / decks |
| `generate_video` | Motion reference for one-shots (Poseidon, shark, maroon) |
| `motion_control` | Puppeteer a locked character into walk/cheer/crash refs |
| `generate_audio` | SFX / music beds (then trim into game banks) |
| `show_reference_elements` / `show_characters` | Lock recurring ships/islands/pirates |
| `presets_show` | Consistent i2v style for ceremony clips |
| `get_game_creation_instructions` | Only if building a separate HF marketplace mini-game — **not** a reason to abandon our repo |

### Local repo tools

- `python3 scripts/chroma_key.py` — cutouts when HF remove_background is unavailable
- `design/assets.csv` — locked generation queue
- `client/src/game/assets/assetManifest.ts` — runtime registration
- Cursor skills: `higgsfield-2d-game-assets`, `game-feel-and-juice`, `treasure-trap-loot-drop`

### Not needed for polish

- Replacing Phaser with Unity “for better animations”
- Pixel-streaming Unreal
- Random new MCP renderers without an asset bible

## Owner concept-art workflow (recommended)

You producing concept art one screen at a time is the **correct** next move. Agents cannot
invent Clash-level taste without an approved hero set.

### Phase 0 — style lock (do this once)

Produce **three** approved plates before bulk generation:

1. `STYLE_LOCK_SEA` — full 16:9 voyage background (no UI, no ships).
2. `STYLE_LOCK_SHIP` — one player ship + captain on deck, cutout-ready.
3. `STYLE_LOCK_ISLAND` — one answer island with plaque-safe answer zone.

Drop files into a folder the agent can read (repo path preferred), e.g.
`design/concept/approved/`, with filenames matching ids above.

Agent then: chroma-key / remove_bg → wire into Phaser → remove procedural fallbacks for those
roles → screenshot for critique.

### Phase 1 — hero set (highest ROI order)

Generate or hand them to the agent in this order:

1. `bg_seven_seas`
2. `sheet_player_ships` (or individual ships A–H)
3. `sheet_answer_islands`
4. `sheet_pirate_avatars`
5. `sheet_item_icons`
6. `bg_lobby_deck`
7. `bg_loot_map`
8. `sheet_chest_ceremony` + casino Zone B accents
9. Event keys: Poseidon, shark, maroon
10. Audio rows in `design/assets.csv`

Every deliverable should include:

- solid flat background OR already cut out
- **no text in art**
- STYLE-001 language (warm excursion; casino only for chest)
- note: “approved for game” vs “reference only”

### Phase 2 — motion

For each hero:

| Asset | Runtime format | Higgsfield help |
| --- | --- | --- |
| Ship idle / sail / cheer / crash | 6–12 frame sheet or Spine | stills + video ref; agent slices / wires |
| Island select pulse | 2–4 frames + particle overlay | stills enough |
| Chest ceremony | staged stills + tween timeline | video for timing reference |
| Poseidon / shark / maroon | keyframe chain or short sprite burst | `generate_video` / `motion_control` as animatic |

Do **not** stream HF video as the live game. Extract frames or re-pose in Spine.

### Phase 3 — juice pass (code, after pixels exist)

Apply the industry juice checklist to existing Phaser timelines:

1. Anticipation → action → impact → recovery on answer lock, reveal, item hit, mutiny.
2. Tiered camera shake (light / medium / heavy), 80–150ms light hits.
3. Squash/stretch on ship commit and treasure return.
4. Directional particles from impact point.
5. Hit-stop only on rare high beats (correct island burst, chest open).
6. SFX on the same frame as impact.
7. Reduced-motion path preserved.

## What “done” looks like for polish

A screen passes polish when:

- [ ] No procedural placeholder visible for hero roles on that screen
- [ ] Shared STYLE-001 palette and outline weight across all elements
- [ ] Ambient motion never fully idle (waves / flags / bob)
- [ ] Player action gets feedback within one frame + unique impact beat
- [ ] Answer text readable instantly on every island
- [ ] Casino look appears **only** on chest/reward beats
- [ ] Owner can watch without recognizing “programmer art”

## Decision record

| Question | Answer | Status |
| --- | --- | --- |
| Is Phaser the blocker? | **No.** Asset fidelity and motion assets are. | LOCKED (this doc) |
| Should we move to Unity now? | **No**, unless 3D or native stores become mandatory. | LOCKED |
| Should owner hand-feed concept art? | **Yes** — best path to professional look. | LOCKED |
| Spine? | Optional mid-term after sheets land. | IDEA → promote when needed |
| Higgsfield remote MCP in this cloud? | Unreliable until `balance` succeeds; owner Apps UI OK. | PILOT |

## Immediate next action for the product owner

1. Approve / create the three Phase-0 style locks.
2. Put them in `design/concept/approved/` (or attach and tell the agent the path).
3. Agent integrates them into Phaser and posts side-by-side screenshots.
4. Iterate one surface at a time using `UI_REVIEW_QUESTIONS.md`.

Do not ask for a full game restyle in one pass. Clash teams ship by **card / unit**; we ship by
**screen / sheet**.
