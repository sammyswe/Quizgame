import { describe, expect, it } from "vitest";
import { SCORING } from "../../config/scoring.js";
import {
  applyDelta,
  clampScore,
  computeRanks,
  obscurePoints,
  protectedPct,
  rankTier,
  splitProtected,
} from "../scoring.js";

describe("score clamping", () => {
  it("never lets a score go below zero", () => {
    expect(clampScore(-50)).toBe(SCORING.MIN_SCORE);
    expect(clampScore(0)).toBe(0);
    expect(clampScore(120)).toBe(120);
  });

  it("applyDelta clamps at zero and reports the actual applied delta", () => {
    const { next, applied } = applyDelta(30, -100);
    expect(next).toBe(0);
    expect(applied).toBe(-30);
    expect(applyDelta(100, 50)).toEqual({ next: 150, applied: 50 });
  });
});

describe("obscure island scoring", () => {
  it("pays more for rarer correct picks", () => {
    expect(obscurePoints(true, 1)).toBe(SCORING.OBSCURE_SOLO);
    expect(obscurePoints(true, 2)).toBe(SCORING.OBSCURE_FEW);
    expect(obscurePoints(true, 3)).toBe(SCORING.OBSCURE_FEW);
    expect(obscurePoints(true, 4)).toBe(SCORING.OBSCURE_MANY);
    expect(obscurePoints(true, 7)).toBe(SCORING.OBSCURE_MANY);
  });

  it("pays nothing for wrong answers", () => {
    expect(obscurePoints(false, 1)).toBe(0);
  });
});

describe("rank tiers and final protection", () => {
  it("maps ranks to the right tiers", () => {
    expect(rankTier(1, 6)).toBe("first");
    expect(rankTier(2, 6)).toBe("second");
    expect(rankTier(4, 6)).toBe("middle");
    expect(rankTier(6, 6)).toBe("bottom");
  });

  it("uses the configured protected percentages", () => {
    expect(protectedPct(1, 6)).toBe(SCORING.PROTECTED_PCT.first);
    expect(protectedPct(2, 6)).toBe(SCORING.PROTECTED_PCT.second);
    expect(protectedPct(4, 6)).toBe(SCORING.PROTECTED_PCT.middle);
    expect(protectedPct(6, 6)).toBe(SCORING.PROTECTED_PCT.bottom);
  });

  it("splits protected/unprotected pools correctly", () => {
    const { protected: prot, unprotected } = splitProtected(1000, 1, 6);
    expect(prot).toBe(700);
    expect(unprotected).toBe(300);
    expect(prot + unprotected).toBe(1000);

    const bottom = splitProtected(500, 6, 6);
    expect(bottom.protected).toBe(200);
    expect(bottom.unprotected).toBe(300);
  });
});

describe("computeRanks", () => {
  it("ranks players by score with shared ranks for ties", () => {
    const ranks = computeRanks({ a: 300, b: 500, c: 300, d: 100 });
    expect(ranks.b).toBe(1);
    expect(ranks.a).toBe(2);
    expect(ranks.c).toBe(2);
    expect(ranks.d).toBe(4);
  });
});
