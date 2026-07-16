---
id: VIS-006
title: Quiz question screen revamp
status: PILOT
scope: voyage-question
updated: 2026-07-14
---

# Quiz screen revamp (PILOT)

## Confirmed UX
- Full-bleed landscape sea; floating parchment question; mid-top draining pot (no numeric timer).
- Fleet Rank sidebar removed; scores on post-question leaderboard.
- First tap: zoom + rising flag. Second tap same island: lock. No confirm button.
- Ship sails toward pick only after lock (local foreshadow). Fleet race after everyone locked / pot 0.
- Scout ships + 3-letter monogram; gold/larger for tied #1 leaders.
- Pot drains 100→0; unanswered at 0 = no score. Correct score = mystery island loot points.
- Loot (coins1 / rubies2 / emeralds5 / pearls10 / idol50). Wrong island = empty vanish.
- 8 biomes; each question random 4 of 8 mapped A–D.
- HUD toggle. Compact booty.

## Art generated (Higgsfield)
- `bg-quiz-caribbean` job `16658030-…`
- `sheet-biomes` job `557e54ba-…`
- `sheet-scouts` job `875a5894-…`
- `sheet-pot-drain` job `6b400ac5-…`

## Visual rescue notes (2026-07-14)
Root cause of the “AI slop” screenshot: sprite sheets sliced on the wrong grid
(`setCrop` / stale `f0` frames) so biomes + scouts rendered as empty navy stubs.
Players collapsed to floating crowns; answer text sat on big wood cards; ambient
wave-sheet icons + coin streams read as collage junk.

## Pass — pot / select / fleet / plunder (2026-07-14)
- Pot chest sits LEFT of the question bar; continuous gold bar underneath;
  coin particles stream under the bar; chest frames cross-fade (no 1fps snap).
- Islands: smaller, wider 2×2 gutters; no fat glow rings; telescope vignette
  select (no camera zoom); second tap locks.
- Fleet: harbour row, monogram on hull only, leaders larger + gold tint, no crown/ring.
- Reveal: race by `lockedAt`; only correct ships full-plunder (pirates walk/smash/loot);
  wrong ships peek then sail home; biome stay on screen with per-biome vignettes.
- Higgsfield: `sheet-pot-drain` 3×3, `sheet-pirates`, `sheet-plunder-biomes`,
  `sheet-loot-particles`, `ui-chest-full/empty`.

## Pass — plunder cinematics + Q2 blank fix (2026-07-14)
- 8× Higgsfield plunder MP4s + intro → ByteDance **4K** (`3840×2160`).
- Plunder plays **full-bleed** over the canvas (not a corner plaque).
- Phaser host is a stable `fixed` mount outside AnimatePresence for
  question / reveal / leaderboard — the board overlay no longer remounts the game
  (that was the persistent blue Q2 blank).

## Still TODO
- Intro video: ship count = players + live names (queued).
- Ambient birds/distant sails loops beyond BG still.
