import { SCORING } from "../config/scoring.js";
import { FINAL_ACTIONS } from "../config/finalActions.js";
import type { FinalActionId, RevealEvent } from "../types/index.js";
import { addDelta, ev } from "./reveal.js";
import { protectedPct, rankTier, type RankTier } from "./scoring.js";

/**
 * Final Plunder: 3 questions of chaos. Each player picks 1 of 3 actions
 * (offered by leaderboard tier) before each question, then answers.
 * Part of every score is protected; attacks only bite unprotected points.
 */

export type FinalPlayerInput = {
  id: string;
  nickname: string;
  score: number;
  rank: number;
  choiceIndex?: number;
  action?: { actionId: FinalActionId; targetId?: string };
};

export type FinalResolution = {
  events: RevealEvent[];
  /** Applied directly to total score (already protection-aware). */
  scoreDelta: Record<string, number>;
};

const ATTACK_ACTIONS: FinalActionId[] = [
  "raiseTheBlackFlag",
  "crownHeist",
  "betrayTheCrew",
  "blameGame",
];

/** Which 3 actions a player is offered, by tier. Deterministic given rng. */
export function offerFinalActions(
  rank: number,
  playerCount: number,
  rng: () => number = Math.random,
): FinalActionId[] {
  const tier: RankTier = rankTier(rank, playerCount);
  const tierKey = tier === "first" ? "leader" : tier === "bottom" ? "bottom" : "middle";
  const pool = Object.values(FINAL_ACTIONS)
    .filter((a) => a.tiers.includes(tierKey))
    .map((a) => a.id);
  const shuffled = [...pool].sort(() => rng() - 0.5);
  return shuffled.slice(0, 3);
}

