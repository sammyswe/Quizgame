import { describe, expect, it } from "vitest";
import { ARCADE, eventForRound, eventRounds } from "../../config/arcade.js";
import { rollPowerUp, POWERUPS_BY_RARITY } from "../../config/powerups.js";
import {
  potAt,
  resolveArcadeQuestion,
  streakBonus,
  type ArcadePlayerInput,
} from "../arcade.js";

const START = 1_000_000;
const DUR = 20_000;

function player(overrides: Partial<ArcadePlayerInput> & { id: string }): ArcadePlayerInput {
  return {
    nickname: overrides.id,
    score: 200,
    streak: 0,
    rank: 1,
    mutinied: false,
    skipped: false,
    rumRush: false,
    ...overrides,
  };
}

function resolve(
  players: ArcadePlayerInput[],
  extra: Partial<Parameters<typeof resolveArcadeQuestion>[0]> = {},
) {
  return resolveArcadeQuestion({
    correctIndex: 0,
    questionStartedAt: START,
    questionDurationMs: DUR,
    islandLoot: ["coins", "rubies", "emeralds", "pearls"],
    players,
    swordFights: [],
    poseidonUsed: new Set(),
    rng: () => 0.99, // no random events by default
    ...extra,
  });
}

describe("decaying pot", () => {
  it("drains from POT_MAX to POT_MIN (0) at the buzzer", () => {
    expect(potAt(START, START, DUR)).toBe(ARCADE.POT_MAX);
    expect(potAt(START + DUR, START, DUR)).toBe(ARCADE.POT_MIN);
  });

  it("pays roughly the midpoint halfway through", () => {
    const mid = potAt(START + DUR / 2, START, DUR);
    expect(mid).toBe(Math.round((ARCADE.POT_MAX + ARCADE.POT_MIN) / 2));
  });

  it("records lower potAtLock for slower locks (score uses island loot)", () => {
    const fast = player({ id: "fast", choiceIndex: 0, lockedAt: START + 1000 });
    const slow = player({ id: "slow", choiceIndex: 0, lockedAt: START + 18_000 });
    const res = resolve([fast, slow, player({ id: "third", choiceIndex: 1 })]);
    expect(res.results.fast!.potAtLock).toBeGreaterThan(res.results.slow!.potAtLock);
    expect(res.scoreDelta.fast).toBe(res.scoreDelta.slow);
  });

  it("awards mystery loot points on a correct answer", () => {
    const p = player({ id: "crew", choiceIndex: 0, lockedAt: START });
    const res = resolve([p], { islandLoot: ["idol", "coins", "coins", "coins"] });
    expect(res.scoreDelta.crew).toBe(50);
  });
});

describe("streaks", () => {
  it("no bonus below streak 2, capped at STREAK_BONUS_CAP", () => {
    expect(streakBonus(1)).toBe(0);
    expect(streakBonus(2)).toBe(ARCADE.STREAK_BONUS_PER);
    expect(streakBonus(99)).toBe(ARCADE.STREAK_BONUS_CAP);
  });

  it("grants a streak chest at STREAK_CHEST_AT", () => {
    const p = player({ id: "a", choiceIndex: 0, lockedAt: START, streak: 2 });
    const res = resolve([p, player({ id: "b", choiceIndex: 1 }), player({ id: "c", choiceIndex: 1 })]);
    expect(res.streaks.a).toBe(3);
    expect(res.chests.some((c) => c.playerId === "a" && c.source === "streak")).toBe(true);
  });

  it("wrong answer resets the streak", () => {
    const p = player({ id: "a", choiceIndex: 2, streak: 5 });
    const res = resolve([p, player({ id: "b" })]);
    expect(res.streaks.a).toBe(0);
  });
});

