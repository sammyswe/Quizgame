# Treasure Trap — Product Requirements (Prototype v0.1)

## One sentence

Treasure Trap is a neon pirate casino party quiz where friends answer trivia, split loot,
bluff with fake maps, betray each other for treasure, open Mario Kart-style mystery chests,
and survive a chaotic final plunder to become the richest pirate at the table.

## Audience & tone

- 2–8 players, same room or voice call, separate devices.
- Gen Z / TikTok party-game energy, but suitable for ages 9+.
- Cheeky, fast, dramatic, bright, slick, funny. Premium but chaotic.

## Product principles

1. **Knowledge usually wins.** The most knowledgeable player should win ~75% of normal
   games. Items, deception and risk-taking decide the rest — and decide _close_ games.
2. **Discussion must matter.** Every round creates reasons to persuade, lie, accuse,
   trust, follow, or betray out loud.
3. **Easy to learn, deep to master.** The UI teaches each round in ≤4 short lines.
4. **Items are comeback tools.** Position-based chest odds (Mario Kart). Nothing unfair,
   nothing useless, everything counterable.
5. **Every action has a counter-action.** See docs/GAME_DESIGN.md § Counterplay map.
6. **Betrayal and helping both viable.** Pacts, Honour Chests, Follow Me vs Plunder,
   Backstab, Betray the Crew.

## Prototype scope (this repo)

- ✅ Host creates a room; gets a 4-char code + shareable link.
- ✅ Friends join from other laptops/phones via code/link, enter nicknames.
- ✅ Host picks Short (3), Medium (5) or Full (7 rounds); picks rounds or randomises.
- ✅ All 7 rounds playable: Loot Drop, Treasure Auction, False Map, Obscure Island,
  Split or Plunder, Captain's Chase, Final Plunder.
- ✅ 60-question hardcoded bank + 6 Obscure Island questions.
- ✅ 15 items, 10 chest sources, position-based rarity odds, chest-opening ceremony.
- ✅ Secret missions (6 fully auto-resolved, rest documented stubs).
- ✅ Mutiny tokens & accusations.
- ✅ Reveal event queue — every score change is a story beat.
- ✅ Bots + debug playtest panel (dev only).
- ✅ Solo simulation possible (1 human + bots).

## Explicit non-goals (prototype)

No accounts, no payments, no AI generation, no database, no matchmaking, no native app
(but UI is mobile-first for the eventual iPhone app), no moderation/profanity systems.

## Success criteria

Two friends on separate laptops can play a full game end-to-end with visible scores,
items/chests firing, a dramatic Final Plunder, and a winner screen — and it _looks_ like
a neon pirate casino, not a form.
