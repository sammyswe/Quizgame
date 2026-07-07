import { SCORING } from "../config/scoring.js";
import { ITEMS } from "../config/items.js";
import { MISSIONS } from "../config/missions.js";
import type {
  Accusation,
  ActiveEffect,
  ActiveMission,
  ChestSource,
  RevealEvent,
} from "../types/index.js";
import { addDelta, ev } from "./reveal.js";

/**
 * Pure resolver for a standard multiple-choice question:
 * base scoring, item effects, secret missions, mutiny accusations, streaks.
 * The server feeds it inputs and applies its outputs; nothing here touches IO.
 */

export type ResolvePlayerInput = {
  id: string;
  nickname: string;
  score: number;
  roundLoot: number;
  rank: number;
  streak: number;
  choiceIndex?: number;
  mission?: ActiveMission;
  /** Double Agent shield absorbs one Fear Shot / accusation. */
  hasAgentShield?: boolean;
  /** Rum Rush active: next correct answer doubles. */
  rumRush?: boolean;
  /** Auction "double reward if correct" prize. */
  doubleReward?: boolean;
};

export type ResolveQuestionContext = {
  correctIndex: number;
  players: ResolvePlayerInput[];
  effects: ActiveEffect[];
  accusations: Accusation[];
  /** Points for a correct answer (Final Plunder overrides). */
  basePoints?: number;
};

export type ChestAward = { playerId: string; source: ChestSource };

export type QuestionResolution = {
  events: RevealEvent[];
  /** Applied to unbanked round loot. */
  lootDelta: Record<string, number>;
  /** Chests earned. */
  chests: ChestAward[];
  /** Post-question streak per player. */
  streaks: Record<string, number>;
  /** Effective choice per player after Copycat. */
  effectiveChoices: Record<string, number | undefined>;
  /** playerIds whose Rum Rush was consumed. */
  rumRushConsumed: string[];
  /** Curse effects consumed (owner ids). */
  cursesConsumed: string[];
  /** Missions that succeeded (playerIds). */
  missionSuccesses: string[];
};

type CurseWard = { ownerId: string; wardedId: string; used: boolean };

