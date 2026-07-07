import type { ObscureQuestion, RevealEvent } from "../types/index.js";
import { addDelta, ev } from "./reveal.js";
import { obscurePoints } from "./scoring.js";
import type { ChestAward } from "./resolveQuestion.js";

/**
 * Obscure Island: several options are correct; rarer picks score more.
 * One Fool's Gold option looks clever but is wrong.
 */

export type ObscurePlayerInput = {
  id: string;
  nickname: string;
  choiceIndex?: number;
};

export type ObscureResolution = {
  events: RevealEvent[];
  lootDelta: Record<string, number>;
  chests: ChestAward[];
};

export function resolveObscure(
  players: ObscurePlayerInput[],
  question: ObscureQuestion,
): ObscureResolution {
  const events: RevealEvent[] = [];
  const lootDelta: Record<string, number> = {};
  const chests: ChestAward[] = [];

  const counts = new Map<number, number>();
  for (const p of players) {
    if (p.choiceIndex === undefined) continue;
    counts.set(p.choiceIndex, (counts.get(p.choiceIndex) ?? 0) + 1);
  }

  events.push(
    ev("correctAnswer", "Obscure Island reveals its secrets...", "Rare knowledge pays. Common knowledge pays less. Fool's Gold pays nothing.", {
      icon: "🏝️",
    }),
  );

  for (const p of players) {
    const opt = p.choiceIndex !== undefined ? question.options[p.choiceIndex] : undefined;
    if (!opt) {
      events.push(ev("scoreChanged", `${p.nickname} froze`, "No answer, no gold.", { icon: "🦀", playerIds: [p.id] }));
      continue;
    }
    if (opt.foolsGold) {
      events.push(
        ev("lootPlundered", "FOOL'S GOLD!", `${p.nickname} picked "${opt.text}" — it glittered, but it was worthless.`, {
          icon: "🪙",
          playerIds: [p.id],
        }),
      );
      continue;
    }
    const count = counts.get(p.choiceIndex ?? -1) ?? 1;
    const pts = obscurePoints(opt.correct, count);
    if (pts > 0) {
      addDelta(lootDelta, p.id, pts);
      const rarityNote = count === 1 ? "SOLO pick — maximum gold!" : `${count} pirates shared this island.`;
      events.push(
        ev("scoreChanged", `+${pts} for "${opt.text}"`, `${p.nickname}: ${rarityNote}`, {
          icon: count === 1 ? "💎" : "💰",
          playerIds: [p.id],
          pointsDelta: { [p.id]: pts },
        }),
      );
      if (count === 1) {
        chests.push({ playerId: p.id, source: "captains" });
        events.push(
          ev("chestEarned", "Lone explorer!", `${p.nickname} alone found "${opt.text}" — Captain's Chest earned.`, {
            icon: "⚓",
            playerIds: [p.id],
          }),
        );
      }
    } else {
      events.push(
        ev("lootPlundered", "Wrong island", `${p.nickname} picked "${opt.text}". The map lied.`, {
          icon: "🌊",
          playerIds: [p.id],
        }),
      );
    }
  }

  return { events, lootDelta, chests };
}
