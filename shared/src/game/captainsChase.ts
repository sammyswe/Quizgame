import { SCORING } from "../config/scoring.js";
import type { ChaseState, RevealEvent } from "../types/index.js";
import { addDelta, ev } from "./reveal.js";

/**
 * Captain's Chase: the leader becomes the Captain and starts ahead on a sea
 * track. Correct answers move the Captain forward and chasers closer. If a
 * chaser reaches the Captain, they steal points. If the Captain survives all
 * questions, they earn an escape bonus.
 */

export const CHASE_CONFIG = {
  TOTAL_QUESTIONS: 3,
  CAPTAIN_HEAD_START: 3,
  TRACK_LENGTH: 10,
} as const;

export function createChase(captainId: string, chaserIds: string[]): ChaseState {
  const positions: Record<string, number> = { [captainId]: CHASE_CONFIG.CAPTAIN_HEAD_START };
  for (const id of chaserIds) positions[id] = 0;
  return {
    captainId,
    positions,
    questionNumber: 1,
    totalQuestions: CHASE_CONFIG.TOTAL_QUESTIONS,
  };
}

export type ChaseStepResult = {
  chase: ChaseState;
  events: RevealEvent[];
  lootDelta: Record<string, number>;
  finished: boolean;
};

/**
 * Advance the chase given who answered correctly this question.
 * The first chaser (by closest position, then earliest lock) to reach the
 * Captain catches them.
 */
export function stepChase(
  chase: ChaseState,
  correctIds: Set<string>,
  nicknames: Record<string, string>,
  captainScorePool: number,
): ChaseStepResult {
  const events: RevealEvent[] = [];
  const lootDelta: Record<string, number> = {};
  const next: ChaseState = { ...chase, positions: { ...chase.positions } };
  const name = (id: string) => nicknames[id] ?? "???";

  const captainCorrect = correctIds.has(chase.captainId);
  if (captainCorrect) {
    next.positions[chase.captainId] = (next.positions[chase.captainId] ?? 0) + 1;
    events.push(
      ev(
        "chaseMove",
        "The Captain surges ahead! ⛵",
        `${name(chase.captainId)} answered correctly and gains a length of open water.`,
        {
          icon: "⛵",
          playerIds: [chase.captainId],
        },
      ),
    );
  } else {
    events.push(
      ev(
        "chaseMove",
        "The Captain falters!",
        `${name(chase.captainId)} got it wrong — the ship stalls in the wind.`,
        {
          icon: "🌫️",
          playerIds: [chase.captainId],
        },
      ),
    );
  }

  const chasers = Object.keys(chase.positions).filter((id) => id !== chase.captainId);
  let caughtBy: string | undefined;
  for (const id of chasers) {
    if (!correctIds.has(id)) continue;
    next.positions[id] = (next.positions[id] ?? 0) + 1;
    addDelta(lootDelta, id, SCORING.CHASE_CHASER_STEP_BONUS);
    events.push(
      ev(
        "chaseMove",
        "A chaser gains! 🚣",
        `${name(id)} closes the gap and pockets +${SCORING.CHASE_CHASER_STEP_BONUS}.`,
        {
          icon: "🚣",
          playerIds: [id],
          pointsDelta: { [id]: SCORING.CHASE_CHASER_STEP_BONUS },
        },
      ),
    );
    const captainPos = next.positions[chase.captainId] ?? 0;
    if (!caughtBy && (next.positions[id] ?? 0) >= captainPos) {
      caughtBy = id;
    }
  }

  const isLastQuestion = chase.questionNumber >= chase.totalQuestions;

  if (caughtBy) {
    next.caughtBy = caughtBy;
    const steal = Math.min(SCORING.CHASE_CATCH_STEAL, Math.max(0, captainScorePool));
    addDelta(lootDelta, caughtBy, steal);
    addDelta(lootDelta, chase.captainId, -steal);
    events.push(
      ev(
        "chaseMove",
        "CAUGHT! ⚓",
        `${name(caughtBy)} boarded the Captain's ship first and plunders ${steal} from ${name(chase.captainId)}!`,
        {
          icon: "⚓",
          playerIds: [caughtBy, chase.captainId],
          pointsDelta: { [caughtBy]: steal, [chase.captainId]: -steal },
        },
      ),
    );
    return { chase: next, events, lootDelta, finished: true };
  }

  if (isLastQuestion) {
    addDelta(lootDelta, chase.captainId, SCORING.CHASE_CAPTAIN_ESCAPE);
    events.push(
      ev(
        "chaseMove",
        "THE CAPTAIN ESCAPES! 🌅",
        `${name(chase.captainId)} sails over the horizon with +${SCORING.CHASE_CAPTAIN_ESCAPE} escape bonus!`,
        {
          icon: "🌅",
          playerIds: [chase.captainId],
          pointsDelta: { [chase.captainId]: SCORING.CHASE_CAPTAIN_ESCAPE },
        },
      ),
    );
    return { chase: next, events, lootDelta, finished: true };
  }

  next.questionNumber += 1;
  return { chase: next, events, lootDelta, finished: false };
}
