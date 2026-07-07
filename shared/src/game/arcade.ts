import { ARCADE } from "../config/arcade.js";
import type { QuestionResult, RevealEvent } from "../types/index.js";
import { addDelta, ev } from "./reveal.js";
import type { ChestAward } from "./resolveQuestion.js";

/**
 * Arcade question resolution — pure and fully testable.
 * Handles the decaying pot, streak bonuses, parrot copying, sword fights,
 * walk-the-plank, mutiny, marooning, and random sea events.
 */

export type ArcadePlayerInput = {
  id: string;
  nickname: string;
  score: number;
  streak: number;
  rank: number;
  /** undefined = no answer. */
  choiceIndex?: number;
  /** Epoch ms of the last answer lock. */
  lockedAt?: number;
  mutinied: boolean;
  /** Sitting this question out (marooned last question). */
  skipped: boolean;
  rumRush: boolean;
  parrotTargetId?: string;
  /** Walk the Plank deadline (epoch ms). Answering after it scores nothing. */
  plankUntil?: number;
};

export type SwordFightInput = { byId: string; targetId: string };

export type ArcadeResolveInput = {
  correctIndex: number;
  questionStartedAt: number;
  questionDurationMs: number;
  players: ArcadePlayerInput[];
  swordFights: SwordFightInput[];
  leaderId?: string;
  /** rng for sea events; pass a stub in tests. */
  rng?: () => number;
  /** Poseidon has already blessed these players this game. */
  poseidonUsed: Set<string>;
};

export type ArcadeResolution = {
  events: RevealEvent[];
  scoreDelta: Record<string, number>;
  streaks: Record<string, number>;
  results: Record<string, QuestionResult>;
  chests: ChestAward[];
  /** Players marooned for the NEXT question. */
  newlyMarooned: string[];
  rumRushConsumed: string[];
  poseidonBlessed: string[];
};

/** Pot value at a given lock time — decays linearly from POT_MAX to POT_MIN. */
export function potAt(
  lockedAt: number,
  startedAt: number,
  durationMs: number,
  max = ARCADE.POT_MAX,
  min = ARCADE.POT_MIN,
): number {
  if (durationMs <= 0) return max;
  const t = Math.min(1, Math.max(0, (lockedAt - startedAt) / durationMs));
  return Math.round(max - (max - min) * t);
}

/** Streak bonus: kicks in from streak 2, +10 per level, capped. */
export function streakBonus(streak: number): number {
  if (streak < 2) return 0;
  return Math.min(ARCADE.STREAK_BONUS_CAP, (streak - 1) * ARCADE.STREAK_BONUS_PER);
}

