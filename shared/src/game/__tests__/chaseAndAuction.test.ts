import { describe, expect, it } from "vitest";
import { SCORING } from "../../config/scoring.js";
import { createChase, stepChase, CHASE_CONFIG } from "../captainsChase.js";
import { resolveBids } from "../auction.js";

const NAMES = { cap: "Cap", c1: "Chaser1", c2: "Chaser2" };

describe("captain's chase", () => {
  it("captain starts ahead", () => {
    const chase = createChase("cap", ["c1", "c2"]);
    expect(chase.positions.cap).toBe(CHASE_CONFIG.CAPTAIN_HEAD_START);
    expect(chase.positions.c1).toBe(0);
  });

  it("a chaser who catches the captain steals points", () => {
    const chase = createChase("cap", ["c1"]);
    chase.positions.c1 = CHASE_CONFIG.CAPTAIN_HEAD_START - 1;
    const result = stepChase(chase, new Set(["c1"]), NAMES, 1000);
    expect(result.finished).toBe(true);
    expect(result.chase.caughtBy).toBe("c1");
    expect(result.lootDelta.c1).toBe(SCORING.CHASE_CHASER_STEP_BONUS + SCORING.CHASE_CATCH_STEAL);
    expect(result.lootDelta.cap).toBe(-SCORING.CHASE_CATCH_STEAL);
  });

  it("the catch steal is capped by the captain's pool", () => {
    const chase = createChase("cap", ["c1"]);
    chase.positions.c1 = CHASE_CONFIG.CAPTAIN_HEAD_START;
    const result = stepChase(chase, new Set(["c1"]), NAMES, 80);
    expect(result.lootDelta.cap).toBe(-80);
  });

  it("captain escapes after surviving all questions", () => {
    let chase = createChase("cap", ["c1"]);
    let loot: Record<string, number> = {};
    for (let q = 0; q < CHASE_CONFIG.TOTAL_QUESTIONS; q++) {
      const r = stepChase(chase, new Set(["cap"]), NAMES, 500);
      chase = r.chase;
      loot = r.lootDelta;
    }
    expect(loot.cap).toBe(SCORING.CHASE_CAPTAIN_ESCAPE);
  });
});

describe("auction bids", () => {
  it("highest bid wins; ties go to the earliest bid", () => {
    expect(
      resolveBids([
        { playerId: "a", amount: 50, at: 2 },
        { playerId: "b", amount: 80, at: 3 },
        { playerId: "c", amount: 80, at: 1 },
      ]),
    ).toEqual({ winnerId: "c", amount: 80 });
  });

  it("returns undefined when nobody bids", () => {
    expect(resolveBids([{ playerId: "a", amount: 0, at: 1 }])).toBeUndefined();
    expect(resolveBids([])).toBeUndefined();
  });
});
