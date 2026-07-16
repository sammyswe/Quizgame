/**
 * Voyage quiz islands + mystery loot — LOCKED 2026-07-14 playtest direction.
 * Biomes are public; loot type stays secret until reveal.
 */

import type { IslandBiomeId, IslandLootId } from "../types/index.js";

export type { IslandBiomeId, IslandLootId };

/** Points awarded for correctly answering an island that reveals this loot. */
export const ISLAND_LOOT_POINTS: Record<IslandLootId, number> = {
  coins: 1,
  rubies: 2,
  emeralds: 5,
  pearls: 10,
  idol: 50,
  empty: 0,
};

export const ISLAND_LOOT_LABELS: Record<IslandLootId, string> = {
  coins: "Gold coins",
  rubies: "Rubies",
  emeralds: "Emeralds",
  pearls: "Pearl nest",
  idol: "Idol",
  empty: "Nothing",
};

/** Playable loot that can appear on islands (empty is for wrong/bust reveals). */
export const SCORING_LOOT_POOL: IslandLootId[] = ["coins", "rubies", "emeralds", "pearls", "idol"];

export const ISLAND_BIOMES: ReadonlyArray<{
  id: IslandBiomeId;
  label: string;
  blurb: string;
}> = [
  { id: "volcano", label: "Volcano Isle", blurb: "Cinder beaches and glowing vents" },
  { id: "jungle", label: "Jungle Isle", blurb: "Tangled palms and hidden ruins" },
  { id: "skull", label: "Skull Rock", blurb: "Bone cliffs and spooky caves" },
  { id: "lagoon", label: "Lagoon Isle", blurb: "Crystal shallows and coral rings" },
  { id: "shipwreck", label: "Shipwreck Cove", blurb: "Broken masts and barnacle gold" },
  { id: "ruins", label: "Sandbar Ruins", blurb: "Sunken columns in the flats" },
  { id: "lighthouse", label: "Lighthouse Cliff", blurb: "Storm lamps over steep cliffs" },
  { id: "mangrove", label: "Mangrove Maze", blurb: "Twisting roots and firefly glow" },
];

export const ISLAND_BIOME_IDS: IslandBiomeId[] = ISLAND_BIOMES.map((b) => b.id);

/** Pick 4 distinct biomes for a question (A–D). */
export function pickQuestionBiomes(rng: () => number = Math.random): IslandBiomeId[] {
  const pool = [...ISLAND_BIOME_IDS];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const a = pool[i]!;
    pool[i] = pool[j]!;
    pool[j] = a;
  }
  return pool.slice(0, 4);
}

/** Assign secret loot to all four islands (independent rolls). */
export function rollIslandLoot(rng: () => number = Math.random): IslandLootId[] {
  return [0, 1, 2, 3].map(() => {
    const i = Math.floor(rng() * SCORING_LOOT_POOL.length);
    return SCORING_LOOT_POOL[i]!;
  });
}
