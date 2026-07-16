---
title: No Regression Checklist
status: LOCKED
implementation: PLAYABLE
area: architecture
tags: [architecture, qa, locked]
sources: .cursor/rules/no-regression.mdc
updated: 2026-07-16
---

# No Regression Checklist

Never remove without explicit instruction:

- Room create/join/rejoin and 4-char codes
- Host migration
- Authoritative-server model
- Reveal event queue
- Score-gap/rank-aware power-up odds and arcade catalogue
- Secret mutiny + private-state isolation
- Dev playtest panel in dev / absent in prod

## Related

- [[Multiplayer Acceptance Loop]]
- [[Secret Mutiny]]
