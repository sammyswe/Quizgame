export type AnimationIntensity = "reduced" | "normal" | "chaos";
export type AssetMode = "auto" | "procedural";

interface GameSettings {
  animationIntensity: AnimationIntensity;
  assetMode: AssetMode;
  soundEnabled: boolean;
}

type Listener = () => void;

const state: GameSettings = {
  animationIntensity: "normal",
  assetMode: "auto",
  soundEnabled: true,
};

const listeners = new Set<Listener>();

export const gameSettings = {
  get animationIntensity() {
    return state.animationIntensity;
  },
  get assetMode() {
    return state.assetMode;
  },
  get soundEnabled() {
    return state.soundEnabled;
  },
  set(partial: Partial<GameSettings>) {
    Object.assign(state, partial);
    listeners.forEach((l) => l());
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  snapshot(): GameSettings {
    return { ...state };
  },
};

/** Multiplier applied to particle counts, shake strength, tween exaggeration. */
export function intensityScale(): number {
  switch (state.animationIntensity) {
    case "reduced":
      return 0.35;
    case "chaos":
      return 1.9;
    default:
      return 1;
  }
}
