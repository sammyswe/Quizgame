import type { Rarity } from "@treasure-trap/shared";

/**
 * Mobile-game rarity treatments. Common feels fine, Legendary feels illegal.
 * Used by item cards, chest reveals, and the booty bag.
 */
export type RarityStyle = {
  label: string;
  /** Card frame border colour. */
  frame: string;
  /** Text / accent colour. */
  text: string;
  /** Box-shadow glow. */
  glow: string;
  /** Card face gradient. */
  face: string;
  /** Banner gradient for the reveal ribbon. */
  banner: string;
  /** Extra classname for animated frames (legendary shimmer). */
  extraClass?: string;
  /** Burst emoji on reveal. */
  burst: string;
};

export const RARITY_STYLES: Record<Rarity, RarityStyle> = {
  common: {
    label: "Common",
    frame: "#7dd3fc",
    text: "#bae6fd",
    glow: "0 0 14px rgba(125,211,252,0.45), 0 0 40px rgba(125,211,252,0.15)",
    face: "linear-gradient(160deg, rgba(125,211,252,0.12), rgba(13,18,51,0.9))",
    banner: "linear-gradient(90deg, #38bdf8, #7dd3fc)",
    burst: "✨",
  },
  rare: {
    label: "Rare",
    frame: "#4ade80",
    text: "#86efac",
    glow: "0 0 16px rgba(74,222,128,0.5), 0 0 46px rgba(74,222,128,0.18)",
    face: "linear-gradient(160deg, rgba(74,222,128,0.14), rgba(13,18,51,0.9))",
    banner: "linear-gradient(90deg, #22c55e, #4ade80)",
    burst: "💚",
  },
  epic: {
    label: "Epic",
    frame: "#c084fc",
    text: "#d8b4fe",
    glow: "0 0 18px rgba(192,132,252,0.55), 0 0 54px rgba(192,132,252,0.22)",
    face: "linear-gradient(160deg, rgba(192,132,252,0.16), rgba(13,18,51,0.92))",
    banner: "linear-gradient(90deg, #a855f7, #c084fc)",
    burst: "🔮",
  },
  legendary: {
    label: "Legendary",
    frame: "#fbbf24",
    text: "#fde68a",
    glow: "0 0 22px rgba(251,191,36,0.65), 0 0 70px rgba(251,113,133,0.3)",
    face: "linear-gradient(160deg, rgba(251,191,36,0.18), rgba(60,10,30,0.9))",
    banner: "linear-gradient(90deg, #f59e0b, #fbbf24, #fb7185)",
    extraClass: "animate-legendary-shimmer",
    burst: "⭐",
  },
};
