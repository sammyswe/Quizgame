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
    tagline: "Split your gold. Trust your gut. Watch the ships come.",
    howTo: [
      "Split 100 loot across the 4 answer islands",
      "Talk it out — persuade, bluff, mislead",
      "Wrong islands get PLUNDERED",
      "Feeling brave? Slam the confidence token",
    ],
    questionsInRound: 2,
  },
  treasureAuction: {
    id: "treasureAuction",
    name: "Treasure Auction",
    icon: "🔨",
    tagline: "Secretly bid your points for an edge. Or for a box of sand.",
    howTo: [
      "A prize appears before the question",
      "Secretly bid your points",
      "Highest bid wins and PAYS",
      "Beware the glittering crate...",
    ],
    questionsInRound: 1,
  },
  falseMap: {
    id: "falseMap",
    name: "False Map",
    icon: "🗺️",
    tagline: "Someone's map smells fake. Everyone gets a secret mission.",
    howTo: [
      "Two Captains get private clues — one clue is FALSE",
      "Everyone gets a secret mission",
      "Talk, lie, accuse, follow",
      "Spend your Mutiny Token to expose a deceiver",
    ],
    questionsInRound: 1,
  },
  obscureIsland: {
    id: "obscureIsland",
    name: "Obscure Island",
    icon: "💎",
    tagline: "Rare knowledge pays triple. Fool's Gold pays nothing.",
    howTo: [
      "Several answers are CORRECT",
      "Rarer picks score more (+200 solo!)",
      "One answer is Fool's Gold — obscure but wrong",
      "Dare to be different",
    ],
    questionsInRound: 1,
  },
  splitOrPlunder: {
    id: "splitOrPlunder",
    name: "Split or Plunder",
    icon: "⚖️",
    tagline: "You and a partner. One pot. Three buttons. No mercy.",
    howTo: [
      "You're paired with another pirate",
      "Answer the question together (or not)",
      "Then secretly: SPLIT, PLUNDER or GUARD",
      "Guard beats Plunder. Plunder beats Split. Split beats paranoia.",
    ],
    questionsInRound: 1,
  },
  captainsChase: {
    id: "captainsChase",
    name: "Captain's Chase",
    icon: "⛵",
    tagline: "The leader runs. The crew hunts. First to board, plunders.",
    howTo: [
      "The leader becomes the Captain, starting ahead",
      "Correct answers move ships",
      "Catch the Captain to steal their gold",
      "Captain escapes 3 questions = big bonus",
    ],
    questionsInRound: 3,
  },
  finalPlunder: {
    id: "finalPlunder",
    name: "Final Plunder",
    icon: "🏴‍☠️",
    tagline: "Three questions. Total chaos. The richest pirate wins.",
    howTo: [
      "Part of your score is now PROTECTED",
      "Pick a secret action before each question",
      "Leaders defend. Underdogs attack.",
      "Reveals happen one by one. Enjoy the carnage.",
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

export const GAME_LENGTHS: Record<GameLength, { label: string; roundCount: number; blurb: string }> = {
  short: { label: "Short Voyage", roundCount: 3, blurb: "3 rounds · ~15 min" },
  medium: { label: "Grand Voyage", roundCount: 5, blurb: "5 rounds · ~25 min" },
  full: { label: "Legendary Voyage", roundCount: 7, blurb: "All 7 rounds · ~35 min" },
};

/** Build a round plan. Final Plunder always closes the game when included. */
export function buildRoundPlan(
  length: GameLength,
  picked?: RoundId[],
  rng: () => number = Math.random,
): RoundId[] {
  const count = GAME_LENGTHS[length].roundCount;
  if (length === "full") return [...ROUND_ORDER];

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