describe("mutiny", () => {
  it("taxes a wrong captain only when every eligible crew member mutinies", () => {
    const leader = player({ id: "lead", choiceIndex: 1 });
    const m1 = player({ id: "m1", choiceIndex: 0, lockedAt: START, mutinied: true });
    const m2 = player({ id: "m2", choiceIndex: 1, mutinied: true });
    const res = resolve([leader, m1, m2], { leaderId: "lead" });
    expect(res.results.m1?.mutiny).toBe("won");
    expect(res.scoreDelta.lead).toBe(-ARCADE.MUTINY_CAPTAIN_TAX_TOTAL);
    expect(res.scoreDelta.m1).toBe(ARCADE.MUTINY_CAPTAIN_TAX_TOTAL / 2);
    expect(res.scoreDelta.m2).toBe(ARCADE.MUTINY_CAPTAIN_TAX_TOTAL / 2);
  });

  it("gives unanimous mutineers nothing when the captain answers right", () => {
    const leader = player({ id: "lead", choiceIndex: 0, lockedAt: START });
    const m1 = player({ id: "m1", choiceIndex: 1, mutinied: true });
    const m2 = player({ id: "m2", choiceIndex: 1, mutinied: true });
    const res = resolve([leader, m1, m2], { leaderId: "lead" });
    expect(res.results.m1?.mutiny).toBe("lost");
    expect(res.scoreDelta.m1 ?? 0).toBe(0);
    expect(res.scoreDelta.m2 ?? 0).toBe(0);
    expect(res.scoreDelta.lead).toBeGreaterThan(0);
  });

  it("only forfeits answers for a divided mutiny", () => {
    const res = resolve(
      [
        player({ id: "lead", choiceIndex: 1 }),
        player({ id: "m1", choiceIndex: 0, mutinied: true }),
        player({ id: "m2", choiceIndex: 0, mutinied: true }),
        player({ id: "crew", choiceIndex: 0, lockedAt: START }),
      ],
      { leaderId: "lead" },
    );
    expect(res.scoreDelta.m1 ?? 0).toBe(0);
    expect(res.scoreDelta.m2 ?? 0).toBe(0);
    expect(res.scoreDelta.lead ?? 0).toBe(0);
    expect(res.scoreDelta.crew).toBe(1); // coins loot on correct island
  });

  it("a lone mutineer is marooned, win or lose", () => {
    const leader = player({ id: "lead", choiceIndex: 1 });
    const lone = player({ id: "lone", choiceIndex: 0, lockedAt: START, mutinied: true });
    const other = player({ id: "other", choiceIndex: 1 });
    const res = resolve([leader, lone, other], { leaderId: "lead" });
    expect(res.newlyMarooned).toContain("lone");
    expect(res.chests.some((c) => c.playerId === "lone" && c.source === "marooned")).toBe(true);
  });

  it("disables mutiny and marooning during onboarding", () => {
    const res = resolve(
      [
        player({ id: "lead", choiceIndex: 0, lockedAt: START }),
        player({ id: "m", choiceIndex: 1, mutinied: true }),
        player({ id: "crew", choiceIndex: 0, lockedAt: START }),
      ],
      { leaderId: "lead", socialMechanicsEnabled: false },
    );
    expect(res.newlyMarooned).toEqual([]);
    expect(res.events.some((e) => e.title.includes("MUTINY"))).toBe(false);
  });
});

describe("marooned (odd one out)", () => {
  it("maroons the only wrong player when everyone else is right", () => {
    const a = player({ id: "a", choiceIndex: 0, lockedAt: START });
    const b = player({ id: "b", choiceIndex: 0, lockedAt: START });
    const c = player({ id: "c", choiceIndex: 3 });
    const res = resolve([a, b, c]);
    expect(res.newlyMarooned).toEqual(["c"]);
    expect(res.results.c?.marooned).toBe(true);
  });

  it("skipped players earn nothing and keep their streak", () => {
    const a = player({ id: "a", choiceIndex: 0, lockedAt: START });
    const b = player({ id: "b", skipped: true, streak: 2 });
    const res = resolve([a, b]);
    expect(res.scoreDelta.b ?? 0).toBe(0);
    expect(res.results.b?.skipped).toBe(true);
    expect(res.streaks.b).toBe(2);
  });
});

