/**
 * Title + lobby shell Higgsfield art (approved shell pack).
 * Readable copy stays in HTML overlays — plaques are blank.
 */

import type { CSSProperties } from "react";
import { spriteStyle, type SpriteGrid } from "./higgsfield";

import bgTitleHeroUrl from "../assets/higgsfield/shell/bg-title-hero.webp";
import bgLobbyHarbourUrl from "../assets/higgsfield/shell/bg-lobby-harbour.webp";
import markTreasureTrapUrl from "../assets/higgsfield/shell/mark-treasure-trap.webp";
import sheetTitleCtaUrl from "../assets/higgsfield/shell/sheet-title-cta.webp";
import sheetTitleDecorUrl from "../assets/higgsfield/shell/sheet-title-decor.webp";
import sheetTitleFleetUrl from "../assets/higgsfield/shell/sheet-title-fleet.webp";
import sheetLobbyPanelsUrl from "../assets/higgsfield/shell/sheet-lobby-panels.webp";
import sheetSetSailCtaUrl from "../assets/higgsfield/shell/sheet-set-sail-cta.webp";
import sheetCrewSlotsUrl from "../assets/higgsfield/shell/sheet-crew-slots.webp";
import sheetLobbyIconsUrl from "../assets/higgsfield/shell/sheet-lobby-icons.webp";
import sheetAvatarRingsUrl from "../assets/higgsfield/shell/sheet-avatar-rings.webp";
import animTitleMascotUrl from "../assets/higgsfield/shell/anim-title-mascot.webp";
import animTitleChestUrl from "../assets/higgsfield/shell/anim-title-chest.webp";
import decoSailBannerUrl from "../assets/higgsfield/shell/deco-sail-banner.webp";

export const SHELL = {
  bgTitleHero: bgTitleHeroUrl,
  bgLobbyHarbour: bgLobbyHarbourUrl,
  mark: markTreasureTrapUrl,
  titleCta: sheetTitleCtaUrl,
  titleDecor: sheetTitleDecorUrl,
  titleFleet: sheetTitleFleetUrl,
  lobbyPanels: sheetLobbyPanelsUrl,
  setSailCta: sheetSetSailCtaUrl,
  crewSlots: sheetCrewSlotsUrl,
  lobbyIcons: sheetLobbyIconsUrl,
  avatarRings: sheetAvatarRingsUrl,
  mascot: animTitleMascotUrl,
  chest: animTitleChestUrl,
  sailBanner: decoSailBannerUrl,
} as const;

export const SHELL_GRIDS = {
  titleCta: { cols: 3, rows: 2 } satisfies SpriteGrid,
  titleDecor: { cols: 3, rows: 3 } satisfies SpriteGrid,
  titleFleet: { cols: 4, rows: 2 } satisfies SpriteGrid,
  lobbyPanels: { cols: 2, rows: 3 } satisfies SpriteGrid,
  setSailCta: { cols: 2, rows: 3 } satisfies SpriteGrid,
  crewSlots: { cols: 2, rows: 3 } satisfies SpriteGrid,
  lobbyIcons: { cols: 4, rows: 2 } satisfies SpriteGrid,
  avatarRings: { cols: 2, rows: 2 } satisfies SpriteGrid,
  mascot: { cols: 4, rows: 2 } satisfies SpriteGrid,
  chest: { cols: 3, rows: 2 } satisfies SpriteGrid,
} as const;

function cell(url: string, grid: SpriteGrid, index: number): CSSProperties {
  const i = ((index % (grid.cols * grid.rows)) + grid.cols * grid.rows) % (grid.cols * grid.rows);
  return spriteStyle(url, grid, i % grid.cols, Math.floor(i / grid.cols));
}

/** Start / Join CTA plaques: idle | hover | press per row. */
export function titleCtaFrame(
  kind: "start" | "join",
  state: "idle" | "hover" | "press" = "idle",
): CSSProperties {
  const row = kind === "start" ? 0 : 1;
  const col = state === "idle" ? 0 : state === "hover" ? 1 : 2;
  return spriteStyle(SHELL.titleCta, SHELL_GRIDS.titleCta, col, row);
}

/** Lobby wooden panels: room | crew | avatar | length | waiting | toast. */
export function lobbyPanelFrame(
  kind: "room" | "crew" | "avatar" | "length" | "waiting" | "toast",
): CSSProperties {
  const map = { room: 0, crew: 1, avatar: 2, length: 3, waiting: 4, toast: 5 } as const;
  return cell(SHELL.lobbyPanels, SHELL_GRIDS.lobbyPanels, map[kind]);
}

/** SET SAIL: idle hover press disabled success waiting. */
export function setSailFrame(
  state: "idle" | "hover" | "press" | "disabled" | "success" | "waiting" = "idle",
): CSSProperties {
  const map = { idle: 0, hover: 1, press: 2, disabled: 3, success: 4, waiting: 5 } as const;
  return cell(SHELL.setSailCta, SHELL_GRIDS.setSailCta, map[state]);
}

/** Crew card frames. */
export function crewSlotFrame(
  kind: "empty" | "occupied" | "host" | "you" | "bot" | "ready",
): CSSProperties {
  const map = { empty: 0, occupied: 1, host: 2, you: 3, bot: 4, ready: 5 } as const;
  return cell(SHELL.crewSlots, SHELL_GRIDS.crewSlots, map[kind]);
}

/** Lobby HUD icons. */
export function lobbyIconFrame(
  kind: "crown" | "link" | "hourglass" | "flag" | "lock" | "megaphone" | "check" | "anchor",
): CSSProperties {
  const map = {
    crown: 0,
    link: 1,
    hourglass: 2,
    flag: 3,
    lock: 4,
    megaphone: 5,
    check: 6,
    anchor: 7,
  } as const;
  return cell(SHELL.lobbyIcons, SHELL_GRIDS.lobbyIcons, map[kind]);
}

export function avatarRingFrame(
  state: "idle" | "hover" | "selected" | "locked" = "idle",
): CSSProperties {
  const map = { idle: 0, hover: 1, selected: 2, locked: 3 } as const;
  return cell(SHELL.avatarRings, SHELL_GRIDS.avatarRings, map[state]);
}

export function decorFrame(index: number): CSSProperties {
  return cell(SHELL.titleDecor, SHELL_GRIDS.titleDecor, index);
}

export function fleetFrame(index: number): CSSProperties {
  return cell(SHELL.titleFleet, SHELL_GRIDS.titleFleet, index);
}

export function mascotFrame(index: number): CSSProperties {
  return cell(SHELL.mascot, SHELL_GRIDS.mascot, index);
}

export function chestFrame(index: number): CSSProperties {
  return cell(SHELL.chest, SHELL_GRIDS.chest, index);
}

/** Soft overlay so HTML text stays readable on photographic BGs. */
export function shellBgStyle(url: string, overlay = "rgba(8, 22, 36, 0.42)"): CSSProperties {
  return {
    backgroundImage: `linear-gradient(180deg, ${overlay}, rgba(8, 22, 36, 0.72)), url(${url})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}
