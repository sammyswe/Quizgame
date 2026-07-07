import type { MissionDef, MissionId } from "../types/index.js";

/**
 * The 12 secret missions. `implemented: true` missions are fully auto-resolved
 * by the engine in v1. The rest are stubbed and documented in docs/GAME_DESIGN.md.
 */
export const MISSIONS: Record<MissionId, MissionDef> = {
  falseFriend: {
    id: "falseFriend",
    name: "False Friend",
    icon: "🎣",
    description: "Pick a pirate and a wrong answer. Convince them to choose it.",
    deceptive: true,
    implemented: true,
    needsTarget: true,
    needsOption: true,
  },
  piedPiper: {
    id: "piedPiper",
    name: "Pied Piper",
    icon: "🪈",
    description: "Get at least two pirates to follow your exact answer.",
    deceptive: true,
    implemented: true,
  },
  honestCaptain: {
    id: "honestCaptain",
    name: "Honest Captain",
    icon: "😇",
    description: "Answer correctly AND get at least one pirate to follow you.",
    deceptive: false,
    implemented: true,
  },
  snakeOil: {
    id: "snakeOil",
    name: "Snake Oil",
    icon: "🐍",
    description: "Make the current leader answer incorrectly.",
    deceptive: true,
    implemented: true,
  },
  loudLiar: {
    id: "loudLiar",
    name: "Loud Liar",
    icon: "📢",
    description: "Speak first and pull someone off the correct answer. (v1: same check as False Friend)",
    deceptive: true,
    implemented: false,
  },
  fakePanic: {
    id: "fakePanic",
    name: "Fake Panic",
    icon: "😱",
    description: "Pretend uncertainty and get someone to follow your guess. (v1 stub)",
    deceptive: true,
    implemented: false,
  },
  saveTheSucker: {
    id: "saveTheSucker",
    name: "Save the Sucker",
    icon: "🛟",
    description: "Persuade a pirate off a wrong answer and onto the right one. (v1 stub)",
    deceptive: false,
    implemented: false,
  },
  pirateProphet: {
    id: "pirateProphet",
    name: "Pirate Prophet",
    icon: "🔮",
    description: "Pick a pirate. If they answer wrong, your prophecy pays out.",
    deceptive: false,
    implemented: true,
    needsTarget: true,
  },
  mutinyBait: {
    id: "mutinyBait",
    name: "Mutiny Bait",
    icon: "🪤",
    description: "Get another pirate to falsely accuse you. (auto-checked when it happens)",
    deceptive: false,
    implemented: true,
  },
  loneTreasure: {
    id: "loneTreasure",
    name: "Lone Treasure",
    icon: "💎",
    description: "Be the ONLY pirate to choose the correct answer.",
    deceptive: false,
    implemented: true,
  },
  herdTrap: {
    id: "herdTrap",
    name: "Herd Trap",
    icon: "🐑",
    description: "Herd the crew onto a low-value answer while you take a better one. (v1 stub)",
    deceptive: true,
    implemented: false,
  },
  doubleCross: {
    id: "doubleCross",
    name: "Double Cross",
    icon: "🤝",
    description: "Win a pirate's trust this round, betray them later. (v1 stub)",
    deceptive: true,
    implemented: false,
  },
};

/** Missions the engine can hand out in False Map / Double Agent (fully working). */
export const ASSIGNABLE_MISSIONS: MissionId[] = [
  "falseFriend",
  "piedPiper",
  "honestCaptain",
  "snakeOil",
  "pirateProphet",
  "loneTreasure",
];
