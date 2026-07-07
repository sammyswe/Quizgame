import { SCORING } from "../config/scoring.js";
import type { Pact, RevealEvent } from "../types/index.js";
import { addDelta, ev } from "./reveal.js";
import type { ChestAward } from "./resolveQuestion.js";

/**
 * Loot Drop: every player splits LOOT_POOL loot across the 4 answer islands.
 * Loot on the correct island survives and converts to points; the rest is
 * plundered by pirate ships. Confidence tokens and trust pacts spice it up.
 */

export type LootDropPlayerInput = {
  id: string;
  nickname: string;
  allocation?: number[]; // length 4, sums <= LOOT_POOL
  confident?: boolean; // public confidence token
};

export type LootDropResolution = {
  events: RevealEvent[];
  lootDelta: Record<string, number>;
  chests: ChestAward[];
  /** loot lost per player (for Sunken Chest + drama). */
  lost: Record<string, number>;
};

/** Normalise a raw allocation: 4 slots, non-negative ints, total <= pool. */
export function normaliseAllocation(raw: number[] | undefined, pool = SCORING.LOOT_POOL): number[] {
  const alloc = [0, 0, 0, 0];
  if (!raw) return alloc;
  let remaining = pool;
  for (let i = 0; i < 4; i++) {
    const v = Math.max(0, Math.floor(raw[i] ?? 0));
    alloc[i] = Math.min(v, remaining);
    remaining -= alloc[i] ?? 0;
  }
  return alloc;
}

export function resolveLootDrop(
  players: LootDropPlayerInput[],
  correctIndex: number,
  pacts: Pact[] = [],
): LootDropResolution {
  const events: RevealEvent[] = [];
  const lootDelta: Record<string, number> = {};
  const chests: ChestAward[] = [];
  const lost: Record<string, number> = {};

  events.push(
    ev("correctAnswer", "The true island stands!", "Pirate ships descend on the wrong islands...", {
      icon: "🏝️",
    }),
  );

  for (const p of players) {
    const alloc = normaliseAllocation(p.allocation);
    const kept = alloc[correctIndex] ?? 0;
    const lostAmount = alloc.reduce((a, b) => a + b, 0) - kept;
    lost[p.id] = lostAmount;

    let gain = kept;
    let note = "";
    if (p.confident) {
      if (kept >= Math.floor(SCORING.LOOT_POOL / 2)) {
        gain += SCORING.CONFIDENCE_BONUS;
        note = ` +${SCORING.CONFIDENCE_BONUS} confidence bonus!`;
      } else {
        gain = Math.max(0, gain - SCORING.CONFIDENCE_PENALTY);
        note = ` -${SCORING.CONFIDENCE_PENALTY} for false bravado!`;
      }
    }
    addDelta(lootDelta, p.id, gain);

    if (lostAmount > 0) {
      events.push(
        ev("lootPlundered", `${p.nickname} loses ${lostAmount} loot!`, `${lostAmount} loot plundered from the wrong islands. ${kept} survived.${note}`, {
          icon: "🏴‍☠️",
          playerIds: [p.id],
          pointsDelta: { [p.id]: gain },
        }),
      );
    } else {
      events.push(
        ev("scoreChanged", `${p.nickname} kept it all!`, `Every coin landed on the true island: +${gain}.${note}`, {
          icon: "💰",
          playerIds: [p.id],
          pointsDelta: { [p.id]: gain },
        }),
      );
    }
  }

  // Trust pacts: if both pact members put their biggest pile on the correct island, both bonus.
  for (const pact of pacts.filter((x) => x.accepted)) {
    const a = players.find((p) => p.id === pact.fromId);
    const b = players.find((p) => p.id === pact.toId);
    if (!a || !b) continue;
    const aAlloc = normaliseAllocation(a.allocation);
    const bAlloc = normaliseAllocation(b.allocation);
    const aBest = aAlloc.indexOf(Math.max(...aAlloc));
    const bBest = bAlloc.indexOf(Math.max(...bAlloc));
    if (aBest === correctIndex && bBest === correctIndex) {
      addDelta(lootDelta, a.id, SCORING.PACT_BONUS);
      addDelta(lootDelta, b.id, SCORING.PACT_BONUS);
      chests.push({ playerId: a.id, source: "honour" });
      events.push(
        ev("scoreChanged", "Trust pact honoured! 🤝", `${a.nickname} and ${b.nickname} both trusted the true island: +${SCORING.PACT_BONUS} each, and an Honour Chest.`, {
          icon: "🤝",
          playerIds: [a.id, b.id],
          pointsDelta: { [a.id]: SCORING.PACT_BONUS, [b.id]: SCORING.PACT_BONUS },
        }),
      );
    } else if (aBest === correctIndex || bBest === correctIndex) {
      const sucker = aBest === correctIndex ? b : a;
      events.push(
        ev("missionFailed", "Pact broken!", `${sucker.nickname} followed the pact to the wrong island. Trust no one.`, {
          icon: "💔",
          playerIds: [a.id, b.id],
        }),
      );
    }
  }

  // Sunken Chest: whoever lost the most loot gets a comeback chest.
  const maxLost = Math.max(0, ...Object.values(lost));
  if (maxLost > 0) {
    const biggestLoser = players.find((p) => lost[p.id] === maxLost);
    if (biggestLoser) {
      chests.push({ playerId: biggestLoser.id, source: "sunken" });
      events.push(
        ev("chestEarned", "Sunken Chest surfaces! 🌊", `${biggestLoser.nickname} lost the most loot (${maxLost}) — the sea sends back a mystery chest.`, {
          icon: "🌊",
          playerIds: [biggestLoser.id],
        }),
      );
    }
  }

  return { events, lootDelta, chests, lost };
}