export function resolveFinalQuestion(
  ctx: {
    correctIndex: number;
    players: FinalPlayerInput[];
    rng?: () => number;
  },
): FinalResolution {
  const rng = ctx.rng ?? Math.random;
  const events: RevealEvent[] = [];
  const scoreDelta: Record<string, number> = {};
  const playerCount = ctx.players.length;
  const byId = new Map(ctx.players.map((p) => [p.id, p]));
  const name = (id: string | undefined) => (id && byId.get(id)?.nickname) || "???";
  const isCorrect = (id: string) => byId.get(id)?.choiceIndex === ctx.correctIndex;
  const actionOf = (id: string) => byId.get(id)?.action;

  // --- Protection pools -------------------------------------------------------
  const unprotectedPool: Record<string, number> = {};
  for (const p of ctx.players) {
    let pct = protectedPct(p.rank, playerCount);
    if (p.action?.actionId === "bankTheBooty") {
      pct = Math.min(0.95, pct + 0.15);
      events.push(
        ev("finalAction", "Booty banked 🏦", `${p.nickname} locks more treasure in the vault — ${Math.round(pct * 100)}% protected this question.`, {
          icon: "🏦",
          playerIds: [p.id],
        }),
      );
    }
    unprotectedPool[p.id] = Math.max(0, p.score - Math.round(p.score * pct));
  }

  // --- Defensive setups ----------------------------------------------------------
  const shields = new Set<string>(); // blocks first attack
  const curses = new Set<string>(); // reverses first attack
  const falseTreasures = new Set<string>(); // first stealer pays instead
  const bodyguards = new Map<string, string>(); // targetId -> guardId

  for (const p of ctx.players) {
    switch (p.action?.actionId) {
      case "captainsShield":
        shields.add(p.id);
        break;
      case "captainsCurse":
        curses.add(p.id);
        break;
      case "falseTreasure":
        falseTreasures.add(p.id);
        break;
      case "bodyguard":
        if (p.action.targetId) bodyguards.set(p.action.targetId, p.id);
        break;
      default:
        break;
    }
  }

  /**
   * Attempt to steal `amount` unprotected points from `victimId` for `attackerId`.
   * Handles shield/curse/bodyguard/false-treasure counters. Returns actual stolen.
   */
  const attemptSteal = (attackerId: string, victimId: string, amount: number, label: string): number => {
    if (curses.has(victimId)) {
      curses.delete(victimId);
      const reversal = Math.min(SCORING.CURSE_REVERSAL_BONUS, unprotectedPool[attackerId] ?? 0);
      addDelta(scoreDelta, attackerId, -reversal);
      addDelta(scoreDelta, victimId, reversal);
      unprotectedPool[attackerId] = Math.max(0, (unprotectedPool[attackerId] ?? 0) - reversal);
      events.push(
        ev("itemBlocked", "CURSED! ☠️", `${name(attackerId)}'s ${label} reversed! ${name(victimId)} steals ${reversal} back.`, {
          icon: "☠️",
          playerIds: [attackerId, victimId],
          pointsDelta: { [attackerId]: -reversal, [victimId]: reversal },
        }),
      );
      return 0;
    }
    if (shields.has(victimId)) {
      shields.delete(victimId);
      events.push(
        ev("itemBlocked", "Shield holds! 🛡️", `${name(victimId)}'s Captain's Shield blocked ${name(attackerId)}'s ${label}.`, {
          icon: "🛡️",
          playerIds: [attackerId, victimId],
        }),
      );
      return 0;
    }
    const guardId = bodyguards.get(victimId);
    if (guardId) {
      bodyguards.delete(victimId);
      addDelta(scoreDelta, guardId, SCORING.BODYGUARD_BONUS);
      addDelta(scoreDelta, victimId, SCORING.BODYGUARD_BONUS);
      events.push(
        ev("itemBlocked", "Bodyguard! 🦍", `${name(guardId)} took the hit for ${name(victimId)}! Both gain +${SCORING.BODYGUARD_BONUS}.`, {
          icon: "🦍",
          playerIds: [attackerId, victimId, guardId],
          pointsDelta: { [guardId]: SCORING.BODYGUARD_BONUS, [victimId]: SCORING.BODYGUARD_BONUS },
        }),
      );
      return 0;
    }
    if (falseTreasures.has(victimId)) {
      falseTreasures.delete(victimId);
      const bait = Math.min(SCORING.FALSE_TREASURE_BAIT, unprotectedPool[attackerId] ?? 0);
      addDelta(scoreDelta, attackerId, -bait);
      addDelta(scoreDelta, victimId, bait);
      unprotectedPool[attackerId] = Math.max(0, (unprotectedPool[attackerId] ?? 0) - bait);
      events.push(
        ev("itemBlocked", "False Treasure! 🪤", `${name(attackerId)} stole a chest of painted rocks and pays ${name(victimId)} ${bait}!`, {
          icon: "🪤",
          playerIds: [attackerId, victimId],
          pointsDelta: { [attackerId]: -bait, [victimId]: bait },
        }),
      );
      return 0;
    }
    const stolen = Math.min(amount, unprotectedPool[victimId] ?? 0);
    if (stolen <= 0) return 0;
    unprotectedPool[victimId] = (unprotectedPool[victimId] ?? 0) - stolen;
    addDelta(scoreDelta, victimId, -stolen);
    addDelta(scoreDelta, attackerId, stolen);
    return stolen;
  };

  // --- 1. Base scoring ---------------------------------------------------------------
  const correctPlayers = ctx.players.filter((p) => isCorrect(p.id));
  events.push(
    ev("correctAnswer", "The answer surfaces!", correctPlayers.length > 0 ? `${correctPlayers.map((p) => p.nickname).join(", ")} answered true.` : "Not one pirate found it.", {
      icon: "🏝️",
      playerIds: correctPlayers.map((p) => p.id),
    }),
  );

  for (const p of ctx.players) {
    const action = p.action?.actionId;
    if (isCorrect(p.id)) {
      let pts = SCORING.FINAL_CORRECT;
      let note = "";
      if (action === "allInPlunder") {
        pts *= SCORING.ALL_IN_MULTIPLIER;
        note = " ALL-IN pays off! 🎰";
      }
      addDelta(scoreDelta, p.id, pts);
      events.push(
        ev("scoreChanged", `+${pts} treasure`, `${p.nickname} banks +${pts}.${note}`, {
          icon: "💰",
          playerIds: [p.id],
          pointsDelta: { [p.id]: pts },
        }),
      );
      if (action === "lastCannon") {
        addDelta(scoreDelta, p.id, SCORING.LAST_CANNON_BONUS);
        events.push(
          ev("finalAction", "LAST CANNON! 🧨", `${p.nickname}'s desperate shot lands: +${SCORING.LAST_CANNON_BONUS} bonus!`, {
            icon: "🧨",
            playerIds: [p.id],
            pointsDelta: { [p.id]: SCORING.LAST_CANNON_BONUS },
          }),
        );
      }
    } else if (action === "allInPlunder") {
      const loss = Math.min(SCORING.ALL_IN_PENALTY, unprotectedPool[p.id] ?? 0);
      unprotectedPool[p.id] = Math.max(0, (unprotectedPool[p.id] ?? 0) - loss);
      addDelta(scoreDelta, p.id, -loss);
      events.push(
        ev("finalAction", "All-in... all gone 🎰", `${p.nickname} went all-in and missed. -${loss} unprotected points.`, {
          icon: "🎰",
          playerIds: [p.id],
          pointsDelta: { [p.id]: -loss },
        }),
      );
    }
  }

  // --- 2. Attacks, resolved bottom-of-the-table first (comeback drama) -----------------
  const attackers = ctx.players
    .filter((p) => p.action && ATTACK_ACTIONS.includes(p.action.actionId))
    .sort((a, b) => b.rank - a.rank);

  for (const p of attackers) {
    const action = p.action;
    if (!action) continue;
    switch (action.actionId) {
      case "raiseTheBlackFlag": {
        if (!isCorrect(p.id)) {
          events.push(
            ev("finalAction", "Flag half-raised", `${p.nickname} raised the Black Flag but answered wrong. The crew laughs.`, {
              icon: "🏴‍☠️",
              playerIds: [p.id],
            }),
          );
          break;
        }
        events.push(
          ev("finalAction", "THE BLACK FLAG RISES! 🏴‍☠️", `${p.nickname} answered true under the black flag — every other pirate bleeds ${SCORING.BLACK_FLAG_ALL_LOSE} unprotected points!`, {
            icon: "🏴‍☠️",
            playerIds: [p.id],
          }),
        );
        for (const victim of ctx.players) {
          if (victim.id === p.id) continue;
          const stolen = attemptSteal(p.id, victim.id, SCORING.BLACK_FLAG_ALL_LOSE, "Black Flag raid");
          if (stolen > 0) {
            events.push(
              ev("lootPlundered", "Raided!", `${victim.nickname} loses ${stolen} to the black flag.`, {
                icon: "🏴‍☠️",
                playerIds: [p.id, victim.id],
                pointsDelta: { [victim.id]: -stolen, [p.id]: stolen },
              }),
            );
          }
        }
        break;
      }
      case "crownHeist": {
        const leader = [...ctx.players].sort((a, b) => a.rank - b.rank)[0];
        if (!leader || leader.id === p.id) break;
        if (!isCorrect(p.id)) {
          events.push(
            ev("finalAction", "Heist fumbled 👑", `${p.nickname} tripped the alarm — wrong answer, no heist.`, { icon: "👑", playerIds: [p.id] }),
          );
          break;
        }
        // 15% of the leader's total score, capped by their unprotected pool inside attemptSteal.
        const amount = Math.round((byId.get(leader.id)?.score ?? 0) * SCORING.CROWN_HEIST_PCT);
        const stolen = attemptSteal(p.id, leader.id, amount, "Crown Heist");
        if (stolen > 0) {
          events.push(
            ev("finalAction", "CROWN HEIST! 👑", `${p.nickname} lifts ${stolen} from the leader, ${leader.nickname}. Absolutely robbed.`, {
              icon: "👑",
              playerIds: [p.id, leader.id],
              pointsDelta: { [p.id]: stolen, [leader.id]: -stolen },
            }),
          );
        }
        break;
      }
      case "betrayTheCrew": {
        const targetId = action.targetId;
        if (!targetId) break;
        if (isCorrect(p.id) && !isCorrect(targetId)) {
          const stolen = attemptSteal(p.id, targetId, SCORING.BETRAY_STEAL, "betrayal");
          if (stolen > 0) {
            events.push(
              ev("finalAction", "BETRAYED! 🐀", `${p.nickname} sold out ${name(targetId)} for ${stolen} points. Cold.`, {
                icon: "🐀",
                playerIds: [p.id, targetId],
                pointsDelta: { [p.id]: stolen, [targetId]: -stolen },
              }),
            );
          }
        } else {
          events.push(
            ev("finalAction", "Betrayal fizzled", `${p.nickname}'s knife slipped — the betrayal of ${name(targetId)} failed.`, {
              icon: "🐀",
              playerIds: [p.id, targetId],
            }),
          );
        }
        break;
      }
      case "blameGame": {
        const targetId = action.targetId;
        if (!targetId) break;
        if (!isCorrect(targetId)) {
          addDelta(scoreDelta, p.id, SCORING.FOLLOW_ME_BONUS);
          events.push(
            ev("finalAction", "Blame lands! 👉", `${p.nickname} blamed ${name(targetId)} — who indeed got it wrong. +${SCORING.FOLLOW_ME_BONUS}.`, {
              icon: "👉",
              playerIds: [p.id, targetId],
              pointsDelta: { [p.id]: SCORING.FOLLOW_ME_BONUS },
            }),
          );
        }
        break;
      }
      default:
        break;
    }
  }

  // --- 3. Social actions ---------------------------------------------------------------
  for (const p of ctx.players) {
    const action = p.action;
    if (!action) continue;
    switch (action.actionId) {
      case "followMe": {
        if (!action.targetId) break;
        if (isCorrect(p.id) && isCorrect(action.targetId)) {
          addDelta(scoreDelta, p.id, SCORING.FOLLOW_ME_BONUS);
          addDelta(scoreDelta, action.targetId, SCORING.FOLLOW_ME_BONUS);
          events.push(
            ev("finalAction", "Follow me! 🧭", `${p.nickname} and ${name(action.targetId)} sailed true together: +${SCORING.FOLLOW_ME_BONUS} each.`, {
              icon: "🧭",
              playerIds: [p.id, action.targetId],
              pointsDelta: { [p.id]: SCORING.FOLLOW_ME_BONUS, [action.targetId]: SCORING.FOLLOW_ME_BONUS },
            }),
          );
        }
        break;
      }
      case "cursedChest": {
        const win = rng() < 0.5;
        if (win) {
          addDelta(scoreDelta, p.id, 120);
          events.push(
            ev("finalAction", "Cursed Chest... blessed! 📦", `${p.nickname} gambled on the cursed chest and found +120 inside!`, {
              icon: "📦",
              playerIds: [p.id],
              pointsDelta: { [p.id]: 120 },
            }),
          );
        } else {
          const loss = Math.min(60, unprotectedPool[p.id] ?? 0);
          unprotectedPool[p.id] = Math.max(0, (unprotectedPool[p.id] ?? 0) - loss);
          addDelta(scoreDelta, p.id, -loss);
          events.push(
            ev("finalAction", "Cursed Chest... cursed! 📦", `${p.nickname} opened the cursed chest. A ghost took ${loss} points. Should've known.`, {
              icon: "👻",
              playerIds: [p.id],
              pointsDelta: { [p.id]: -loss },
            }),
          );
        }
        break;
      }
      case "doubleCross": {
        if (!action.targetId) break;
        const targetAction = actionOf(action.targetId);
        if (targetAction && ATTACK_ACTIONS.includes(targetAction.actionId)) {
          addDelta(scoreDelta, p.id, SCORING.FALSE_TREASURE_BAIT);
          events.push(
            ev("finalAction", "Double Cross! 🃏", `${p.nickname} read ${name(action.targetId)}'s treachery like a map: +${SCORING.FALSE_TREASURE_BAIT}.`, {
              icon: "🃏",
              playerIds: [p.id, action.targetId],
              pointsDelta: { [p.id]: SCORING.FALSE_TREASURE_BAIT },
            }),
          );
        }
        break;
      }
      default:
        break;
    }
  }

  return { events, scoreDelta };
}
