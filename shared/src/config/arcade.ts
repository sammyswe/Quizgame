import type { GameLength, SpecialEventId } from "../types/index.js";

/**
 * Arcade mode constants — the v2 game structure.
 * Rounds are single questions; every 10th round is a special event.
 */
export const ARCADE = {
  /** Social mechanics unlock and the onboarding item is granted after this regular question. */
  FIRST_ITEM_WINDOW: 5,
  /** A special event follows every N regular questions. */
  EVENT_EVERY: 10,

  // --- Decaying question pot (answer fast = earn more) ---
  POT_MAX: 100,
  POT_MIN: 30,

  // --- Streaks ---
  STREAK_BONUS_PER: 10, // +10 per streak level from streak 2 upward
  STREAK_BONUS_CAP: 50,
  STREAK_CHEST_AT: 3,
  WHITE_FLAG_PER_STREAK: 20,

  // --- Mutiny (ever-present, secret, simultaneous) ---
  MUTINY_REWARD: 40, // each mutineer, when the leader answers wrong
  MUTINY_LEADER_PENALTY: 60, // leader, when mutinied and wrong
  MUTINY_FAIL_PENALTY: 40, // each mutineer, when the leader answers right
  MUTINY_LEADER_DEFENSE: 20, // leader bonus per failed mutineer
  /** Total score the captain pays across the crew when a unanimous mutiny catches them wrong. */
  MUTINY_CAPTAIN_TAX_TOTAL: 60,

  // --- Marooned ---
  /** Marooned players skip the next question and get a bonus chest. */
  MAROON_MIN_PLAYERS: 3,

  // --- Random sea events ---
  DOLPHIN_THRESHOLD: 0.75, // fraction of players correct to trigger the burglary
  DOLPHIN_STEAL_PCT: 0.05,
  KRAKEN_CHANCE: 0.08, // per regular reveal
  KRAKEN_STEAL_PCT: 0.1, // of the leader's gold
  POSEIDON_BLESSING: 50,
  POSEIDON_POOR_PCT: 0.35, // "doing poorly" = below this fraction of the leader's gold
  POSEIDON_RESCUE_CHANCE: 0.5,
  SHARK_THRESHOLD: 0.75,
  SHARK_LOSS_PCT: 0.05,

  // --- Power-ups ---
  SWORD_FIGHT_STEAL: 60,
  SWORD_FIGHT_TIE_STEAL: 30,
  PLANK_SECONDS: 5,
  PLANK_POT_CAP: 80,

  // --- Million Pound Drop fallback (the live pool normally comes from blockLoot) ---
  MPD_POOL: 100,
} as const;

/** Round counts per game length. Test games are for quick playtests. */
export const ARCADE_LENGTHS: Record<GameLength, { label: string; rounds: number; blurb: string }> =
  {
    test: { label: "Test", rounds: 10, blurb: "10 rounds · quick playtest" },
    short: { label: "Short", rounds: 30, blurb: "30 rounds" },
    medium: { label: "Medium", rounds: 50, blurb: "50 rounds" },
    long: { label: "Long", rounds: 70, blurb: "70 rounds" },
  };

export const SPECIAL_EVENTS: Record<
  SpecialEventId,
  { name: string; icon: string; tagline: string; howTo: string[] }
> = {
  millionPoundDrop: {
    name: "Million Pound Drop",
    icon: "💷",
    tagline: "Your block's treasure. Four ventures. One returns.",
    howTo: [
      "Send your last 10 questions' treasure across four ventures",
      "Wrong ventures fail — that gold is gone",
      "Talk it out. Or don't.",
    ],
  },
};

/** Which rounds are special events for a given total. */
export function eventRounds(totalRounds: number, every = ARCADE.EVENT_EVERY): number[] {
  const out: number[] = [];
  for (let r = every; r <= totalRounds; r += every) out.push(r);
  return out;
}

/** The scheduled event for a given event round (cycles through the list; only MPD for now). */
export function eventForRound(_roundNumber: number): SpecialEventId {
  return "millionPoundDrop";
}
