import { create } from "zustand";

/**
 * Animation intensity system.
 * - "reduced": no shake, minimal particles, short transitions (also auto-picked
 *   when the OS requests reduced motion).
 * - "normal": the intended game feel.
 * - "chaos": playtest mode — everything louder, bigger, more.
 */
export type AnimationIntensity = "reduced" | "normal" | "chaos";

function initialIntensity(): AnimationIntensity {
  const stored = localStorage.getItem("tt-intensity");
  if (stored === "reduced" || stored === "normal" || stored === "chaos") return stored;
  if (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    return "reduced";
  }
  return "normal";
}

type GameFeelStore = {
  intensity: AnimationIntensity;
  setIntensity: (i: AnimationIntensity) => void;
};

export const useGameFeel = create<GameFeelStore>((set) => ({
  intensity: initialIntensity(),
  setIntensity: (intensity) => {
    localStorage.setItem("tt-intensity", intensity);
    set({ intensity });
  },
}));

/** Scale a particle count by intensity. */
export function particleCount(base: number, intensity: AnimationIntensity): number {
  switch (intensity) {
    case "reduced":
      return Math.min(3, base);
    case "chaos":
      return Math.round(base * 2);
    default:
      return base;
  }
}

/** Whether screen shake is allowed. */
export function shakeAllowed(intensity: AnimationIntensity): boolean {
  return intensity !== "reduced";
}

/** Whether ambient scene layers (fog, ships, lightning) render. */
export function ambientAllowed(intensity: AnimationIntensity): boolean {
  return intensity !== "reduced";
}
