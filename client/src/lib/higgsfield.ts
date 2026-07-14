/**
 * Higgsfield Loot Drop art — neon pirate casino sheets generated for the
 * Phaser vertical slice, now skinned onto the arcade React client.
 *
 * Sheets use CSS background-position framing (no canvas slicing).
 */

import type { CSSProperties } from "react";
import type { Rarity } from "@treasure-trap/shared";
import bgUrl from "../assets/higgsfield/loot-drop/a1-background.webp";
import islandsUrl from "../assets/higgsfield/loot-drop/a2-islands-cut.webp";
import shipsUrl from "../assets/higgsfield/loot-drop/a3-ships-cut.webp";
import chestsUrl from "../assets/higgsfield/loot-drop/a5-chests-cut.webp";
import avatarsUrl from "../assets/higgsfield/loot-drop/a6-avatars-cut.webp";
import rarityUrl from "../assets/higgsfield/loot-drop/a9-rarity-cut.webp";

export const HF = {
  background: bgUrl,
  islands: islandsUrl,
  ships: shipsUrl,
  chests: chestsUrl,
  avatars: avatarsUrl,
  rarity: rarityUrl,
} as const;

export type SpriteGrid = { cols: number; rows: number };

export const HF_GRIDS = {
  islands: { cols: 2, rows: 2 } satisfies SpriteGrid,
  ships: { cols: 4, rows: 4 } satisfies SpriteGrid,
  chests: { cols: 4, rows: 5 } satisfies SpriteGrid,
  avatars: { cols: 3, rows: 3 } satisfies SpriteGrid,
  rarity: { cols: 4, rows: 4 } satisfies SpriteGrid,
} as const;

/** CSS background-size / position for a single cell in a sheet. */
export function spriteStyle(
  url: string,
  grid: SpriteGrid,
  col: number,
  row: number,
): CSSProperties {
  const c = ((col % grid.cols) + grid.cols) % grid.cols;
  const r = ((row % grid.rows) + grid.rows) % grid.rows;
  return {
    backgroundImage: `url(${url})`,
    backgroundRepeat: "no-repeat",
    backgroundSize: `${grid.cols * 100}% ${grid.rows * 100}%`,
    backgroundPosition: `${(c / Math.max(grid.cols - 1, 1)) * 100}% ${(r / Math.max(grid.rows - 1, 1)) * 100}%`,
  };
}

export function islandFrame(index: number): CSSProperties {
  const i = ((index % 4) + 4) % 4;
  return spriteStyle(HF.islands, HF_GRIDS.islands, i % 2, Math.floor(i / 2));
}

/** Player dock ship = sheet cell 0; raider = cell 14. */
export function shipFrame(kind: "player" | "raider" = "player"): CSSProperties {
  const i = kind === "player" ? 0 : 14;
  return spriteStyle(HF.ships, HF_GRIDS.ships, i % 4, Math.floor(i / 4));
}

const RARITY_COL: Record<Rarity, number> = {
  common: 0,
  rare: 1,
  epic: 2,
  legendary: 3,
};

/** Chest sheet: columns = rarity, rows = ceremony stage. */
export type ChestStageFrame = "closed" | "shake" | "glow" | "open" | "burst";

const CHEST_ROW: Record<ChestStageFrame, number> = {
  closed: 0,
  shake: 1,
  glow: 2,
  open: 3,
  burst: 4,
};

export function chestFrame(rarity: Rarity, stage: ChestStageFrame): CSSProperties {
  return spriteStyle(HF.chests, HF_GRIDS.chests, RARITY_COL[rarity], CHEST_ROW[stage]);
}

/** Avatar reactions: 3×3 sheet of the same pirate, different moods. */
type HfAvatarMood =
  | "idle"
  | "answered"
  | "nervous"
  | "attacked"
  | "protected"
  | "cursed"
  | "accused"
  | "winner";

const AVATAR_MOOD_CELL: Record<HfAvatarMood, number> = {
  idle: 4, // neutral
  answered: 2, // smug
  nervous: 5, // confused
  attacked: 1, // shocked
  protected: 0, // wink / confident
  cursed: 3, // angry + bomb
  accused: 3,
  winner: 6, // celebrate
};

export function avatarFrame(mood: HfAvatarMood = "idle", variant?: number): CSSProperties {
  const i = variant === undefined ? AVATAR_MOOD_CELL[mood] : ((variant % 9) + 9) % 9;
  return spriteStyle(HF.avatars, HF_GRIDS.avatars, i % 3, Math.floor(i / 3));
}

/** Rarity glow row on A9 (4 frames across). */
export function rarityGlowFrame(rarity: Rarity, frame = 0): CSSProperties {
  return spriteStyle(HF.rarity, HF_GRIDS.rarity, frame % 4, RARITY_COL[rarity]);
}
