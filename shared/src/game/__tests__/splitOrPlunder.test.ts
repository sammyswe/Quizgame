import { describe, expect, it } from "vitest";
import { SCORING } from "../../config/scoring.js";
import { resolvePair, resolvePairOutcome } from "../splitOrPlunder.js";

describe("split or plunder outcome matrix", () => {
  it("split/split: fair reward for both", () => {
    const o = resolvePairOutcome("split", "split");
    expect(o.a).toBe(SCORING.SPLIT_SPLIT_EACH);
    expect(o.b).toBe(SCORING.SPLIT_SPLIT_EACH);
    expect(o.honour).toBe(true);
  });

  it("split/plunder: the plunderer profits", () => {
    const o = resolvePairOutcome("split", "plunder");
    expect(o.a).toBe(SCORING.PLUNDER_VICTIM);
    expect(o.b).toBe(SCORING.PLUNDER_WINNER);
    expect(o.b).toBeGreaterThan(o.a);
  });

  it("plunder/plunder: both get the cursed reward", () => {
    const o = resolvePairOutcome("plunder", "plunder");
    expect(o.a).toBe(SCORING.PLUNDER_PLUNDER_EACH);
    expect(o.b).toBe(SCORING.PLUNDER_PLUNDER_EACH);
    expect(o.a).toBeLessThan(SCORING.SPLIT_SPLIT_EACH);
  });

  it("guard blocks a plunder and earns the counter-bonus", () => {
    const o = resolvePairOutcome("guard", "plunder");
    expect(o.a).toBe(SCORING.GUARD_COUNTER_BONUS);
    expect(o.b).toBe(0);
  });

  it("guard vs split: splitter gains normal, guard slightly less", () => {
    const o = resolvePairOutcome("guard", "split");
    expect(o.b).toBe(SCORING.GUARD_VS_SPLIT_SPLITTER);
    expect(o.a).toBe(SCORING.GUARD_VS_SPLIT_GUARD);
    expect(o.a).toBeLessThan(o.b);
  });

  it("is symmetric", () => {
    const ab = resolvePairOutcome("plunder", "guard");
    const ba = resolvePairOutcome("guard", "plunder");
    expect(ab.a).toBe(ba.b);
    expect(ab.b).toBe(ba.a);
  });
});

describe("resolvePair", () => {
  it("only-correct player takes the solo reward with no dilemma", () => {
    const res = resolvePair(
      { id: "a", nickname: "A", correct: true, choice: "plunder" },
      { id: "b", nickname: "B", correct: false, choice: "split" },
    );
    expect(res.lootDelta.a).toBe(SCORING.SOLO_CORRECT_IN_PAIR);
    expect(res.lootDelta.b ?? 0).toBe(0);
  });

  it("neither correct: pot sinks", () => {
    const res = resolvePair(
      { id: "a", nickname: "A", correct: false },
      { id: "b", nickname: "B", correct: false },
    );
    expect(Object.keys(res.lootDelta)).toHaveLength(0);
  });

  it("betrayal grants the victim a revenge chest", () => {
    const res = resolvePair(
      { id: "a", nickname: "A", correct: true, choice: "split" },
      { id: "b", nickname: "B", correct: true, choice: "plunder" },
    );
    expect(res.chests).toContainEqual({ playerId: "a", source: "revenge" });
  });

  it("missing choice defaults to split", () => {
    const res = resolvePair(
      { id: "a", nickname: "A", correct: true },
      { id: "b", nickname: "B", correct: true },
    );
    expect(res.lootDelta.a).toBe(SCORING.SPLIT_SPLIT_EACH);
    expect(res.lootDelta.b).toBe(SCORING.SPLIT_SPLIT_EACH);
  });
});
