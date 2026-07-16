---
title: Quality Gate Commands
status: LOCKED
implementation: PLAYABLE
area: architecture
tags: [architecture, ci, locked]
sources: AGENTS.md, .cursor/rules/no-regression.mdc
updated: 2026-07-16
---

# Quality Gate Commands

Before finishing any change:

`pnpm typecheck && pnpm lint && pnpm test && pnpm build`

Keep `pnpm dev` working end-to-end: two browser windows must play a full game locally.

## Related

- [[Multiplayer Acceptance Loop]]
- [[No Regression Checklist]]
