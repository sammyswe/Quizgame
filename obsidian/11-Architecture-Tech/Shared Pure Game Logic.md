---
title: Shared Pure Game Logic
status: LOCKED
implementation: PLAYABLE
area: architecture
tags: [architecture, shared, locked]
sources: AGENTS.md, .cursor/rules/code-quality.mdc
updated: 2026-07-16
---

# Shared Pure Game Logic

Pure logic in `shared/src/game/` — no IO, no React, no sockets — so it can be unit tested.

The server orchestrates; shared modules decide. New mechanics need Vitest coverage in `shared/src/game/__tests__/`.

## Related

- [[Named Constants Only]]
- [[Active Architecture]]
