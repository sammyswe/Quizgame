# Higgsfield job provenance — beauty pass 2026-07-20

Model: `nano_banana_pro` @ 2k. STYLE FORMULA from `STYLE_FORMULA.txt`.

| asset | job id |
|---|---|
| bg-sea | 1db3202d-7067-4dd9-9328-a503d9219dd5 |
| map-cabin | c2fdca9d-6b42-49f3-a08c-41adf8c16c8b |
| thumb | 3d680940-6fde-4a8b-a009-9d15c6819066 |
| island-a | 3ebe7f61-eb66-4275-96f9-6153a74467ff |
| island-b | a7fb1304-1f57-4782-bf06-a6b436170d5f |
| island-c | 19a09bc1-cfe1-4827-b3d1-d3a5daf964c8 |
| island-d | 755057b1-6bf9-4ebe-aff8-01ac6aadf90a |
| ship-0 | cba4ba74-2be0-47f2-a4ae-60e5eeb12303 |
| ship-1 | 93866cd0-ee1b-4cc2-874a-a19819a075a3 |
| ship-2 | aadf8294-7bb4-4067-992e-3aae3d78833f |
| ship-3 | bc0f1d8b-2944-40ae-82b3-cfb1b6f4086b |
| coin | 652ede4e-c993-4bf1-a1b0-d2551ba03835 |
| chest-full | 2eb89652-3c32-4281-90de-5142baa43652 |
| chest-low | 0bd09b4b-4af1-4de2-8f3b-ba412607592b |
| wheel | fcfdd7ce-9888-4d0c-8d21-db614e919548 |
| crew-token | 8f4f8b9e-6656-4446-a5bf-3e37dabc9075 |
| fog | 5976f4be-8cb6-4a19-8760-3b72523753a5 |
| favicon | 14484a2c-37ca-4d7c-bb5a-ec8397c1526b |
| poseidon | 053f548e-12a9-4011-89ff-bced4c3985f6 |
| shark | 502ac99d-d941-4921-a949-ca4bd5306946 |
| portrait-0 | 9b8d7e2b-be42-4be8-bf57-ed107731feb2 |
| portrait-1 | ce7ebb71-5496-4f5c-b694-c914da17914b |
| portrait-2 | 5bc947b9-89d8-4590-a247-2fe34504f6d8 |
| portrait-3 | a18176eb-c8d6-4203-914c-dde079f3f192 |

Raw downloads in `raw/`; cutouts in `assets/`.

## Video + environment pack 2026-07-20d

| asset | job id | notes |
|---|---|---|
| bg-sea.jpg | b8e594d1-e40c-488a-936d-1b0271d617b5 | Rich archipelago backdrop (replaces plain lined water) |
| clouds.png | 05e7b87c-e284-4fa6-bee1-a935250d8b13 | Parallax cloud bank (green-key cutout) |
| reef-rocks.png | 645d0e0f-b68d-4ca5-bc8a-0e6d8f2461e3 | Mid-sea reef props |
| seagulls.png | 83b4f511-8f56-4142-977b-398477698023 | Ambient gulls |
| video/poseidon.mp4 | a05e4caf-b48a-41ea-a349-a7433d0a25fe | Seedance i2v from Poseidon still |
| video/loot-a.mp4 | ca4d806a-8b36-43ff-97a2-94994f7e1921 | Palm cove loot |
| video/loot-b.mp4 | 16382343-de29-4b0b-9a77-b5fc5a15c5b0 | Volcanic loot |
| video/loot-c.mp4 | cbd1c4b1-fbf9-4ed7-badf-953ac14cec6b | Jungle ruin loot |
| video/loot-d.mp4 | 6eea42be-071f-4b94-9643-53a5fd264d73 | Skull-rock loot |

Client: HUD chrome moved to bottom dock; island loot videos play on the quiz sea after sail arrival; Poseidon is full-screen video then gold summary.

## Ship flap + HUD/loot feel 2026-07-20e

| asset | job id |
|---|---|
| ship-0 flap sheet | 58f2fb3b-1187-4e1b-83f7-32f431d0f457 |
| ship-1 flap sheet | e4c00a68-c59e-41ce-868e-d6c19aaefb28 |
| ship-2 flap sheet | 85e3bfc8-94c2-4027-990c-f9c914477eb8 |
| ship-3 flap sheet | d9b149a6-5d8e-40ca-8e2a-bf6771c09fdb |

Ships: no water under hull; 3-frame sail wind cycle. HUD: scores+timer top only. Tap-to-loot plunder with haptics. Loot Drop wager fleet (1–4) from bottom to picked island only.

## Multi-angle ships + chest spin + scoreboard 2026-07-20f

| asset | job id |
|---|---|
| ship-0 8-dir sheet | dc751fbc-e5d6-499a-b143-53a2836460a7 |
| ship-1 8-dir sheet | 3f6e0055-b154-44ca-843f-d43c97e1d4bf |
| ship-2 8-dir sheet | 64696f65-85b4-4eb0-92ca-7d3699f83819 |
| ship-3 8-dir sheet | 1417fb10-8d58-4453-857c-c0aeead036c0 |
| bird flap strip | 4524fda0-d692-4a5a-8eea-864e9e8760f4 |
| chest spin sheet | 53d8030c-a6e2-48f3-bb60-77e8ebc0e01d |

Sailing is clamped to the painted centre water channel of `bg-sea.jpg` (full-screen playTop/playBottom + channel X). Backdrop is aligned so image water matches that corridor; side vignette marks beaches out-of-bounds. Chest jackpot plays inside `#worldFx` (scoreboard no longer kills it); empty wrong-island chests use sad SFX.