describe("power-up interactions", () => {
  it("parrot copies the target's answer", () => {
    const target = player({ id: "target", choiceIndex: 0, lockedAt: START });
    const copier = player({ id: "copier", parrotTargetId: "target", lockedAt: START + 5000 });
    const res = resolve([target, copier, player({ id: "c", choiceIndex: 1 })]);
    expect(res.results.copier?.correct).toBe(true);
  });

  it("rum rush doubles the earnings and is consumed", () => {
    const p = player({ id: "a", choiceIndex: 0, lockedAt: START, rumRush: true });
    const plain = player({ id: "b", choiceIndex: 0, lockedAt: START });
    // two wrong players keep the dolphin burglary out of this test
    const res = resolve([p, plain, player({ id: "c", choiceIndex: 1 }), player({ id: "d", choiceIndex: 1 })]);
    expect(res.scoreDelta.a).toBe((res.scoreDelta.b ?? 0) * 2);
    expect(res.rumRushConsumed).toContain("a");
  });

  it("walk the plank: late answers score nothing", () => {
    const victim = player({
      id: "v",
      choiceIndex: 0,
      lockedAt: START + 10_000,
      plankUntil: START + 5_000,
    });
    const res = resolve([victim, player({ id: "b", choiceIndex: 1 })]);
    expect(res.results.v?.correct).toBe(false);
    expect(res.scoreDelta.v ?? 0).toBe(0);
  });

  it("walk the plank caps an on-time answer below the maximum pot", () => {
    const victim = player({
      id: "v",
      choiceIndex: 0,
      lockedAt: START,
      plankUntil: START + 5_000,
    });
    const res = resolve([victim, player({ id: "b", choiceIndex: 1 })]);
    expect(res.results.v?.potAtLock).toBe(ARCADE.PLANK_POT_CAP);
  });

  it("white flag forfeits the answer while preserving the streak", () => {
    const surrendered = player({
      id: "flag",
      choiceIndex: 0,
      lockedAt: START,
      streak: 4,
      surrendered: true,
    });
    const res = resolve([surrendered, player({ id: "b", choiceIndex: 1 })]);
    expect(res.scoreDelta.flag ?? 0).toBe(0);
    expect(res.streaks.flag).toBe(4);
    expect(res.results.flag?.skipped).toBeUndefined();
  });

  it("sword fight: the correct pirate steals from the wrong one", () => {
    const winner = player({ id: "w", choiceIndex: 0, lockedAt: START });
    const loser = player({ id: "l", choiceIndex: 1, score: 500 });
    const res = resolve([winner, loser, player({ id: "c", choiceIndex: 1 })], {
      swordFights: [{ byId: "w", targetId: "l" }],
    });
    expect(res.scoreDelta.w).toBeGreaterThanOrEqual(ARCADE.SWORD_FIGHT_STEAL);
    expect(res.scoreDelta.l).toBeLessThanOrEqual(-ARCADE.SWORD_FIGHT_STEAL);
  });
});

describe("random sea events", () => {
  it("dolphin burglary strikes when most players are right", () => {
    const players = ["a", "b", "c", "d"].map((id) =>
      player({ id, choiceIndex: 0, lockedAt: START, score: 400 }),
    );
    const res = resolve(players);
    const dolphin = res.events.find((e) => e.title.includes("DOLPHIN"));
    expect(dolphin).toBeDefined();
    // everyone lost a slice
    for (const p of players) {
      expect(res.scoreDelta[p.id]!).toBeLessThan(50 + ARCADE.STREAK_BONUS_CAP);
    }
  });

  it("kraken drags gold from the leader when the dice say so", () => {
    const leader = player({ id: "lead", choiceIndex: 1, score: 1000 });
    const other = player({ id: "o", choiceIndex: 1 });
    const res = resolve([leader, other], { leaderId: "lead", rng: () => 0 });
    const kraken = res.events.find((e) => e.title.includes("KRAKEN"));
    expect(kraken).toBeDefined();
    expect(res.scoreDelta.lead).toBeLessThan(0);
  });

  it("does not fire Poseidon during regular questions", () => {
    const leader = player({ id: "lead", choiceIndex: 0, lockedAt: START, score: 1000 });
    const poor = player({ id: "poor", choiceIndex: 1, score: 50 });
    const res = resolve([leader, poor, player({ id: "c", choiceIndex: 1, score: 500 })], {
      leaderId: "lead",
      rng: () => 0.3,
    });
    expect(res.poseidonBlessed).toHaveLength(0);
    expect(res.events.some((e) => e.title.includes("POSEIDON"))).toBe(false);
  });
});

describe("arcade schedule", () => {
  it("schedules an event every 10th round", () => {
    expect(eventRounds(10)).toEqual([10]);
    expect(eventRounds(30)).toEqual([10, 20, 30]);
    expect(eventRounds(70)).toHaveLength(7);
  });

  it("the first event is Million Pound Drop", () => {
    expect(eventForRound(10)).toBe("millionPoundDrop");
  });

  it("rolls power-ups from the right rarity pool", () => {
    for (const rarity of ["common", "rare", "epic", "legendary"] as const) {
      const rolled = rollPowerUp(rarity, () => 0.5);
      expect(POWERUPS_BY_RARITY[rarity]).toContain(rolled);
    }
  });
});
