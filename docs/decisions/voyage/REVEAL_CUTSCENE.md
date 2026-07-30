# Reveal cutscene — LOCKED (2026-07-20)

Status: **LOCKED** from owner follow-up. Scope: regular-quiz `q_reveal` only.

## Approach (chosen for seamlessness)

**Full-scene baked cutscene + live ship overlay + island stage-boxes for pathing.**

Why not pure per-island box videos: generative mattes rarely match baked islands pixel-perfect, which makes “stock overlay” obvious. Full-scene clips start from the same `bg-SXX` plate, so the swap reads as the world animating — not a panel popping on.

Island **boxes** remain first-class:

- Invisible stage rectangles around each baked island.
- Ships **never enter** the box — they sail to the **dock edge** and stop.
- During the cutscene ships stay **visible and frozen** on that edge (no glitch, no land overlap).

## Pack

- **40 unique ~2s animations** = 10 scenes × 4 “this letter is correct”.
- In each clip: winning island plays a **happy biome win**; the other three play **biome-specific sad/empty** beats **baked into the same shot**.
- Everyone watches the **same correct-island cutscene** (synced). A wrong player may still see their ship parked at the wrong island’s edge.

## Timing / flow

1. Ships at dock edges (arrive if needed).
2. **~2s** archipelago cutscene (ships frozen on edges, overlaid).
3. Ships sail back to **middle**.
4. Ships sail **away** (top exit).
5. **Full-screen leaderboard**.
6. Next archipelago.

Chest jackpot UI is **archived** for this path (assets/code kept; not used on quiz reveal).

## Layout

Portrait mobile, **no scroll**: sea band and question sheet are **two completely separate
sections**. All four islands must be **fully on-screen** in the sea band (never cropped by
Q&A). See `LAYOUT_SEA_QA.md`.

Keep island visual size; crop/recompose the baked plate into the sea band with padding under
C/D rather than covering them with UI.

## Sad / empty looks (mix per biome)

| Biome | Disappointing read |
| --- | --- |
| palm | Wilted fronds, grey sand, drooping coconuts, dust motes |
| volcano | Cold ash cone, dead ember glow out, thin grey smoke |
| temple | Cracked stones, braziers out, settling dust |
| lighthouse | Lamp dark / dim, lonely fog |
| skull | Hollow dark sockets, dry dust puff |
| shipwreck | Sagging torn sail, dull barnacles, no treasure glint |
| mangrove | Drooping leaves, muddy still water |
| crystal | Dull grey shards, sparkle killed |
| iceberg | Soft melt drips, grey-blue sad ice |

## Audio

Unique **happy** SFX keyed to the **winning island’s biome** (extend toward per-variant later). Warm, short, ages 9+.

## Fallback

If a clip is missing: procedural win-glow + empty-dim on the live sea for ~2s, then same ship flow. Game never blocks on media.
