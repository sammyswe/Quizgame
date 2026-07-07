import type { ChestSource, Rarity } from "../types/index.js";

/**
 * Position-based rarity odds. "Position" is leaderboard rank bucket.
 * Lower-ranked players get better odds — Mario Kart style comeback tuning.
 * Each row must sum to 1.
 */
export type RarityOdds = Record<Rarity, number>;

export const CHEST_ODDS: Record<"first" | "secondThird" | "middle" | "last", RarityOdds> = {
  first: { common: 0.65, rare: 0.3, epic: 0.05, legendary: 0 },
  secondThird: { common: 0.5, rare: 0.35, epic: 0.13, legendary: 0.02 },
  middle: { common: 0.35, rare: 0.4, epic: 0.2, legendary: 0.05 },
  last: { common: 0.2, rare: 0.35, epic: 0.35, legendary: 0.1 },
};

export const CHEST_SOURCES: Record<ChestSource, { name: string; icon: string; blurb: string }> = {
  sunken: { name: "Sunken Chest", icon: "🌊", blurb: "Lost the most loot in Loot Drop" },
  captains: { name: "Captain's Chest", icon: "⚓", blurb: "Only player to get it right" },
  betrayal: { name: "Betrayal Chest", icon: "🗡️", blurb: "Completed a secret mission" },
  mutiny: { name: "Mutiny Chest", icon: "⚔️", blurb: "Correctly accused a deceiver" },
  survivor: { name: "Survivor Chest", icon: "🛟", blurb: "Dodged a trap" },
  streak: { name: "Streak Chest", icon: "🔥", blurb: "3 correct answers in a row" },
  underdog: { name: "Underdog Chest", icon: "🐙", blurb: "Last place checkpoint reward" },
  auction: { name: "Auction Chest", icon: "🔨", blurb: "Won at the Treasure Auction" },
  honour: { name: "Honour Chest", icon: "🤝", blurb: "Helped a crewmate — you both won" },
  revenge: { name: "Revenge Chest", icon: "😤", blurb: "Betrayed, plundered or wrongly accused" },
  debug: { name: "Debug Chest", icon: "🧪", blurb: "Forced from the playtest panel" },
};

export const RARITY_META: Record<Rarity, { label: string; color: string; glow: string }> = {
  common: { label: "Common", color: "#9ca3af", glow: "#9ca3af" },
  rare: { label: "Rare", color: "#22d3ee", glow: "#22d3ee" },
  epic: { label: "Epic", color: "#c084fc", glow: "#c084fc" },
  legendary: { label: "Legendary", color: "#fbbf24", glow: "#fbbf24" },
};
