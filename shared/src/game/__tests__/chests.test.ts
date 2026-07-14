import { describe, expect, it } from "vitest";
import { CHEST_ODDS } from "../../config/chests.js";
import { ITEMS_BY_RARITY } from "../../config/items.js";
import { oddsForRank, openChest, rollRarity } from "../chests.js";

describe("chest odds config", () => {
  it("all odds rows sum to 1", () => {
    for (const [bucket, odds] of Object.entries(CHEST_ODDS)) {
      const sum = odds.common + odds.rare + odds.epic + odds.legendary;
      expect(sum, `bucket ${bucket}`).toBeCloseTo(1, 10);
    }
  });

  it("leaders can never roll legendary", () => {
    expect(CHEST_ODDS.first.legendary).toBe(0);
  });

  it("last place has the best epic+legendary odds", () => {
    const strong = (o: { epic: number; legendary: number }) => o.epic + o.legendary;
    expect(strong(CHEST_ODDS.last)).toBeGreaterThan(strong(CHEST_ODDS.middle));
    expect(strong(CHEST_ODDS.middle)).toBeGreaterThan(strong(CHEST_ODDS.secondThird));
    expect(strong(CHEST_ODDS.secondThird)).toBeGreaterThan(strong(CHEST_ODDS.first));
  });
});

describe("oddsForRank", () => {
  it("maps positions to buckets (Mario Kart style)", () => {
    expect(oddsForRank(1, 6)).toBe(CHEST_ODDS.first);
    expect(oddsForRank(2, 6)).toBe(CHEST_ODDS.secondThird);
    expect(oddsForRank(3, 6)).toBe(CHEST_ODDS.secondThird);
    expect(oddsForRank(4, 6)).toBe(CHEST_ODDS.middle);
    expect(oddsForRank(6, 6)).toBe(CHEST_ODDS.last);
  });

  it("works for a 2-player game", () => {
    expect(oddsForRank(1, 2)).toBe(CHEST_ODDS.first);
    expect(oddsForRank(2, 2)).toBe(CHEST_ODDS.last);
  });
});

describe("rollRarity", () => {
  it("is deterministic given a seeded rng", () => {
    expect(rollRarity(CHEST_ODDS.last, () => 0.05)).toBe("common");
    expect(rollRarity(CHEST_ODDS.last, () => 0.3)).toBe("rare");
    expect(rollRarity(CHEST_ODDS.last, () => 0.7)).toBe("epic");
    expect(rollRarity(CHEST_ODDS.last, () => 0.95)).toBe("legendary");
  });

  it("matches configured odds over many rolls (statistical)", () => {
    const n = 20_000;
    let legendary = 0;
    for (let i = 0; i < n; i++) {
      if (rollRarity(CHEST_ODDS.last) === "legendary") legendary += 1;
    }
    const rate = legendary / n;
    expect(rate).toBeGreaterThan(0.07);
    expect(rate).toBeLessThan(0.13);
  });
});

describe("openChest", () => {
  it("returns an item of the rolled rarity", () => {
    const { rarity, itemId } = openChest(6, 6, () => 0.99);
    expect(rarity).toBe("legendary");
    expect(ITEMS_BY_RARITY.legendary).toContain(itemId);
  });
});
