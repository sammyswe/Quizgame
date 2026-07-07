import { describe, expect, it } from "vitest";
import { SCORING } from "../../config/scoring.js";
import { normaliseAllocation, resolveLootDrop } from "../lootDrop.js";

describe("normaliseAllocation", () => {
  it("clamps totals to the loot pool", () => {
    expect(normaliseAllocation([100, 100, 0, 0])).toEqual([100, 0, 0, 0]);
    expect(normaliseAllocation([40, 30, 20, 10])).toEqual([40, 30, 20, 10]);
  });

  it("handles missing/negative/fractional input", () => {
    expect(normaliseAllocation(undefined)).toEqual([0, 0, 0, 0]);
    expect(normaliseAllocation([-10, 55.9, 0, 0])).toEqual([0, 55, 0, 0]);
  });
});

describe("resolveLootDrop", () => {
  it("keeps loot on the correct island and plunders the rest", () => {
    const res = resolveLootDrop(
      [
        { id: "a", nickname: "A", allocation: [60, 40, 0, 0] },
        { id: "b", nickname: "B", allocation: [0, 100, 0, 0] },
      ],
      0,
    );
    expect(res.lootDelta.a).toBe(60);
    expect(res.lootDelta.b ?? 0).toBe(0);
    expect(res.lost.a).toBe(40);
    expect(res.lost.b).toBe(100);
  });

  it("awards the Sunken Chest to the biggest loser", () => {
    const res = resolveLootDrop(
      [
        { id: "a", nickname: "A", allocation: [100, 0, 0, 0] },
        { id: "b", nickname: "B", allocation: [0, 100, 0, 0] },
      ],
      0,
    );
    expect(res.chests).toContainEqual({ playerId: "b", source: "sunken" });
  });

  it("confidence token pays when half+ of the pool survives, punishes otherwise", () => {
    const res = resolveLootDrop(
      [
        { id: "brave", nickname: "Brave", allocation: [80, 20, 0, 0], confident: true },
        { id: "bluffer", nickname: "Bluffer", allocation: [10, 90, 0, 0], confident: true },
      ],
      0,
    );
    expect(res.lootDelta.brave).toBe(80 + SCORING.CONFIDENCE_BONUS);
    expect(res.lootDelta.bluffer).toBe(Math.max(0, 10 - SCORING.CONFIDENCE_PENALTY));
  });

  it("honours trust pacts only when both biggest piles hit the correct island", () => {
    const res = resolveLootDrop(
      [
        { id: "a", nickname: "A", allocation: [70, 30, 0, 0] },
        { id: "b", nickname: "B", allocation: [60, 40, 0, 0] },
      ],
      0,
      [{ fromId: "a", toId: "b", accepted: true }],
    );
    expect(res.lootDelta.a).toBe(70 + SCORING.PACT_BONUS);
    expect(res.lootDelta.b).toBe(60 + SCORING.PACT_BONUS);
    expect(res.chests.some((c) => c.source === "honour")).toBe(true);
  });
});
