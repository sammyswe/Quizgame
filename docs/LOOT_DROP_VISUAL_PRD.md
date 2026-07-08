# Loot Drop Visual PRD

## Fantasy

You are a pirate gambling your loot on treasure islands in a neon casino
ocean at night. Every choice is a physical bet: coins leave your pile, land
on an island, and either come home doubled or get blasted off the map by
raider ships.

## Non-negotiables (the bar)

1. The active gameplay screen is a full-screen animated 2D scene — never a
   card list. Ocean, islands and ships are always moving.
2. Loot allocation is physical: coins are dragged or fly from the pile to the
   island. No numeric inputs.
3. LOCK IN is a slam: squash, shockwave sparkles, camera punch, sound.
4. Wrong answers are *attacked*, not dimmed: ships sail in, cannons fire,
   the screen shakes, skulls get stamped, loot is hauled away.
5. The correct island celebrates: gold glow, sparkles, payout coin stream,
   rolling score ticker, floating +N text.
6. Other players are visible characters (avatars with lock icons, confidence
   flags, reactions) — not rows in a list.
7. Camera is alive: idle drift, reveal zoom, impact shake, leaderboard pull-back.

## Scene layout (1280x720)

- Question banner top-centre with round number and countdown.
- Four answer islands: (330,240) (950,240) (330,470) (950,470), each with a
  lettered plaque, allocation badge, chip stack and planted confidence flags.
- Player dock strip along the bottom: your avatar, moored ship, coin pile
  (drag source), Fear Shot item slot, score ticker, RESET, LOCK IN.
- Other players stacked on the left/right edges.
- Leaderboard panel drops in from the top during the reveal.

## Reveal beat sheet

zoom in -> islands pulse in sequence -> correct island golds + camera pan ->
wrong islands darken/flash red -> raiders sail in -> 3 cannon volleys each
(shake + splash + skull stamp) -> plunder coin streams to ships + shocked/angry
reactions + "PLUNDERED -N" -> ships retreat -> payout streams + "+N" + ticker
roll + happy reactions -> camera out + leaderboard + winner celebration.

## Anti-goals for this pass

- Do not polish the other six rounds.
- Do not build menus beyond functional lobby/landing.
- Do not add audio assets (synth blips only, behind SoundEventBus).
