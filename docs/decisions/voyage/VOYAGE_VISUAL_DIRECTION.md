# Voyage Visual Direction — LOCKED (10-question section)

Status: **LOCKED** from owner questionnaire 2026-07-20.  
Scope: Regular quiz voyage **before** Loot Drop.  
Primary goal: **SMOOTHNESS AND POLISH**.

## Reference stack

| Rank | Game | Steal |
| --- | --- | --- |
| 1 | **Coin Master** | Glossy clarity, rewarding feedback, satisfying micro-animations, readable gold/amber reward language |
| 2 | Brawl Stars | Gameplay silhouette polish, chunky readable shapes |
| 3 | Clash Royale | Clean unit movement, readable travel arcs |

Do not ignore any of the three. Coin Master leads overall feel.

### Coin Master lessons we apply

1. **Immediate feedback** — every commit gets squash / wake / snap / SFX / haptic in ≤100ms.
2. **Readable hierarchy** — hero silhouettes and reward colours pop; HUD stays quiet.
3. **Anticipation → payoff** — arrival and correct-island celebration escalate (glow → burst → cheer).
4. **Consistent timing** — travel ~1.1s, exit ~2s, leaderboard 3s — never sluggish, never twitchy.
5. **Avoid fatiguing loops** — spectacles are punchy, not endless non-skippable chains during the quiz.

## Mood

Warm tropical archipelago for all ten questions. One continuous voyage; each question is a new destination (remix of the same world). Later themes deferred.

Quality bar: **top-grossing glossy mobile**.

## Scene rules

- **10 unique full-screen backdrops**, highly polished.
- Composition: **~90% playable water, ~10% sky**.
- Islands sit in the water and collectively occupy **~40%** of the playable area.
- Prefer corner-biased layouts; vary some scenes for interest.
- **Islands are baked into each backdrop** (not muddy cutout islands composited on top).
- **Water lanes are predefined per scene** so ships never cross land.
- Always **4 answer islands** with integrated **plaque zones** for A–D.
- Vary **layout + artwork** every question.
- Mandatory biomes across the pack: palm cove, volcano, temple, lighthouse, skull rock, shipwreck, mangrove, crystal, iceberg (+ one free remix).
- Island width ≈ **4× hero ship width**.

## Ships

- Hero ship ≈ **8–10%** of screen width.
- Optimise for **4 players**, one ship each.
- Colour-coded sails/flags + subtle hull accents.
- Names **painted on hull** (truncate 12 chars; shrink type for long names).
- Local player: subtle outline/highlight.
- Answered rivals → fog until reveal.

## Motion

- Weighty but responsive.
- Commit travel **1.0–1.2s**, gentle curves, **≥16 facings**, **3–6 idle frames** per facing.
- Visible wakes, foam, ripples.
- Camera **locked**.
- Commit 100ms: wake burst, sail snap, squash, SFX, haptic.
- Arrival: dock bump + flag raise + cheer (correct) / disappointed (wrong).
- End of question: sail **off the TOP** shrinking into distance (~2s) → **leaderboard 3s** → next destination.
- No reduced-motion mode — polish the default path.

## Asset philosophy

- Budget: **500+ Higgsfield generations** for this section.
- Prefer **sprite sheets (~4×8)** and **layered backdrop plates** (sky / water+islands / near foam).
- ~**40 unique island hero artworks** for plaque/celebration overlays + state variants (idle / highlight / correct / wrong) even when bases are baked.
- Ships: emotion variants (idle, celebrate, damaged, travel) + separate crew layers.
- Ambient: birds, fish, clouds, flags, lanterns.
- VFX: splashes, wakes, foam, coin bursts, confetti, fireworks, treasure sparkle, impact stars, speed lines, smoke, magical glows.
- Style: keep STYLE FORMULA, push gloss toward Coin Master.

## UI

- Question + answers in **bottom sheet**; ~**60% sea / 40% sheet**, no scroll.
- Tap answer cards → ships sail automatically to **island box edges** (never onto land).
- Correct answer: synced **~2s full-scene cutscene** (win + empty islands baked together),
  live ships frozen on dock edges, then middle → sail away → full-screen leaderboard.
  See `REVEAL_CUTSCENE.md`. Chest jackpot archived for this path.

## Top five polish killers (reject builds that ship these)

1. Tiny unreadable ships  
2. Muddy inconsistent AI art  
3. Slow, lifeless movement  
4. Ugly name tags / cluttered HUD  
5. Weak reward spectacle  

## Conflict resolution

1. This LOCKED note  
2. STYLE_FORMULA.txt (Coin Master gloss push)  
3. VOYAGE_ASSET_PACK_PLAN.md  
4. Shipped code  
