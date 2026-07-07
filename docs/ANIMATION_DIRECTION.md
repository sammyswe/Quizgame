# Animation Direction

The animation identity of Treasure Trap: **Clash Royale energy on a neon pirate ocean.**
Everything moves like it has weight, treasure glitters, attacks land with impact, and the
sea never stops breathing.

## Principles

1. **Animations clarify, never hide.** Every effect answers "what just happened?" —
   a cannon blast means an attack landed, a curse aura means it reversed, sinking coins
   mean loot was lost. If an animation doesn't carry information or emotion, cut it.
2. **Weight and springs, not fades.** Cards _slam_, stamps _punch_, medals _pop_.
   Use the shared presets in `client/src/lib/animationPresets.ts` (SLAM/POP/SETTLE/SCREEN)
   instead of ad-hoc values so the whole game moves with one hand.
3. **Anticipation → impact → settle.** Big moments (chest opening, reveals) build tension
   (shake, glow, slot spin) before the payoff (burst, flash, card flyout).
4. **Constant ambient life, zero ambient noise.** Backgrounds drift (aurora, bubbles,
   fog, ships) at low opacity behind content. Ambient layers are `pointer-events-none`,
   never brighter than the content, and disabled at `reduced` intensity.
5. **One hero moment per screen.** The reveal card, the chest, the winner — everything
   else supports it. Two simultaneous hero animations cancel each other out.
6. **Readable at arm's length.** Points deltas ≥ text-sm, floats last ≥ 1s, flashes ≤ 0.5s
   and ≤ 50% opacity. Nothing critical is communicated _only_ through motion or colour.

## The vocabulary

| Moment                  | Treatment                                                                 |
| ----------------------- | ------------------------------------------------------------------------- |
| Answer lock             | Card punch + coin burst + LOCKED IN stamp + thunk                         |
| Attack lands            | CannonBlast (fireball, shockwave, smoke) + screen shake + orange flash    |
| Attack blocked/reversed | CurseAura green rings + reversal flash                                    |
| Loot lost               | SinkingCoins tumbling off the card + womp sound                           |
| Mutiny                  | Red flash + MUTINY! ink stamp + alarm                                     |
| Chest                   | Slam → chains snap → escalating shake → rarity slot → burst → card flyout |
| Score change            | AnimatedNumber rollup + FloatingText ±delta near the HUD counter          |
| New leader              | Banner pop + crown burst + alarm sting                                    |
| Winner                  | Fanfare + confetti + coin rain + avatar crown mood                        |

## Intensity

`lib/gameFeel.ts` exposes `reduced | normal | chaos` (persisted, defaults from
`prefers-reduced-motion`). `reduced` removes shake and caps particles at 3;
`chaos` doubles particle counts. The debug panel toggles it live. CSS loops are
globally collapsed by the `prefers-reduced-motion` block in `styles/index.css`.

## Timing rules of thumb

- Micro feedback (tap, hover): 80–150ms
- Card entrances: springs ~250–350 stiffness, stagger 80ms
- Hero reveals: 400–700ms entrance, hold ≥ 2.5s
- Full chest ceremony: ~4.5s, skippable after 1.2s
- Ambient loops: ≥ 2.5s cycles so they read as weather, not UI
