# Playtest Visual Checklist

Run through this before every playtest build. Two browsers minimum (one can
be an incognito window; bots via the debug panel also work).

## Setup

- [ ] `npm run dev` boots server (3001) and client (5173) with no errors.
- [ ] Landing renders the neon title, create/join card, no layout breaks.
- [ ] Create room -> lobby shows 4-letter code big enough to read across a room.
- [ ] Second browser joins with the code; both lobbies list both pirates.

## Scene (on START LOOT DROP)

- [ ] Full-screen animated ocean scene appears on BOTH clients (no white
      flash, no static screen).
- [ ] Waves scroll, fog drifts, sparkles twinkle, distant ships move.
- [ ] Four distinct islands bob, each with readable answer plaque + letter.
- [ ] Question banner shows round number and a counting-down timer.
- [ ] Your avatar, ship, 100-coin pile, Fear Shot slot, score ticker, RESET
      and LOCK IN are all on the dock.
- [ ] Other players appear as avatars on the screen edges.

## Interactions

- [ ] Tap island: coin flies from pile, counter +10, sparkle burst, blip.
- [ ] Drag coin from pile to island: ghost coin follows pointer, snaps in.
- [ ] Right-click island: coin flies back, counter -10.
- [ ] Cannot exceed 100 total ("NO LOOT LEFT!" pop).
- [ ] RESET returns everything with a coin burst.
- [ ] LOCK IN slams (squash -> LOCKED!, camera punch, sparkles) and the other
      client immediately shows your lock icon + confidence flag on your
      biggest island.
- [ ] Drag Fear Shot onto another player: reticle spins, their avatar glows
      red; release fires a shot on BOTH screens and the victim's avatar gets
      the scared jitter.

## Reveal (both lock in, or debug force reveal)

- [ ] Camera zooms; islands pulse one by one.
- [ ] Correct island glows gold with sparkles; wrong islands darken + red flash.
- [ ] Raider ships sail in ONLY to wrong islands holding loot.
- [ ] Three cannon volleys each: arcing cannonballs, impact flashes, splash,
      screen shake, skull stamp.
- [ ] Loot streams from wrong islands into the ships; "PLUNDERED -N" if you
      lost loot; avatars go shocked/angry.
- [ ] Ships retreat; payout coins stream to winners; "+N"; ticker rolls.
- [ ] Leaderboard slides in with correct scores on BOTH clients; winner
      avatar celebrates with crown.
- [ ] Next question resets everything cleanly (no leftover flags/skulls/tints).

## Modes

- [ ] `chaos` intensity visibly exaggerates particles/shake; `reduced` calms
      motion and disables shake.
- [ ] Asset toggle procedural-only still looks intentional (no missing
      textures) and restarts the scene without losing state.

## End

- [ ] After 5 questions, final standings screen; host can "SAIL AGAIN".
- [ ] Disconnecting the friend mid-round doesn't crash the host.
