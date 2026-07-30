# Layout invariant — sea vs Q&A

Status: **LOCKED** (owner 2026-07-20, reinforced 2026-07-21 with screenshot rejection)

## Rules

1. Portrait mobile; **no page scroll** during questions.
2. The voyage canvas occupies a **dedicated sea band**.
3. The question / answer UI occupies a **dedicated sheet below** the sea band.
4. These sections **must not overlap**. The sheet must never crop islands.
5. **All four islands (A–D) must be fully visible** in the sea band at all times during
   question, reveal, and travel (unless a full-screen leaderboard or spectacle intentionally
   replaces the sea).
6. If baked art places lower islands too low, **recompose/crop the plate** into the sea band
   (with padding) — do not cover them with UI.

## Reject builds that

- Stretch a full-screen canvas underneath a bottom sheet
- Clip palm trees / island bases of C or D at the sheet divider
- Shrink islands until unreadable to “fit”

## Related

- `VOYAGE_VISUAL_DIRECTION.md`
- `REVEAL_CUTSCENE.md`
