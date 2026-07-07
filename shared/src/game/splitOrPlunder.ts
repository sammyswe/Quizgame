import { SCORING } from "../config/scoring.js";
import type { PlunderChoice, RevealEvent } from "../types/index.js";
import { addDelta, ev } from "./reveal.js";
import type { ChestAward } from "./resolveQuestion.js";

/**
 * Split or Plunder: paired players answer a question. Everyone who is correct
 * becomes eligible for the pot and secretly chooses Split / Plunder / Guard.
 * Classic prisoner's-dilemma-with-a-counter matrix.
 */

export type PairOutcome = {
  a: number;
  b: number;
  title: string;
  description: string;
  honour?: boolean;
  revengeFor?: "a" | "b";
};

/** The full outcome matrix for two eligible players. Order-independent. */
export function resolvePairOutcome(choiceA: PlunderChoice, choiceB: PlunderChoice): PairOutcome {
  const key = `${choiceA}/${choiceB}`;
  switch (key) {
    case "split/split":
      return {
        a: SCORING.SPLIT_SPLIT_EACH,
        b: SCORING.SPLIT_SPLIT_EACH,
        title: "Fair winds! 🤝",
        description: `Both chose Split — ${SCORING.SPLIT_SPLIT_EACH} gold each. Honour among thieves lives.`,
        honour: true,
      };
    case "split/plunder":
      return {
        a: SCORING.PLUNDER_VICTIM,
        b: SCORING.PLUNDER_WINNER,
        title: "BETRAYAL! 🗡️",
        description: `A plunderer strikes! ${SCORING.PLUNDER_WINNER} for the traitor, scraps for the trusting soul.`,
        revengeFor: "a",
      };
    case "plunder/split":
      return {
        a: SCORING.PLUNDER_WINNER,
        b: SCORING.PLUNDER_VICTIM,
        title: "BETRAYAL! 🗡️",
        description: `A plunderer strikes! ${SCORING.PLUNDER_WINNER} for the traitor, scraps for the trusting soul.`,
        revengeFor: "b",
      };
    case "plunder/plunder":
      return {
        a: SCORING.PLUNDER_PLUNDER_EACH,
        b: SCORING.PLUNDER_PLUNDER_EACH,
        title: "Double cross, double curse! ☠️",
        description: `Both drew blades. The treasure cursed them — only ${SCORING.PLUNDER_PLUNDER_EACH} each.`,
      };
    case "guard/plunder":
      return {
        a: SCORING.GUARD_COUNTER_BONUS,
        b: 0,
        title: "Plunder blocked! 🛡️",
        description: `The guard saw it coming! Counter-bonus +${SCORING.GUARD_COUNTER_BONUS}, the plunderer gets nothing.`,
      };
    case "plunder/guard":
      return {
        a: 0,
        b: SCORING.GUARD_COUNTER_BONUS,
        title: "Plunder blocked! 🛡️",
        description: `The guard saw it coming! Counter-bonus +${SCORING.GUARD_COUNTER_BONUS}, the plunderer gets nothing.`,
      };
    case "guard/split":
      return {
        a: SCORING.GUARD_VS_SPLIT_GUARD,
        b: SCORING.GUARD_VS_SPLIT_SPLITTER,
        title: "Cautious waters 🌊",
        description: `One guarded, one split. The splitter gains ${SCORING.GUARD_VS_SPLIT_SPLITTER}, the paranoid guard ${SCORING.GUARD_VS_SPLIT_GUARD}.`,
      };
    case "split/guard":
      return {
        a: SCORING.GUARD_VS_SPLIT_SPLITTER,
        b: SCORING.GUARD_VS_SPLIT_GUARD,
        title: "Cautious waters 🌊",
        description: `One guarded, one split. The splitter gains ${SCORING.GUARD_VS_SPLIT_SPLITTER}, the paranoid guard ${SCORING.GUARD_VS_SPLIT_GUARD}.`,
      };
    case "guard/guard":
      return {
        a: SCORING.GUARD_VS_SPLIT_GUARD,
        b: SCORING.GUARD_VS_SPLIT_GUARD,
        title: "Stand-off 🧍🧍",
        description: `Two guards staring at each other. ${SCORING.GUARD_VS_SPLIT_GUARD} each for wasted paranoia.`,
      };
    default:
      return { a: 0, b: 0, title: "Confusion at sea", description: "Nobody moved. Nobody gained." };
  }
}

export type PairPlayerInput = {
  id: string;
  nickname: string;
  correct: boolean;
  choice?: PlunderChoice;
};

export type PairResolution = {
  events: RevealEvent[];
  lootDelta: Record<string, number>;
  chests: ChestAward[];
};

export function resolvePair(a: PairPlayerInput, b: PairPlayerInput): PairResolution {
  const events: RevealEvent[] = [];
  const lootDelta: Record<string, number> = {};
  const chests: ChestAward[] = [];

  if (!a.correct && !b.correct) {
    events.push(
      ev(
        "pairResult",
        `${a.nickname} ⚔️ ${b.nickname}`,
        "Neither found the treasure. The pot sinks, unclaimed.",
        {
          icon: "🌊",
          playerIds: [a.id, b.id],
        },
      ),
    );
    return { events, lootDelta, chests };
  }

  if (a.correct !== b.correct) {
    const winner = a.correct ? a : b;
    addDelta(lootDelta, winner.id, SCORING.SOLO_CORRECT_IN_PAIR);
    events.push(
      ev(
        "pairResult",
        `${winner.nickname} claims it alone!`,
        `Only ${winner.nickname} was correct — no dilemma, +${SCORING.SOLO_CORRECT_IN_PAIR} uncontested.`,
        {
          icon: "💰",
          playerIds: [a.id, b.id],
          pointsDelta: { [winner.id]: SCORING.SOLO_CORRECT_IN_PAIR },
        },
      ),
    );
    return { events, lootDelta, chests };
  }

  // Both correct: the dilemma. Missing choice defaults to Split (trusting by default).
  const ca = a.choice ?? "split";
  const cb = b.choice ?? "split";
  const outcome = resolvePairOutcome(ca, cb);
  addDelta(lootDelta, a.id, outcome.a);
  addDelta(lootDelta, b.id, outcome.b);
  events.push(
    ev(
      "pairResult",
      outcome.title,
      `${a.nickname} chose ${ca.toUpperCase()}, ${b.nickname} chose ${cb.toUpperCase()}. ${outcome.description}`,
      {
        icon: "⚔️",
        playerIds: [a.id, b.id],
        pointsDelta: { [a.id]: outcome.a, [b.id]: outcome.b },
      },
    ),
  );
  if (outcome.honour) {
    chests.push({ playerId: a.id, source: "honour" }, { playerId: b.id, source: "honour" });
    events.push(
      ev(
        "chestEarned",
        "Honour Chests! 🤝",
        `${a.nickname} and ${b.nickname} both kept the code — Honour Chest each.`,
        {
          icon: "🤝",
          playerIds: [a.id, b.id],
        },
      ),
    );
  }
  if (outcome.revengeFor) {
    const victim = outcome.revengeFor === "a" ? a : b;
    chests.push({ playerId: victim.id, source: "revenge" });
    events.push(
      ev(
        "chestEarned",
        "Revenge brews...",
        `${victim.nickname} pockets a Revenge Chest. This isn't over.`,
        {
          icon: "😤",
          playerIds: [victim.id],
        },
      ),
    );
  }
  return { events, lootDelta, chests };
}
