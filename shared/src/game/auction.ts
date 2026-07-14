import type { AuctionPrizeId } from "../types/index.js";

/**
 * Treasure Auction lots. Players secretly bid points; highest bid wins and pays.
 * A rare cursed lot keeps bidders honest — never bid the hold on a shiny box.
 */
export type AuctionLot = {
  id: AuctionPrizeId;
  name: string;
  icon: string;
  description: string;
  /** Chance weight in the lot draw. */
  weight: number;
};

export const AUCTION_LOTS: AuctionLot[] = [
  {
    id: "mysteryChest",
    name: "Mystery Chest",
    icon: "🎁",
    description: "Could be anything. Probably treasure. Probably.",
    weight: 25,
  },
  {
    id: "spyglass",
    name: "Spyglass",
    icon: "🔭",
    description: "Removes one wrong answer next question.",
    weight: 20,
  },
  {
    id: "doubleReward",
    name: "Double Bounty Writ",
    icon: "📜",
    description: "Double gold if you answer the next question right.",
    weight: 20,
  },
  {
    id: "privateClue",
    name: "Whispered Clue",
    icon: "🤫",
    description: "A private clue for the next question.",
    weight: 20,
  },
  {
    id: "protectLoot",
    name: "Iron Strongbox",
    icon: "🔒",
    description: "Your round gold can't be stolen this round.",
    weight: 10,
  },
  {
    id: "cursedLot",
    name: "Glittering Crate",
    icon: "✨",
    description: "It sparkles magnificently. What could possibly go wrong?",
    weight: 5, // cursed: winner pays for... sand.
  },
];

export function drawAuctionLot(rng: () => number = Math.random): AuctionLot {
  const total = AUCTION_LOTS.reduce((sum, lot) => sum + lot.weight, 0);
  let roll = rng() * total;
  for (const lot of AUCTION_LOTS) {
    roll -= lot.weight;
    if (roll <= 0) return lot;
  }
  return AUCTION_LOTS[0] as AuctionLot;
}

/**
 * Resolve secret bids: highest wins (earliest bid breaks ties), pays their bid.
 * Bids above the player's affordable points are clamped by the server before this.
 */
export function resolveBids(
  bids: Array<{ playerId: string; amount: number; at: number }>,
): { winnerId: string; amount: number } | undefined {
  const positive = bids.filter((b) => b.amount > 0);
  if (positive.length === 0) return undefined;
  positive.sort((a, b) => b.amount - a.amount || a.at - b.at);
  const top = positive[0];
  if (!top) return undefined;
  return { winnerId: top.playerId, amount: top.amount };
}
