---
id: MECH-003
title: Special-round framework
status: LOCKED
scope: special rounds after each 10-question block
updated: 2026-07-14
---

# Special rounds

Special rounds are high-stakes changes of pace after each 10-question block. They reuse the
knowledge core while changing risk, discussion and presentation. Build and polish them one at
a time.

## Framework

**LOCKED**

- One special round follows every 10 regular questions.
- Pre-match length determines the number of special rounds.
- Initially, the server randomises special-round types.
- A later option may let players choose the set, but the server randomises order.
- Content target: at least 12 special rounds and 3 special final rounds.
- Each special round contains 3–5 possible wildcard events.
- Wildcards create replayability and bounded catch-up pressure.
- Each special round owns one unique obtainable item.
- Wildcards and unique items require authored audiovisual sequences and reveal events.

**Selection safety**

- Avoid the same special twice in a row when at least two are available.
- Seed randomness for reproducible tests.
- Tell players the round rules in at most four short staged beats.
- Never expose secret answers or exact private allocations before reveal.

## Special 01 — Loot Drop / Million Pound Drop

**Decision: LOCKED · Implementation: PLAYABLE/PARTIAL · Current polish priority**

### Purpose

Turn the treasure earned through the preceding quiz block into a tense team discussion and
risk-allocation moment. Players send pirate forces toward possible answer islands; correct
ventures return with treasure, wrong ventures are eliminated/plundered.

### Rules

1. Each player wagers the points accumulated over the **previous 10 regular questions**.
2. Four answer ventures/islands correspond to the four choices.
3. Players distribute their available block loot among ventures in fixed, touch-friendly steps.
4. Players commit/lock their allocation.
5. Wrong ventures fail and their wager is lost; the correct venture returns its treasure.
6. Exact allocations remain private until reveal unless a named mechanic says otherwise.
7. The server resolves every allocation and clamps total scores at zero.

**Current mismatch:** the live event always allocates a fixed 100-gold pool and has no separate
block-loot ledger. The UI calls the options trapdoors rather than pirate ventures. This is a
functional PILOT, not the final locked implementation.

### Visual direction

The base remains a cartoon pirate operation: split crews/ships among ventures, watch them
depart, then reveal return or disaster sequentially. Casino intensity may rise during lock and
reveal, but should not replace the pirate-world cause and effect.

### Wildcard 01 — Poseidon's Rescue

**Decision: LOCKED · Implementation: WRONG CONTEXT/PARTIAL**

- Eligible when a struggling player backs a wrong venture.
- Poseidon rises from the sea, rescues that player's wager, and physically moves/returns it via
  the correct island.
- He may rarely help a mid-table player but never the current leader.
- Eligibility and chance are server-owned named constants.
- It must visibly identify why that player was eligible without revealing hidden odds.

The live game has a regular-question “Poseidon Rises” +50 event. It does not rescue a Loot Drop
allocation and must not be mistaken for this mechanic.

### Wildcard 02 — Shark Attack

**Decision: LOCKED · Implementation: NOT_STARTED**

- Eligible when a high majority of active players choose the correct venture.
- A shark fleet attacks and every affected player loses a small, bounded percentage.
- The lowest-ranked eligible player receives the special shark-themed item.
- Threshold, percentage, tie handling and once-per-round limits live in shared config.
- The reveal must stage the successful return first, then telegraph and resolve the attack so
  success never appears to be silently reduced.

### Unique item — shark concept

**Decision: IDEA · Implementation: NOT_STARTED**

Working name: **Shark Head**. Working effect: steal everyone's items. Both name and effect need
redesign; stealing all inventories is likely too destructive and violates bounded-counterplay
principles. Preserve the fantasy, not the exact effect. Candidate direction: summon a shark
raid that steals one random eligible item in total, with warning and protection options.

### Loot Drop polish gate

- [ ] Prior-block wager ledger and reconnect-safe state.
- [ ] Pirate venture interaction replacing form-like allocation.
- [ ] Lock-in feedback and private allocation sync.
- [ ] Cancellable sequential reveal.
- [ ] Poseidon rescue logic, tests, animation and sound.
- [ ] Shark Attack logic, tests, animation and sound.
- [ ] Unique shark item redesigned and playtested.
- [ ] Two-device full-block smoke test.
- [ ] At least three observed playtests with logged confusion/fun moments.

## Future special-round pipeline

Every proposed round must answer:

1. What knowledge skill does it reward?
2. What do players discuss, claim or bluff about?
3. What is the meaningful choice beyond answering?
4. How does a trailing player retain hope without nullifying expertise?
5. What are its 3–5 wildcards?
6. What is its unique item?
7. What is the 10-second visual pitch?
8. How does the server resolve it deterministically?
9. What evidence promotes it from IDEA to PILOT to LOCKED?

Future concepts are in [IDEA_BANK.md](IDEA_BANK.md), not in the active implementation queue.
