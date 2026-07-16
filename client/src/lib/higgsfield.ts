/**
 * Higgsfield voyage art — STYLE-001 pirate excursion sheets for React + Phaser.
 * Sheets use CSS background-position framing on the React side.
 */

import type { CSSProperties } from "react";
import type { Rarity } from "@treasure-trap/shared";
import bgUrl from "../assets/higgsfield/voyage/bg-seven-seas.webp";
import islandsUrl from "../assets/higgsfield/voyage/sheet-islands.webp";
import shipsUrl from "../assets/higgsfield/voyage/sheet-ships.webp";
import chestsUrl from "../assets/higgsfield/voyage/sheet-chest.webp";
import avatarsUrl from "../assets/higgsfield/voyage/sheet-avatars.webp";
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
  ships: { cols: 3, rows: 3 } satisfies SpriteGrid,
  chests: { cols: 3, rows: 3 } satisfies SpriteGrid,
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

/** Player dock ship = first coloured cell; captain flagship = last cell. */
export function shipFrame(kind: "player" | "raider" = "player"): CSSProperties {
  const i = kind === "player" ? 0 : 8;
  return spriteStyle(HF.ships, HF_GRIDS.ships, i % 3, Math.floor(i / 3));
}

export type ChestStageFrame = "closed" | "shake" | "glow" | "open" | "burst";

const CHEST_INDEX: Record<ChestStageFrame, number> = {
  closed: 0,
  shake: 1,
  glow: 3,
  open: 4,
  burst: 5,
};

export function chestFrame(_rarity: Rarity, stage: ChestStageFrame): CSSProperties {
  const i = CHEST_INDEX[stage];
  return spriteStyle(HF.chests, HF_GRIDS.chests, i % 3, Math.floor(i / 3));
}

type HfAvatarMood =
  | "idle"
  | "answered"
  | "nervous"
  | "attacked"
  | "protected"
  | "cursed"
  | "accused"
  | "winner";

/** Voyage sheet is eight distinct pirates; mood currently selects a cast member. */
const AVATAR_MOOD_CELL: Record<HfAvatarMood, number> = {
  idle: 0,
  answered: 1,
  nervous: 2,
  attacked: 3,
  protected: 4,
  cursed: 5,
  accused: 6,
  winner: 7,
};

export function avatarFrame(mood: HfAvatarMood = "idle", variant?: number): CSSProperties {
  const i = variant === undefined ? AVATAR_MOOD_CELL[mood] : ((variant % 9) + 9) % 9;
  return spriteStyle(HF.avatars, HF_GRIDS.avatars, i % 3, Math.floor(i / 3));
}

const RARITY_COL: Record<Rarity, number> = {
  common: 0,
  rare: 1,
  epic: 2,
  legendary: 3,
};

export function rarityGlowFrame(rarity: Rarity, frame = 0): CSSProperties {
  return spriteStyle(HF.rarity, HF_GRIDS.rarity, frame % 4, RARITY_COL[rarity]);
}
