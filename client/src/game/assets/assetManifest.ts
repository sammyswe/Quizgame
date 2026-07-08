import { HF } from "./spriteKeys";

/**
 * Discovers Higgsfield-generated art at build time. Vite's import.meta.glob
 * resolves any png/jpg/webp files under assets/higgsfield/loot-drop into URLs.
 * If the folder is empty (Higgsfield not run yet), the game silently falls
 * back to procedural textures -- nothing breaks.
 */

const files = import.meta.glob("../../assets/higgsfield/loot-drop/*.{png,jpg,jpeg,webp}", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

export interface HiggsfieldEntry {
  key: string;
  url: string;
  /** grid layout of the sheet, used to slice quadrant frames after load */
  grid?: { cols: number; rows: number };
}

/** filename (without extension) -> texture key + slicing info */
const FILE_MAP: Record<string, { key: string; grid?: { cols: number; rows: number } }> = {
  "a1-background": { key: HF.background },
  "a2-islands": { key: HF.islands, grid: { cols: 2, rows: 2 } },
  "a3-ships": { key: HF.ships, grid: { cols: 2, rows: 2 } },
  "a4-coins": { key: HF.coins, grid: { cols: 3, rows: 3 } },
  "a5-chests": { key: HF.chests, grid: { cols: 3, rows: 3 } },
  "a6-avatars": { key: HF.avatars, grid: { cols: 4, rows: 2 } },
  "a7-vfx": { key: HF.vfx, grid: { cols: 3, rows: 3 } },
  "a8-lock-in": { key: HF.lockIn },
  "a9-rarity": { key: HF.rarity, grid: { cols: 2, rows: 2 } },
};

export function higgsfieldAssets(): HiggsfieldEntry[] {
  const entries: HiggsfieldEntry[] = [];
  for (const [path, url] of Object.entries(files)) {
    const base = path.split("/").pop()?.replace(/\.(png|jpe?g|webp)$/i, "") ?? "";
    const mapped = FILE_MAP[base];
    if (mapped) entries.push({ key: mapped.key, url, grid: mapped.grid });
  }
  return entries;
}
