# Shot List — Beauty vertical slice (3Q + Loot Drop)

Generate **stills first**. Integrate after cutout. Videos/motion refs only after hero stills lock.

STYLE FORMULA: paste from `design/STYLE_FORMULA.txt` byte-identical.

Key colour for sprites: **bright lime green (#00FF00)** solid background.

| id | kind | AR | description | zone | priority |
|---|---|---|---|---|---|
| bg-sea | background | 9:16 | three-quarter diorama tropical archipelago golden hour, layered parallax sky sea distant isles, empty of ships UI | excursion | P0 |
| island-a | sprite | 1:1 | palm cove answer island biome A, sandy beach coconut palms small dock, no letters | excursion | P0 |
| island-b | sprite | 1:1 | volcanic answer island biome B, warm rock glow gentle smoke palm tufts, no letters | excursion | P0 |
| island-c | sprite | 1:1 | jungle ruin answer island biome C, mossy stones vines waterfall trickle, no letters | excursion | P0 |
| island-d | sprite | 1:1 | cartoon skull-rock answer island biome D, friendly carved skull cliff nest, no letters | excursion | P0 |
| ship-0 | sprite | 1:1 | chunky pirate ship three-quarter, timber hull, vivid red sail and red flag, empty deck | excursion | P0 |
| ship-1 | sprite | 1:1 | chunky pirate ship three-quarter, timber hull, vivid blue sail and blue flag, empty deck | excursion | P0 |
| ship-2 | sprite | 1:1 | chunky pirate ship three-quarter, timber hull, vivid green sail and green flag, empty deck | excursion | P0 |
| ship-3 | sprite | 1:1 | chunky pirate ship three-quarter, timber hull, vivid gold sail and gold flag, empty deck | excursion | P0 |
| coin | sprite | 1:1 | glossy pirate gold coin, thick outline, readable at 48px | excursion | P0 |
| chest-full | sprite | 1:1 | overflowing treasure chest gold glow | reward | P0 |
| chest-low | sprite | 1:1 | nearly empty treasure chest few coins left urgency | excursion | P0 |
| wheel | sprite | 1:1 | ornate ship wheel brass wood lock-in prop | excursion | P0 |
| crew-token | sprite | 1:1 | tiny pirate crew token figure for loot allocation | excursion | P0 |
| fog | sprite | 1:1 | soft fog bank cloud for hidden rival sail | excursion | P1 |
| portrait-0 | sprite | 1:1 | cheeky pirate captain bust portrait red bandana, circular badge ready | excursion | P1 |
| portrait-1 | sprite | 1:1 | cheeky pirate captain bust portrait blue bandana, circular badge ready | excursion | P1 |
| poseidon | sprite | 1:1 | majestic then friendly cartoon Poseidon rising from sea with trident | excursion | P1 |
| shark | sprite | 1:1 | funny rubbery cartoon shark not scary ages 9+ | excursion | P1 |
| map-cabin | background | 9:16 | captain cabin treasure map table brass instruments warm lantern light empty of UI text | excursion | P1 |
| thumb | background | 16:9 | marketing cover fleet toward four biome islands golden hour no text | marketing | P0 |
| favicon | sprite | 1:1 | simple treasure chest icon app icon | marketing | P0 |

## Cinematic stills (optional P2 after P0 wired)

| id | beat |
|---|---|
| shot-commit | ship squash sail toward glowing island path |
| shot-correct | fleet cheer coins fireworks |
| shot-wrong | comic reef crash impact |
| shot-lock | hands turning wheel |
| shot-return | victorious ships return glowing chests Coin Master energy |
| shot-poseidon-save | Poseidon lifts ship comedic splash |

## Integration order

1. bg-sea + 4 islands + 4 ships + coin + chests + wheel
2. Client diorama + sail commit + rivalry fog
3. Loot Drop cabin map + tokens + venture-by-venture reveal
4. Poseidon + shark stills
5. Audio beds/SFX (separate pass)
