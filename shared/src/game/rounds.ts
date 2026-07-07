import type { GameLength, RoundId } from "../types/index.js";

export type RoundMeta = {
  id: RoundId;
  name: string;
  icon: string;
  tagline: string;
  /** One-line teach shown on the intro screen. The UI teaches the game. */
  howTo: string[];
  questionsInRound: number;
};

export const ROUNDS: Record<RoundId, RoundMeta> = {
  lootDrop: {
    id: "lootDrop",
    name: "Loot Drop",
    icon: "🪙",
    tagline: "Bet your gold on the right island.",
    howTo: [
      "Split 100 gold across 4 islands",
      "Wrong islands lose their gold",
      "Talk it out — lying allowed",
    ],
    questionsInRound: 2,
  },
  treasureAuction: {
    id: "treasureAuction",
    name: "Treasure Auction",
    icon: "🔨",
    tagline: "Bid in secret. Winner pays.",
    howTo: [
      "Secretly bid gold on a prize",
      "Highest bid wins — and pays",
      "Some prizes are junk...",
    ],
    questionsInRound: 1,
  },
  falseMap: {
    id: "falseMap",
    name: "False Map",
    icon: "🗺️",
    tagline: "One of the maps is a lie.",
    howTo: [
      "2 captains get clues — one clue is FALSE",
      "Everyone has a secret mission",
      "Spot a liar? Call MUTINY",
    ],
    questionsInRound: 1,
  },
  obscureIsland: {
    id: "obscureIsland",
    name: "Obscure Island",
    icon: "💎",
    tagline: "Rare answers pay more.",
    howTo: [
      "Several answers are correct",
      "The rarer your pick, the more you earn",
      "One is Fool's Gold — avoid it",
    ],
    questionsInRound: 1,
  },
  splitOrPlunder: {
    id: "splitOrPlunder",
    name: "Split or Plunder",
    icon: "⚖️",
    tagline: "One pot. Two pirates. No mercy.",
    howTo: [
      "Answer with a partner",
      "Then secretly: Split, Plunder or Guard",
      "Guard beats Plunder beats Split",
    ],
    questionsInRound: 1,
  },
  captainsChase: {
    id: "captainsChase",
    name: "Captain's Chase",
    icon: "⛵",
    tagline: "Hunt the leader. Steal their gold.",
    howTo: [
      "Correct answers move your ship",
      "Catch the Captain, take their gold",
      "The Captain escapes 3 times = bonus",
    ],
    questionsInRound: 3,
  },
  finalPlunder: {
    id: "finalPlunder",
    name: "Final Plunder",
    icon: "🏴‍☠️",
    tagline: "Last chance. Richest pirate wins.",
    howTo: [
      "Part of your gold is now SAFE",
      "Pick a secret move each question",
      "Attack, defend, or gamble it all",
    ],
    questionsInRound: 3,
  },
};

export const ROUND_ORDER: RoundId[] = [
  "lootDrop",
  "treasureAuction",
  "falseMap",
  "obscureIsland",
  "splitOrPlunder",
  "captainsChase",
  "finalPlunder",
];

/**
 * Legacy mini-game round plan (v1). The arcade structure in `config/arcade.ts`
 * supersedes this; kept for the classic mini-game modes and their tests.
 */
export const GAME_LENGTHS: Record<
  GameLength,
  { label: string; roundCount: number; blurb: string }
> = {
  test: { label: "Test", roundCount: 3, blurb: "3 rounds" },
  short: { label: "Short", roundCount: 3, blurb: "3 rounds" },
  medium: { label: "Medium", roundCount: 5, blurb: "5 rounds" },
  long: { label: "Long", roundCount: 7, blurb: "7 rounds" },
};

/** Build a round plan. Final Plunder always closes the game when included. */
export function buildRoundPlan(
  length: GameLength,
  picked?: RoundId[],
  rng: () => number = Math.random,
): RoundId[] {
  const count = GAME_LENGTHS[length].roundCount;
  if (length === "long") return [...ROUND_ORDER];

  let plan: RoundId[];
  if (picked && picked.length === count) {
    plan = [...picked];
  } else {
    const pool = ROUND_ORDER.filter((r) => r !== "finalPlunder");
    const shuffled = [...pool].sort(() => rng() - 0.5);
    plan = shuffled.slice(0, count - 1);
    plan.push("finalPlunder");
  }
  // Keep Final Plunder last for maximum drama.
  const withoutFinal = plan.filter((r) => r !== "finalPlunder");
  return plan.includes("finalPlunder") ? [...withoutFinal, "finalPlunder"] : plan;
}
