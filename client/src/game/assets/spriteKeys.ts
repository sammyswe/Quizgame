/**
 * Central registry of texture keys. Scene code must reference textures through
 * these constants (usually via AssetManager), never through hardcoded strings.
 */

export const PROC = {
  oceanBg: "proc-ocean-bg",
  waveLayer: "proc-wave-layer",
  fog: "proc-fog",
  island: "proc-island",
  islandGlow: "proc-island-glow",
  shipPlayer: "proc-ship-player",
  shipEnemy: "proc-ship-enemy",
  coin: "proc-coin",
  chip: "proc-chip",
  chest: "proc-chest",
  cannonball: "proc-cannonball",
  smoke: "proc-smoke",
  spark: "proc-spark",
  skull: "proc-skull",
  lockInButton: "proc-lockin-btn",
  reticle: "proc-reticle",
  glowSoft: "proc-glow-soft",
  plaque: "proc-plaque",
  moon: "proc-moon",
} as const;

/** avatar-0 .. avatar-7 medallions */
export const avatarKey = (avatarId: number): string => `proc-avatar-${((avatarId % 8) + 8) % 8}`;
/** flag-0 .. flag-7 confidence flags in player colours */
export const flagKey = (avatarId: number): string => `proc-flag-${((avatarId % 8) + 8) % 8}`;
/** emote icons overlaid on avatars */
export const emoteKey = (
  emote: "happy" | "shocked" | "angry" | "scared" | "winner" | "locked",
): string => `proc-emote-${emote}`;

/** Keys for Higgsfield-generated art (loaded only if the files exist). */
export const HF = {
  background: "hf-loot-drop-bg",
  islands: "hf-islands",
  ships: "hf-ships",
  coins: "hf-coins",
  chests: "hf-chests",
  avatars: "hf-avatars",
  vfx: "hf-vfx",
  lockIn: "hf-lock-in",
  rarity: "hf-rarity",
} as const;

/** The 8 player colours used for flags, avatars, ship sails and glows. */
export const PLAYER_COLORS: number[] = [
  0x2ee6ff, // cyan
  0xff4fd8, // magenta
  0xffd23e, // gold
  0x7cff4f, // lime
  0xff7a3d, // orange
  0xa06bff, // purple
  0xff4f5e, // red
  0x4f8dff, // blue
];
