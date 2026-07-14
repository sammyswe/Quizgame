import { describe, expect, it } from "vitest";
import { SCORING } from "../../config/scoring.js";
import { resolveQuestion, type ResolvePlayerInput } from "../resolveQuestion.js";

function player(id: string, overrides: Partial<ResolvePlayerInput> = {}): ResolvePlayerInput {
  return {
    id,
    nickname: id.toUpperCase(),
    score: 200,
    roundLoot: 0,
    rank: 1,
    streak: 0,
    ...overrides,
  };
}

describe("base scoring", () => {
  it("gives BASE_CORRECT for a correct answer and 0 for wrong", () => {
    const res = resolveQuestion({
      correctIndex: 1,
      players: [player("a", { choiceIndex: 1 }), player("b", { choiceIndex: 0, rank: 2 })],
      effects: [],
      accusations: [],
    });
    expect(res.lootDelta.a).toBe(SCORING.BASE_CORRECT);
    expect(res.lootDelta.b ?? 0).toBe(0);
  });

  it("rum rush doubles the correct reward and is consumed", () => {
    const res = resolveQuestion({
      correctIndex: 0,
      players: [player("a", { choiceIndex: 0, rumRush: true })],
      effects: [],
      accusations: [],
    });
    expect(res.lootDelta.a).toBe(SCORING.BASE_CORRECT * SCORING.RUM_RUSH_MULTIPLIER);
    expect(res.rumRushConsumed).toContain("a");
  });

  it("streaks increment on correct and reset on wrong; every 3rd earns a chest", () => {
    const res = resolveQuestion({
      correctIndex: 0,
      players: [
        player("hot", { choiceIndex: 0, streak: 2 }),
        player("cold", { choiceIndex: 1, streak: 2, rank: 2 }),
      ],
      effects: [],
      accusations: [],
    });
    expect(res.streaks.hot).toBe(3);
    expect(res.streaks.cold).toBe(0);
    expect(res.chests).toContainEqual({ playerId: "hot", source: "streak" });
  });
});

