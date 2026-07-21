---
title: Special Round Framework
status: LOCKED
implementation: PARTIAL
area: special-rounds
tags: [special-rounds, framework, locked]
sources: docs/context/SPECIAL_ROUNDS.md
updated: 2026-07-16
---

# Special Round Framework

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

## Related

- [[Match Structure 10 Question Blocks]]
- [[Loot Drop Special Round]]
- [[Future Match Special Round Selection]]
