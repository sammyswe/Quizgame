import { sfx } from "./sfx";

/**
 * Named sound events — the game's audio vocabulary. Components fire events by
 * name; this map decides what actually plays. The native iOS build will remap
 * these to real sound files + haptics without touching call sites.
 */
export type SoundEventName =
  | "chestOpen"
  | "itemReveal"
  | "cannonFire"
  | "lootPlundered"
  | "correctAnswer"
  | "wrongAnswer"
  | "mutiny"
  | "finalPlunder"
  | "winner"
  | "scoreTick"
  | "itemBlocked"
  | "attackReversed"
  | "answerLocked"
  | "answerChanged"
  | "coinGain"
  | "roundIntro"
  | "timerUrgent"
  | "uiTap";

const SOUND_MAP: Record<SoundEventName, () => void> = {
  chestOpen: sfx.chest,
  itemReveal: sfx.legendary,
  cannonFire: sfx.boom,
  lootPlundered: sfx.lose,
  correctAnswer: sfx.sting,
  wrongAnswer: sfx.lose,
  mutiny: sfx.alarm,
  finalPlunder: sfx.drum,
  winner: sfx.fanfare,
  scoreTick: sfx.tap,
  itemBlocked: sfx.sting,
  attackReversed: sfx.legendary,
  answerLocked: sfx.lock,
  answerChanged: sfx.select,
  coinGain: sfx.coins,
  roundIntro: sfx.drum,
  timerUrgent: sfx.tick,
  uiTap: sfx.tap,
};

export function playSound(name: SoundEventName): void {
  SOUND_MAP[name]();
}