describe("items", () => {
  it("copycat copies the target's answer", () => {
    const res = resolveQuestion({
      correctIndex: 2,
      players: [player("copier", { choiceIndex: 0 }), player("brain", { choiceIndex: 2, rank: 2 })],
      effects: [{ uid: "e1", itemId: "copycat", byId: "copier", targetId: "brain" }],
      accusations: [],
    });
    expect(res.effectiveChoices.copier).toBe(2);
    expect(res.lootDelta.copier).toBe(SCORING.BASE_CORRECT);
  });

  it("lucky doubloon consoles a wrong answer", () => {
    const res = resolveQuestion({
      correctIndex: 0,
      players: [player("a", { choiceIndex: 1 })],
      effects: [{ uid: "e1", itemId: "luckyDoubloon", byId: "a" }],
      accusations: [],
    });
    expect(res.lootDelta.a).toBe(SCORING.LUCKY_DOUBLOON_CONSOLATION);
  });

  it("backstab pays when the target is wrong, whiffs when right", () => {
    const hit = resolveQuestion({
      correctIndex: 0,
      players: [
        player("stabber", { choiceIndex: 0 }),
        player("victim", { choiceIndex: 1, rank: 2 }),
      ],
      effects: [{ uid: "e1", itemId: "backstab", byId: "stabber", targetId: "victim" }],
      accusations: [],
    });
    expect(hit.lootDelta.stabber).toBe(SCORING.BASE_CORRECT + SCORING.BACKSTAB_BONUS);
    expect(hit.chests).toContainEqual({ playerId: "victim", source: "revenge" });

    const whiff = resolveQuestion({
      correctIndex: 0,
      players: [
        player("stabber", { choiceIndex: 0 }),
        player("victim", { choiceIndex: 0, rank: 2 }),
      ],
      effects: [{ uid: "e1", itemId: "backstab", byId: "stabber", targetId: "victim" }],
      accusations: [],
    });
    expect(whiff.lootDelta.stabber).toBe(SCORING.BASE_CORRECT);
  });

  it("shipwreck sinks the target's unbanked loot when they are wrong", () => {
    const res = resolveQuestion({
      correctIndex: 0,
      players: [
        player("wrecker", { choiceIndex: 0 }),
        player("target", { choiceIndex: 1, roundLoot: 120, rank: 2 }),
      ],
      effects: [{ uid: "e1", itemId: "shipwreck", byId: "wrecker", targetId: "target" }],
      accusations: [],
    });
    expect(res.lootDelta.target).toBe(-120);
  });

  it("black spot pays everyone else when the marked pirate fails", () => {
    const res = resolveQuestion({
      correctIndex: 0,
      players: [
        player("marker", { choiceIndex: 0 }),
        player("marked", { choiceIndex: 3, rank: 2 }),
        player("bystander", { choiceIndex: 1, rank: 3 }),
      ],
      effects: [{ uid: "e1", itemId: "blackSpot", byId: "marker", targetId: "marked" }],
      accusations: [],
    });
    expect(res.lootDelta.marker).toBe(SCORING.BASE_CORRECT + SCORING.BLACK_SPOT_BONUS);
    expect(res.lootDelta.bystander).toBe(SCORING.BLACK_SPOT_BONUS);
    expect(res.lootDelta.marked ?? 0).toBe(0);
  });

  it("treasure switch swaps unbanked loot", () => {
    const res = resolveQuestion({
      correctIndex: 0,
      players: [
        player("swapper", { choiceIndex: 1, roundLoot: 10 }),
        player("rich", { choiceIndex: 1, roundLoot: 150, rank: 2 }),
      ],
      effects: [{ uid: "e1", itemId: "treasureSwitch", byId: "swapper", targetId: "rich" }],
      accusations: [],
    });
    expect(res.lootDelta.swapper).toBe(140);
    expect(res.lootDelta.rich).toBe(-140);
  });

  it("sneak's map pays per victim but not if the sneak steps in it", () => {
    const res = resolveQuestion({
      correctIndex: 0,
      players: [
        player("sneak", { choiceIndex: 0 }),
        player("mark1", { choiceIndex: 2, rank: 2 }),
        player("mark2", { choiceIndex: 2, rank: 3 }),
      ],
      effects: [{ uid: "e1", itemId: "sneaksMap", byId: "sneak", optionIndex: 2 }],
      accusations: [],
    });
    expect(res.lootDelta.sneak).toBe(SCORING.BASE_CORRECT + 2 * SCORING.SNEAKS_MAP_PER_VICTIM);

    const selfTrap = resolveQuestion({
      correctIndex: 0,
      players: [player("sneak", { choiceIndex: 2 }), player("other", { choiceIndex: 2, rank: 2 })],
      effects: [{ uid: "e1", itemId: "sneaksMap", byId: "sneak", optionIndex: 2 }],
      accusations: [],
    });
    expect(selfTrap.lootDelta.sneak ?? 0).toBe(0);
  });

  it("crown heist steals from the leader only on a correct answer", () => {
    const res = resolveQuestion({
      correctIndex: 0,
      players: [
        player("thief", { choiceIndex: 0, rank: 3 }),
        player("leader", { choiceIndex: 0, score: 1000, rank: 1 }),
      ],
      effects: [{ uid: "e1", itemId: "crownHeist", byId: "thief" }],
      accusations: [],
    });
    // Leader pool: 1000 score + 100 just earned = 1100 → 15% = 165
    expect(res.lootDelta.thief).toBe(SCORING.BASE_CORRECT + 165);
    expect(res.lootDelta.leader).toBe(SCORING.BASE_CORRECT - 165);
  });

  it("captain's curse reverses an attack and pays the curse owner", () => {
    const res = resolveQuestion({
      correctIndex: 0,
      players: [
        player("attacker", { choiceIndex: 0 }),
        player("warded", { choiceIndex: 1, roundLoot: 100, rank: 2 }),
      ],
      effects: [
        { uid: "c1", itemId: "captainsCurse", byId: "warded", targetId: "warded" },
        { uid: "e1", itemId: "shipwreck", byId: "attacker", targetId: "warded" },
      ],
      accusations: [],
    });
    // Shipwreck blocked: warded keeps loot, curse owner gets the reversal bonus.
    expect(res.lootDelta.warded).toBe(SCORING.CURSE_REVERSAL_BONUS);
    expect(res.cursesConsumed).toContain("warded");
  });

  it("fear shot blocks a mission; double agent shield absorbs the shot", () => {
    const blocked = resolveQuestion({
      correctIndex: 0,
      players: [
        player("shooter", { choiceIndex: 0 }),
        player("schemer", { choiceIndex: 0, rank: 2, mission: { missionId: "loneTreasure" } }),
      ],
      effects: [{ uid: "e1", itemId: "fearShot", byId: "shooter", targetId: "schemer" }],
      accusations: [],
    });
    expect(blocked.missionSuccesses).not.toContain("schemer");

    const absorbed = resolveQuestion({
      correctIndex: 0,
      players: [
        player("shooter", { choiceIndex: 1 }),
        player("agent", {
          choiceIndex: 0,
          rank: 2,
          hasAgentShield: true,
          mission: { missionId: "loneTreasure" },
        }),
      ],
      effects: [{ uid: "e1", itemId: "fearShot", byId: "shooter", targetId: "agent" }],
      accusations: [],
    });
    expect(absorbed.missionSuccesses).toContain("agent");
  });

  it("broadside duel: higher-ranked loser loses more", () => {
    const res = resolveQuestion({
      correctIndex: 0,
      players: [
        player("underdog", { choiceIndex: 0, rank: 4 }),
        player("topdog", { choiceIndex: 1, score: 800, rank: 1 }),
      ],
      effects: [{ uid: "e1", itemId: "broadsideDuel", byId: "underdog", targetId: "topdog" }],
      accusations: [],
    });
    expect(res.lootDelta.underdog).toBe(SCORING.BASE_CORRECT + SCORING.BROADSIDE_WIN);
    expect(res.lootDelta.topdog).toBe(-SCORING.BROADSIDE_LOSS_HIGHER);
  });
});