export function resolveQuestion(ctx: ResolveQuestionContext): QuestionResolution {
  const events: RevealEvent[] = [];
  const lootDelta: Record<string, number> = {};
  const chests: ChestAward[] = [];
  const streaks: Record<string, number> = {};
  const rumRushConsumed: string[] = [];
  const cursesConsumed: string[] = [];
  const missionSuccesses: string[] = [];
  const basePoints = ctx.basePoints ?? SCORING.BASE_CORRECT;

  const byId = new Map(ctx.players.map((p) => [p.id, p]));
  const name = (id: string | undefined) => (id && byId.get(id)?.nickname) || "A mystery pirate";

  // --- Captain's Curse wards -------------------------------------------------
  const wards: CurseWard[] = ctx.effects
    .filter((e) => e.itemId === "captainsCurse")
    .map((e) => ({ ownerId: e.byId, wardedId: e.targetId ?? e.byId, used: false }));

  /** Returns true (and fires reversal events) if the target is warded. */
  const checkCurse = (attackerId: string, targetId: string, itemName: string): boolean => {
    const ward = wards.find((w) => w.wardedId === targetId && !w.used);
    if (!ward) return false;
    ward.used = true;
    cursesConsumed.push(ward.ownerId);
    addDelta(lootDelta, ward.ownerId, SCORING.CURSE_REVERSAL_BONUS);
    events.push(
      ev(
        "itemBlocked",
        "Captain's Curse!",
        `${name(attackerId)}'s ${itemName} hit a cursed pirate! ${name(ward.ownerId)} steals +${SCORING.CURSE_REVERSAL_BONUS}.`,
        {
          icon: "☠️",
          playerIds: [attackerId, targetId, ward.ownerId],
          pointsDelta: { [ward.ownerId]: SCORING.CURSE_REVERSAL_BONUS },
        },
      ),
    );
    return true;
  };

  // --- 1. Copycat rewires answers before anything scores ---------------------
  const effectiveChoices: Record<string, number | undefined> = {};
  for (const p of ctx.players) effectiveChoices[p.id] = p.choiceIndex;

  for (const e of ctx.effects.filter((x) => x.itemId === "copycat")) {
    if (!e.targetId) continue;
    effectiveChoices[e.byId] = effectiveChoices[e.targetId];
    events.push(
      ev("itemTriggered", "Copycat!", `${name(e.byId)} secretly copied ${name(e.targetId)}'s answer.`, {
        icon: ITEMS.copycat.icon,
        playerIds: [e.byId, e.targetId],
      }),
    );
  }

  const isCorrect = (id: string) => effectiveChoices[id] === ctx.correctIndex;
  const answered = (id: string) => effectiveChoices[id] !== undefined;

  // --- 2. Fear Shot blocks missions (Double Agent shield absorbs) ------------
  const missionBlocked = new Set<string>();
  for (const e of ctx.effects.filter((x) => x.itemId === "fearShot")) {
    if (!e.targetId) continue;
    if (checkCurse(e.byId, e.targetId, "Fear Shot")) continue;
    const target = byId.get(e.targetId);
    if (target?.hasAgentShield) {
      events.push(
        ev("itemBlocked", "Shot absorbed!", `${name(e.targetId)}'s Double Agent cover soaked up a Fear Shot.`, {
          icon: "🎭",
          playerIds: [e.byId, e.targetId],
        }),
      );
      continue;
    }
    missionBlocked.add(e.targetId);
    events.push(
      ev("itemTriggered", "Fear Shot!", `${name(e.byId)} fired a Fear Shot at ${name(e.targetId)} — any secret scheme is blocked.`, {
        icon: ITEMS.fearShot.icon,
        playerIds: [e.byId, e.targetId],
      }),
    );
  }

  // --- 3. Correct answer reveal + base scoring --------------------------------
  const correctPlayers = ctx.players.filter((p) => isCorrect(p.id));
  events.push(
    ev(
      "correctAnswer",
      correctPlayers.length > 0 ? "The true island!" : "Nobody found the treasure!",
      correctPlayers.length > 0
        ? `${correctPlayers.map((p) => p.nickname).join(", ")} answered correctly!`
        : "Every pirate sailed the wrong way. The sea keeps its gold.",
      { icon: "🏝️", playerIds: correctPlayers.map((p) => p.id) },
    ),
  );

  for (const p of ctx.players) {
    if (!isCorrect(p.id)) continue;
    let pts = basePoints;
    let note = "";
    if (p.rumRush) {
      pts *= SCORING.RUM_RUSH_MULTIPLIER;
      rumRushConsumed.push(p.id);
      note = " (Rum Rush doubled it!)";
    }
    if (p.doubleReward) {
      pts *= 2;
      note += " (Auction prize doubled it!)";
    }
    addDelta(lootDelta, p.id, pts);
    events.push(
      ev("scoreChanged", `+${pts} loot`, `${p.nickname} plunders +${pts}${note}`, {
        icon: "💰",
        playerIds: [p.id],
        pointsDelta: { [p.id]: pts },
      }),
    );
  }

  // Captain's Chest — only player to get it right (needs 3+ players to be meaningful).
  if (correctPlayers.length === 1 && ctx.players.length >= 3) {
    const solo = correctPlayers[0];
    if (solo) {
      chests.push({ playerId: solo.id, source: "captains" });
      events.push(
        ev("chestEarned", "Captain's Chest!", `${solo.nickname} was the ONLY pirate to get it right.`, {
          icon: "⚓",
          playerIds: [solo.id],
        }),
      );
    }
  }

  // --- 4. Lucky Doubloon (wrong-answer consolation) ---------------------------
  for (const e of ctx.effects.filter((x) => x.itemId === "luckyDoubloon")) {
    if (isCorrect(e.byId)) continue;
    addDelta(lootDelta, e.byId, SCORING.LUCKY_DOUBLOON_CONSOLATION);
    events.push(
      ev("itemTriggered", "Lucky Doubloon!", `${name(e.byId)} was wrong but flips a doubloon: +${SCORING.LUCKY_DOUBLOON_CONSOLATION}.`, {
        icon: "🪙",
        playerIds: [e.byId],
        pointsDelta: { [e.byId]: SCORING.LUCKY_DOUBLOON_CONSOLATION },
      }),
    );
  }

  // --- 5. Sneak's Map traps -----------------------------------------------------
  for (const e of ctx.effects.filter((x) => x.itemId === "sneaksMap")) {
    if (e.optionIndex === undefined || e.optionIndex === ctx.correctIndex) continue;
    if (effectiveChoices[e.byId] === e.optionIndex) {
      events.push(
        ev("missionFailed", "Trapped by their own map!", `${name(e.byId)} fell into their own trap. Embarrassing.`, {
          icon: "🗺️",
          playerIds: [e.byId],
        }),
      );
      continue;
    }
    const victims = ctx.players.filter((p) => p.id !== e.byId && effectiveChoices[p.id] === e.optionIndex);
    if (victims.length > 0) {
      const gain = victims.length * SCORING.SNEAKS_MAP_PER_VICTIM;
      addDelta(lootDelta, e.byId, gain);
      events.push(
        ev(
          "itemTriggered",
          "Sneak's Map!",
          `${victims.map((v) => v.nickname).join(", ")} followed a fake map! ${name(e.byId)} collects +${gain}.`,
          { icon: "🗺️", playerIds: [e.byId, ...victims.map((v) => v.id)], pointsDelta: { [e.byId]: gain } },
        ),
      );
    } else {
      // Everyone dodged: survivors near the trap earn a Survivor Chest (max 1).
      const dodgers = ctx.players.filter((p) => p.id !== e.byId && answered(p.id) && isCorrect(p.id));
      const luckiest = dodgers[0];
      if (luckiest) {
        chests.push({ playerId: luckiest.id, source: "survivor" });
        events.push(
          ev("chestEarned", "Trap dodged!", `${name(e.byId)}'s fake map fooled nobody. ${luckiest.nickname} earns a Survivor Chest.`, {
            icon: "🛟",
            playerIds: [luckiest.id],
          }),
        );
      }
    }
  }

  // --- 6. Backstab ---------------------------------------------------------------
  for (const e of ctx.effects.filter((x) => x.itemId === "backstab")) {
    if (!e.targetId) continue;
    if (checkCurse(e.byId, e.targetId, "Backstab")) continue;
    if (!isCorrect(e.targetId)) {
      addDelta(lootDelta, e.byId, SCORING.BACKSTAB_BONUS);
      chests.push({ playerId: e.targetId, source: "revenge" });
      events.push(
        ev("itemTriggered", "Backstab!", `${name(e.byId)} bet on ${name(e.targetId)} failing... and cashes +${SCORING.BACKSTAB_BONUS}. The victim pockets a Revenge Chest.`, {
          icon: "🗡️",
          playerIds: [e.byId, e.targetId],
          pointsDelta: { [e.byId]: SCORING.BACKSTAB_BONUS },
        }),
      );
    } else {
      events.push(
        ev("itemBlocked", "Backstab whiffed!", `${name(e.targetId)} answered correctly — ${name(e.byId)}'s blade found only air.`, {
          icon: "🗡️",
          playerIds: [e.byId, e.targetId],
        }),
      );
    }
  }

  // --- 7. Shipwreck -----------------------------------------------------------------
  for (const e of ctx.effects.filter((x) => x.itemId === "shipwreck")) {
    if (!e.targetId) continue;
    if (checkCurse(e.byId, e.targetId, "Shipwreck")) continue;
    const target = byId.get(e.targetId);
    if (!target) continue;
    if (!isCorrect(e.targetId)) {
      const currentLoot = target.roundLoot + (lootDelta[e.targetId] ?? 0);
      const loss = Math.max(0, currentLoot);
      if (loss > 0) {
        addDelta(lootDelta, e.targetId, -loss);
        events.push(
          ev("itemTriggered", "Shipwreck!", `${name(e.byId)} wrecked ${name(e.targetId)}'s ship — ${loss} unbanked loot sinks to the depths.`, {
            icon: "🚢",
            playerIds: [e.byId, e.targetId],
            pointsDelta: { [e.targetId]: -loss },
          }),
        );
        chests.push({ playerId: e.targetId, source: "revenge" });
      } else {
        events.push(
          ev("itemTriggered", "Shipwreck!", `${name(e.byId)} wrecked ${name(e.targetId)}'s ship... but the hold was already empty.`, {
            icon: "🚢",
            playerIds: [e.byId, e.targetId],
          }),
        );
      }
    } else {
      events.push(
        ev("itemBlocked", "Shipwreck dodged!", `${name(e.targetId)} sailed true — the cannonball missed.`, {
          icon: "🚢",
          playerIds: [e.byId, e.targetId],
        }),
      );
    }
  }

  // --- 8. Black Spot -------------------------------------------------------------------
  for (const e of ctx.effects.filter((x) => x.itemId === "blackSpot")) {
    if (!e.targetId) continue;
    if (checkCurse(e.byId, e.targetId, "Black Spot")) continue;
    if (!isCorrect(e.targetId)) {
      const beneficiaries = ctx.players.filter((p) => p.id !== e.targetId);
      const delta: Record<string, number> = {};
      for (const b of beneficiaries) {
        addDelta(lootDelta, b.id, SCORING.BLACK_SPOT_BONUS);
        delta[b.id] = SCORING.BLACK_SPOT_BONUS;
      }
      events.push(
        ev("itemTriggered", "The Black Spot!", `${name(e.targetId)} was marked and got it wrong. Everyone else gains +${SCORING.BLACK_SPOT_BONUS}.`, {
          icon: "⚫",
          playerIds: [e.targetId],
          pointsDelta: delta,
        }),
      );
    } else {
      events.push(
        ev("itemBlocked", "Spot torn up!", `${name(e.targetId)} answered right and tore up the Black Spot.`, {
          icon: "⚫",
          playerIds: [e.byId, e.targetId],
        }),
      );
    }
  }

  // --- 9. Treasure Switch ------------------------------------------------------------------
  for (const e of ctx.effects.filter((x) => x.itemId === "treasureSwitch")) {
    if (!e.targetId) continue;
    if (checkCurse(e.byId, e.targetId, "Treasure Switch")) continue;
    const a = byId.get(e.byId);
    const b = byId.get(e.targetId);
    if (!a || !b) continue;
    const aLoot = a.roundLoot + (lootDelta[a.id] ?? 0);
    const bLoot = b.roundLoot + (lootDelta[b.id] ?? 0);
    addDelta(lootDelta, a.id, bLoot - aLoot);
    addDelta(lootDelta, b.id, aLoot - bLoot);
    chests.push({ playerId: b.id, source: "revenge" });
    events.push(
      ev("itemTriggered", "Treasure Switch!", `${a.nickname} swapped loot bags with ${b.nickname}! (${aLoot} ⇄ ${bLoot})`, {
        icon: "🔁",
        playerIds: [a.id, b.id],
        pointsDelta: { [a.id]: bLoot - aLoot, [b.id]: aLoot - bLoot },
      }),
    );
  }

  // --- 10. Crown Heist -------------------------------------------------------------------------
  for (const e of ctx.effects.filter((x) => x.itemId === "crownHeist")) {
    const leader = [...ctx.players].sort((a, b) => a.rank - b.rank)[0];
    if (!leader || leader.id === e.byId) continue;
    if (!isCorrect(e.byId)) {
      events.push(
        ev("itemBlocked", "Heist foiled!", `${name(e.byId)} fumbled the Crown Heist by answering wrong.`, {
          icon: "👑",
          playerIds: [e.byId],
        }),
      );
      continue;
    }
    if (checkCurse(e.byId, leader.id, "Crown Heist")) continue;
    const unprotected = leader.score + leader.roundLoot + (lootDelta[leader.id] ?? 0);
    const steal = Math.max(0, Math.round(unprotected * SCORING.CROWN_HEIST_PCT));
    addDelta(lootDelta, e.byId, steal);
    addDelta(lootDelta, leader.id, -steal);
    events.push(
      ev("itemTriggered", "CROWN HEIST!", `${name(e.byId)} robbed the leader! ${steal} points lifted from ${leader.nickname}. Absolutely robbed.`, {
        icon: "👑",
        playerIds: [e.byId, leader.id],
        pointsDelta: { [e.byId]: steal, [leader.id]: -steal },
      }),
    );
  }

  // --- 11. Broadside Duel -------------------------------------------------------------------------
  for (const e of ctx.effects.filter((x) => x.itemId === "broadsideDuel")) {
    if (!e.targetId) continue;
    if (checkCurse(e.byId, e.targetId, "Broadside Duel")) continue;
    const challenger = byId.get(e.byId);
    const defender = byId.get(e.targetId);
    if (!challenger || !defender) continue;
    const cRight = isCorrect(challenger.id);
    const dRight = isCorrect(defender.id);
    if (cRight === dRight) {
      events.push(
        ev("itemTriggered", "Broadside stalemate!", `${challenger.nickname} and ${defender.nickname} both ${cRight ? "hit" : "missed"} — cannons fall silent.`, {
          icon: "💣",
          playerIds: [challenger.id, defender.id],
        }),
      );
      continue;
    }
    const winner = cRight ? challenger : defender;
    const loser = cRight ? defender : challenger;
    // Higher-ranked (lower rank number) loser risks more.
    const loserLoss = loser.rank < winner.rank ? SCORING.BROADSIDE_LOSS_HIGHER : SCORING.BROADSIDE_LOSS_LOWER;
    addDelta(lootDelta, winner.id, SCORING.BROADSIDE_WIN);
    const loserPool = loser.score + loser.roundLoot + (lootDelta[loser.id] ?? 0);
    const actualLoss = Math.min(loserLoss, Math.max(0, loserPool));
    addDelta(lootDelta, loser.id, -actualLoss);
    events.push(
      ev("itemTriggered", "BROADSIDE DUEL!", `${winner.nickname} out-gunned ${loser.nickname}! +${SCORING.BROADSIDE_WIN} / -${actualLoss}.`, {
        icon: "💣",
        playerIds: [winner.id, loser.id],
        pointsDelta: { [winner.id]: SCORING.BROADSIDE_WIN, [loser.id]: -actualLoss },
      }),
    );
  }

  // --- 12. Secret missions --------------------------------------------------------------------------
  for (const p of ctx.players) {
    if (!p.mission || p.mission.blocked) continue;
    const def = MISSIONS[p.mission.missionId];
    if (!def.implemented) continue;
    if (missionBlocked.has(p.id)) {
      events.push(
        ev("missionFailed", "Scheme blocked!", `${p.nickname}'s secret plan (${def.name}) was blocked by a Fear Shot.`, {
          icon: "💀",
          playerIds: [p.id],
        }),
      );
      continue;
    }
    const success = checkMission(p, ctx, effectiveChoices);
    if (success === undefined) continue; // not checkable this question
    if (success) {
      missionSuccesses.push(p.id);
      addDelta(lootDelta, p.id, SCORING.SECRET_MISSION_BASE);
      chests.push({ playerId: p.id, source: "betrayal" });
      events.push(
        ev("missionSuccess", `Secret mission complete! ${def.icon}`, `${p.nickname} pulled off "${def.name}": +${SCORING.SECRET_MISSION_BASE} and a Betrayal Chest.`, {
          icon: def.icon,
          playerIds: [p.id],
          pointsDelta: { [p.id]: SCORING.SECRET_MISSION_BASE },
        }),
      );
    } else {
      events.push(
        ev("missionFailed", "Mission failed", `${p.nickname}'s secret mission "${def.name}" slipped away.`, {
          icon: def.icon,
          playerIds: [p.id],
        }),
      );
    }
  }

  // --- 13. Mutiny accusations -----------------------------------------------------------------------
  for (const acc of ctx.accusations) {
    const accuser = byId.get(acc.accuserId);
    const accused = byId.get(acc.accusedId);
    if (!accuser || !accused) continue;
    const accusedMission = accused.mission ? MISSIONS[accused.mission.missionId] : undefined;
    const correct = Boolean(accusedMission?.deceptive);
    if (correct && accused.hasAgentShield) {
      events.push(
        ev("itemBlocked", "Cover held!", `${accuser.nickname} accused ${accused.nickname}... the Double Agent's cover held. No proof!`, {
          icon: "🎭",
          playerIds: [accuser.id, accused.id],
        }),
      );
      continue;
    }
    if (correct) {
      addDelta(lootDelta, accuser.id, SCORING.ACCUSATION_CORRECT);
      chests.push({ playerId: accuser.id, source: "mutiny" });
      if (accused.mission) accused.mission.blocked = true;
      events.push(
        ev("accusationCorrect", "MUTINY! ⚔️", `${accuser.nickname} exposed ${accused.nickname} as a deceiver! +${SCORING.ACCUSATION_CORRECT} and a Mutiny Chest. The scheme is cancelled.`, {
          icon: "⚔️",
          playerIds: [accuser.id, accused.id],
          pointsDelta: { [accuser.id]: SCORING.ACCUSATION_CORRECT },
        }),
      );
    } else {
      chests.push({ playerId: accused.id, source: "revenge" });
      addDelta(lootDelta, accused.id, SCORING.ACCUSATION_WRONG_CONSOLATION);
      // Mutiny Bait mission: get someone to falsely accuse you.
      if (accused.mission?.missionId === "mutinyBait") {
        missionSuccesses.push(accused.id);
        addDelta(lootDelta, accused.id, SCORING.SECRET_MISSION_BASE);
        events.push(
          ev("missionSuccess", "Mutiny Bait! 🪤", `${accused.nickname} WANTED to be accused! +${SCORING.SECRET_MISSION_BASE}.`, {
            icon: "🪤",
            playerIds: [accused.id],
            pointsDelta: { [accused.id]: SCORING.SECRET_MISSION_BASE },
          }),
        );
      }
      events.push(
        ev("accusationWrong", "False mutiny!", `${accuser.nickname} accused ${accused.nickname}... but their map was clean. ${accused.nickname} gets a Revenge Chest +${SCORING.ACCUSATION_WRONG_CONSOLATION}.`, {
          icon: "🕊️",
          playerIds: [accuser.id, accused.id],
          pointsDelta: { [accused.id]: SCORING.ACCUSATION_WRONG_CONSOLATION },
        }),
      );
    }
  }

  // --- 14. Streaks ------------------------------------------------------------------------------------
  for (const p of ctx.players) {
    const next = isCorrect(p.id) ? p.streak + 1 : 0;
    streaks[p.id] = next;
    if (next > 0 && next % 3 === 0) {
      chests.push({ playerId: p.id, source: "streak" });
      events.push(
        ev("chestEarned", "On fire! 🔥", `${p.nickname} hit ${next} correct in a row — Streak Chest earned!`, {
          icon: "🔥",
          playerIds: [p.id],
        }),
      );
    }
  }

  return {
    events,
    lootDelta,
    chests,
    streaks,
    effectiveChoices,
    rumRushConsumed,
    cursesConsumed,
    missionSuccesses,
  };
}

