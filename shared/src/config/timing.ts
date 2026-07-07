/** All phase timers in milliseconds. Tune here, not inline. */
export const TIMING = {
  ROUND_INTRO_MS: 7_000,
  QUESTION_MS: 45_000,
  LOOT_DROP_MS: 55_000,
  AUCTION_MS: 25_000,
  FINAL_ACTION_MS: 25_000,
  PAIR_CHOICE_MS: 20_000,
  REVEAL_STEP_MS: 3_400,
  REVEAL_MIN_MS: 6_000,
  LEADERBOARD_MS: 14_000,
  WINNER_MS: 0, // no auto-advance
  SABOTAGE_LOCK_DELAY_MS: 5_000,
  BOT_ANSWER_MIN_MS: 2_000,
  BOT_ANSWER_MAX_MS: 8_000,
} as const;