describe("missions", () => {
  it("lone treasure succeeds only when you alone are correct", () => {
    const solo = resolveQuestion({
      correctIndex: 0,
      players: [
        player("lone", { choiceIndex: 0, mission: { missionId: "loneTreasure" } }),
        player("other", { choiceIndex: 1, rank: 2 }),
      ],
      effects: [],
      accusations: [],
    });
    expect(solo.missionSuccesses).toContain("lone");
    expect(solo.lootDelta.lone).toBe(SCORING.BASE_CORRECT + SCORING.SECRET_MISSION_BASE);

    const shared = resolveQuestion({
      correctIndex: 0,
      players: [
        player("lone", { choiceIndex: 0, mission: { missionId: "loneTreasure" } }),
        player("other", { choiceIndex: 0, rank: 2 }),
      ],
      effects: [],
      accusations: [],
    });
    expect(shared.missionSuccesses).not.toContain("lone");
  });

  it("snake oil succeeds when the leader answers wrong", () => {
    const res = resolveQuestion({
      correctIndex: 0,
      players: [
        player("snake", { choiceIndex: 0, rank: 2, mission: { missionId: "snakeOil" } }),
        player("leader", { choiceIndex: 3, rank: 1, score: 999 }),
      ],
      effects: [],
      accusations: [],
    });
    expect(res.missionSuccesses).toContain("snake");
  });

  it("pied piper needs two followers on your answer", () => {
    const res = resolveQuestion({
      correctIndex: 1,
      players: [
        player("piper", { choiceIndex: 3, mission: { missionId: "piedPiper" } }),
        player("f1", { choiceIndex: 3, rank: 2 }),
        player("f2", { choiceIndex: 3, rank: 3 }),
      ],
      effects: [],
      accusations: [],
    });
    expect(res.missionSuccesses).toContain("piper");
  });
});

describe("mutiny accusations", () => {
  it("correct accusation pays the accuser, cancels the scheme, grants a mutiny chest", () => {
    const res = resolveQuestion({
      correctIndex: 0,
      players: [
        player("accuser", { choiceIndex: 0 }),
        player("deceiver", { choiceIndex: 0, rank: 2, mission: { missionId: "snakeOil" } }),
      ],
      effects: [],
      accusations: [{ accuserId: "accuser", accusedId: "deceiver" }],
    });
    expect(res.lootDelta.accuser).toBe(SCORING.BASE_CORRECT + SCORING.ACCUSATION_CORRECT);
    expect(res.chests).toContainEqual({ playerId: "accuser", source: "mutiny" });
    expect(res.missionSuccesses).not.toContain("deceiver");
  });

  it("wrong accusation rewards the innocent with a revenge chest and consolation", () => {
    const res = resolveQuestion({
      correctIndex: 0,
      players: [
        player("accuser", { choiceIndex: 1 }),
        player("innocent", { choiceIndex: 0, rank: 2, mission: { missionId: "loneTreasure" } }),
      ],
      effects: [],
      accusations: [{ accuserId: "accuser", accusedId: "innocent" }],
    });
    expect(res.chests).toContainEqual({ playerId: "innocent", source: "revenge" });
    expect(res.lootDelta.accuser ?? 0).toBe(0);
  });

  it("mutiny bait pays out when falsely accused", () => {
    const res = resolveQuestion({
      correctIndex: 0,
      players: [
        player("accuser", { choiceIndex: 0 }),
        player("baiter", { choiceIndex: 0, rank: 2, mission: { missionId: "mutinyBait" } }),
      ],
      effects: [],
      accusations: [{ accuserId: "accuser", accusedId: "baiter" }],
    });
    expect(res.missionSuccesses).toContain("baiter");
    expect(res.lootDelta.baiter).toBe(
      SCORING.BASE_CORRECT + SCORING.ACCUSATION_WRONG_CONSOLATION + SCORING.SECRET_MISSION_BASE,
    );
  });
});
