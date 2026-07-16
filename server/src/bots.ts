import { POWERUPS, TIMING } from "@treasure-trap/shared";
import { declareMutiny, submitAnswer, usePowerUp, type ServerRoom } from "./engine.js";

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
 * occasionally mutiny against the leader, and sometimes fire a power-up.
 */
export function runBotsForPhase(room: ServerRoom): void {
  const bots = [...room.players.values()].filter((p) => p.isBot);
  if (bots.length === 0) return;
  const phaseAtSchedule = room.phase;

  for (const bot of bots) {
    setTimeout(() => {
      if (room.phase !== phaseAtSchedule) return;
      if (room.phase !== "question") return;
      if (bot.marooned || room.answers.has(bot.id)) return;
      const q = room.currentQuestion;
      const optionCount = q?.options.length ?? 4;
      const accurate = Math.random() < 0.6;
      const choiceIndex =
        q && accurate ? q.correctIndex : Math.floor(Math.random() * optionCount);

      if (room.isEventRound) {
        // Loot Drop: risk the entire previous block wager, sometimes hedge.
        const alloc = [0, 0, 0, 0];
        if (Math.random() < 0.5) {
          alloc[choiceIndex] = bot.eventWager;
        } else {
          const primary = Math.floor((bot.eventWager * 0.6) / 10) * 10;
          alloc[choiceIndex] = primary;
          alloc[(choiceIndex + 1) % 4] = bot.eventWager - primary;
        }
        submitAnswer(room, bot.id, { lootAllocation: alloc });
        return;
      }

      // Occasionally fire a power-up before answering.
      if (bot.powerUps.length > 0 && Math.random() < 0.35) {
        const owned = bot.powerUps[Math.floor(Math.random() * bot.powerUps.length)];
        if (owned) {
          const def = POWERUPS[owned.powerUpId];
          let targetId: string | undefined;
          if (def.target === "otherPlayer") {
            const others = [...room.players.values()].filter(
              (p) => p.id !== bot.id && !p.marooned,
            );
            targetId = others[Math.floor(Math.random() * others.length)]?.id;
          }
          if (def.target !== "otherPlayer" || targetId) {
            usePowerUp(room, bot.id, { uid: owned.uid, targetId });
          }
        }
      }

      // Sometimes join the mutiny (never as the leader).
      if (Math.random() < 0.15) {
        declareMutiny(room, bot.id);
      }

      submitAnswer(room, bot.id, { choiceIndex });
    }, delay());
  }
}
