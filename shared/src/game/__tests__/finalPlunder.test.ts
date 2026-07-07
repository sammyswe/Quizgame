import { describe, expect, it } from "vitest";
import { SCORING } from "../../config/scoring.js";
import { FINAL_ACTIONS } from "../../config/finalActions.js";
import { offerFinalActions, resolveFinalQuestion, type FinalPlayerInput } from "../finalPlunder.js";

function player(id: string, overrides: Partial<FinalPlayerInput> = {}): FinalPlayerInput {
  return { id, nickname: id.toUpperCase(), score: 500, rank: 1, ...overrides };
}

describe("offerFinalActions", () => {
  it("offers 3 legal actions per tier", () => {
    const leaderOffers = offerFinalActions(1, 6, () => 0.42);
    expect(leaderOffers).toHaveLength(3);
    for (const a of leaderOffers) expect(FINAL_ACTIONS[a].tiers).toContain("leader");

    const bottomOffers = offerFinalActions(6, 6, () => 0.42);
    expect(bottomOffers).toHaveLength(3);
    for (const a of bottomOffers) expect(FINAL_ACTIONS[a].tiers).toContain("bottom");
  });
});

describe("resolveFinalQuestion", () => {
  it("pays FINAL_CORRECT for correct answers", () => {
    const res = resolveFinalQuestion({
      correctIndex: 0,
      players: [player("a", { choiceIndex: 0 }), player("b", { choiceIndex: 1, rank: 2 })],
    });
    expect(res.scoreDelta.a).toBe(SCORING.FINAL_CORRECT);
    expect(res.scoreDelta.b ?? 0).toBe(0);
  });

  it("betray the crew steals only unprotected points", () => {
    // Leader with 1000 at 70% protection → 300 unprotected.
    const res = resolveFinalQuestion({
      correctIndex: 0,
      players: [
        player("rat", { rank: 4, score: 100, choiceIndex: 0, action: { actionId: "betrayTheCrew", targetId: "leader" } }),
        player("leader", { rank: 1, score: 1000, choiceIndex: 1 }),
        player("mid", { rank: 2, score: 500, choiceIndex: 1 }),
        player("mid2", { rank: 3, score: 400, choiceIndex: 1 }),
      ],
    });
    expect(res.scoreDelta.rat).toBe(SCORING.FINAL_CORRECT + SCORING.BETRAY_STEAL);
    expect(res.scoreDelta.leader).toBe(-SCORING.BETRAY_STEAL);
  });

  it("steals are capped by the victim's unprotected pool", () => {
    // Bottom-tier victim: 100 score at 40% protection → 60 unprotected.
    const res = resolveFinalQuestion({
      correctIndex: 0,
      players: [
        player("rat", { rank: 1, score: 500, choiceIndex: 0, action: { actionId: "betrayTheCrew", targetId: "poor" } }),
        player("poor", { rank: 2, score: 100, choiceIndex: 1 }),
      ],
    });
    // 2-player game: rank 2 = bottom tier → 40% protected → 60 stealable.
    expect(res.scoreDelta.poor).toBe(-60);
    expect(res.scoreDelta.rat).toBe(SCORING.FINAL_CORRECT + 60);
  });

  it("captain's shield blocks the first attack", () => {
    const res = resolveFinalQuestion({
      correctIndex: 0,
      players: [
        player("rat", { rank: 3, score: 200, choiceIndex: 0, action: { actionId: "betrayTheCrew", targetId: "leader" } }),
        player("leader", { rank: 1, score: 1000, choiceIndex: 1, action: { actionId: "captainsShield" } }),
        player("mid", { rank: 2, score: 500, choiceIndex: 1 }),
      ],
    });
    expect(res.scoreDelta.leader ?? 0).toBe(0);
    expect(res.scoreDelta.rat).toBe(SCORING.FINAL_CORRECT);
    expect(res.events.some((e) => e.type === "itemBlocked")).toBe(true);
  });

  it("all-in plunder doubles on success and bleeds unprotected points on failure", () => {
    const win = resolveFinalQuestion({
      correctIndex: 0,
      players: [player("g", { rank: 2, choiceIndex: 0, action: { actionId: "allInPlunder" } }), player("x", { rank: 1, choiceIndex: 0 })],
    });
    expect(win.scoreDelta.g).toBe(SCORING.FINAL_CORRECT * SCORING.ALL_IN_MULTIPLIER);

    const lose = resolveFinalQuestion({
      correctIndex: 0,
      players: [player("g", { rank: 2, score: 500, choiceIndex: 1, action: { actionId: "allInPlunder" } }), player("x", { rank: 1, choiceIndex: 0 })],
    });
    expect(lose.scoreDelta.g).toBe(-SCORING.ALL_IN_PENALTY);
  });

  it("last cannon adds its bonus on a correct answer", () => {
    const res = resolveFinalQuestion({
      correctIndex: 0,
      players: [player("d", { rank: 2, choiceIndex: 0, action: { actionId: "lastCannon" } }), player("x", { rank: 1, choiceIndex: 1 })],
    });
    expect(res.scoreDelta.d).toBe(SCORING.FINAL_CORRECT + SCORING.LAST_CANNON_BONUS);
  });

  it("black flag bleeds every unshielded pirate when raised correctly", () => {
    const res = resolveFinalQuestion({
      correctIndex: 0,
      players: [
        player("flag", { rank: 3, score: 300, choiceIndex: 0, action: { actionId: "raiseTheBlackFlag" } }),
        player("v1", { rank: 1, score: 1000, choiceIndex: 1 }),
        player("v2", { rank: 2, score: 500, choiceIndex: 1 }),
      ],
    });
    expect(res.scoreDelta.v1).toBe(-SCORING.BLACK_FLAG_ALL_LOSE);
    expect(res.scoreDelta.v2).toBe(-SCORING.BLACK_FLAG_ALL_LOSE);
    expect(res.scoreDelta.flag).toBe(SCORING.FINAL_CORRECT + 2 * SCORING.BLACK_FLAG_ALL_LOSE);
  });
});
