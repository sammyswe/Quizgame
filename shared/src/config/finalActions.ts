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
    description:
      "Raise your protected score by 15% this question. Safe and boring — like a coward.",
    needsTarget: false,
    tiers: ["leader", "middle"],
  },
  captainsShield: {
    id: "captainsShield",
    name: "Captain's Shield",
    icon: "🛡️",
    description: "Block the first steal or attack aimed at you this question.",
    needsTarget: false,
    tiers: ["leader"],
  },
  captainsCurse: {
    id: "captainsCurse",
    name: "Captain's Curse",
    icon: "☠️",
    description: "The first attack on you reverses onto the attacker.",
    needsTarget: false,
    tiers: ["leader"],
  },
  bodyguard: {
    id: "bodyguard",
    name: "Bodyguard",
    icon: "🦍",
    description: "Guard another pirate. If they're attacked, you block it and both gain a bonus.",
    needsTarget: true,
    tiers: ["middle"],
  },
  raiseTheBlackFlag: {
    id: "raiseTheBlackFlag",
    name: "Raise the Black Flag",
    icon: "🏴‍☠️",
    description: "If YOU answer correctly, every other pirate loses 50 unprotected points.",
    needsTarget: false,
    tiers: ["middle", "bottom"],
  },
  lastCannon: {
    id: "lastCannon",
    name: "Last Cannon",
    icon: "🧨",
    description: "One desperate shot: answer correctly for a +150 bonus.",
    needsTarget: false,
    tiers: ["bottom"],
  },
  crownHeist: {
    id: "crownHeist",
    name: "Crown Heist",
    icon: "👑",
    description: "Answer correctly to steal 15% of the leader's unprotected score.",
    needsTarget: false,
    tiers: ["bottom"],
  },
  falseTreasure: {
    id: "falseTreasure",
    name: "False Treasure",
    icon: "🪤",
    description:
      "Plant fake loot. The first pirate who steals from you gets nothing and pays you instead.",
    needsTarget: false,
    tiers: ["leader"],
  },
  followMe: {
    id: "followMe",
    name: "Follow Me",
    icon: "🧭",
    description: "Pick a pirate. If you both answer correctly, you both gain a trust bonus.",
    needsTarget: true,
    tiers: ["middle"],
  },
  betrayTheCrew: {
    id: "betrayTheCrew",
    name: "Betray the Crew",
    icon: "🐀",
    description:
      "Pick a pirate. Steal 100 of their unprotected points if you answer right and they don't.",
    needsTarget: true,
    tiers: ["middle", "bottom"],
  },
  allInPlunder: {
    id: "allInPlunder",
    name: "All-In Plunder",
    icon: "🎰",
    description: "Double points if correct. Lose 100 unprotected points if wrong. Full send.",
    needsTarget: false,
    tiers: ["bottom"],
  },
  spyTheDeck: {
    id: "spyTheDeck",
    name: "Spy the Deck",
    icon: "🕵️",
    description: "Peek: one wrong option is removed for you this question.",
    needsTarget: false,
    tiers: ["middle", "bottom"],
  },
  blameGame: {
    id: "blameGame",
    name: "Blame Game",
    icon: "👉",
    description:
      "Pick a pirate. If they answer wrong, you gain half of what they lose. (v1 simplified: +60)",
    needsTarget: true,
    tiers: ["middle"],
    simplified: true,
  },
  cursedChest: {
    id: "cursedChest",
    name: "Cursed Chest",
    icon: "📦",
    description: "Gamble: 50/50 between +120 and -60 unprotected. The chest decides.",
    needsTarget: false,
    tiers: ["bottom"],
    simplified: true,
  },
  doubleCross: {
    id: "doubleCross",
    name: "Double Cross",
    icon: "🃏",
    description:
      "Pick a pirate. If they chose an attack this question, you steal its bonus. (v1 simplified)",
    needsTarget: true,
    tiers: ["leader", "middle"],
    simplified: true,
  },
};

export const FINAL_ACTION_LIST = Object.values(FINAL_ACTIONS);