export function resolveArcadeQuestion(input: ArcadeResolveInput): ArcadeResolution {
  const rng = input.rng ?? Math.random;
  const events: RevealEvent[] = [];
  const scoreDelta: Record<string, number> = {};
  const streaks: Record<string, number> = {};
  const results: Record<string, QuestionResult> = {};
  const chests: ChestAward[] = [];
  const newlyMarooned: string[] = [];
  const rumRushConsumed: string[] = [];
  const poseidonBlessed: string[] = [];

  const byId = new Map(input.players.map((p) => [p.id, p]));
  const active = input.players.filter((p) => !p.skipped);

  // --- Effective answers (parrot copies its target) --------------------------
  const effectiveChoice = (p: ArcadePlayerInput): number | undefined => {
    if (p.parrotTargetId) {
      const t = byId.get(p.parrotTargetId);
      if (t && !t.skipped) return t.choiceIndex;
    }
    return p.choiceIndex;
  };

  const isCorrect = (p: ArcadePlayerInput): boolean => {
    if (p.skipped) return false;
    if (effectiveChoice(p) !== input.correctIndex) return false;
    // Walk the Plank: answering after the deadline scores nothing.
    if (p.plankUntil && (p.lockedAt ?? Infinity) > p.plankUntil) return false;
    return true;
  };

  // --- Base scoring: decaying pot + streak bonus -----------------------------
  for (const p of input.players) {
    if (p.skipped) {
      streaks[p.id] = p.streak;
      results[p.id] = {
        correct: false,
        correctIndex: input.correctIndex,
        earned: 0,
        streak: p.streak,
        streakBonus: 0,
        potAtLock: 0,
        skipped: true,
      };
      continue;
    }
    const correct = isCorrect(p);
    const walkedPlank =
      p.plankUntil !== undefined &&
      (p.lockedAt ?? Infinity) > p.plankUntil &&
      effectiveChoice(p) === input.correctIndex;
    const pot = correct
      ? potAt(p.lockedAt ?? input.questionStartedAt + input.questionDurationMs,
          input.questionStartedAt, input.questionDurationMs)
      : 0;
    const nextStreak = correct ? p.streak + 1 : 0;
    const bonus = correct ? streakBonus(nextStreak) : 0;
    let earned = pot + bonus;
    if (correct && p.rumRush) {
      earned *= 2;
      rumRushConsumed.push(p.id);
    }
    addDelta(scoreDelta, p.id, earned);
    streaks[p.id] = nextStreak;
    results[p.id] = {
      correct,
      correctIndex: input.correctIndex,
      earned,
      streak: nextStreak,
      streakBonus: bonus,
      potAtLock: pot,
    };
    if (walkedPlank) {
      events.push(
        ev("itemTriggered", "Off the plank! 🪵", `${p.nickname} answered too slowly — no gold.`, {
          icon: "🪵",
          playerIds: [p.id],
          animation: "plunder",
        }),
      );
    }
    if (correct && nextStreak === ARCADE.STREAK_CHEST_AT) {
      chests.push({ playerId: p.id, source: "streak" });
      events.push(
        ev("chestEarned", "On fire! 🔥", `${p.nickname} hits a ${nextStreak}-streak — bonus chest!`, {
          icon: "🔥",
          playerIds: [p.id],
        }),
      );
    }
  }

  // --- Sword fights -----------------------------------------------------------
  for (const duel of input.swordFights) {
    const a = byId.get(duel.byId);
    const b = byId.get(duel.targetId);
    if (!a || !b || a.skipped || b.skipped) continue;
    const aOk = isCorrect(a);
    const bOk = isCorrect(b);
    let winner: ArcadePlayerInput | undefined;
    let loser: ArcadePlayerInput | undefined;
    let steal: number = ARCADE.SWORD_FIGHT_STEAL;
    if (aOk && !bOk) [winner, loser] = [a, b];
    else if (bOk && !aOk) [winner, loser] = [b, a];
    else if (aOk && bOk) {
      // Both right: faster blade wins a smaller cut.
      steal = ARCADE.SWORD_FIGHT_TIE_STEAL;
      const aT = a.lockedAt ?? Infinity;
      const bT = b.lockedAt ?? Infinity;
      [winner, loser] = aT <= bT ? [a, b] : [b, a];
    }
    if (winner && loser) {
      const actual = Math.min(steal, Math.max(0, loser.score + (scoreDelta[loser.id] ?? 0)));
      addDelta(scoreDelta, winner.id, actual);
      addDelta(scoreDelta, loser.id, -actual);
      events.push(
        ev(
          "itemTriggered",
          "SWORD FIGHT! ⚔️",
          `${winner.nickname} wins the duel and takes ${actual} gold from ${loser.nickname}!`,
          {
            icon: "⚔️",
            playerIds: [winner.id, loser.id],
            pointsDelta: { [winner.id]: actual, [loser.id]: -actual },
            animation: "duel",
            intensity: "big",
          },
        ),
      );
    } else {
      events.push(
        ev("itemTriggered", "Blades clash... ⚔️", `${a.nickname} and ${b.nickname} both missed. No winner.`, {
          icon: "⚔️",
          playerIds: [a.id, b.id],
          animation: "duel",
        }),
      );
    }
  }

  // --- Mutiny -------------------------------------------------------------------
  const leader = input.leaderId ? byId.get(input.leaderId) : undefined;
  const mutineers = active.filter((p) => p.mutinied && p.id !== input.leaderId);
  if (leader && mutineers.length > 0) {
    const leaderRight = isCorrect(leader);
    if (!leaderRight) {
      const delta: Record<string, number> = {};
      for (const m of mutineers) {
        addDelta(scoreDelta, m.id, ARCADE.MUTINY_REWARD);
        delta[m.id] = ARCADE.MUTINY_REWARD;
        const r = results[m.id];
        if (r) r.mutiny = "won";
      }
      addDelta(scoreDelta, leader.id, -ARCADE.MUTINY_LEADER_PENALTY);
      delta[leader.id] = -ARCADE.MUTINY_LEADER_PENALTY;
      events.push(
        ev(
          "accusationCorrect",
          "MUTINY! ⚔️",
          `The crew turned on ${leader.nickname} — and the captain FAILED! +${ARCADE.MUTINY_REWARD} to each mutineer.`,
          {
            icon: "⚔️",
            playerIds: [leader.id, ...mutineers.map((m) => m.id)],
            pointsDelta: delta,
            animation: "mutiny",
            intensity: "big",
          },
        ),
      );
    } else {
      const delta: Record<string, number> = {};
      for (const m of mutineers) {
        addDelta(scoreDelta, m.id, -ARCADE.MUTINY_FAIL_PENALTY);
        delta[m.id] = -ARCADE.MUTINY_FAIL_PENALTY;
        const r = results[m.id];
        if (r) r.mutiny = "lost";
      }
      const defense = ARCADE.MUTINY_LEADER_DEFENSE * mutineers.length;
      addDelta(scoreDelta, leader.id, defense);
      delta[leader.id] = defense;
      events.push(
        ev(
          "accusationWrong",
          "Mutiny crushed! 👑",
          `${leader.nickname} answered right — the mutineers walk the plank. −${ARCADE.MUTINY_FAIL_PENALTY} each.`,
          {
            icon: "👑",
            playerIds: [leader.id, ...mutineers.map((m) => m.id)],
            pointsDelta: delta,
            animation: "mutiny",
            intensity: "big",
          },
        ),
      );
    }
    // Lone mutineer gets marooned — win or lose.
    if (mutineers.length === 1 && active.length >= ARCADE.MAROON_MIN_PLAYERS) {
      const lone = mutineers[0];
      if (lone) {
        newlyMarooned.push(lone.id);
        chests.push({ playerId: lone.id, source: "marooned" });
        const r = results[lone.id];
        if (r) r.marooned = true;
        events.push(
          ev(
            "scoreChanged",
            "MAROONED! 🏝️",
            `${lone.nickname} mutinied ALONE. Off to the island — skip a question, keep a chest.`,
            { icon: "🏝️", playerIds: [lone.id], animation: "wave", intensity: "big" },
          ),
        );
      }
    }
  }

  // --- Marooned: everyone right bar one ------------------------------------------
  if (active.length >= ARCADE.MAROON_MIN_PLAYERS) {
    const wrong = active.filter((p) => !isCorrect(p));
    if (wrong.length === 1) {
      const odd = wrong[0];
      if (odd && !newlyMarooned.includes(odd.id)) {
        newlyMarooned.push(odd.id);
        chests.push({ playerId: odd.id, source: "marooned" });
        const r = results[odd.id];
        if (r) r.marooned = true;
        events.push(
          ev(
            "scoreChanged",
            "MAROONED! 🏝️",
            `Everyone got it right except ${odd.nickname}. Enjoy the island — and the pity chest.`,
            { icon: "🏝️", playerIds: [odd.id], animation: "wave", intensity: "big" },
          ),
        );
      }
    }
  }

  // --- Random sea events -----------------------------------------------------------
  // Dolphin burglary: too many right answers attract dolphins.
  const correctCount = active.filter((p) => isCorrect(p)).length;
  if (
    active.length >= ARCADE.MAROON_MIN_PLAYERS &&
    correctCount / active.length >= ARCADE.DOLPHIN_THRESHOLD
  ) {
    const delta: Record<string, number> = {};
    for (const p of active) {
      const pool = Math.max(0, p.score + (scoreDelta[p.id] ?? 0));
      const stolen = Math.round(pool * ARCADE.DOLPHIN_STEAL_PCT);
      if (stolen > 0) {
        addDelta(scoreDelta, p.id, -stolen);
        delta[p.id] = -stolen;
      }
    }
    if (Object.keys(delta).length > 0) {
      events.push(
        ev(
          "scoreChanged",
          "DOLPHIN BURGLARY! 🐬",
          "Too many right answers — a pod of larcenous dolphins skims everyone's gold.",
          { icon: "🐬", pointsDelta: delta, animation: "wave", intensity: "medium" },
        ),
      );
    }
  }

  // Kraken: small chance it surfaces and drags down the leader's gold.
  if (leader && rng() < ARCADE.KRAKEN_CHANCE) {
    const pool = Math.max(0, leader.score + (scoreDelta[leader.id] ?? 0));
    const dragged = Math.round(pool * ARCADE.KRAKEN_STEAL_PCT);
    if (dragged > 0) {
      addDelta(scoreDelta, leader.id, -dragged);
      events.push(
        ev(
          "scoreChanged",
          "THE KRAKEN! 🦑",
          `Tentacles rise from the deep and drag ${dragged} of ${leader.nickname}'s gold under.`,
          {
            icon: "🦑",
            playerIds: [leader.id],
            pointsDelta: { [leader.id]: -dragged },
            animation: "plunder",
            intensity: "big",
          },
        ),
      );
    }
  }

  // Poseidon: blesses a struggling pirate once per game.
  if (leader) {
    const leaderTotal = Math.max(1, leader.score + (scoreDelta[leader.id] ?? 0));
    const struggling = active
      .filter((p) => p.id !== leader.id && !input.poseidonUsed.has(p.id))
      .filter(
        (p) => (p.score + (scoreDelta[p.id] ?? 0)) / leaderTotal < ARCADE.POSEIDON_POOR_PCT,
      )
      .sort((a, b) => a.score + (scoreDelta[a.id] ?? 0) - (b.score + (scoreDelta[b.id] ?? 0)));
    const blessed = struggling[0];
    if (blessed && !isCorrect(blessed) && rng() < 0.5) {
      addDelta(scoreDelta, blessed.id, ARCADE.POSEIDON_BLESSING);
      poseidonBlessed.push(blessed.id);
      events.push(
        ev(
          "scoreChanged",
          "POSEIDON RISES! 🔱",
          `The sea god pities ${blessed.nickname} and returns ${ARCADE.POSEIDON_BLESSING} gold from the deep.`,
          {
            icon: "🔱",
            playerIds: [blessed.id],
            pointsDelta: { [blessed.id]: ARCADE.POSEIDON_BLESSING },
            animation: "curse",
            intensity: "medium",
          },
        ),
      );
    }
  }

  return {
    events,
    scoreDelta,
    streaks,
    results,
    chests,
    newlyMarooned,
    rumRushConsumed,
    poseidonBlessed,
  };
}
