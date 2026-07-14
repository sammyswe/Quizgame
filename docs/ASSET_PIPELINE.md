# Asset Pipeline

## Current state: zero binary assets

Everything is code: emoji glyphs, inline SVG (ships, islands, hats, stalactites),
CSS gradients/keyframes, Framer Motion, and WebAudio-synthesised sound. This keeps the
prototype instantly deployable and diff-reviewable.

## Placeholder → production map

| Placeholder today             | Eventual professional asset                                 |
| ----------------------------- | ----------------------------------------------------------- |
| 🎁 emoji chest                | Rigged chest sprite sheet (idle/shake/burst) or Lottie      |
| Emoji item icons (🔭🗡️☠️…)    | 15 illustrated item cards, one per item, same rarity frames |
| `PirateShip` inline SVG       | Illustrated ship set (captain + chaser variants)            |
| `Island` SVG humps            | Painted island set with per-round variants                  |
| `PirateAvatar` emoji+hat      | Avatar system: base characters × hats × expressions         |
| CSS aurora/fog/waves          | Parallax painted backdrop layers per round                  |
| WebAudio synth (`lib/sfx.ts`) | Recorded SFX + music loops, mapped via `lib/soundEvents.ts` |
| Emoji particles               | Sprite-based particle textures (coins, splinters, smoke)    |

## Rules for adding real assets later

1. Keep filenames semantic: `assets/items/crown-heist.png`, `assets/ships/captain.svg`.
2. Icons/illustrations: SVG preferred; raster at 2x for the max rendered size, WebP.
3. Swap points are already centralised — item art goes into `ItemCard`, chest art into
   `ChestModal`, ship art into `SceneBackdrop`'s `PirateShip`, sounds into `soundEvents.ts`.
   No screen-level changes should be needed.
4. Respect the palette in VISUAL_SYSTEM.md; art that fights the neon palette will glow wrong.
5. Keep total asset payload < 3MB for the web prototype; lazy-load round-specific art.
6. Sound files: short (<1.5s) UI stingers, -14 LUFS-ish, no licensing ambiguity.
