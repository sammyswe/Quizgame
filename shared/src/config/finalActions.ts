import type { FinalActionDef, FinalActionId } from "../types/index.js";

/**
 * Final Plunder actions. Before each of the 3 final questions every player is
 * offered 3 of these based on leaderboard tier. Leaders defend, the bottom
 * attacks. All effects resolve at the reveal, sequentially.
 */
export const FINAL_ACTIONS: Record<FinalActionId, FinalActionDef> = {
  bankTheBooty: {
    id: "bankTheBooty",
    name: "Bank the Booty",
    icon: "🏦",
    description: "Protect 15% more of your gold.",
    needsTarget: false,
    tiers: ["leader", "middle"],
  },
  captainsShield: {
    id: "captainsShield",
    name: "Captain's Shield",
    icon: "🛡️",
    description: "Block the first attack on you.",
    needsTarget: false,
    tiers: ["leader"],
  },
  captainsCurse: {
    id: "captainsCurse",
    name: "Captain's Curse",
    icon: "☠️",
    description: "Bounce the first attack back at the attacker.",
    needsTarget: false,
    tiers: ["leader"],
  },
  bodyguard: {
    id: "bodyguard",
    name: "Bodyguard",
    icon: "🦍",
    description: "Guard a pirate. Block an attack, both profit.",
    needsTarget: true,
    tiers: ["middle"],
  },
  raiseTheBlackFlag: {
    id: "raiseTheBlackFlag",
    name: "Raise the Black Flag",
    icon: "🏴‍☠️",
    description: "Answer right: everyone else loses 50 gold.",
    needsTarget: false,
    tiers: ["middle", "bottom"],
  },
  lastCannon: {
    id: "lastCannon",
    name: "Last Cannon",
    icon: "🧨",
    description: "Answer right for +150 gold.",
    needsTarget: false,
    tiers: ["bottom"],
  },
  crownHeist: {
    id: "crownHeist",
    name: "Crown Heist",
    icon: "👑",
    description: "Answer right to steal 15% of the leader's gold.",
    needsTarget: false,
    tiers: ["bottom"],
  },
  falseTreasure: {
    id: "falseTreasure",
    name: "False Treasure",
    icon: "🪤",
    description: "Set a trap. The first thief pays YOU instead.",
    needsTarget: false,
    tiers: ["leader"],
  },
  followMe: {
    id: "followMe",
    name: "Follow Me",
    icon: "🧭",
    description: "Pick a pirate. Both answer right, both profit.",
    needsTarget: true,
    tiers: ["middle"],
  },
  betrayTheCrew: {
    id: "betrayTheCrew",
    name: "Betray the Crew",
    icon: "🐀",
    description: "Beat a pirate on this question to steal 100 gold.",
    needsTarget: true,
    tiers: ["middle", "bottom"],
  },
  allInPlunder: {
    id: "allInPlunder",
    name: "All-In Plunder",
    icon: "🎰",
    description: "Double gold if right. Lose 100 if wrong.",
    needsTarget: false,
    tiers: ["bottom"],
  },
  spyTheDeck: {
    id: "spyTheDeck",
    name: "Spy the Deck",
    icon: "🕵️",
    description: "Remove one wrong answer for yourself.",
    needsTarget: false,
    tiers: ["middle", "bottom"],
  },
  blameGame: {
    id: "blameGame",
    name: "Blame Game",
    icon: "👉",
    description: "Pick a pirate. If they answer wrong, you gain +60.",
    needsTarget: true,
    tiers: ["middle"],
    simplified: true,
  },
  cursedChest: {
    id: "cursedChest",
    name: "Cursed Chest",
    icon: "📦",
    description: "Gamble: 50/50 for +120 or −60.",
    needsTarget: false,
    tiers: ["bottom"],
    simplified: true,
  },
  doubleCross: {
    id: "doubleCross",
    name: "Double Cross",
    icon: "🃏",
    description: "Pick a pirate. If they attacked, steal their bonus.",
    needsTarget: true,
    tiers: ["leader", "middle"],
    simplified: true,
  },
};

export const FINAL_ACTION_LIST = Object.values(FINAL_ACTIONS);
