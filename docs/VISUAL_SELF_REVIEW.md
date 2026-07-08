# Visual Self-Review

Honest assessment after the first Loot Drop vertical slice pass
(verified with automated two-browser playtests + screenshots).

## What was achieved

- Loot Drop is a full-screen Phaser 3 scene: animated ocean background
  (Higgsfield art), scrolling wave layers, drifting fog, ambient sparkles,
  bobbing islands, moored player ship, edge-mounted player avatars.
- Physical loot allocation: drag coins from the pile or tap islands (+10),
  right-click to remove; coins fly on bezier arcs with sparkle bursts; chip
  stacks grow on islands; hard 100-loot cap with feedback.
- Slammable LOCK IN with pulse/squash/slam, camera punch and confidence flags
  planted on other clients.
- The reveal is a 14.5s sequential cinematic: zoom, island pulses, gold
  correct island, red wrong islands, raider ships (Higgsfield sprites)
  sailing in, three cannon volleys with shake/splash/skull stamps, plunder
  coin streams, "PLUNDERED -N" / "+N" floating text, rolling score ticker,
  avatar reactions, leaderboard drop-in, winner crown.
- Fear Shot item targeting: drag a spinning reticle onto a player; they glow
  red, get shot on every client and jitter scared for 10s.
- Two-laptop multiplayer works end to end (rooms, join, host start, state
  sync, synced reveals, bots, reconnect-tolerant leave handling).
- Debug panel: bots, skip timer, force reveal, grant item, intensity modes
  (reduced/normal/chaos), asset mode toggle, sound toggle.

## Whether Higgsfield was used

**Yes.** Nine assets generated with `nano_banana_pro` via Higgsfield MCP
(18 credits). Used directly in-game: A1 background, A2 island sheet (chroma-
keyed, quadrant-sliced), A3 ship sheet (player + raider frames). A4-A9 are in
the repo as style references with documented reasons and regeneration prompts
(`HIGGSFIELD_ASSET_TODO.md`).

## What still looks weak

1. **Coins/chips are procedural** and flatter than the Higgsfield art around
   them. Highest-impact quick win: generate single-coin sprites (TODO #1).
2. **Avatars are procedural medallions.** Charming but simple; distinct
   Higgsfield character portraits (TODO #3) plus the A6 expression sheet as
   reaction overlays would add a lot of personality.
3. **Lock-in button is procedural** while sitting next to painted art (TODO #2).
4. **HF island sprites vs plaques**: the painted islands are busy, so the
   plaque needs to carry answer readability alone; a subtle dark scrim behind
   plaque text could help on very bright islands.
5. **No audio identity** — synth blips only, by design this pass.
6. **Reveal pacing is fixed** (16s server window) even when nobody lost loot;
   could adapt to the drama level.
7. Enemy ships fire straight at islands but don't visibly "carry" loot away
   beyond the coin stream; a sinking/burning beat on heavy losses would sell
   the plunder harder.

## How to test with another player

See README "Play with a friend": `npm run dev`, share
`http://<host-lan-ip>:5173`, join with the room code. Solo testing: debug
panel -> Add bot -> Force reveal.

## Next visual iteration recommendations

1. Single-sprite Higgsfield coins/chips/button and character portraits
   (prompts ready in `HIGGSFIELD_ASSET_TODO.md`).
2. Slice A6 expressions into `PlayerAvatar.react()` overlays.
3. Timer as a burning fuse / draining rum bottle instead of text seconds.
4. Chest reward moment using A5 + A9 (already generated) when a player nets
   150+ in a round.
5. Water reflections under islands and ships (cheap flipped-alpha sprites).
6. Round intro stinger: question banner slams in, islands surface from the
   water one by one.
