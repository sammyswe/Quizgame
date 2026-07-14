# Island plunder cinematic prompts (Higgsfield)

Cloud-agent generation is currently blocked (`Invalid or expired token`). Run these
from a **local** Cursor agent with working Higgsfield MCP, then drop results into:

`client/src/assets/higgsfield/plunder/`

Register textures as:

| Theme | Frame keys (stills) | Or video key |
| --- | --- | --- |
| ruins | `plunder-ruins-0`, `-1`, `-2` | `plunder-ruins-video` |
| cave | `plunder-cave-0`… | `plunder-cave-video` |
| port | `plunder-port-0`… | `plunder-port-video` |
| temple | `plunder-temple-0`… | `plunder-temple-video` |

Runtime already looks for those keys in `IslandPlunderCeremony.ts` and falls back
to the authored Phaser choreography when missing.

Model suggestion: image `nano_banana_pro` 16:9 2k (3 keyframes) **or** video
`kling3_0_turbo` / `kling3_0` 16:9 ~4s.

Shared suffix:

> Treasure Trap, a 2–8 player cartoon pirate party quiz. Premium 2D mobile arcade
> game art, adventurous storybook pirate excursion, warm daylight, chunky shapes,
> thick dark outlines, glossy highlights, readable silhouettes, Brawl Stars energy,
> funny ages 9+, no text, no logos, no photorealism, no UI chrome.

## ruins — tropical stone ruins

**Keyframe 0 (arrive):** Colourful chunky pirate ships pull up to a tropical stone
ruins island; pirates leap from decks onto sandy beach toward ancient pillars.

**Keyframe 1 (plunder):** Pirates pry open carved chests nestled between broken
columns; gold coins and glowing relics burst upward in comic loot spray.

**Keyframe 2 (return):** Joyful pirates mid-jump back onto their ships with overstuffed
loot sacks; ships rocking, warm sunset rim light, ruins behind.

**Video one-shot:** Continuous 4s shot of the same arrive → plunder → jump-return beat
on the ruins island, camera gently orbiting, seamless game-cinematic loop-friendly ending.

## cave — rocky sea cave

**Keyframe 0:** Ships nose into turquoise sea-cave mouth; pirates splash onto wet
rocks with torch/glint highlights.

**Keyframe 1:** Inside the cave mouth they scoop pearl jars and glowing blue gems;
water sprays and comic sparkles.

**Keyframe 2:** Pirates dive/leap back to ships with pearl nets; cave glow behind.

## port — fortified pirate port

**Keyframe 0:** Ships dock at wooden wharf of a crimson-flag pirate port; crews
vault onto the pier (flags have no readable text).

**Keyframe 1:** Crates smash open; gold and rum barrels tumble; port lanterns glow warm.

**Keyframe 2:** Crews leap from dock back to decks with crates; ships shove off lively.

## temple — jungle temple

**Keyframe 0:** Ships beach near vine-covered jungle temple pyramid; pirates dash
ashore through fronds.

**Keyframe 1:** They lift a glowing idol / treasure from temple steps; vines whip,
leaf burst, warm green-gold light.

**Keyframe 2:** Mid-air jump back to ships with idol wrapped in leaf rope; temple
silhouetted behind.
