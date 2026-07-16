import type { PowerUpDef, PowerUpId, Rarity } from "../types/index.js";

/**
 * The arcade power-up set. Attacks are fired at another player's avatar on
 * the question screen; self items apply instantly with a flourish.
 */
export const POWERUPS: Record<PowerUpId, PowerUpDef> = {
  eyepatch: {
    id: "eyepatch",
    name: "Eyepatch",
    icon: "EP",
    rarity: "common",
    description: "50/50 — removes half the wrong answers.",
    target: "self",
    isAttack: false,
    animation: "aura",
  },
  parrot: {
    id: "parrot",
    name: "Parrot",
    icon: "PA",
    rarity: "common",
    description: "Copy another pirate's answer.",
    target: "otherPlayer",
    isAttack: false,
    animation: "sneak",
  },
  whiteFlag: {
    id: "whiteFlag",
    name: "White Flag",
    icon: "WF",
    rarity: "common",
    description: "Sit out this question and preserve your streak.",
    target: "self",
    isAttack: false,
    animation: "aura",
  },
  telescope: {
    id: "telescope",
    name: "Telescope",
    icon: "TE",
    rarity: "rare",
    description: "Privately see another pirate's committed answer.",
    target: "otherPlayer",
    isAttack: false,
    animation: "aura",
  },
  rumRush: {
    id: "rumRush",
    name: "Rum Rush",
    icon: "RR",
    rarity: "rare",
    description: "Double your next correct reward.",
    target: "self",
    isAttack: false,
    animation: "aura",
  },
  cannonball: {
    id: "cannonball",
    name: "Cannonball",
    icon: "CB",
    rarity: "rare",
    description: "Blast holes in the middle of a pirate's answers.",
    target: "otherPlayer",
    isAttack: true,
    animation: "projectile",
  },
  walkThePlank: {
    id: "walkThePlank",
    name: "Walk the Plank",
    icon: "WP",
    rarity: "rare",
    description: "Force a pirate to answer in 5 seconds — or score nothing.",
    target: "otherPlayer",
    isAttack: true,
    animation: "projectile",
  },
  hook: {
    id: "hook",
    name: "Hook",
    icon: "HK",
    rarity: "epic",
    description: "Steal a random power-up from a pirate.",
    target: "otherPlayer",
    isAttack: true,
    animation: "swap",
  },
  swordFight: {
    id: "swordFight",
    name: "Sword Fight",
    icon: "SF",
    rarity: "epic",
    description: "Duel a pirate on this question. Winner steals gold.",
    target: "otherPlayer",
    isAttack: true,
    animation: "projectile",
  },
  secretX: {
    id: "secretX",
    name: "Secret X",
    icon: "SX",
    rarity: "legendary",
    description: "X marks the spot — reveals the correct answer.",
    target: "self",
    isAttack: false,
    animation: "aura",
  },
  cannonballBarrage: {
    id: "cannonballBarrage",
    name: "Cannonball Barrage",
    icon: "BR",
    rarity: "legendary",
    description: "Blast holes in EVERYONE else's answers.",
    target: "allOthers",
    isAttack: true,
    animation: "projectile",
  },
  barnacle: {
    id: "barnacle",
    name: "Barnacle Net",
    icon: "BN",
    rarity: "epic",
    description: "Cover one answer on another pirate's screen.",
    target: "otherPlayer",
    isAttack: true,
    animation: "projectile",
  },
  barnacleInfestation: {
    id: "barnacleInfestation",
    name: "Barnacle Infestation",
    icon: "BI",
    rarity: "legendary",
    description: "Cover one answer for every other pirate.",
    target: "allOthers",
    isAttack: true,
    animation: "projectile",
  },
};

export const POWERUP_LIST = Object.values(POWERUPS);

/** Power-up pools per rarity for chest rolls. */
export const POWERUPS_BY_RARITY: Record<Rarity, PowerUpId[]> = {
  common: ["eyepatch", "parrot", "whiteFlag"],
  rare: ["telescope", "rumRush", "cannonball", "walkThePlank"],
  epic: ["hook", "swordFight", "barnacle"],
  legendary: ["secretX", "cannonballBarrage", "barnacleInfestation"],
};

/** Roll a power-up of the given rarity. Pass rng for deterministic tests. */
export function rollPowerUp(rarity: Rarity, rng: () => number = Math.random): PowerUpId {
  const pool = POWERUPS_BY_RARITY[rarity];
  return pool[Math.floor(rng() * pool.length)] ?? pool[0] ?? "eyepatch";
}
