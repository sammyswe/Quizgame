import { describe, expect, it } from "vitest";
import { OBSCURE_QUESTIONS, QUESTIONS, pickQuestions } from "../questions.js";
import { generateRoomCode, isValidRoomCode } from "../roomCode.js";
import { buildRoundPlan } from "../rounds.js";

describe("question bank", () => {
  it("has at least 60 questions with the required category mix", () => {
    expect(QUESTIONS.length).toBeGreaterThanOrEqual(60);
    const byCategory = (c: string) => QUESTIONS.filter((q) => q.category === c).length;
    expect(byCategory("general")).toBeGreaterThanOrEqual(15);
    expect(byCategory("geography")).toBeGreaterThanOrEqual(15);
    expect(byCategory("science")).toBeGreaterThanOrEqual(10);
    expect(byCategory("sport")).toBeGreaterThanOrEqual(10);
    expect(byCategory("culture")).toBeGreaterThanOrEqual(10);
  });

  it("every question has 4 options and a valid correctIndex", () => {
    for (const q of QUESTIONS) {
      expect(q.options, q.id).toHaveLength(4);
      expect(q.correctIndex, q.id).toBeGreaterThanOrEqual(0);
      expect(q.correctIndex, q.id).toBeLessThan(4);
    }
  });

  it("has unique ids", () => {
    const ids = new Set(QUESTIONS.map((q) => q.id));
    expect(ids.size).toBe(QUESTIONS.length);
  });

  it("pickQuestions respects the exclusion set", () => {
    const exclude = new Set(QUESTIONS.slice(0, 55).map((q) => q.id));
    const picked = pickQuestions(5, Math.random, exclude);
    for (const q of picked) expect(exclude.has(q.id)).toBe(false);
  });

  it("every obscure question has 2+ correct options and exactly one fool's gold", () => {
    for (const q of OBSCURE_QUESTIONS) {
      expect(q.options.filter((o) => o.correct).length, q.id).toBeGreaterThanOrEqual(2);
      expect(q.options.filter((o) => o.foolsGold).length, q.id).toBe(1);
      const fool = q.options.find((o) => o.foolsGold);
      expect(fool?.correct, q.id).toBe(false);
    }
  });
});

describe("room codes", () => {
  it("generates valid 4-char uppercase codes", () => {
    for (let i = 0; i < 50; i++) {
      const code = generateRoomCode();
      expect(code).toHaveLength(4);
      expect(isValidRoomCode(code)).toBe(true);
    }
  });
});

describe("round plans", () => {
  it("long plan includes all 7 rounds ending in Final Plunder", () => {
    const plan = buildRoundPlan("long");
    expect(plan).toHaveLength(7);
    expect(plan[plan.length - 1]).toBe("finalPlunder");
  });

  it("short plan has 3 rounds ending in Final Plunder", () => {
    const plan = buildRoundPlan("short");
    expect(plan).toHaveLength(3);
    expect(plan[plan.length - 1]).toBe("finalPlunder");
    expect(new Set(plan).size).toBe(3);
  });

  it("respects a manual round pick", () => {
    const plan = buildRoundPlan("short", ["lootDrop", "falseMap", "obscureIsland"]);
    expect(plan).toEqual(["lootDrop", "falseMap", "obscureIsland"]);
  });
});
