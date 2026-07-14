import type {
  RevealAnimation,
  RevealEvent,
  RevealEventType,
  RevealIntensity,
} from "../types/index.js";

let counter = 0;

/** Default visual treatment per event type; call sites can override via `extra`. */
export function inferAnimation(type: RevealEventType): {
  animation: RevealAnimation;
  intensity: RevealIntensity;
} {
  switch (type) {
    case "lootPlundered":
      return { animation: "plunder", intensity: "medium" };
    case "itemTriggered":
      return { animation: "cannon", intensity: "medium" };
    case "itemBlocked":
      return { animation: "curse", intensity: "medium" };
    case "chestEarned":
      return { animation: "chest", intensity: "medium" };
    case "missionSuccess":
      return { animation: "mission", intensity: "big" };
    case "missionFailed":
      return { animation: "wave", intensity: "small" };
    case "accusationCorrect":
      return { animation: "mutiny", intensity: "big" };
    case "accusationWrong":
      return { animation: "wave", intensity: "small" };
    case "scoreChanged":
      return { animation: "coinBurst", intensity: "small" };
    case "auctionResult":
      return { animation: "coinBurst", intensity: "medium" };
    case "pairResult":
      return { animation: "duel", intensity: "medium" };
    case "chaseMove":
      return { animation: "wave", intensity: "small" };
    case "finalAction":
      return { animation: "cannon", intensity: "big" };
    case "correctAnswer":
      return { animation: "mapFlip", intensity: "medium" };
    default:
      return { animation: "wave", intensity: "small" };
  }
}

/** Build a reveal event with a unique id. Reveal events are the ONLY way scores change on screen. */
export function ev(
  type: RevealEventType,
  title: string,
  description: string,
  extra: Partial<
    Pick<RevealEvent, "icon" | "playerIds" | "pointsDelta" | "animation" | "intensity">
  > = {},
): RevealEvent {
  counter += 1;
  return {
    id: `ev-${Date.now().toString(36)}-${counter}`,
    type,
    title,
    description,
    ...inferAnimation(type),
    ...extra,
  };
}

/** Merge two delta maps. */
export function mergeDeltas(
  a: Record<string, number>,
  b: Record<string, number>,
): Record<string, number> {
  const out = { ...a };
  for (const [id, d] of Object.entries(b)) out[id] = (out[id] ?? 0) + d;
  return out;
}

export function addDelta(map: Record<string, number>, id: string, delta: number): void {
  map[id] = (map[id] ?? 0) + delta;
}
