---
id: CTX-001
title: Decision status vocabulary
status: LOCKED
scope: global
updated: 2026-07-14
---

# Decision status vocabulary

Every mechanic, visual direction and roadmap entry must have one of these statuses. Status
describes certainty, not implementation completeness.

| Status | Meaning | Agent behaviour |
| --- | --- | --- |
| **LOCKED** | The product owner confirmed it. | Preserve it. Implementation gaps are TODOs, not permission to reinterpret it. |
| **PILOT** | It is implemented or selected for an active playtest, but its final form/balance is unproven. | Keep it playable, instrument observations, and change it only in service of the named test. |
| **IDEA** | It is worth retaining but has not been approved for production. | Discuss, prototype only when asked, and never present it as shipped or decided. |
| **REJECTED** | It was explicitly declined or superseded. | Do not revive it without new evidence and product-owner approval. |

## Two independent labels

Use both a **decision status** and an **implementation state**:

- `NOT_STARTED`
- `PARTIAL`
- `PLAYABLE`
- `POLISHED`
- `VERIFIED`

Example: secret mutiny can be `LOCKED + PLAYABLE`; streak bonuses can be `IDEA + PLAYABLE`.
This prevents existing code from being mistaken for a confirmed product decision.

## Promotion gates

- IDEA → PILOT: define the player behaviour being tested and a success/failure signal.
- PILOT → LOCKED: product-owner confirmation after playtest evidence.
- Any status → REJECTED: record why and what replaces it.
- LOCKED changes: require an explicit owner decision; update docs, rules, skills, code and tests.

## Wording rules

- **Must / will** means LOCKED.
- **Testing / current pilot** means PILOT.
- **Could / explore / later** means IDEA.
- Unknown numbers remain `TBD`; do not invent balance values to make a spec look complete.
- Never use a checkmark to mean both “confirmed” and “implemented.” Name both dimensions.
