---
title: Strict TypeScript Policy
status: LOCKED
implementation: PLAYABLE
area: architecture
tags: [architecture, typescript, locked]
sources: .cursor/rules/code-quality.mdc
updated: 2026-07-16
---

# Strict TypeScript Policy

Use strict TypeScript everywhere; never weaken `tsconfig.base.json`.

Keep shared types centralised in `shared/src/types/index.ts`. Client and server import from `@treasure-trap/shared`.

## Related

- [[Socket Contract]]
- [[Shared Pure Game Logic]]
