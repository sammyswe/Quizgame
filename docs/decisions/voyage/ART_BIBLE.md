# Treasure Trap: Voyage — Art Bible (Path B)

Status: **LOCKED by owner brief 2026-07-20** · Beauty milestone target **8/10** (from ~4/10)

## Product sentence

A mobile-first multiplayer cartoon pirate party quiz: friends race a fleet across a storybook archipelago, answer on islands, then gamble block loot in Loot Drop. Comedy-led adventure with occasional epic peaks. Brawl Stars readability + Jackbox party clarity + Coin Master reward spectacle (rewards only).

## Platform & stack

| Decision | Choice |
|---|---|
| Path | **B — Higgsfield Game Generator only** |
| Runtime | 2D canvas + `logic.js` multiplayer kernel |
| Art pipeline | 3D-look concepts → **pre-rendered 2D sprites** via Higgsfield |
| Primary device | **Phone** (handheld distance) |
| Phaser / Path A | **Not the project direction** (legacy root app may remain in repo but is not the target) |

## STYLE FORMULA (byte-identical in every prompt)

See `design/STYLE_FORMULA.txt` — do not paraphrase.

## Camera & world

- Fixed **three-quarter diorama** with layered parallax (sky / far isles / sea / ships / UI).
- Medium-to-large **hero ships** on a compressed archipelago map.
- Occasional cinematic **push-ins** for reveals / Poseidon / lock.
- Golden hour default; special weather only for threats/wrong beats.
- One coherent archipelago; **four distinct island biomes** for answers A–D.

## Colour & identity

- Player colour primarily on **sails and flags** (hull stays warm timber).
- Captain **portraits in HUD** + subtle deck presence.
- Neon / cyan-magenta **only** at reward / lock-reveal climax (Zone B).
- Cartoon skulls only; no photorealism; no casino lobby UI chrome.

## Typography

- UI body: **Nunito** (700/900).
- Display / headings: expressive rounded display (Lilita One or close embed).
- Concise copy; icons first.

## HUD

- Nautical **chart** metaphor, brass accents.
- More world, less chrome.
- **Fleet ribbon** (not minimap).
- Compact persistent scores; nicknames near ships.
- Question on **sail / sky banner**.
- Nautical countdown; chest visibly empties over the question timer.

## Motion grammar

| Beat | Feel |
|---|---|
| Ambient | waves, flags, sails, wakes, birds — always on |
| Choose | preview path glow |
| Commit | weighty sail + subtle squash |
| Correct | fleet cheer + coins/fireworks |
| Wrong | comic impact (not endless sinking) |
| Rivalry | fog-hide opponents until reveal; wake rivalry |
| Lock | wheel-turn gesture |
| Reward peak | brief casino light + Coin Master payout energy |

## Loot Drop (LOCKED rules)

- Wager **points earned in the preceding questions** (slice: 3Q block).
- Allocate **crew/ship tokens** to four ventures; coin values support markers.
- Exact allocation **private** until reveal; show only private remaining fleet.
- **Wrong ventures lose**; correct returns treasure (not all-venture multipliers).
- Reveal **venture-by-venture**; comic reef crashes; huge victorious return.
- Poseidon: majestic → comedic; short loss beat first.
- Sharks: funny; success-then-reversal; ignore unique shark item for now.
- Intro: sea changes → event → captain map → ventures.
- Cabin map for allocation → sea for reveal.
- Discussion timer **30–45s**; SFX priority lock → reveal → alloc.

## Quality bar

Physical commitment · Competitive rivalry · Reward spectacle — equally with art/animation/audio/feel.

## Fallback

Procedural art only if intentional and on-style; never broken placeholders.
