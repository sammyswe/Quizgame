import type { RevealEvent, RevealEventType } from "../types/index.js";

let counter = 0;

/** Build a reveal event with a unique id. Reveal events are the ONLY way scores change on screen. */
export function ev(
  type: RevealEventType,
  title: string,
  description: string,
  extra: Partial<Pick<RevealEvent, "icon" | "playerIds" | "pointsDelta">> = {},
): RevealEvent {
  counter += 1;
  return {
    id: `ev-${Date.now().toString(36)}-${counter}`,
    type,
    title,
    description,
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
