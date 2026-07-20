# Treasure Trap: Voyage (Higgsfield Game)

Beauty vertical slice of Treasure Trap as a Higgsfield-hosted multiplayer browser game.

## Live

**https://lazy-crane-142.higgsfield.gg/**

- Game id: `001ac28c-b62c-4fca-9da9-9f9bda75b7c9`
- Mode: `logic.js` rules kernel (simultaneous turns + soft client countdown)
- Players: **2** (kernel seats at `minPlayers`)

## Loop

1. **Play vs Bot** (default practice) or invite a friend (`?room=`)
2. Nickname → raise sail
3. **3** pirate trivia questions — tap an island; ship sails; soft ~18s clock
4. Mini **Loot Drop** — allocate earned points to 4 ventures, lock in, multipliers + Poseidon rescue
5. Winner → Play again (same room; bot rematches if you chose bot)

Tip: `?bot=1` forces practice mode. The bot is a second WebSocket from your browser (~65% quiz accuracy).

## Layout

```
index.html      # canvas sea + HUD (relative assets)
logic.js        # authoritative rules (no timers/imports)
assets/         # islands (Higgsfield cutouts) + procedural pack
design/         # STYLE_FORMULA, assets.csv, gdd.json
```

## Redeploy

```bash
cd hf-treasure-trap
zip -r game.zip index.html logic.js assets design scripts -x '*.DS_Store' -x 'raw/*'
higgsfield game deploy ./game.zip \
  --game-id 001ac28c-b62c-4fca-9da9-9f9bda75b7c9 \
  --title "Treasure Trap: Voyage" \
  --description "…" \
  --thumbnail "<https cover>" \
  --favicon "<https icon>"
```

## Notes

- Higgsfield MCP was unavailable; assets via CLI + procedural fallback after daily grace gen limit.
- Soft timer (T1): clients send `{type:"timeout"}`; server validates `deadlineAt`.
- Path A (Phaser polish on main) remains the long-term product; this is the Path B beauty experiment.
