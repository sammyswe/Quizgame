# Restart brief — LOCKED intent

Status: **LOCKED** (owner direction 2026-07-21)  
Purpose: authorize a greenfield engineering restart while preserving decisions.

## Verdict

The current game **does not look or feel** like the intended product. Continuing to patch the
Path B Higgsfield prototype or the legacy Phaser app is the wrong investment.

**Restart engineering.** Keep this design bank.

## Keep (carry into the new build)

### Product

- Multiplayer room create / join / rejoin, 4-char codes, host start, nicknames
- Authoritative server; clients send intents only
- Blocks of **10 regular questions** → **Loot Drop** special (polish Loot Drop before any other special)
- Four answer islands; fleet sails to choices
- Mutiny / marooning after Q5; secret until reveal
- Score-gap-aware items; knowledge usually wins; scores ≥ 0
- Ages 9+; cheeky pirate tone; no accounts / payments / auth for prototype

### Visual / feel (voyage)

From `docs/decisions/voyage/` and owner follow-ups:

- Warm cartoon pirate **excursion** first; casino only for loot-box / jackpot peaks
- Reference stack: Coin Master → Brawl Stars → Clash Royale
- Primary goal for the quiz voyage: **smoothness and polish**
- Portrait mobile; **sea band and Q&A are two completely separate sections**
- **All four islands fully on-screen** at all times (never cropped by the question sheet)
- Baked island seas + authored water lanes; ships stop at **island box edges** (never on land)
- Reveal: synced ~2s full-scene island celebration (win + sad losers baked together), ships
  frozen on dock edges, then middle → sail away → full-screen leaderboard → next sea
- No gold sparkle overlays that hide the winning island’s authored animation
- Chest jackpot UI is **not** the quiz-reveal presentation (may return later for loot ceremony)

### Process

- LOCKED / PILOT / IDEA / REJECTED vocabulary
- Obsidian + `docs/context/` dual source
- Higgsfield (or equivalent) art with provenance + runtime fallbacks
- Agent loop with **exit gates**, not endless polish

## Discard / do not copy as architecture

- Pixel layout and timing bugs from Path B live builds (cropped C/D islands, overlapping HUD,
  reveal video race, muddy composites)
- “Casino reskin of a quiz” global skin
- Generic quiz cards / numeric allocation UIs
- Expanding wildcards / extra specials before Loot Drop passes its gate
- Treating any existing runtime as the source of visual truth

## Reference only

Older codebases may be consulted for **multiplayer protocol ideas** and pure scoring logic
patterns, then re-implemented cleanly. Do not port their presentation layer.

## Success definition for the restart

A first-time player on a phone, in a 2–4 player room, completes:

**lobby → 10 questions with a beautiful fleet voyage → Loot Drop → winner**

…and the voyage never looks like a generic quiz website. Islands are always fully visible;
motion is smooth; rewards feel Coin Master–satisfying without turning the whole game neon.
