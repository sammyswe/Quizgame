import { SCORING } from "../config/scoring.js";

/** Scores can never go below MIN_SCORE (0). All score mutation flows through here. */
export function clampScore(score: number): number {
  return Math.max(SCORING.MIN_SCORE, Math.round(score));
}

/** Apply a delta to a score, clamped at zero. Returns the *actual* applied delta. */
export function applyDelta(score: number, delta: number): { next: number; applied: number } {
  const next = clampScore(score + delta);
  return { next, applied: next - score };
}

export function correctAnswerPoints(opts: { doubled?: boolean } = {}): number {
  return SCORING.BASE_CORRECT * (opts.doubled ? SCORING.RUM_RUSH_MULTIPLIER : 1);
}

/**
 * Obscure Island: fewer players on your correct option = more gold.
 * countOnOption includes yourself.
 */
export function obscurePoints(correct: boolean, countOnOption: number): number {
  if (!correct) return 0;
  if (countOnOption <= 1) return SCORING.OBSCURE_SOLO;
  if (countOnOption <= 3) return SCORING.OBSCURE_FEW;
  return SCORING.OBSCURE_MANY;
}

/**
 * Rank tier used for chest odds and Final Plunder protection.
 * rank is 1-based, playerCount >= 2.
 */
export type RankTier = "first" | "second" | "middle" | "bottom";

export function rankTier(rank: number, playerCount: number): RankTier {
  if (rank <= 1) return "first";
  if (rank === playerCount) return "bottom";
  if (rank === 2) return "second";
  return "middle";
}

/** Protected score fraction in the Final Plunder by leaderboard tier. */
export function protectedPct(rank: number, playerCount: number): number {
  const tier = rankTier(rank, playerCount);
  switch (tier) {
    case "first":
      return SCORING.PROTECTED_PCT.first;
    case "second":
      return SCORING.PROTECTED_PCT.second;
    case "bottom":
      return SCORING.PROTECTED_PCT.bottom;
    default:
      return SCORING.PROTECTED_PCT.middle;
  }
}

/** Split of a score into protected/unprotected pools for the Final Plunder. */
export function splitProtected(
  score: number,
  rank: number,
  playerCount: number,
): {
  protected: number;
  unprotected: number;
} {
  const pct = protectedPct(rank, playerCount);
  const prot = Math.round(score * pct);
  return { protected: prot, unprotected: score - prot };
}

/**
 * Compute 1-based ranks from scores (ties share the higher rank).
 * Returns map of playerId -> rank.
 */
export function computeRanks(scores: Record<string, number>): Record<string, number> {
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const ranks: Record<string, number> = {};
  sorted.forEach(([id, score], i) => {
    const prev = sorted[i - 1];
    if (prev && prev[1] === score) {
      ranks[id] = ranks[prev[0]] ?? i + 1;
    } else {
      ranks[id] = i + 1;
    }
  });
  return ranks;
}
