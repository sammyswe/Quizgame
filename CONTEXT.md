# Treasure Trap — shared language

Short glossary entry point for agent skills. Canonical product routing lives in
`docs/context/INDEX.md` + the Obsidian vault (`obsidian/_MOCs/Home.md`). Keep terms
here tight; expand via `/domain-modeling` / `/grill-with-docs`.

## Product

| Term | Meaning |
| --- | --- |
| **Treasure Trap** | Cartoon pirate excursion party quiz for 2–8 live multiplayer players |
| **Fleet** | The group of player ships sailing together through a match |
| **Block** | A stretch of **10 regular questions**, then a **special round** |
| **Loot Drop** | The first/only special-round polish target (Million Pound Drop style allocation + reveal) |
| **Answer island** | One of four answer destinations players sail toward during a question |
| **Authoritative server** | Server owns phases, timers, scores, outcomes; clients send **intents** only |
| **Intent** | Client event (`answer:submit`, `item:use`, allocate/lock…) that never mutates game truth locally |
| **Reveal event** | Staged public score/outcome change; no silent score mutation |
| **Mutiny** | Secret allegiance choice (starts after question 5); private until reveal |
| **Power-up / item** | Bounded Mario Kart-style comeback tool; every attack has documented counterplay |
| **Higgsfield** | Preferred authored art pipeline; runtime fallbacks required |

## Status tags

`LOCKED` · `PILOT` · `IDEA` · `REJECTED` — see `docs/context/STATUS.md`. Code ≠ confirmed design.

## Avoid

- Calling the whole game a “casino reskin” — casino energy is reward peaks only
- Putting `correctIndex` or private allocations in public state mid-question
- Shipping Obsidian `IDEA` notes without an explicit promote request
- Weakening `tsconfig.base.json` or duplicating types outside `@treasure-trap/shared`

## Read next

- Task router: `docs/context/INDEX.md`
- Handoff: `docs/context/HANDOFF.md`
- ADRs from skills: `docs/adr/`
- Agent skill config: `docs/agents/`
