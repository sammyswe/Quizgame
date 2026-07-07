import { CHEST_ODDS, type RarityOdds } from "../config/chests.js";
import { ITEMS_BY_RARITY } from "../config/items.js";
import type { ItemId, Rarity } from "../types/index.js";
import { rankTier } from "./scoring.js";

/** Map a leaderboard rank to the chest-odds bucket. */
export function oddsForRank(rank: number, playerCount: number): RarityOdds {
  const tier = rankTier(rank, playerCount);
  switch (tier) {
    case "first":
      return CHEST_ODDS.first;
    case "second":
      return CHEST_ODDS.secondThird;
    case "bottom":
      return CHEST_ODDS.last;
    default:
      // 3rd place uses the secondThird bucket; everyone else mid-pack.
      return rank === 3 ? CHEST_ODDS.secondThird : CHEST_ODDS.middle;
  }
}

const RARITY_ORDER: Rarity[] = ["common", "rare", "epic", "legendary"];

/** Roll a rarity from odds. Pass rng for deterministic tests. */
export function rollRarity(odds: RarityOdds, rng: () => number = Math.random): Rarity {
  const roll = rng();
  let cumulative = 0;
  for (const rarity of RARITY_ORDER) {
    cumulative += odds[rarity];
    if (roll < cumulative) return rarity;
  }
  return "common";
}

/** Roll an item of the given rarity. */
export function rollItem(rarity: Rarity, rng: () => number = Math.random): ItemId {
  const pool = ITEMS_BY_RARITY[rarity];
  const picked = pool[Math.floor(rng() * pool.length)];
  return picked ?? pool[0] ?? "spyglass";
}

/** Full chest open: position-based rarity roll then item roll. */
export function openChest(
  rank: number,
  playerCount: number,
  rng: () => number = Math.random,
): { rarity: Rarity; itemId: ItemId } {
  const rarity = rollRarity(oddsForRank(rank, playerCount), rng);
  return { rarity, itemId: rollItem(rarity, rng) };
}
