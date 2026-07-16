import { SCORING } from "../config/scoring.js";
import { ARCADE } from "../config/arcade.js";
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
  pool?: number;
  rank?: number;
  isLeader?: boolean;
  poseidonUsed?: boolean;
};

export type LootDropResolution = {
  events: RevealEvent[];
  lootDelta: Record<string, number>;
  chests: ChestAward[];
  /** loot lost per player (for Sunken Chest + drama). */
  lost: Record<string, number>;
  poseidonBlessed: string[];
  sharkRewardPlayerId?: string;
};

export type LootDropOptions = {
  rng?: () => number;
  enableWildcards?: boolean;
  /** The allocation pool already belongs to the player, so surviving loot is returned. */
  wagered?: boolean;
};

/** Normalise a raw allocation: 4 slots, non-negative ints, total <= pool. */
export function normaliseAllocation(
  raw: number[] | undefined,
  pool: number = SCORING.LOOT_POOL,
): number[] {
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
  options: LootDropOptions = {},
): LootDropResolution {
  const rng = options.rng ?? Math.random;
  const events: RevealEvent[] = [];
  const lootDelta: Record<string, number> = {};
  const chests: ChestAward[] = [];
  const lost: Record<string, number> = {};
  const grossPayout: Record<string, number> = {};
  const poseidonBlessed: string[] = [];
  let sharkRewardPlayerId: string | undefined;
  const allocations = new Map(
    players.map((p) => [p.id, normaliseAllocation(p.allocation, p.pool ?? SCORING.LOOT_POOL)]),
  );

  events.push(
    ev("correctAnswer", "The true island stands!", "Pirate ships descend on the wrong islands...", {
      icon: "🏝️",
    }),
  );

  if (options.enableWildcards) {
    const rescueCandidates = players
      .filter((p) => !p.isLeader && !p.poseidonUsed)
      .filter((p) => (allocations.get(p.id)?.[correctIndex] ?? 0) === 0)
      .sort((a, b) => (b.rank ?? 1) - (a.rank ?? 1));
    const rescued = rescueCandidates[0];
    if (rescued && rng() < ARCADE.POSEIDON_RESCUE_CHANCE) {
      const alloc = allocations.get(rescued.id) ?? [0, 0, 0, 0];
      const committed = alloc.reduce((sum, amount) => sum + amount, 0);
      const moved = [0, 0, 0, 0];
      moved[correctIndex] = committed;
      allocations.set(rescued.id, moved);
      poseidonBlessed.push(rescued.id);
      events.push(
        ev(
          "scoreChanged",
          "POSEIDON'S RESCUE! 🔱",
          `Poseidon lifts ${rescued.nickname}'s doomed treasure and carries it to the true island!`,
          {
            icon: "🔱",
            playerIds: [rescued.id],
            animation: "wave",
            intensity: "big",
          },
        ),
      );
    }
  }

  for (const p of players) {
    const pool = p.pool ?? SCORING.LOOT_POOL;
    const alloc = allocations.get(p.id) ?? normaliseAllocation(p.allocation, pool);
    const kept = alloc[correctIndex] ?? 0;
    const lostAmount = (options.wagered ? pool : alloc.reduce((a, b) => a + b, 0)) - kept;
    lost[p.id] = lostAmount;

    let gain = kept;
    let note = "";
    if (p.confident) {
      if (kept >= Math.floor(pool / 2)) {
        gain += SCORING.CONFIDENCE_BONUS;
        note = ` +${SCORING.CONFIDENCE_BONUS} confidence bonus!`;
      } else {
        gain = Math.max(0, gain - SCORING.CONFIDENCE_PENALTY);
        note = ` -${SCORING.CONFIDENCE_PENALTY} for false bravado!`;
      }
    }
    const delta = options.wagered ? gain - pool : gain;
    grossPayout[p.id] = gain;
    addDelta(lootDelta, p.id, delta);

    if (lostAmount > 0) {
      events.push(
        ev(
          "lootPlundered",
          `${p.nickname} loses ${lostAmount} loot!`,
          `${lostAmount} loot plundered from the wrong islands. ${kept} survived.${note}`,
          {
            icon: "🏴‍☠️",
            playerIds: [p.id],
            pointsDelta: { [p.id]: delta },
          },
        ),
      );
    } else {
      events.push(
        ev(
          "scoreChanged",
          `${p.nickname} kept it all!`,
          `Every coin landed on the true island: +${gain}.${note}`,
          {
            icon: "💰",
            playerIds: [p.id],
            pointsDelta: { [p.id]: delta },
          },
        ),
      );
    }
  }

  // Trust pacts: if both pact members put their biggest pile on the correct island, both bonus.
  for (const pact of pacts.filter((x) => x.accepted)) {
    const a = players.find((p) => p.id === pact.fromId);
    const b = players.find((p) => p.id === pact.toId);
    if (!a || !b) continue;
    const aAlloc = allocations.get(a.id) ?? normaliseAllocation(a.allocation, a.pool);
    const bAlloc = allocations.get(b.id) ?? normaliseAllocation(b.allocation, b.pool);
    const aBest = aAlloc.indexOf(Math.max(...aAlloc));
    const bBest = bAlloc.indexOf(Math.max(...bAlloc));
    if (aBest === correctIndex && bBest === correctIndex) {
      addDelta(lootDelta, a.id, SCORING.PACT_BONUS);
      addDelta(lootDelta, b.id, SCORING.PACT_BONUS);
      chests.push({ playerId: a.id, source: "honour" });
      events.push(
        ev(
          "scoreChanged",
          "Trust pact honoured! 🤝",
          `${a.nickname} and ${b.nickname} both trusted the true island: +${SCORING.PACT_BONUS} each, and an Honour Chest.`,
          {
            icon: "🤝",
            playerIds: [a.id, b.id],
            pointsDelta: { [a.id]: SCORING.PACT_BONUS, [b.id]: SCORING.PACT_BONUS },
          },
        ),
      );
    } else if (aBest === correctIndex || bBest === correctIndex) {
      const sucker = aBest === correctIndex ? b : a;
      events.push(
        ev(
          "missionFailed",
          "Pact broken!",
          `${sucker.nickname} followed the pact to the wrong island. Trust no one.`,
          {
            icon: "💔",
            playerIds: [a.id, b.id],
          },
        ),
      );
    }
  }

  if (options.enableWildcards && players.length >= ARCADE.MAROON_MIN_PLAYERS) {
    const backedCorrect = players.filter((p) => (allocations.get(p.id)?.[correctIndex] ?? 0) > 0);
    if (backedCorrect.length / players.length >= ARCADE.SHARK_THRESHOLD) {
      const delta: Record<string, number> = {};
      for (const p of players) {
        const payout = grossPayout[p.id] ?? 0;
        const bite = Math.round(payout * ARCADE.SHARK_LOSS_PCT);
        if (bite <= 0) continue;
        addDelta(lootDelta, p.id, -bite);
        delta[p.id] = -bite;
      }
      sharkRewardPlayerId = [...players].sort((a, b) => (b.rank ?? 1) - (a.rank ?? 1))[0]?.id;
      events.push(
        ev(
          "lootPlundered",
          "SHARK ATTACK! 🦈",
          "Too many crews found the treasure. Sharks tear a small share from every returning haul!",
          {
            icon: "🦈",
            playerIds: players.map((p) => p.id),
            pointsDelta: delta,
            animation: "plunder",
            intensity: "big",
          },
        ),
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
        ev(
          "chestEarned",
          "Sunken Chest surfaces! 🌊",
          `${biggestLoser.nickname} lost the most loot (${maxLost}) — the sea sends back a mystery chest.`,
          {
            icon: "🌊",
            playerIds: [biggestLoser.id],
          },
        ),
      );
    }
  }

  return { events, lootDelta, chests, lost, poseidonBlessed, sharkRewardPlayerId };
}
