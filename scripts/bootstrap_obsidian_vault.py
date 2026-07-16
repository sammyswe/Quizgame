#!/usr/bin/env python3
"""Bootstrap the Treasure Trap Obsidian vault from repo knowledge."""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "obsidian"


def fm(**kwargs: object) -> str:
    lines = ["---"]
    for k, v in kwargs.items():
        if v is None:
            continue
        if isinstance(v, list):
            lines.append(f"{k}: [{', '.join(str(x) for x in v)}]")
        else:
            lines.append(f"{k}: {v}")
    lines.append("---")
    return "\n".join(lines)


def write(rel: str, body: str) -> None:
    path = ROOT / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(body.strip() + "\n", encoding="utf-8")


def note(
    rel: str,
    *,
    title: str,
    status: str,
    area: str,
    implementation: str,
    tags: list[str],
    sources: str,
    body: str,
    related: list[str] | None = None,
    updated: str = "2026-07-16",
) -> str:
    tag_list = list(dict.fromkeys([*tags, status.lower(), area]))
    header = fm(
        title=title,
        status=status,
        implementation=implementation,
        area=area,
        tags=tag_list,
        sources=sources,
        updated=updated,
    )
    related = related or []
    related_block = ""
    if related:
        related_block = "\n\n## Related\n\n" + "\n".join(f"- [[{r}]]" for r in related)
    write(rel, f"{header}\n\n# {title}\n\n{body.strip()}{related_block}\n")
    return title


def moc(rel: str, title: str, intro: str, sections: dict[str, list[str]]) -> None:
    parts = [fm(title=title, status="LOCKED", area="moc", tags=["moc", "locked"], updated="2026-07-16"), "", f"# {title}", "", intro.strip(), ""]
    for heading, links in sections.items():
        parts.append(f"## {heading}")
        parts.append("")
        for link in links:
            parts.append(f"- [[{link}]]")
        parts.append("")
    parts.append("## Navigation")
    parts.append("")
    parts.append("- [[Home]]")
    write(rel, "\n".join(parts))