/** Returns true/false when checkable, undefined when the mission doesn't apply this question. */
function checkMission(
  p: ResolvePlayerInput,
  ctx: ResolveQuestionContext,
  choices: Record<string, number | undefined>,
): boolean | undefined {
  const mission = p.mission;
  if (!mission) return undefined;
  const myChoice = choices[p.id];
  const correct = myChoice === ctx.correctIndex;
  const others = ctx.players.filter((o) => o.id !== p.id);
  const followers = others.filter((o) => choices[o.id] !== undefined && choices[o.id] === myChoice);

  switch (mission.missionId) {
    case "loneTreasure": {
      const correctCount = ctx.players.filter((o) => choices[o.id] === ctx.correctIndex).length;
      return correct && correctCount === 1;
    }
    case "snakeOil": {
      const leader = [...ctx.players].sort((a, b) => a.rank - b.rank)[0];
      if (!leader || leader.id === p.id) return false;
      return choices[leader.id] !== undefined && choices[leader.id] !== ctx.correctIndex;
    }
    case "piedPiper":
      return myChoice !== undefined && followers.length >= 2;
    case "honestCaptain":
      return correct && followers.length >= 1;
    case "falseFriend": {
      if (mission.targetId === undefined || mission.optionIndex === undefined) return false;
      if (mission.optionIndex === ctx.correctIndex) return false;
      return choices[mission.targetId] === mission.optionIndex && myChoice !== mission.optionIndex;
    }
    case "pirateProphet": {
      if (!mission.targetId) return false;
      const targetChoice = choices[mission.targetId];
      return targetChoice !== undefined && targetChoice !== ctx.correctIndex;
    }
    case "mutinyBait":
      return undefined; // resolved inside the accusation branch
    default:
      return undefined; // stubbed missions
  }
}
