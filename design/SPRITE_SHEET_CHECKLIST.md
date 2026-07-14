# Sprite sheet approval checklist

Status: `PENDING` → `CANDIDATE` → `APPROVED` / `NEEDS_REDO`  
Rule: finish reviewing **all sprite sheets** before integrating into Phaser. Backgrounds, key sprites, animations and audio wait until this list is closed.

Style lock: STYLE-001 (pirate excursion, thick outlines, Brawl Stars energy; casino only for chest).  
Model default: `nano_banana_pro`, `aspect_ratio: 1:1`, solid flat background for cutout.

| # | Asset ID | Grid | Contents | Prompt ready | Job ID | Local path | Status | Owner note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `sheet_answer_islands` | 2×2 | Tropical ruins, sea cave, pirate port, jungle temple | ✅ | | | PENDING | |
| 2 | `sheet_player_ships` | 4×2 | 8 coloured ships + captain golden-sail variant | ✅ | | | PENDING | |
| 3 | `sheet_pirate_avatars` | 4×2 | 8 distinct pirate portrait medallions | ✅ | | | PENDING | |
| 4 | `sheet_item_icons` | 4×4 | 13 item icons (cells 14–16 empty/spacer) | ✅ | | | PENDING | |
| 5 | `sheet_item_world_fx` | 4×2 | Cannonball, hook, parrot, net, flag, patch, glint, rum aura | ✅ | | | PENDING | |
| 6 | `sheet_chest_ceremony` | 3×2 | Closed → key → chain-break → glow → open → burst (Zone B casino) | ✅ | | | PENDING | |

## Review order

1. Generate a candidate for each row (this pass).
2. Owner reviews **each** sheet one by one (approve or redo with notes).
3. After **all six** are APPROVED, agent cutouts (`remove_background` / chroma_key), registers in manifests, and wires Phaser.
4. Only then: backgrounds, Poseidon/shark/maroon keys, audio.

## Approval criteria (every sheet)

- [ ] Readable at ~phone / HUD size (strong silhouette)
- [ ] Matches warm excursion look (except chest = casino Zone B)
- [ ] No text, logos, UI chrome, or watermark
- [ ] Even gaps between cells; consistent scale inside the sheet
- [ ] Cutout-friendly solid background (not busy scenery behind cells)
- [ ] Feels like one art set, not six different styles

## Job log

(append after each generation)

| When | Asset | Model | Job ID | Result |
| --- | --- | --- | --- | --- |
| 2026-07-14 | all six sheets | `nano_banana_pro` 2k 1:1 | — | **FAIL** `Invalid or expired token` (also `nano_banana_2`). Catalog/`models_explore` works; `generate_image` blocked until Higgsfield MCP is re-authenticated in Cursor. Prompts ready in `design/concept/SPRITE_SHEET_PROMPTS.md`. |

## Owner unblock

1. In Cursor: reconnect / re-auth the **Higgsfield** MCP server (token expired).
2. Confirm credits via plans/credits UI.
3. Reply **“token fixed — generate sheets”** and the agent will fire all six again in review order.
4. Approve or redo each sheet; integrate only after all six are APPROVED.