def main() -> None:
    titles: dict[str, list[str]] = {k: [] for k in [
        "product", "core", "mutiny", "items", "specials", "wildcards", "scoring",
        "multiplayer", "visual", "audio", "art", "arch", "ux", "playtest", "roadmap",
        "rejected", "archive",
    ]}

    def track(bucket: str, t: str) -> str:
        titles[bucket].append(t)
        return t

    # -------------------------------------------------------------------------
    # 16 Product Vision
    # -------------------------------------------------------------------------
    track("product", note(
        "16-Product-Vision-Audience/Treasure Trap Product Vision.md",
        title="Treasure Trap Product Vision",
        status="LOCKED",
        area="product-vision",
        implementation="PLAYABLE",
        tags=["vision", "product"],
        sources="docs/context/VISION.md, AGENTS.md, .cursor/rules/product.mdc",
        body="""
Treasure Trap is a live multiplayer **cartoon pirate party quiz**. Friends sail as a fleet, race toward answer islands, collect treasure, bluff, mutiny, use pirate tools, and survive high-drama special rounds.

It must feel like a purpose-built game — never a quiz website with a pirate skin.

## Audience and tone

- 2–8 players on separate phones/laptops (same room or voice call)
- Suitable for ages 9+
- Cheeky, dramatic, funny party energy
- Rules learned through symbols, staging, and short animated demos
- Table discussion is part of the game

## Non-goals (prototype)

- Accounts, payments, public matchmaking, databases
- Native app before the web loop is proven
- Twelve shallow special rounds at once
- Casino imagery on every screen
""",
        related=["Knowledge Usually Wins", "Cartoon Pirate Excursion Fantasy", "Selective Casino Excitement", "Deception Through Discussion", "One Polished Slice at a Time", "MOC - Product Vision & Audience"],
    ))

    track("product", note(
        "16-Product-Vision-Audience/Knowledge Usually Wins.md",
        title="Knowledge Usually Wins",
        status="LOCKED",
        area="product-vision",
        implementation="PLAYABLE",
        tags=["pillars", "balance"],
        sources="docs/context/VISION.md, .cursor/rules/product.mdc",
        body="""
Trivia ability should be the strongest predictor of victory (target hypothesis: **~75%**).

Items and wildcards create comebacks and stories, but must not turn the winner into a random draw.

## Invariants

- Scores never go below zero
- Attacks cannot erase a whole game
- Catch-up effects are bounded
""",
        related=["Treasure Trap Product Vision", "Item Design Principles", "Scores Never Go Below Zero"],
    ))

    track("product", note(
        "16-Product-Vision-Audience/Cartoon Pirate Excursion Fantasy.md",
        title="Cartoon Pirate Excursion Fantasy",
        status="LOCKED",
        area="product-vision",
        implementation="PARTIAL",
        tags=["pillars", "visual"],
        sources="docs/context/VISION.md, docs/context/VISUAL_DIRECTION.md",
        body="""
The dominant fantasy is a fleet travelling through a lively storybook sea.

Ships bob, sails snap, waves move, islands approach, threats emerge from the world. Pirate symbolism makes actions self-explanatory: sail to an answer, fire a cannonball, raise a white flag, walk the plank, mutiny against the captain.

This is **Zone A** in the visual system — the default look of the game.
""",
        related=["Selective Casino Excitement", "Visual Zone A - Pirate Excursion", "MOC - Visual Direction & Animation"],
    ))

    track("product", note(
        "16-Product-Vision-Audience/Selective Casino Excitement.md",
        title="Selective Casino Excitement",
        status="LOCKED",
        area="product-vision",
        implementation="PARTIAL",
        tags=["pillars", "visual", "rewards"],
        sources="docs/context/VISION.md, docs/context/VISUAL_DIRECTION.md",
        body="""
Casino language is an **intensity tool**, not the global skin.

Use slot-machine anticipation, lights, escalating ticks, rarity colour, near-miss timing, and payout fanfare for:

- Loot-box / chest opening (primary casino moment)
- Jackpot item awards
- Selected high-stakes reveals inside special rounds
- Exceptional payouts where contrast makes them valuable

Do not cover ordinary sailing and questions in neon casino chrome.
""",
        related=["Cartoon Pirate Excursion Fantasy", "Loot Box Chest Ceremony", "Visual Zone B - Casino Spectacle"],
    ))

    track("product", note(
        "16-Product-Vision-Audience/Deception Through Discussion.md",
        title="Deception Through Discussion",
        status="LOCKED",
        area="product-vision",
        implementation="PLAYABLE",
        tags=["pillars", "social"],
        sources="docs/context/VISION.md",
        body="""
`Imposter` / social-spy-style uncertainty is a major inspiration.

Mechanics should create useful things to say and reasons to doubt them. Secret mutiny is the first locked expression: players can claim they will mutiny, bluff that they know the answer, or bait others into forfeiting.

Both helping **and** betrayal must be viable.
""",
        related=["Secret Mutiny", "Mutiny Outcome Table", "Treasure Trap Product Vision"],
    ))

    track("product", note(
        "16-Product-Vision-Audience/One Polished Slice at a Time.md",
        title="One Polished Slice at a Time",
        status="LOCKED",
        area="product-vision",
        implementation="PARTIAL",
        tags=["pillars", "process"],
        sources="docs/context/VISION.md, docs/context/SPECIAL_ROUNDS.md, .cursor/rules/loot-drop-vertical-slice.mdc",
        body="""
The first special round is **Million Pound Drop / Loot Drop**.

Make its complete multiplayer loop, interaction, reveal, and audiovisual payoff excellent before adding another special round. Breadth must not cost game feel.
""",
        related=["Loot Drop Special Round", "Roadmap Phase Overview", "MOC - Special Rounds"],
    ))

    track("product", note(
        "16-Product-Vision-Audience/Ages 9 Plus Tone.md",
        title="Ages 9 Plus Tone",
        status="LOCKED",
        area="product-vision",
        implementation="PLAYABLE",
        tags=["tone", "audience"],
        sources="docs/context/VISION.md, AGENTS.md",
        body="""
Copy and tone: cheeky pirate, fast, funny, ages 9+.

Example energy: "You have been absolutely robbed."

Never imply real-money purchase or cash-out. Loss sequences are dramatic but brief — no shame, predatory purchase cues, or fake scarcity.
""",
        related=["Treasure Trap Product Vision", "Selective Casino Excitement"],
    ))

    track("product", note(
        "16-Product-Vision-Audience/No Accounts Prototype Boundary.md",
        title="No Accounts Prototype Boundary",
        status="LOCKED",
        area="product-vision",
        implementation="PLAYABLE",
        tags=["non-goals", "prototype"],
        sources="docs/context/VISION.md, .cursor/rules/product.mdc",
        body="""
For the playtest prototype: **no accounts, no payments, no databases, no auth**.

Remote friends open a URL, create/join with a room code, play.
""",
        related=["Room Create Join Rejoin", "Remote Alpha Deployment"],
    ))

    # -------------------------------------------------------------------------
    # 01 Core Loop
    # -------------------------------------------------------------------------
    track("core", note(
        "01-Core-Loop/Match Structure 10 Question Blocks.md",
        title="Match Structure 10 Question Blocks",
        status="LOCKED",
        area="core-loop",
        implementation="PLAYABLE",
        tags=["match", "structure"],
        sources="docs/context/MECHANICS.md, docs/context/SPECIAL_ROUNDS.md",
        body="""
- Regular quiz questions play in blocks of **10**
- Completing each block triggers one special round
- Match length is selected before play and determines special-round count
- Example: 30-question game = 30 regular questions + 3 special rounds
- Special-round types are initially random
- Long-term content target: ≥12 special-round types and ≥3 final-round types
- Build sequentially: polish one special before starting the next

Code: `server/src/engine.ts` tracks regular questions and completed specials separately.
""",
        related=["Loot Drop Special Round", "First Five Questions Onboarding", "Special Round Framework"],
    ))

    track("core", note(
        "01-Core-Loop/First Five Questions Onboarding.md",
        title="First Five Questions Onboarding",
        status="LOCKED",
        area="core-loop",
        implementation="PLAYABLE",
        tags=["onboarding", "items"],
        sources="docs/context/MECHANICS.md",
        body="""
- Mutiny and marooning unavailable during questions 1–5
- First item ceremony occurs immediately after question 5
- Items may later use finer timing windows (not yet decided)

Live: each player gets the onboarding item after Q5; social mechanics gate until Q6.
""",
        related=["Loot Box Chest Ceremony", "Secret Mutiny", "Item Timing Windows"],
    ))

    track("core", note(
        "01-Core-Loop/Regular Question Four Islands.md",
        title="Regular Question Four Islands",
        status="LOCKED",
        area="core-loop",
        implementation="PARTIAL",
        tags=["questions", "islands"],
        sources="docs/context/MECHANICS.md, docs/context/VISUAL_DIRECTION.md",
        body="""
1. Fleet encounters a question and four answer islands
2. Each player sails/selects one island
3. Correct island holds treasure
4. Available treasure visibly dwindles with time (speed matters)
5. Correct players receive the amount remaining when they committed
6. Reveal communicates correct/wrong, payout, and fleet consequences

Islands are **places in the world**, not generic answer cards.
""",
        related=["Decaying Treasure Reward", "Answer Commit Feedback", "Correct Answer Celebration", "Wrong Answer Loss Sting"],
    ))

    track("core", note(
        "01-Core-Loop/Decaying Treasure Reward.md",
        title="Decaying Treasure Reward",
        status="PILOT",
        area="core-loop",
        implementation="PLAYABLE",
        tags=["scoring", "timing"],
        sources="docs/context/MECHANICS.md",
        body="""
The current linear decaying pot is a valid **PILOT** for the reward curve.

Exact curve and min/max are balance values, not locked design. Visual representation must make decay legible without requiring players to parse a small number.
""",
        related=["Regular Question Four Islands", "Scoring Invariants"],
    ))

    track("core", note(
        "01-Core-Loop/Captain of the Fleet.md",
        title="Captain of the Fleet",
        status="LOCKED",
        area="core-loop",
        implementation="PLAYABLE",
        tags=["captain", "leadership"],
        sources="docs/context/MECHANICS.md",
        body="""
- Player in first place is Captain of the Fleet
- Ties use a deterministic server-owned rule
- Captain cannot mutiny
- Captain status must be obvious in the fleet without obscuring score/answer state
- Additional captain powers are future IDEAS, not implicit permissions
""",
        related=["Secret Mutiny", "Captain Visual Marker"],
    ))

    track("core", note(
        "01-Core-Loop/Answer Commit Feedback.md",
        title="Answer Commit Feedback",
        status="LOCKED",
        area="core-loop",
        implementation="PARTIAL",
        tags=["feedback", "ux"],
        sources="docs/context/MECHANICS.md, .cursor/rules/no-boring-ui.mdc",
        body="""
Answer lock must give immediate within-frame feedback.

Motion grammar: squash → snap/sail → confirmation wake.

On new question: cancel all stale effects/timers before state rehydrates.
""",
        related=["Regular Question Four Islands", "Motion Grammar"],
    ))

    track("core", note(
        "01-Core-Loop/Correct Answer Celebration.md",
        title="Correct Answer Celebration",
        status="LOCKED",
        area="core-loop",
        implementation="PARTIAL",
        tags=["feedback", "animation"],
        sources="docs/context/MECHANICS.md, docs/context/VISUAL_DIRECTION.md",
        body="""
Correct: celebratory island/ship animation, readable payout, satisfying positive sound.

Motion: upward lift, warm burst, fleet cheer, treasure return.
""",
        related=["Wrong Answer Loss Sting", "Sound Direction"],
    ))

    track("core", note(
        "01-Core-Loop/Wrong Answer Loss Sting.md",
        title="Wrong Answer Loss Sting",
        status="LOCKED",
        area="core-loop",
        implementation="PARTIAL",
        tags=["feedback", "animation"],
        sources="docs/context/MECHANICS.md, docs/context/VISUAL_DIRECTION.md",
        body="""
Wrong: casino-style loss sting used sparingly, an upsetting but age-appropriate sound, and a physical consequence in the pirate world.

Motion: impact/drop, desaturation beat, comic loss sting.
""",
        related=["Correct Answer Celebration", "Ages 9 Plus Tone"],
    ))

    track("core", note(
        "01-Core-Loop/Streak Bonus Pilot.md",
        title="Streak Bonus Pilot",
        status="IDEA",
        area="core-loop",
        implementation="PLAYABLE",
        tags=["streaks", "scoring"],
        sources="docs/context/MECHANICS.md, docs/context/IDEA_BANK.md",
        body="""
Live game has escalating point bonuses, a three-answer chest, and White Flag cash-out.

**Not confirmed.** Keep playable for comparison; do not build new systems around streaks until promoted.

Open questions:

- Reward knowledge without runaway leaders?
- Make [[White Flag]] strategically interesting?
- Understandable alongside decaying reward?
- Grant items instead of points?
""",
        related=["White Flag", "Decaying Treasure Reward", "MOC - Scoring & Economy"],
    ))

    # -------------------------------------------------------------------------
    # 02 Mutiny & Marooning
    # -------------------------------------------------------------------------
    track("mutiny", note(
        "02-Mutiny-Marooning/Secret Mutiny.md",
        title="Secret Mutiny",
        status="LOCKED",
        area="mutiny-marooning",
        implementation="PLAYABLE",
        tags=["mutiny", "social"],
        sources="docs/context/MECHANICS.md",
        body="""
Mutiny creates discussion, deception, and bluffing around difficult questions.

- Available on every regular question after question 5
- Every non-captain may secretly press an ever-present mutiny action
- No public indicator of who has mutinied before reveal
- Declaring mutiny forfeits that player's chance to answer
- Players may discuss or lie about intent out loud
""",
        related=["Mutiny Outcome Table", "Captain of the Fleet", "Deception Through Discussion", "First Five Questions Onboarding"],
    ))

    track("mutiny", note(
        "02-Mutiny-Marooning/Mutiny Outcome Table.md",
        title="Mutiny Outcome Table",
        status="LOCKED",
        area="mutiny-marooning",
        implementation="PLAYABLE",
        tags=["mutiny", "resolution"],
        sources="docs/context/MECHANICS.md",
        body="""
| Secret mutineer count | Outcome |
| --- | --- |
| 0 | Normal question |
| Exactly 1 | Lone mutineer forfeits answer and becomes marooned |
| 2+ but not all eligible non-captains | Mutineers forfeit answers; no extra payout/punishment |
| All eligible non-captains | Only captain answers. Captain correct → normal captain reward, others nothing. Captain wrong → captain pays configured tax distributed to all others |

Server rejects/removes answers from mutineers and resolves this table.
""",
        related=["Secret Mutiny", "Marooning", "Lone Mutineer Maroon Cinematic"],
    ))

    track("mutiny", note(
        "02-Mutiny-Marooning/Marooning.md",
        title="Marooning",
        status="LOCKED",
        area="mutiny-marooning",
        implementation="PARTIAL",
        tags=["marooning", "punishment"],
        sources="docs/context/MECHANICS.md",
        body="""
Marooned players miss the **next regular question**. A special round must not consume the skipped question — defer the skip if needed.

Triggers after question 5:

1. Exactly one active player answers incorrectly while everyone else answers correctly
2. Exactly one eligible player declares mutiny

Each trigger needs a distinct authored cinematic (see linked notes).
""",
        related=["Sole Wrong Maroon Cinematic", "Lone Mutineer Maroon Cinematic", "Secret Mutiny"],
    ))

    track("mutiny", note(
        "02-Mutiny-Marooning/Sole Wrong Maroon Cinematic.md",
        title="Sole Wrong Maroon Cinematic",
        status="LOCKED",
        area="mutiny-marooning",
        implementation="NOT_STARTED",
        tags=["marooning", "animation"],
        sources="docs/context/MECHANICS.md, docs/context/ANIMATION_AND_ASSETS.md",
        body="""
Trigger: sole wrong answer while everyone else is correct.

Visual: their ship drifts away from the fleet, crashes/grounds at a deserted island, fleet sails onward.

Live game tracks the skip but still uses generic presentation.
""",
        related=["Marooning", "Lone Mutineer Maroon Cinematic", "Required Event Animation Bank"],
    ))

    track("mutiny", note(
        "02-Mutiny-Marooning/Lone Mutineer Maroon Cinematic.md",
        title="Lone Mutineer Maroon Cinematic",
        status="LOCKED",
        area="mutiny-marooning",
        implementation="NOT_STARTED",
        tags=["marooning", "animation", "mutiny"],
        sources="docs/context/MECHANICS.md, docs/context/ANIMATION_AND_ASSETS.md",
        body="""
Trigger: lone mutineer.

Visual: fleet fires warning cannon volleys; mutineer's damaged ship flees; they hide on a deserted island.
""",
        related=["Marooning", "Mutiny Outcome Table", "Secret Mutiny"],
    ))

    # -------------------------------------------------------------------------
    # 03 Items
    # -------------------------------------------------------------------------
    track("items", note(
        "03-Items-Powerups/Item Design Principles.md",
        title="Item Design Principles",
        status="LOCKED",
        area="items",
        implementation="PARTIAL",
        tags=["items", "principles"],
        sources="docs/context/ITEMS.md, .cursor/skills/pirate-item-design/SKILL.md",
        body="""
1. **Read it in one glance** — name, silhouette, target, effect
2. **Fire it physically** — drag/tap, legal targets, animate through the fleet
3. **Match position need** — rank + score gap + recent item history
4. **No dead rewards** — avoid unusable items without banking them
5. **No runaway leader arsenal** — leaders get defence/precision; trailers get comeback
6. **Bound every attack** — cap impact, preserve ability to answer, define counterplay
7. **Knowledge still matters**
8. **Prevent hoarding/sandbagging**
9. **Every item tells a story** via animation/sound
10. **Playtest by position** — leader / middle / last

Mario Kart research notes (score-gap tables, underdog hope) live in `docs/context/ITEMS.md`.
""",
        related=["Item Acquisition and Chests", "Item Timing Windows", "Item Animation Acceptance Contract", "Knowledge Usually Wins"],
    ))

    track("items", note(
        "03-Items-Powerups/Item Timing Windows.md",
        title="Item Timing Windows",
        status="IDEA",
        area="items",
        implementation="NOT_STARTED",
        tags=["items", "timing"],
        sources="docs/context/ITEMS.md",
        body="""
Candidate timing model — **not confirmed**:

| Window | Meaning |
| --- | --- |
| `PRE_QUESTION` | Before prompt; strategic setup |
| `PROMPT` | Prompt visible, choices hidden |
| `CHOICES` | Choices visible, before commit |
| `POST_COMMIT` | Reactive info/defence only |
| `REVEAL` | Cinematic; no new hidden advantage |

Live implementation allows power-ups during the broad `question` phase.
""",
        related=["Item Design Principles", "Eyepatch", "Barnacle"],
    ))

    track("items", note(
        "03-Items-Powerups/Item Acquisition and Chests.md",
        title="Item Acquisition and Chests",
        status="LOCKED",
        area="items",
        implementation="PARTIAL",
        tags=["items", "chests", "economy"],
        sources="docs/context/ITEMS.md, shared/src/config/chests.ts",
        body="""
**LOCKED goals**

- Acquisition is random, dramatic, and fun
- Lower-ranked / far-behind players have better odds of powerful items
- First item ceremony after question 5
- Each special round has one unique item available only through that round
- Opening a loot box is the game's strongest slot-machine/casino moment

**Undecided**

- Exact chest frequency after the first item
- Rank/score-gap probability tables and duplicate protection
- Inventory limit and whether unused items persist between blocks
- Whether players can earn items from regular streaks
""",
        related=["Loot Box Chest Ceremony", "First Five Questions Onboarding", "Score Gap Aware Item Odds"],
    ))

    track("items", note(
        "03-Items-Powerups/Item Animation Acceptance Contract.md",
        title="Item Animation Acceptance Contract",
        status="LOCKED",
        area="items",
        implementation="NOT_STARTED",
        tags=["items", "animation"],
        sources="docs/context/ITEMS.md",
        body="""
Each item needs:

1. Anticipation / selection pose
2. Legal target highlight + invalid-action response
3. Source ship animation
4. Readable travel path or world transformation
5. Impact on target ship/island/answers
6. Victim and bystander reaction
7. Result text and sound
8. Reduced-motion treatment
9. Higgsfield generation record + runtime fallback

Do not call an item polished when only an icon and toast exist.
""",
        related=["Definition of Polished Event", "Item Design Principles"],
    ))

    track("items", note(
        "03-Items-Powerups/Score Gap Aware Item Odds.md",
        title="Score Gap Aware Item Odds",
        status="IDEA",
        area="items",
        implementation="NOT_STARTED",
        tags=["items", "balance"],
        sources="docs/context/ITEMS.md, docs/context/ROADMAP.md",
        body="""
Treasure Trap should consider **score gap and rank**, not rank alone (Mario Kart 8 evidence).

TODO: design score-gap-aware rarity tables with duplicate/hoarding protection and explicit `counterplay` metadata in live power-up config.
""",
        related=["Item Acquisition and Chests", "Item Design Principles", "Knowledge Usually Wins"],
    ))

    items = [
        ("Eyepatch", "LOCKED", "PLAYABLE", "common", "self", "50/50: leave two options, one correct. Timing TBD."),
        ("Parrot", "LOCKED", "PLAYABLE", "common", "otherPlayer", "Blindly repeat a chosen player's selection."),
        ("White Flag", "LOCKED", "PLAYABLE", "common", "self", "Sit out one question while preserving the streak. Streak dependency is IDEA."),
        ("Telescope", "LOCKED", "PLAYABLE", "rare", "otherPlayer", "Privately see what another player committed."),
        ("Rum Rush", "LOCKED", "PLAYABLE", "rare", "self", "2× the next correct answer."),
        ("Cannonball", "LOCKED", "PLAYABLE", "rare", "otherPlayer", "Blast holes through answer words for one target. Accessibility-safe distortion required."),
        ("Walk the Plank", "LOCKED", "PLAYABLE", "rare", "otherPlayer", "Force a target to answer quickly or score nothing."),
        ("Hook", "LOCKED", "PLAYABLE", "epic", "otherPlayer", "Steal another player's item."),
        ("Secret X", "LOCKED", "PLAYABLE", "legendary", "self", "Privately reveal the correct answer. Rarity/scarcity critical."),
        ("Cannonball Barrage", "LOCKED", "PLAYABLE", "legendary", "allOthers", "Blast answer words for all other players."),
        ("Barnacle", "LOCKED", "PLAYABLE", "epic", "otherPlayer", "Cover one of four options for one target. Timing polish open."),
        ("Barnacle Infestation", "LOCKED", "PLAYABLE", "legendary", "allOthers", "Barnacle everyone. Timing polish open."),
    ]
    for name, status, impl, rarity, target, effect in items:
        slug = name
        track("items", note(
            f"03-Items-Powerups/{slug}.md",
            title=slug,
            status=status,
            area="items",
            implementation=impl,
            tags=["items", "catalogue", rarity],
            sources="docs/context/ITEMS.md, shared/src/config/powerups.ts",
            body=f"""
**Rarity:** {rarity}  
**Target:** `{target}`  
**Effect:** {effect}

See [[Item Design Principles]] and [[Item Animation Acceptance Contract]].
Hole-in-words / cover-option effects must preserve accessibility (time-limited readable distortion + accessible equivalent).
""",
            related=["Item Design Principles", "Item Acquisition and Chests", "MOC - Items & Power-ups"],
        ))

    track("items", note(
        "03-Items-Powerups/Sword Fight.md",
        title="Sword Fight",
        status="IDEA",
        area="items",
        implementation="PLAYABLE",
        tags=["items", "catalogue", "duel"],
        sources="docs/context/ITEMS.md, docs/context/IDEA_BANK.md, shared/src/config/powerups.ts",
        body="""
**Richer design (IDEA):** challenge a player to a duel while others place faith in a winner.

Open questions:

- Same trivia answer, speed, or follow-up?
- Backing public or secret?
- What does each participant risk?
- Can a leader farm weaker players?
- How are spectators engaged without turning knowledge into betting randomness?

Live code contains a simpler one-on-one duel — that does **not** confirm the richer design.
""",
        related=["Item Design Principles", "Deception Through Discussion"],
    ))

    track("items", note(
        "03-Items-Powerups/Shark Head Unique Item.md",
        title="Shark Head Unique Item",
        status="IDEA",
        area="items",
        implementation="NOT_STARTED",
        tags=["items", "special-round-unique", "shark"],
        sources="docs/context/SPECIAL_ROUNDS.md",
        body="""
Working name: **Shark Head**. Working effect (steal everyone's items) is likely **too destructive**.

Preserve the fantasy, not the exact effect.

Candidate direction: summon a shark raid that steals **one** random eligible item in total, with warning and protection options.

Awarded via [[Shark Attack]] in [[Loot Drop Special Round]]. Until redesigned, server grants a temporary underdog chest — do not present that as the final shark item.
""",
        related=["Shark Attack", "Loot Drop Special Round", "Item Design Principles"],
    ))

    # -------------------------------------------------------------------------
    # 04 Special Rounds
    # -------------------------------------------------------------------------
    track("specials", note(
        "04-Special-Rounds/Special Round Framework.md",
        title="Special Round Framework",
        status="LOCKED",
        area="special-rounds",
        implementation="PARTIAL",
        tags=["special-rounds", "framework"],
        sources="docs/context/SPECIAL_ROUNDS.md",
        body="""
- One special round follows every 10 regular questions
- Pre-match length determines the number of special rounds
- Initially server randomises types
- Later option may let players choose the set; server still randomises order
- Content target: ≥12 special rounds and ≥3 special final rounds
- Each special contains 3–5 possible wildcard events
- Each special owns one unique obtainable item
- Wildcards and unique items need authored AV sequences and reveal events

## Selection safety

- Avoid same special twice in a row when ≥2 available
- Seed randomness for reproducible tests
- Teach rules in ≤4 short staged beats
- Never expose secrets/private allocations before reveal
""",
        related=["Match Structure 10 Question Blocks", "Loot Drop Special Round", "Future Match Special Round Selection"],
    ))

    track("specials", note(
        "04-Special-Rounds/Loot Drop Special Round.md",
        title="Loot Drop Special Round",
        status="LOCKED",
        area="special-rounds",
        implementation="PARTIAL",
        tags=["special-rounds", "loot-drop", "priority"],
        sources="docs/context/SPECIAL_ROUNDS.md, .cursor/rules/loot-drop-vertical-slice.mdc",
        body="""
Also known as Million Pound Drop. **Current polish priority.**

### Purpose

Turn treasure from the preceding quiz block into a tense discussion and risk-allocation moment. Players send pirate forces toward answer islands; correct ventures return; wrong ventures are eliminated/plundered.

### Rules

1. Wager points from the **previous 10 regular questions**
2. Four answer ventures/islands
3. Distribute block loot in fixed touch-friendly steps
4. Lock allocation
5. Wrong ventures lose wager; correct returns treasure
6. Exact allocations private until reveal
7. Server resolves; scores clamp at zero

### Visual

Cartoon pirate operation first; casino intensity may rise at lock/reveal only.

### Polish gate (open items)

- Pirate venture interaction replacing form-like allocation
- Lock-in feedback + private allocation sync
- Cancellable sequential reveal
- Poseidon + Shark authored animation/sound
- Unique shark item redesigned
- Two-device smoke + ≥3 observed playtests
""",
        related=["Poseidons Rescue", "Shark Attack", "Shark Head Unique Item", "Prior Block Wager Ledger", "One Polished Slice at a Time"],
    ))

    track("specials", note(
        "04-Special-Rounds/Prior Block Wager Ledger.md",
        title="Prior Block Wager Ledger",
        status="LOCKED",
        area="special-rounds",
        implementation="PLAYABLE",
        tags=["loot-drop", "economy"],
        sources="docs/context/SPECIAL_ROUNDS.md, docs/context/HANDOFF.md",
        body="""
Server tracks positive regular-question earnings per block and privately exposes each player's wager in 10-point steps.

The fixed 100-gold live allocator was a PILOT; confirmed direction wagers points earned in the preceding 10 questions.
""",
        related=["Loot Drop Special Round", "Scoring Invariants"],
    ))

    track("specials", note(
        "04-Special-Rounds/Second Most Popular Special Round.md",
        title="Second Most Popular Special Round",
        status="IDEA",
        area="special-rounds",
        implementation="NOT_STARTED",
        tags=["special-rounds", "idea"],
        sources="docs/context/IDEA_BANK.md",
        body="""
Goal: pick the **second most popular** answer.

- Most popular answer bankrupts the player's event stake
- Other answers preserve a percentage based on share of guesses
- Reveal answers and popularity slowly for tension

Open: ties, bankrupt = block stake only?, knowledge reward, collusion/bluff, whether percentages show before selection.
""",
        related=["Special Round Framework", "Special Round Promotion Checklist"],
    ))

    track("specials", note(
        "04-Special-Rounds/Treasure Grid Special Round.md",
        title="Treasure Grid Special Round",
        status="IDEA",
        area="special-rounds",
        implementation="NOT_STARTED",
        tags=["special-rounds", "idea"],
        sources="docs/context/IDEA_BANK.md",
        body="""
- Grid contains 15 correct and 5 wrong answers
- Players take turns choosing loot
- Wrong answer eliminates from the event
- Particularly bold/respectable correct choice earns bonus

Open: definition of "bold", turn-order catch-up, eliminated-player engagement, question sourcing, run length.
""",
        related=["Special Round Framework", "Special Round Promotion Checklist"],
    ))

    track("specials", note(
        "04-Special-Rounds/Future Match Special Round Selection.md",
        title="Future Match Special Round Selection",
        status="IDEA",
        area="special-rounds",
        implementation="NOT_STARTED",
        tags=["special-rounds", "lobby"],
        sources="docs/context/IDEA_BANK.md, docs/context/SPECIAL_ROUNDS.md",
        body="""
Players may eventually select which special rounds are included; server keeps order random.

Keep out of early lobby until enough polished specials exist.
""",
        related=["Special Round Framework", "Room Create Join Rejoin"],
    ))

    track("specials", note(
        "04-Special-Rounds/Special Round Promotion Checklist.md",
        title="Special Round Promotion Checklist",
        status="LOCKED",
        area="special-rounds",
        implementation="PLAYABLE",
        tags=["process", "special-rounds"],
        sources="docs/context/SPECIAL_ROUNDS.md",
        body="""
Every proposed round must answer:

1. What knowledge skill does it reward?
2. What do players discuss, claim, or bluff about?
3. What meaningful choice beyond answering?
4. How does a trailer retain hope without nullifying expertise?
5. What are its 3–5 wildcards?
6. What is its unique item?
7. What is the 10-second visual pitch?
8. How does the server resolve it deterministically?
9. What evidence promotes IDEA → PILOT → LOCKED?
""",
        related=["Special Round Framework", "Status Vocabulary"],
    ))

    # -------------------------------------------------------------------------
    # 05 Wildcards
    # -------------------------------------------------------------------------
    track("wildcards", note(
        "05-Special-Events-Wildcards/Wildcard Framework.md",
        title="Wildcard Framework",
        status="LOCKED",
        area="wildcards",
        implementation="PARTIAL",
        tags=["wildcards", "framework"],
        sources="docs/context/SPECIAL_ROUNDS.md, docs/context/MECHANICS.md",
        body="""
Wildcards live inside special rounds. Generally help players who are behind or apply bounded pressure to leaders.

Must remain readable and cannot silently alter scores. Need authored audiovisual sequences and reveal events.

Each special targets 3–5 possible wildcards.
""",
        related=["Poseidons Rescue", "Shark Attack", "Loot Drop Special Round"],
    ))

    track("wildcards", note(
        "05-Special-Events-Wildcards/Poseidons Rescue.md",
        title="Poseidons Rescue",
        status="LOCKED",
        area="wildcards",
        implementation="PARTIAL",
        tags=["wildcards", "loot-drop", "poseidon"],
        sources="docs/context/SPECIAL_ROUNDS.md",
        body="""
Loot Drop wildcard 01.

- Eligible when a struggling player backs a wrong venture
- Poseidon rises, rescues that player's wager, moves it via the correct island
- May rarely help mid-table; **never** the current leader
- Eligibility/chance are server-owned named constants
- Must visibly identify why that player was eligible without revealing hidden odds

Logic/tests complete; authored animation/sound remain open.
""",
        related=["Shark Attack", "Loot Drop Special Round", "Wildcard Framework"],
    ))

    track("wildcards", note(
        "05-Special-Events-Wildcards/Shark Attack.md",
        title="Shark Attack",
        status="LOCKED",
        area="wildcards",
        implementation="PARTIAL",
        tags=["wildcards", "loot-drop", "shark"],
        sources="docs/context/SPECIAL_ROUNDS.md",
        body="""
Loot Drop wildcard 02.

- Eligible when a high majority of active players choose the correct venture
- Shark fleet attacks; every affected player loses a small bounded percentage
- Lowest-ranked eligible player receives the special shark-themed item
- Threshold, percentage, ties, once-per-round limits in shared config
- Reveal must stage successful return first, then telegraph and resolve the attack

Until unique item designed, server grants underdog chest (temporary).
""",
        related=["Poseidons Rescue", "Shark Head Unique Item", "Loot Drop Special Round"],
    ))

    for theme, blurb in [
        ("Atlantis Wildcard Theme", "Submerged route/treasure reveal; exact player choice unknown."),
        ("Iceberg Wildcard Theme", "Route obstruction or fleet split; avoid passive random punishment."),
        ("Cave System Wildcard Theme", "Branching hidden-information route."),
        ("Sirens Wildcard Theme", "Temptation/misdirection with clear signal and counterplay."),
        ("Piranhas Wildcard Theme", "Escalating hazard around a venture."),
        ("Lifeboats Wildcard Theme", "Rescue/protection allocation."),
    ]:
        track("wildcards", note(
            f"05-Special-Events-Wildcards/{theme}.md",
            title=theme,
            status="IDEA",
            area="wildcards",
            implementation="NOT_STARTED",
            tags=["wildcards", "theme", "idea"],
            sources="docs/context/IDEA_BANK.md",
            body=f"""
Theme only — **not a mechanic yet**.

{blurb}

Before promotion, define: knowledge test, discussion incentive, meaningful choice, affected players, counterplay, score cap, visual sequence. Use [[Special Round Promotion Checklist]].
""",
            related=["Wildcard Framework", "Special Round Promotion Checklist"],
        ))

    # -------------------------------------------------------------------------
    # 06 Scoring
    # -------------------------------------------------------------------------
    track("scoring", note(
        "06-Scoring-Economy/Scoring Invariants.md",
        title="Scoring Invariants",
        status="LOCKED",
        area="scoring",
        implementation="PLAYABLE",
        tags=["scoring", "invariants"],
        sources="AGENTS.md, shared/src/game/scoring.ts, docs/context/MECHANICS.md",
        body="""
- Server owns outcomes and score mutation
- Every score change emits a reveal event — **no silent score changes**
- Scores clamp at zero via `applyDelta` / `clampScore`
- Catch-up effects are bounded; knowledge remains main win route
- Numeric balance truth lives in `shared/src/config/*`
""",
        related=["Scores Never Go Below Zero", "Reveal Event Queue", "Knowledge Usually Wins"],
    ))

    track("scoring", note(
        "06-Scoring-Economy/Scores Never Go Below Zero.md",
        title="Scores Never Go Below Zero",
        status="LOCKED",
        area="scoring",
        implementation="PLAYABLE",
        tags=["scoring", "invariants"],
        sources="AGENTS.md, .cursor/rules/product.mdc",
        body="""
All score changes go through shared scoring utilities. Attacks must never destroy an entire player's game.
""",
        related=["Scoring Invariants", "Item Design Principles"],
    ))

    track("scoring", note(
        "06-Scoring-Economy/Reveal Event Queue.md",
        title="Reveal Event Queue",
        status="LOCKED",
        area="scoring",
        implementation="PLAYABLE",
        tags=["scoring", "reveal"],
        sources="AGENTS.md, docs/context/ARCHITECTURE.md",
        body="""
Every meaningful change must produce a `RevealEvent` rendered by the reveal queue.

No silent score changes. Staged reveals create drama and teach rules.
""",
        related=["Scoring Invariants", "Loot Drop Special Round"],
    ))

    track("scoring", note(
        "06-Scoring-Economy/Named Constants Only.md",
        title="Named Constants Only",
        status="LOCKED",
        area="scoring",
        implementation="PLAYABLE",
        tags=["config", "invariants"],
        sources="AGENTS.md, .cursor/rules/code-quality.mdc",
        body="""
Scoring, odds, timing, and rarity values live in `shared/src/config/*`. No magic numbers in game logic.

Prose in this vault explains purpose and status; code holds numeric truth.
""",
        related=["Scoring Invariants", "Active Architecture"],
    ))

    # -------------------------------------------------------------------------
    # 07 Multiplayer
    # -------------------------------------------------------------------------
    track("multiplayer", note(
        "07-Multiplayer-Social/Room Create Join Rejoin.md",
        title="Room Create Join Rejoin",
        status="LOCKED",
        area="multiplayer",
        implementation="PLAYABLE",
        tags=["multiplayer", "rooms"],
        sources=".cursor/rules/multiplayer-preservation.mdc, docs/context/ARCHITECTURE.md",
        body="""
Never break: room create/join/rejoin, **4-character codes**, host migration/start, nicknames.

Two browsers/laptops must complete the active block/event loop.
""",
        related=["Host Migration", "Authoritative Server Model", "Multiplayer Acceptance Loop"],
    ))

    track("multiplayer", note(
        "07-Multiplayer-Social/Host Migration.md",
        title="Host Migration",
        status="LOCKED",
        area="multiplayer",
        implementation="PLAYABLE",
        tags=["multiplayer", "host"],
        sources=".cursor/rules/multiplayer-preservation.mdc, docs/context/ARCHITECTURE.md",
        body="""
When the host disconnects, host role migrates. Preserve start authority and room continuity.
""",
        related=["Room Create Join Rejoin", "Reconnect State Reconstruction"],
    ))

    track("multiplayer", note(
        "07-Multiplayer-Social/Authoritative Server Model.md",
        title="Authoritative Server Model",
        status="LOCKED",
        area="multiplayer",
        implementation="PLAYABLE",
        tags=["multiplayer", "architecture"],
        sources="docs/context/ARCHITECTURE.md, .cursor/rules/game-engine.mdc",
        body="""
`server/src/engine.ts` is the single source of truth: phases, timers, allocations, scores, correct answer.

Clients render state and send **intents**; they never compute outcomes locally.

Clients never submit “I was correct,” score deltas, random results, or resolved item effects.
""",
        related=["Socket Contract", "Secret State Isolation", "Active Architecture"],
    ))

    track("multiplayer", note(
        "07-Multiplayer-Social/Secret State Isolation.md",
        title="Secret State Isolation",
        status="LOCKED",
        area="multiplayer",
        implementation="PLAYABLE",
        tags=["multiplayer", "privacy"],
        sources="AGENTS.md, docs/context/ARCHITECTURE.md",
        body="""
Never expose during a question:

- `correctIndex`
- Other players' private state
- Mutiny choices
- Exact loot allocations
- Private inventories/clues

Exact loot splits stay private until reveal; only totals, lock status, and confidence flags are public.
""",
        related=["Authoritative Server Model", "Secret Mutiny", "Loot Drop Special Round"],
    ))

    track("multiplayer", note(
        "07-Multiplayer-Social/Socket Contract.md",
        title="Socket Contract",
        status="LOCKED",
        area="multiplayer",
        implementation="PLAYABLE",
        tags=["multiplayer", "protocol"],
        sources="shared/src/types/index.ts, docs/context/ARCHITECTURE.md",
        body="""
Socket contract lives in `shared/src/types/index.ts` (`ClientEvents` / `ServerEvents`).

Any protocol change updates that file first and both sides together. Do not rename events without updating client + server + shared types.
""",
        related=["Authoritative Server Model", "Active Architecture"],
    ))

    track("multiplayer", note(
        "07-Multiplayer-Social/Reconnect State Reconstruction.md",
        title="Reconnect State Reconstruction",
        status="LOCKED",
        area="multiplayer",
        implementation="PLAYABLE",
        tags=["multiplayer", "reconnect"],
        sources="docs/context/ARCHITECTURE.md, .cursor/rules/game-engine.mdc",
        body="""
Client effects tolerate out-of-order/late state: cancel running timelines on phase/question changes and rehydrate from Zustand/socket state after reconnect.

Reconnect receives enough public/private state to reconstruct the current phase. Visual state reconstructs without replaying stale effects.
""",
        related=["Room Create Join Rejoin", "Animation Timeline Cancellation"],
    ))

    track("multiplayer", note(
        "07-Multiplayer-Social/Multiplayer Acceptance Loop.md",
        title="Multiplayer Acceptance Loop",
        status="LOCKED",
        area="multiplayer",
        implementation="PLAYABLE",
        tags=["multiplayer", "qa"],
        sources="docs/context/ARCHITECTURE.md",
        body="""
Two separate clients can:

1. Create/join/rejoin by 4-char code
2. Preserve nickname and host migration
3. Configure length and start
4. Play ten regular questions
5. Receive first item ceremony after Q5
6. Mutiny secretly after Q5
7. Resolve marooning and skip correctly
8. Enter Loot Drop with prior-block points
9. Allocate/lock privately and see synced reveal
10. Continue into another block or winner state
""",
        related=["Room Create Join Rejoin", "Loot Drop Special Round"],
    ))

    # -------------------------------------------------------------------------
    # 08 Visual
    # -------------------------------------------------------------------------
    track("visual", note(
        "08-Visual-Direction-Animation/Visual Direction Sentence.md",
        title="Visual Direction Sentence",
        status="LOCKED",
        area="visual",
        implementation="PARTIAL",
        tags=["visual", "direction"],
        sources="docs/context/VISUAL_DIRECTION.md",
        body="""
**A warm, exaggerated cartoon pirate excursion that erupts into jewel-bright casino spectacle when treasure, rarity or high stakes deserve it.**

Contrast is essential. If everything glows like a slot machine, loot boxes stop feeling special.
""",
        related=["Visual Zone A - Pirate Excursion", "Visual Zone B - Casino Spectacle"],
    ))

    track("visual", note(
        "08-Visual-Direction-Animation/Visual Zone A - Pirate Excursion.md",
        title="Visual Zone A - Pirate Excursion",
        status="LOCKED",
        area="visual",
        implementation="PARTIAL",
        tags=["visual", "zone-a"],
        sources="docs/context/VISUAL_DIRECTION.md",
        body="""
Default for regular questions, fleet travel, islands, mutiny, marooning, item attacks, most special-round staging.

- Storybook tropical sea, painted skies, weather, reefs
- Chunky expressive ships with readable player colours
- Warm sunlit gold, ocean blue/teal, coral, sail cream, timber, danger red
- Thick outlines, glossy highlights, squash/stretch
- Constant ambient motion
- UI like captain's chart, carved plaque, sailcloth banner
""",
        related=["Visual Zone B - Casino Spectacle", "Cartoon Pirate Excursion Fantasy", "Fleet Scene Requirements"],
    ))

    track("visual", note(
        "08-Visual-Direction-Animation/Visual Zone B - Casino Spectacle.md",
        title="Visual Zone B - Casino Spectacle",
        status="LOCKED",
        area="visual",
        implementation="PARTIAL",
        tags=["visual", "zone-b"],
        sources="docs/context/VISUAL_DIRECTION.md",
        body="""
Primarily for chest/loot-box opening and jackpot rewards; optionally brief high-stakes reveal peaks.

- World darkens; gold, gem colour, selective cyan/magenta
- Slot-style anticipation: ticks, near-miss, rarity escalation, burst, payout
- Must resolve into a concrete pirate reward
- Never imply real-money purchase
""",
        related=["Selective Casino Excitement", "Loot Box Chest Ceremony"],
    ))

    track("visual", note(
        "08-Visual-Direction-Animation/Typography and Readability.md",
        title="Typography and Readability",
        status="LOCKED",
        area="visual",
        implementation="PLAYABLE",
        tags=["visual", "typography"],
        sources="docs/context/VISUAL_DIRECTION.md, .cursor/rules/visual-quality.mdc",
        body="""
- **Lilita One** for display
- **Nunito 700/900** for body/answers
- Answer text readable at a glance on all devices
- Art yields to readability (scrims, plaques, strokes)
- No emoji as final game art
- Colour is never the only state indicator
""",
        related=["Visual Direction Sentence", "Accessibility Reduced Motion"],
    ))

    track("visual", note(
        "08-Visual-Direction-Animation/Motion Grammar.md",
        title="Motion Grammar",
        status="LOCKED",
        area="visual",
        implementation="PARTIAL",
        tags=["visual", "motion"],
        sources="docs/context/VISUAL_DIRECTION.md",
        body="""
| Meaning | Motion |
| --- | --- |
| Safe / waiting | slow bob, drift, breathing |
| Choice available | pulse, wake path, target glow |
| Commit | squash → snap/sail → confirmation wake |
| Correct | upward lift, warm burst, fleet cheer |
| Wrong | impact/drop, desaturation, comic sting |
| Threat | directional warning, red rhythm, incoming silhouette |
| Casino reward | tick escalation → held breath → rarity burst → payout |

Every pointer action responds within one frame. Invalid actions shake/flash and explain why.
""",
        related=["Answer Commit Feedback", "No Boring UI Rule"],
    ))

    track("visual", note(
        "08-Visual-Direction-Animation/Fleet Scene Requirements.md",
        title="Fleet Scene Requirements",
        status="LOCKED",
        area="visual",
        implementation="PARTIAL",
        tags=["visual", "fleet"],
        sources="docs/context/VISUAL_DIRECTION.md",
        body="""
- Every active player has an identifiable ship
- Captain leads visually but does not occlude answers
- Four answer islands are world places, not cards
- Item animations originate from user's ship
- Marooning visibly separates one ship from the group
- Reconnect can reconstruct current visual state
""",
        related=["Regular Question Four Islands", "Captain Visual Marker", "Captain of the Fleet"],
    ))

    track("visual", note(
        "08-Visual-Direction-Animation/Captain Visual Marker.md",
        title="Captain Visual Marker",
        status="LOCKED",
        area="visual",
        implementation="PARTIAL",
        tags=["visual", "captain"],
        sources="docs/context/MECHANICS.md, docs/context/ANIMATION_AND_ASSETS.md",
        body="""
Captain crown/leadership transition must be obvious without obscuring score or answer state.

Required animation bank includes captain leadership transition.
""",
        related=["Captain of the Fleet", "Fleet Scene Requirements"],
    ))

    track("visual", note(
        "08-Visual-Direction-Animation/Accessibility Reduced Motion.md",
        title="Accessibility Reduced Motion",
        status="LOCKED",
        area="visual",
        implementation="PARTIAL",
        tags=["visual", "a11y"],
        sources="docs/context/VISUAL_DIRECTION.md, docs/context/ANIMATION_AND_ASSETS.md",
        body="""
Reduced motion keeps timing and meaning while replacing long travel/shake with short fades, scale changes, and static end poses.

Cannonball/barnacle distortions must never make text literally impossible for colour-blind, dyslexic, screen-reader, or reduced-motion users.
""",
        related=["Typography and Readability", "Item Animation Acceptance Contract"],
    ))

    track("visual", note(
        "08-Visual-Direction-Animation/Animation Timeline Cancellation.md",
        title="Animation Timeline Cancellation",
        status="LOCKED",
        area="visual",
        implementation="PLAYABLE",
        tags=["visual", "architecture"],
        sources=".cursor/rules/game-engine.mdc, docs/context/ARCHITECTURE.md",
        body="""
Animation timelines must tolerate late/out-of-order state, cancel on phase/question changes, and reconstruct from current state after reconnect.
""",
        related=["Reconnect State Reconstruction", "Definition of Polished Event"],
    ))

    track("visual", note(
        "08-Visual-Direction-Animation/Required Event Animation Bank.md",
        title="Required Event Animation Bank",
        status="PILOT",
        area="visual",
        implementation="PARTIAL",
        tags=["visual", "backlog"],
        sources="docs/context/ANIMATION_AND_ASSETS.md",
        body="""
### Core loop (highest priority)

- Fleet ambient travel loop
- Question/islands arrive
- Dwindling treasure urgency
- Ship commits to island
- Correct / wrong feedback
- Captain leadership transition
- Sole-wrong maroon cinematic
- Lone-mutineer maroon cinematic
- Full mutiny reveal
- Post-Q5 first loot-box ceremony

### Items

One bespoke fleet animation per confirmed item (see catalogue).

### Loot Drop

Allocation, departures, returns, Poseidon, Shark sequences.
""",
        related=["Sole Wrong Maroon Cinematic", "Loot Box Chest Ceremony", "Poseidons Rescue"],
    ))

    track("visual", note(
        "08-Visual-Direction-Animation/No Boring UI Rule.md",
        title="No Boring UI Rule",
        status="LOCKED",
        area="visual",
        implementation="PARTIAL",
        tags=["visual", "ux", "rules"],
        sources=".cursor/rules/no-boring-ui.mdc",
        body="""
Banned in gameplay: numeric input boxes, dropdowns, checkbox forms for gameplay actions.

- Allocating loot = dragging/tapping coins that fly
- Using an item = dragging an attack onto a glowing target
- Locking in = slamming a big button

Every pointer interaction needs feedback within one frame. If a UI element could appear unchanged on a generic quiz website, it does not belong in the gameplay scene.
""",
        related=["Motion Grammar", "Loot Drop Special Round"],
    ))

    # -------------------------------------------------------------------------
    # 09 Audio
    # -------------------------------------------------------------------------
    track("audio", note(
        "09-Audio-Juice-Game-Feel/Sound Direction.md",
        title="Sound Direction",
        status="LOCKED",
        area="audio",
        implementation="NOT_STARTED",
        tags=["audio", "direction"],
        sources="docs/context/ANIMATION_AND_ASSETS.md",
        body="""
- Excursion bed: sea, timber, sail, gulls, percussion, adventurous pirate instrumentation
- Interaction: immediate tactile click/thump/splash before flourish
- Correct: warm rising phrase + treasure texture
- Wrong: descending comic/casino bust sting — disappointing, not humiliating
- Mutiny: secret low cue on declaration; public horn/cannon only at reveal
- Casino chest: latch, tick ladder, held breath, rarity fanfare, coin payout
- Reserve loudest/brightest for rare moments
""",
        related=["Loot Box Chest Ceremony", "Selective Casino Excitement"],
    ))

    track("audio", note(
        "09-Audio-Juice-Game-Feel/Loot Box Chest Ceremony.md",
        title="Loot Box Chest Ceremony",
        status="LOCKED",
        area="audio",
        implementation="PARTIAL",
        tags=["audio", "casino", "chests"],
        sources="docs/context/ANIMATION_AND_ASSETS.md, docs/context/ITEMS.md",
        body="""
Strongest casino beat:

1. Approach — chest lands; voyage sound ducks
2. Commit — slam/tap; latch responds instantly
3. Build — light leaks, ticks accelerate, rarity colours cycle
4. Near miss — short controlled pause; no purchase pressure
5. Reveal — lid blast, rarity silhouette, item pose
6. Payout — gold/light/particles match rarity
7. Teach — 1–2s visual demonstration of the item
8. Return — reward into booty bag

Skippable after server-known result; shortened for repeats. Reduced motion preserves sound hierarchy and rarity without flashes/shake.
""",
        related=["Selective Casino Excitement", "Item Acquisition and Chests", "Visual Zone B - Casino Spectacle"],
    ))

    track("audio", note(
        "09-Audio-Juice-Game-Feel/Game Feel Juice Principles.md",
        title="Game Feel Juice Principles",
        status="LOCKED",
        area="audio",
        implementation="PARTIAL",
        tags=["audio", "juice"],
        sources=".cursor/skills/game-feel-and-juice/SKILL.md, docs/GAME_FEEL.md",
        body="""
Mobile arcade game feel: particles, camera, sequential reveals, physical interactions, avatar reactions.

Prefer physical pirate-world cause/effect over menu-based feedback. See skill `game-feel-and-juice` for procedures.
""",
        related=["Motion Grammar", "No Boring UI Rule"],
    ))

    track("audio", note(
        "09-Audio-Juice-Game-Feel/Definition of Polished Event.md",
        title="Definition of Polished Event",
        status="LOCKED",
        area="audio",
        implementation="PLAYABLE",
        tags=["audio", "quality-gate"],
        sources="docs/context/ANIMATION_AND_ASSETS.md",
        body="""
An event is polished only when it is:

- Driven by authoritative state
- Cancellable and reconnect-safe
- Visually readable on mobile
- Accompanied by appropriate sound
- Represented in reduced motion
- Performant under 8-player scene
- Backed by a fallback
- Documented with real generation provenance
- Observed in a two-device playtest
""",
        related=["Item Animation Acceptance Contract", "Required Event Animation Bank"],
    ))

    # -------------------------------------------------------------------------
    # 10 Art Pipeline
    # -------------------------------------------------------------------------
    track("art", note(
        "10-Art-Pipeline-Higgsfield/Higgsfield Mandate.md",
        title="Higgsfield Mandate",
        status="LOCKED",
        area="art-pipeline",
        implementation="PARTIAL",
        tags=["higgsfield", "art"],
        sources="docs/context/ANIMATION_AND_ASSETS.md, .cursor/rules/higgsfield-assets.mdc",
        body="""
Prefer Higgsfield MCP for authored visuals (characters, ships, islands, keyframes, sheets, video references).

Prompts must include: product sentence, zone (excursion vs casino), mechanic/trigger/source/target/meaning, framing, mobile readability, art-direction suffix, solid contrasting background for cutouts.

Never pretend Higgsfield was used when it wasn't. Fallbacks always required.
""",
        related=["Excursion Prompt Suffix", "Casino Reward Prompt Suffix", "Asset Provenance Record"],
    ))

    track("art", note(
        "10-Art-Pipeline-Higgsfield/Excursion Prompt Suffix.md",
        title="Excursion Prompt Suffix",
        status="LOCKED",
        area="art-pipeline",
        implementation="PLAYABLE",
        tags=["higgsfield", "prompts"],
        sources="docs/context/ANIMATION_AND_ASSETS.md",
        body="""
> Treasure Trap, a 2–8 player cartoon pirate party quiz. Premium 2D mobile arcade game art, adventurous storybook pirate excursion across tropical seas, warm daylight colour, expressive chunky shapes, thick dark outlines, glossy highlights, readable silhouettes at phone size, playful Brawl Stars-style energy, funny and dramatic but suitable for ages 9+, no text, no logos, no photorealism. Casino neon is absent unless explicitly requested for a reward beat.
""",
        related=["Casino Reward Prompt Suffix", "Higgsfield Mandate"],
    ))

    track("art", note(
        "10-Art-Pipeline-Higgsfield/Casino Reward Prompt Suffix.md",
        title="Casino Reward Prompt Suffix",
        status="LOCKED",
        area="art-pipeline",
        implementation="PLAYABLE",
        tags=["higgsfield", "prompts"],
        sources="docs/context/ANIMATION_AND_ASSETS.md",
        body="""
> Treasure Trap loot-box reward moment inside a cartoon pirate excursion. Premium 2D mobile arcade game art, pirate treasure transformed into a thrilling slot-machine-style ceremony, jewel-bright gold, controlled cyan and magenta lights, escalating rarity, glossy highlights, thick dark outlines, strong phone-size silhouette, Coin Master-like payout excitement without real-money imagery, funny and suitable for ages 9+, no text, no logos, no photorealism.
""",
        related=["Excursion Prompt Suffix", "Loot Box Chest Ceremony"],
    ))

    track("art", note(
        "10-Art-Pipeline-Higgsfield/Runtime Composition Prefer Sprites.md",
        title="Runtime Composition Prefer Sprites",
        status="LOCKED",
        area="art-pipeline",
        implementation="PARTIAL",
        tags=["higgsfield", "runtime"],
        sources="docs/context/ANIMATION_AND_ASSETS.md, design/concept/VIDEO_FIRST_MOTION.md",
        body="""
Generated video is not automatically production-ready. Prefer:

- Higgsfield-authored sprite/keyframe layers
- Transparent/cutout ships, characters, effects
- Short loopable WebM only for state-independent ambience
- Runtime composition in the active client
- Procedural fallbacks so missing binaries never stop play

Never place secret or variable game data inside baked video.
""",
        related=["Higgsfield Mandate", "Asset Provenance Record"],
    ))

    track("art", note(
        "10-Art-Pipeline-Higgsfield/Asset Provenance Record.md",
        title="Asset Provenance Record",
        status="LOCKED",
        area="art-pipeline",
        implementation="PARTIAL",
        tags=["higgsfield", "provenance"],
        sources="docs/context/ANIMATION_AND_ASSETS.md, .cursor/rules/higgsfield-assets.mdc",
        body="""
For every generated asset record: ID, mechanic, exact prompt, model, job ID, raw path, runtime path, cutout/sheet dims, shipped/reference/rejected, fallback, licence notes.

Register in active asset maps and `client/src/assets/higgsfield/**/asset-manifest.json`. Manifest queue: `design/assets.csv`.
""",
        related=["Higgsfield Mandate", "Concept Art Pipeline"],
    ))

    track("art", note(
        "10-Art-Pipeline-Higgsfield/Concept Art Pipeline.md",
        title="Concept Art Pipeline",
        status="PILOT",
        area="art-pipeline",
        implementation="PARTIAL",
        tags=["higgsfield", "pipeline"],
        sources="docs/context/POLISH_PRODUCTION_PLAN.md, design/concept/README.md, design/concept/ANIMATION_PIPELINE.md",
        body="""
- `design/assets.csv` is the locked generation queue
- Drop owner-approved Phase-0 locks into `design/concept/approved/` before bulk regen
- Owner Apps UI / handed concept art is the reliable path when cloud generate fails
- Existing Higgsfield binaries and Phaser-drawn art are explicit fallbacks, not final art

See also: `design/concept/SHELL_UI_BATCH.md`, `MOTION_BATCH.md`, `VIDEO_FIRST_MOTION.md`.
""",
        related=["Asset Provenance Record", "Voyage Art Integration Status"],
    ))

    track("art", note(
        "10-Art-Pipeline-Higgsfield/Voyage Art Integration Status.md",
        title="Voyage Art Integration Status",
        status="PILOT",
        area="art-pipeline",
        implementation="PARTIAL",
        tags=["higgsfield", "voyage"],
        sources="docs/context/HANDOFF.md",
        body="""
Voyage art is wired into live Phaser + lobby (`client/src/assets/higgsfield/voyage/`).

Still sheets + motion packs integrated; owner may request redo packs. Open polish: audio banks, per-player ship colour matching idle anims, chest private ceremony UI, reduced-motion paths.
""",
        related=["Concept Art Pipeline", "Roadmap Phase Overview"],
    ))

    track("art", note(
        "10-Art-Pipeline-Higgsfield/Chroma Key Cutout Workflow.md",
        title="Chroma Key Cutout Workflow",
        status="LOCKED",
        area="art-pipeline",
        implementation="PLAYABLE",
        tags=["higgsfield", "pipeline"],
        sources=".cursor/rules/higgsfield-assets.mdc",
        body="""
Ask for a plain solid dark background for easy cutout (models cannot emit alpha), then run:

`python3 scripts/chroma_key.py <file>`

Produces transparent `-cut` version. Keep raw generations in appropriate `raw/` folders under `client/src/assets/higgsfield/`.
""",
        related=["Higgsfield Mandate", "Asset Provenance Record"],
    ))

    # -------------------------------------------------------------------------
    # 11 Architecture
    # -------------------------------------------------------------------------
    track("arch", note(
        "11-Architecture-Tech/Active Architecture.md",
        title="Active Architecture",
        status="LOCKED",
        area="architecture",
        implementation="PLAYABLE",
        tags=["architecture", "runtime"],
        sources="docs/context/ARCHITECTURE.md, .cursor/rules/game-engine.mdc",
        body="""
```
React shell (landing/lobby/intros/leaderboard/winner/modals)
        ↕ Zustand snapshots
GameEventBridge
        ↕ state in / intents out
Phaser 3 in-round gameplay
        ↕ typed Socket.IO
Node authoritative server (server/src/engine.ts)
        ↕ pure inputs/results
Shared types, config, game logic
```

`experiments/loot-drop/` is archived reference — do not import its stale protocol.

Ownership:

- `shared/src/types/index.ts` — socket/state types
- `shared/src/config/*` — named constants
- `shared/src/game/*` — pure resolvers + Vitest
- `server/src/engine.ts` — authority
- `server/src/rooms.ts` — rooms/reconnect/host
- `client/src/game/` — Phaser
- `client/src/` — React shell
""",
        related=["GameEventBridge Boundary", "Authoritative Server Model", "Phaser In Round Gameplay"],
    ))

    track("arch", note(
        "11-Architecture-Tech/GameEventBridge Boundary.md",
        title="GameEventBridge Boundary",
        status="LOCKED",
        area="architecture",
        implementation="PLAYABLE",
        tags=["architecture", "phaser"],
        sources=".cursor/rules/game-engine.mdc",
        body="""
`client/src/game/GameEventBridge.ts` is the only React/network ↔ Phaser boundary.

Phaser consumes snapshots and emits intents; scenes never import sockets or Zustand.
`PhaserGame.tsx` owns canvas lifecycle only.
""",
        related=["Active Architecture", "Phaser In Round Gameplay"],
    ))

    track("arch", note(
        "11-Architecture-Tech/Phaser In Round Gameplay.md",
        title="Phaser In Round Gameplay",
        status="LOCKED",
        area="architecture",
        implementation="PLAYABLE",
        tags=["architecture", "phaser"],
        sources="docs/context/ARCHITECTURE.md, .cursor/skills/phaser-vertical-slice/SKILL.md",
        body="""
Active in-round engine is Phaser 3 + TypeScript under `client/src/game/`.

React owns landing, lobby, intros, leaderboard, winner, modal overlays.

Do not migrate off Phaser unless 3D/native becomes a product requirement.
""",
        related=["Active Architecture", "GameEventBridge Boundary"],
    ))

    track("arch", note(
        "11-Architecture-Tech/Shared Pure Game Logic.md",
        title="Shared Pure Game Logic",
        status="LOCKED",
        area="architecture",
        implementation="PLAYABLE",
        tags=["architecture", "shared"],
        sources="AGENTS.md, .cursor/rules/code-quality.mdc",
        body="""
Pure logic in `shared/src/game/` — no IO, no React, no sockets — so it can be unit tested.

The server orchestrates; shared modules decide. New mechanics need Vitest coverage in `shared/src/game/__tests__/`.
""",
        related=["Named Constants Only", "Active Architecture"],
    ))

    track("arch", note(
        "11-Architecture-Tech/Strict TypeScript Policy.md",
        title="Strict TypeScript Policy",
        status="LOCKED",
        area="architecture",
        implementation="PLAYABLE",
        tags=["architecture", "typescript"],
        sources=".cursor/rules/code-quality.mdc",
        body="""
Use strict TypeScript everywhere; never weaken `tsconfig.base.json`.

Keep shared types centralised in `shared/src/types/index.ts`. Client and server import from `@treasure-trap/shared`.
""",
        related=["Socket Contract", "Shared Pure Game Logic"],
    ))

    track("arch", note(
        "11-Architecture-Tech/Quality Gate Commands.md",
        title="Quality Gate Commands",
        status="LOCKED",
        area="architecture",
        implementation="PLAYABLE",
        tags=["architecture", "ci"],
        sources="AGENTS.md, .cursor/rules/no-regression.mdc",
        body="""
Before finishing any change:

`pnpm typecheck && pnpm lint && pnpm test && pnpm build`

Keep `pnpm dev` working end-to-end: two browser windows must play a full game locally.
""",
        related=["Multiplayer Acceptance Loop", "No Regression Checklist"],
    ))

    track("arch", note(
        "11-Architecture-Tech/Dev Playtest Panel.md",
        title="Dev Playtest Panel",
        status="LOCKED",
        area="architecture",
        implementation="PLAYABLE",
        tags=["architecture", "debug"],
        sources=".cursor/rules/no-regression.mdc, docs/context/HANDOFF.md",
        body="""
Debug/playtest panel exists in **dev mode only** and is absent in production.

Still uses authoritative handlers. Used to add bots, skip timers, force chests.
""",
        related=["Quality Gate Commands", "Playtest Observation Checklist"],
    ))

    track("arch", note(
        "11-Architecture-Tech/No Regression Checklist.md",
        title="No Regression Checklist",
        status="LOCKED",
        area="architecture",
        implementation="PLAYABLE",
        tags=["architecture", "qa"],
        sources=".cursor/rules/no-regression.mdc",
        body="""
Never remove without explicit instruction:

- Room create/join/rejoin and 4-char codes
- Host migration
- Authoritative-server model
- Reveal event queue
- Score-gap/rank-aware power-up odds and arcade catalogue
- Secret mutiny + private-state isolation
- Dev playtest panel in dev / absent in prod
""",
        related=["Multiplayer Acceptance Loop", "Secret Mutiny"],
    ))

    # -------------------------------------------------------------------------
    # 12 UX Screens
    # -------------------------------------------------------------------------
    track("ux", note(
        "12-UX-Screens-HUD/React Shell Screens.md",
        title="React Shell Screens",
        status="LOCKED",
        area="ux",
        implementation="PLAYABLE",
        tags=["ux", "shell"],
        sources="docs/context/ARCHITECTURE.md, docs/context/UI_IMPLEMENTATION_SPEC.md",
        body="""
React owns: landing, lobby, intros, leaderboard, winner, modal/accessibility overlays.

In-round gameplay is Phaser. Shell transitions may use Framer Motion.

Do not over-polish menus beyond functional-and-on-theme while core scene has open weaknesses.
""",
        related=["Landing Screen Direction", "Lobby Screen Direction", "Phaser In Round Gameplay"],
    ))

    track("ux", note(
        "12-UX-Screens-HUD/Landing Screen Direction.md",
        title="Landing Screen Direction",
        status="PILOT",
        area="ux",
        implementation="PARTIAL",
        tags=["ux", "landing"],
        sources="docs/context/UI_IMPLEMENTATION_SPEC.md, design/concept/SHELL_UI_BATCH.md",
        body="""
Title/landing should read as one branded pirate composition: brand hero, short pitch, CTA into create/join.

Shell art packs live under `client/src/assets/higgsfield/shell/` and `design/concept/approved/shell/`.
""",
        related=["React Shell Screens", "Lobby Screen Direction"],
    ))

    track("ux", note(
        "12-UX-Screens-HUD/Lobby Screen Direction.md",
        title="Lobby Screen Direction",
        status="PILOT",
        area="ux",
        implementation="PARTIAL",
        tags=["ux", "lobby"],
        sources="docs/context/UI_IMPLEMENTATION_SPEC.md, design/concept/SHELL_UI_CHECKLIST.md",
        body="""
Lobby: room code, crew roster, match length, host start.

Functional and on-theme first. Harbour/deck backgrounds from voyage/shell asset packs.
""",
        related=["Room Create Join Rejoin", "React Shell Screens"],
    ))

    track("ux", note(
        "12-UX-Screens-HUD/Round Intro Screen.md",
        title="Round Intro Screen",
        status="PILOT",
        area="ux",
        implementation="PARTIAL",
        tags=["ux", "intro"],
        sources="docs/context/UI_IMPLEMENTATION_SPEC.md",
        body="""
Special/round intros teach rules in ≤4 short staged beats. Never expose secrets.

Intro video assets: `client/src/assets/higgsfield/intro/`.
""",
        related=["Special Round Framework", "Loot Drop Special Round"],
    ))

    track("ux", note(
        "12-UX-Screens-HUD/Gameplay HUD Overlays.md",
        title="Gameplay HUD Overlays",
        status="LOCKED",
        area="ux",
        implementation="PARTIAL",
        tags=["ux", "hud"],
        sources=".cursor/rules/visual-quality.mdc, docs/context/UI_IMPLEMENTATION_SPEC.md",
        body="""
Any React overlay during gameplay must be styled like game HUD (chunky, glowing, on-palette), not like a settings form.

Debug panel is the only exception.
""",
        related=["No Boring UI Rule", "Dev Playtest Panel"],
    ))

    track("ux", note(
        "12-UX-Screens-HUD/Mobile Portrait First.md",
        title="Mobile Portrait First",
        status="LOCKED",
        area="ux",
        implementation="PARTIAL",
        tags=["ux", "mobile"],
        sources="AGENTS.md, docs/context/ROADMAP.md",
        body="""
Mobile-first, portrait-friendly UI. Big buttons. Readable text.

Phase 2 roadmap includes portrait, reduced motion, keyboard/touch, and readable distortions; screenshot checks for 2/4/8 players.
""",
        related=["Typography and Readability", "Accessibility Reduced Motion"],
    ))

    track("ux", note(
        "12-UX-Screens-HUD/UI Review Open Questions.md",
        title="UI Review Open Questions",
        status="PILOT",
        area="ux",
        implementation="PARTIAL",
        tags=["ux", "questions"],
        sources="docs/context/UI_REVIEW_QUESTIONS.md",
        body="""
Owner questions for the next visual iteration live in `docs/context/UI_REVIEW_QUESTIONS.md`.

After meetings, capture answers in Inbox then promote into atomic notes here.
""",
        related=["Inbox", "Visual Direction Sentence"],
    ))

    # -------------------------------------------------------------------------
    # 13 Playtesting
    # -------------------------------------------------------------------------
    track("playtest", note(
        "13-Playtesting-Balance/Playtest Observation Checklist.md",
        title="Playtest Observation Checklist",
        status="PILOT",
        area="playtesting",
        implementation="PARTIAL",
        tags=["playtest", "process"],
        sources="docs/context/ROADMAP.md, docs/PLAYTEST_NOTES.md",
        body="""
For every session record:

- Player count, game length, build
- Completion/reconnect failures
- Trivia accuracy vs final rank
- Mutiny declarations and whether they caused discussion
- Item use/hold/discard by position
- Loot Drop allocation patterns and wildcard reactions
- Confusion, delight, frustration, replay requests
""",
        related=["Playtest Promotion Targets", "Dev Playtest Panel"],
    ))

    track("playtest", note(
        "13-Playtesting-Balance/Playtest Promotion Targets.md",
        title="Playtest Promotion Targets",
        status="PILOT",
        area="playtesting",
        implementation="NOT_STARTED",
        tags=["playtest", "gates"],
        sources="docs/context/ROADMAP.md",
        body="""
- Complete-game rate high enough for unattended friend tests
- Knowledge remains strongest predictor of winner
- Mutiny creates talk without dominating every question
- Players can explain item effects after seeing them once
- Chest opening remains exciting after repeats
- No high-severity secret-state or score-authority bug
""",
        related=["Playtest Observation Checklist", "Knowledge Usually Wins"],
    ))

    track("playtest", note(
        "13-Playtesting-Balance/Item Position Playtest.md",
        title="Item Position Playtest",
        status="IDEA",
        area="playtesting",
        implementation="NOT_STARTED",
        tags=["playtest", "items"],
        sources="docs/context/ITEMS.md",
        body="""
Playtest each item by position: record fun for user, victim, and bystanders at leader / middle / last.

Add use/victim/bystander playtest questions for every item.
""",
        related=["Item Design Principles", "Playtest Observation Checklist"],
    ))

    track("playtest", note(
        "13-Playtesting-Balance/Visual Self Review Gate.md",
        title="Visual Self Review Gate",
        status="PILOT",
        area="playtesting",
        implementation="PARTIAL",
        tags=["playtest", "visual"],
        sources="docs/VISUAL_SELF_REVIEW.md, docs/context/POLISH_PRODUCTION_PLAN.md",
        body="""
Visual quality gate is open. Current Phaser scenes historically used procedural/fallback art — why the game can feel unfinished. Stack is not the root cause; see polish production plan.

Do not polish menus beyond functional-and-on-theme while core scene weaknesses remain.
""",
        related=["Voyage Art Integration Status", "One Polished Slice at a Time"],
    ))

    # -------------------------------------------------------------------------
    # 14 Roadmap
    # -------------------------------------------------------------------------
    track("roadmap", note(
        "14-Roadmap-Open-Questions/Roadmap Phase Overview.md",
        title="Roadmap Phase Overview",
        status="PILOT",
        area="roadmap",
        implementation="PARTIAL",
        tags=["roadmap"],
        sources="docs/context/ROADMAP.md",
        body="""
Phases exit on **evidence**, not feature count:

0. One source of truth (context + status vocabulary) — mostly done; vault adds Obsidian side
1. Correct 10-question vertical slice
2. Pirate fleet question experience
3. Loot Drop production slice
4. Items and loot-box ceremony
5. Deployable remote alpha
6. Measured playtesting
7. Content expansion (one special at a time toward 12 + 3 finals)

Detail checklist items remain in `docs/context/ROADMAP.md` for Cursor integration.
""",
        related=["Loot Drop Special Round", "Remote Alpha Deployment", "One Polished Slice at a Time"],
    ))

    track("roadmap", note(
        "14-Roadmap-Open-Questions/Remote Alpha Deployment.md",
        title="Remote Alpha Deployment",
        status="IDEA",
        area="roadmap",
        implementation="NOT_STARTED",
        tags=["roadmap", "deploy"],
        sources="docs/context/ROADMAP.md, .cursor/skills/public-playtest-release/SKILL.md",
        body="""
Phase 5 targets: production client URL, long-lived Socket.IO server, strict CORS, health endpoint, WebSocket-capable host, static client with `VITE_SERVER_URL`, error monitoring, feedback link, build/version, mobile network verification.
""",
        related=["Roadmap Phase Overview", "No Accounts Prototype Boundary"],
    ))

    track("roadmap", note(
        "14-Roadmap-Open-Questions/Current Handoff Snapshot.md",
        title="Current Handoff Snapshot",
        status="PILOT",
        area="roadmap",
        implementation="PARTIAL",
        tags=["roadmap", "handoff"],
        sources="docs/context/HANDOFF.md",
        body="""
Mirror of key handoff truths (always verify against `docs/context/HANDOFF.md`):

- React shell + Phaser in-round + Socket.IO
- Excursion-first; casino at rewards
- 10Q + special; Loot Drop only polish target now
- Q5 item ceremony; mutiny after Q5; maroon skips defer across specials
- Prior-block wager; Poseidon + Shark logic exist; shark unique item still IDEA
- Streak bonuses unconfirmed pilot
- Voyage art wired; audio/colour/chest ceremony polish open
""",
        related=["Roadmap Phase Overview", "Voyage Art Integration Status", "Shark Head Unique Item"],
    ))

    track("roadmap", note(
        "14-Roadmap-Open-Questions/Open Design Questions Board.md",
        title="Open Design Questions Board",
        status="IDEA",
        area="roadmap",
        implementation="NOT_STARTED",
        tags=["roadmap", "questions"],
        sources="docs/context/ITEMS.md, docs/context/MECHANICS.md, docs/context/IDEA_BANK.md",
        body="""
Living board of undecided product questions:

- Item timing windows finalisation
- Chest frequency, inventory limits, streak → item?
- Streak scoring: keep / redesign / remove?
- Sword Fight richer design vs simple duel
- Shark unique item redesign
- Decaying reward curve playtest
- Second special round after Loot Drop gate
- Match-config special-round selection timing

Capture meeting answers in [[Inbox]], then promote into atomic notes and update statuses.
""",
        related=["Inbox", "Streak Bonus Pilot", "Item Timing Windows", "Shark Head Unique Item"],
    ))

    # -------------------------------------------------------------------------
    # 15 Rejected / Parked
    # -------------------------------------------------------------------------
    track("rejected", note(
        "15-Rejected-Parked/Casino Skin Everywhere.md",
        title="Casino Skin Everywhere",
        status="REJECTED",
        area="rejected",
        implementation="NOT_STARTED",
        tags=["rejected", "visual"],
        sources="docs/context/VISION.md, docs/context/VISUAL_DIRECTION.md",
        body="""
**Rejected direction:** covering ordinary sailing and questions in neon casino chrome.

**Why:** contrast is what makes reward moments exciting; the voyage loses identity.

**Replacement:** [[Selective Casino Excitement]] + [[Visual Zone B - Casino Spectacle]] only at earned peaks.
""",
        related=["Selective Casino Excitement", "Cartoon Pirate Excursion Fantasy"],
    ))

    track("rejected", note(
        "15-Rejected-Parked/Twelve Shallow Specials at Once.md",
        title="Twelve Shallow Specials at Once",
        status="REJECTED",
        area="rejected",
        implementation="NOT_STARTED",
        tags=["rejected", "process"],
        sources="docs/context/VISION.md, docs/context/ROADMAP.md",
        body="""
**Rejected process:** parallel-building a catalogue of shallow special rounds.

**Why:** breadth costs game feel; first slice must be excellent.

**Replacement:** [[One Polished Slice at a Time]] — polish [[Loot Drop Special Round]] first.
""",
        related=["One Polished Slice at a Time", "Special Round Framework"],
    ))

    track("rejected", note(
        "15-Rejected-Parked/Steal All Inventories Shark Effect.md",
        title="Steal All Inventories Shark Effect",
        status="REJECTED",
        area="rejected",
        implementation="NOT_STARTED",
        tags=["rejected", "items"],
        sources="docs/context/SPECIAL_ROUNDS.md",
        body="""
Working Shark Head effect of stealing **everyone's** items is rejected as too destructive — violates bounded-counterplay principles.

Preserve fantasy; redesign toward stealing one random eligible item with warning/protection. See [[Shark Head Unique Item]].
""",
        related=["Shark Head Unique Item", "Item Design Principles"],
    ))

    track("rejected", note(
        "15-Rejected-Parked/Accounts Payments Auth for Prototype.md",
        title="Accounts Payments Auth for Prototype",
        status="REJECTED",
        area="rejected",
        implementation="NOT_STARTED",
        tags=["rejected", "product"],
        sources="docs/context/VISION.md",
        body="""
Accounts, payments, public matchmaking, and databases are out of scope for the playtest prototype.

See [[No Accounts Prototype Boundary]].
""",
        related=["No Accounts Prototype Boundary", "Remote Alpha Deployment"],
    ))

    track("rejected", note(
        "15-Rejected-Parked/Generic Quiz Website Presentation.md",
        title="Generic Quiz Website Presentation",
        status="REJECTED",
        area="rejected",
        implementation="PARTIAL",
        tags=["rejected", "ux"],
        sources=".cursor/rules/no-boring-ui.mdc, .cursor/rules/visual-quality.mdc",
        body="""
Static answer cards, plain buttons, numeric inputs, emoji-as-art, motionless panels, and instant state swaps are banned in gameplay.

The product must never read as a quiz website with a pirate skin.
""",
        related=["No Boring UI Rule", "Regular Question Four Islands"],
    ))

    # -------------------------------------------------------------------------
    # Archive
    # -------------------------------------------------------------------------
    track("archive", note(
        "Archive/README.md",
        title="Archive",
        status="REJECTED",
        area="archive",
        implementation="NOT_STARTED",
        tags=["archive", "rejected"],
        sources="docs/context/INDEX.md",
        body="""
Historical and superseded material. **Not current product truth.**

Prefer `docs/context/` and the live area folders in this vault.

Useful for archaeology and “why we didn’t do X” — never for implementing new features without re-promotion.
""",
        related=["MOC - Archive", "Seven Round Prototype Era", "Archived Loot Drop Experiment"],
    ))

    track("archive", note(
        "Archive/Seven Round Prototype Era.md",
        title="Seven Round Prototype Era",
        status="REJECTED",
        area="archive",
        implementation="NOT_STARTED",
        tags=["archive", "history"],
        sources="docs/PRD.md, docs/GAME_DESIGN.md, docs/ARCHITECTURE.md",
        body="""
Older root docs (`docs/PRD.md`, `docs/GAME_DESIGN.md`, older architecture reviews) describe a superseded **seven-round** prototype.

Canonical match structure is now [[Match Structure 10 Question Blocks]].

Keep these docs in `docs/` for Cursor history; this note flags them as non-authoritative for new work.
""",
        related=["Match Structure 10 Question Blocks", "Archive"],
    ))

    track("archive", note(
        "Archive/Archived Loot Drop Experiment.md",
        title="Archived Loot Drop Experiment",
        status="REJECTED",
        area="archive",
        implementation="NOT_STARTED",
        tags=["archive", "phaser"],
        sources="experiments/loot-drop/, docs/context/ARCHITECTURE.md",
        body="""
`experiments/loot-drop/` is an archived Phaser vertical slice with a **stale protocol**.

Active Phaser lives under `client/src/game/`. Do not import the experiment's network/server modules.

Useful as art/animation reference only.
""",
        related=["Phaser In Round Gameplay", "Active Architecture", "Archive"],
    ))

    track("archive", note(
        "Archive/Historical Root Docs Index.md",
        title="Historical Root Docs Index",
        status="REJECTED",
        area="archive",
        implementation="NOT_STARTED",
        tags=["archive", "docs"],
        sources="docs/",
        body="""
Root `docs/` files that may mix current and historical content. Prefer `docs/context/` + this vault.

Notable historical / mixed files:

- `docs/PRD.md`
- `docs/GAME_DESIGN.md`
- `docs/ARCHITECTURE.md` (also see context version)
- `docs/PHASER_ARCHITECTURE.md`
- `docs/IMPLEMENTATION_PLAN.md`
- `docs/ROADMAP.md` (prefer `docs/context/ROADMAP.md`)
- `docs/LOOT_DROP_REBUILD_PLAN.md`
- `docs/GAME_ENGINE_DECISION.md`

When extracting ideas, create new IDEA notes — do not treat archived prose as LOCKED.
""",
        related=["Seven Round Prototype Era", "Archive"],
    ))

    track("archive", note(
        "Archive/Cursor Rules Snapshot Notes.md",
        title="Cursor Rules Snapshot Notes",
        status="LOCKED",
        area="archive",
        implementation="PLAYABLE",
        tags=["archive", "agents"],
        sources=".cursor/rules/",
        body="""
Non-negotiable agent rules also live in `.cursor/rules/*.mdc`. This vault duplicates their **product meaning** as atomic notes so humans can browse in Obsidian.

When a LOCKED rule changes, update: the rule file, relevant vault notes, `docs/context/`, and skills.

Key rule files: `product`, `no-regression`, `multiplayer-preservation`, `game-engine`, `loot-drop-vertical-slice`, `visual-quality`, `no-boring-ui`, `higgsfield-assets`, `code-quality`.
""",
        related=["How Agents Use This Vault", "No Regression Checklist"],
    ))

    # -------------------------------------------------------------------------
    # MOCs
    # -------------------------------------------------------------------------
    moc("_MOCs/MOC - Product Vision & Audience.md", "MOC - Product Vision & Audience",
        "Product pillars, audience, and non-goals.",
        {"Notes": titles["product"]})

    moc("_MOCs/MOC - Core Loop.md", "MOC - Core Loop",
        "Regular questions, match structure, captain, streaks.",
        {"Notes": titles["core"]})

    moc("_MOCs/MOC - Mutiny & Marooning.md", "MOC - Mutiny & Marooning",
        "Secret social mechanics after question 5.",
        {"Notes": titles["mutiny"]})

    moc("_MOCs/MOC - Items & Power-ups.md", "MOC - Items & Power-ups",
        "Catalogue, principles, acquisition, unique special-round items.",
        {
            "Principles & systems": ["Item Design Principles", "Item Timing Windows", "Item Acquisition and Chests", "Item Animation Acceptance Contract", "Score Gap Aware Item Odds"],
            "Catalogue": [t for t in titles["items"] if t not in {"Item Design Principles", "Item Timing Windows", "Item Acquisition and Chests", "Item Animation Acceptance Contract", "Score Gap Aware Item Odds"}],
        })

    moc("_MOCs/MOC - Special Rounds.md", "MOC - Special Rounds",
        "Framework, Loot Drop, and future special concepts.",
        {"Notes": titles["specials"]})

    moc("_MOCs/MOC - Special Events & Wildcards.md", "MOC - Special Events & Wildcards",
        "Wildcards inside special rounds and theme bank.",
        {"Notes": titles["wildcards"]})

    moc("_MOCs/MOC - Scoring & Economy.md", "MOC - Scoring & Economy",
        "Score invariants, reveals, named constants.",
        {"Notes": titles["scoring"] + ["Decaying Treasure Reward", "Streak Bonus Pilot", "Prior Block Wager Ledger"]})

    moc("_MOCs/MOC - Multiplayer & Social.md", "MOC - Multiplayer & Social",
        "Rooms, authority, secrets, reconnect.",
        {"Notes": titles["multiplayer"] + ["Deception Through Discussion"]})

    moc("_MOCs/MOC - Visual Direction & Animation.md", "MOC - Visual Direction & Animation",
        "Zones, motion grammar, fleet scene, event bank.",
        {"Notes": titles["visual"]})

    moc("_MOCs/MOC - Audio Juice & Game Feel.md", "MOC - Audio Juice & Game Feel",
        "Sound, chest ceremony, polish definition.",
        {"Notes": titles["audio"]})

    moc("_MOCs/MOC - Art Pipeline Higgsfield.md", "MOC - Art Pipeline Higgsfield",
        "Higgsfield prompts, provenance, concept pipeline.",
        {"Notes": titles["art"]})

    moc("_MOCs/MOC - Architecture & Tech.md", "MOC - Architecture & Tech",
        "Runtime, Phaser bridge, quality gates.",
        {"Notes": titles["arch"]})

    moc("_MOCs/MOC - UX Screens & HUD.md", "MOC - UX Screens & HUD",
        "React shell screens and HUD rules.",
        {"Notes": titles["ux"]})

    moc("_MOCs/MOC - Playtesting & Balance.md", "MOC - Playtesting & Balance",
        "Observation checklists and promotion targets.",
        {"Notes": titles["playtest"]})

    moc("_MOCs/MOC - Roadmap & Open Questions.md", "MOC - Roadmap & Open Questions",
        "Phases and living question board. Detail checklists stay in docs/context/ROADMAP.md.",
        {"Notes": titles["roadmap"]})

    moc("_MOCs/MOC - Rejected & Parked.md", "MOC - Rejected & Parked",
        "Ruled-out directions with reasons retained.",
        {"Notes": titles["rejected"]})

    moc("_MOCs/MOC - Archive.md", "MOC - Archive",
        "Historical material — not current truth.",
        {"Notes": titles["archive"]})

    # Root README for opening the vault
    write("README.md", f"""
{fm(title="Treasure Trap Obsidian Vault", status="LOCKED", area="meta", tags=["meta", "locked"], updated="2026-07-16")}

# Treasure Trap Obsidian Vault

Open **this folder** (`obsidian/`) as a vault in Obsidian.

## Dual source of truth

- **This vault** — granular ideas, mechanics, meetings, MOCs
- **`docs/` + `docs/context/`** — Cursor-integrated INDEX, HANDOFF, roadmap checklists

Agents are instructed to read **both**. See [[How Agents Use This Vault]] and `.cursor/rules/obsidian-vault.mdc`.

## Start

1. Open [[Home]]
2. Browse area MOCs under `_MOCs/`
3. Capture meeting dumps in [[Inbox]]

## Status tags

`LOCKED` · `PILOT` · `IDEA` · `REJECTED` — see [[Status Vocabulary]]
""")

    # Lightweight Obsidian config so tags work nicely
    (ROOT / ".obsidian").mkdir(exist_ok=True)
    write(".obsidian/app.json", """
{
  "alwaysUpdateLinks": true,
  "newFileLocation": "folder",
  "newFileFolderPath": "00-Inbox",
  "attachmentFolderPath": "00-Inbox/attachments",
  "showFrontmatter": true
}
""")
    write(".obsidian/core-plugins.json", """
{
  "file-explorer": true,
  "global-search": true,
  "switcher": true,
  "graph": true,
  "backlink": true,
  "outgoing-link": true,
  "tag-pane": true,
  "page-preview": true,
  "templates": true,
  "daily-notes": false,
  "outline": true,
  "word-count": true,
  "file-recovery": true
}
""")
    write(".obsidian/starred.json", """
{
  "items": [
    {"type": "file", "title": "Home", "path": "_MOCs/Home.md"},
    {"type": "file", "title": "Inbox", "path": "00-Inbox/README.md"},
    {"type": "file", "title": "Open Questions", "path": "14-Roadmap-Open-Questions/Open Design Questions Board.md"}
  ]
}
""")

    # Count
    md_count = sum(1 for _ in ROOT.rglob("*.md"))
    print(f"Wrote vault with {md_count} markdown files to {ROOT}")


if __name__ == "__main__":
    main()
