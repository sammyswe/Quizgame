import { FINAL_ACTIONS, TIMING } from "@treasure-trap/shared";
import type { PlunderChoice } from "@treasure-trap/shared";
import {
  submitAnswer,
  submitBid,
  submitFinalAction,
  submitPairChoice,
  type ServerRoom,
} from "./engine.js";

const BOT_NAMES = [
  "Salty Sam",
  "One-Eye Wren",
  "Barnacle Bob",
  "Mad Meg",
  "Rusty Pete",
  "Kraken Kate",
  "Gullible Gus",
];

export function botName(index: number): string {
  return BOT_NAMES[index % BOT_NAMES.length] ?? `Bot ${index}`;
}

function delay(): number {
  return (
    TIMING.BOT_ANSWER_MIN_MS + Math.random() * (TIMING.BOT_ANSWER_MAX_MS - TIMING.BOT_ANSWER_MIN_MS)
  );
}

/**
 * Bots make the prototype playtestable solo. They answer with ~60% accuracy,
 * bid modestly, and pick random-but-legal choices everywhere else.
 */
export function runBotsForPhase(room: ServerRoom): void {
  const bots = [...room.players.values()].filter((p) => p.isBot);
  if (bots.length === 0) return;
  const phaseAtSchedule = room.phase;

  for (const bot of bots) {
    setTimeout(() => {
      if (room.phase !== phaseAtSchedule) return;
      switch (room.phase) {
        case "question": {
          if (room.answers.has(bot.id)) return;
          const q = room.currentQuestion;
          const obscure = room.currentObscure;
          const optionCount = q?.options.length ?? obscure?.options.length ?? 4;
          const round = room.roundPlan[room.roundIndex];
          const accurate = Math.random() < 0.6;
          let choiceIndex: number;
          if (q && accurate) {
            choiceIndex = q.correctIndex;
          } else if (obscure && accurate) {
            const correctIdxs = obscure.options
              .map((o, i) => (o.correct ? i : -1))
              .filter((i) => i >= 0);
            choiceIndex = correctIdxs[Math.floor(Math.random() * correctIdxs.length)] ?? 0;
          } else {
            choiceIndex = Math.floor(Math.random() * optionCount);
          }
          if (round === "lootDrop") {
            const alloc = [0, 0, 0, 0];
            if (Math.random() < 0.5) {
              alloc[choiceIndex] = 100;
            } else {
              alloc[choiceIndex] = 60;
              alloc[(choiceIndex + 1) % 4] = 40;
            }
            submitAnswer(room, bot.id, { lootAllocation: alloc, confident: Math.random() < 0.2 });
          } else {
            submitAnswer(room, bot.id, { choiceIndex });
          }
          break;
        }
        case "auction": {
          const budget = bot.score + bot.roundLoot;
          const amount =
            Math.random() < 0.3 ? 0 : Math.floor(Math.random() * Math.min(budget, 120));
          submitBid(room, bot.id, amount);
          break;
        }
        case "pair_choice": {
          const choices: PlunderChoice[] = ["split", "split", "plunder", "guard"];
          const choice = choices[Math.floor(Math.random() * choices.length)] ?? "split";
          submitPairChoice(room, bot.id, choice);
          break;
        }
        case "final_action": {
          const offered = bot.finalActionsOffered ?? [];
          const easy = offered.filter((a) => !FINAL_ACTIONS[a].needsTarget);
          const pick = easy[Math.floor(Math.random() * easy.length)] ?? offered[0];
          if (!pick) return;
          const def = FINAL_ACTIONS[pick];
          let targetId: string | undefined;
          if (def.needsTarget) {
            const others = [...room.players.keys()].filter((id) => id !== bot.id);
            targetId = others[Math.floor(Math.random() * others.length)];
          }
          submitFinalAction(room, bot.id, { actionId: pick, targetId });
          break;
        }
        default:
          break;
      }
    }, delay());
  }
}
