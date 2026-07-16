/** Voyage Higgsfield asset URLs + grid metadata for ArcadeGameplayScene. */

import bgSevenSeasUrl from "../../assets/higgsfield/voyage/bg-seven-seas.webp";
import bgQuizCaribbeanUrl from "../../assets/higgsfield/voyage/bg-quiz-caribbean.webp";
import bgLobbyDeckUrl from "../../assets/higgsfield/voyage/bg-lobby-deck.webp";
import bgLootMapUrl from "../../assets/higgsfield/voyage/bg-loot-map.webp";
import sheetIslandsUrl from "../../assets/higgsfield/voyage/sheet-islands.webp";
import sheetBiomesUrl from "../../assets/higgsfield/voyage/sheet-biomes.webp";
import sheetShipsUrl from "../../assets/higgsfield/voyage/sheet-ships.webp";
import sheetScoutsUrl from "../../assets/higgsfield/voyage/sheet-scouts.webp";
import sheetPotDrainUrl from "../../assets/higgsfield/voyage/sheet-pot-drain.webp";
import sheetPiratesUrl from "../../assets/higgsfield/voyage/sheet-pirates.webp";
import sheetPlunderBiomesUrl from "../../assets/higgsfield/voyage/sheet-plunder-biomes.webp";
import sheetLootParticlesUrl from "../../assets/higgsfield/voyage/sheet-loot-particles.webp";
import sheetSmashFxUrl from "../../assets/higgsfield/voyage/sheet-smash-fx.webp";
import sheetWrongReactUrl from "../../assets/higgsfield/voyage/sheet-wrong-react.webp";
import sheetAvatarsUrl from "../../assets/higgsfield/voyage/sheet-avatars.webp";
import sheetItemsUrl from "../../assets/higgsfield/voyage/sheet-items.webp";
import sheetFxUrl from "../../assets/higgsfield/voyage/sheet-fx.webp";
import sheetChestUrl from "../../assets/higgsfield/voyage/sheet-chest.webp";
import poseidonKeyUrl from "../../assets/higgsfield/voyage/poseidon-key.webp";
import sharkKeyUrl from "../../assets/higgsfield/voyage/shark-key.webp";
import maroonKeyUrl from "../../assets/higgsfield/voyage/maroon-key.webp";
import animShipIdleUrl from "../../assets/higgsfield/voyage/anim-ship-idle.webp";
import animShipSailUrl from "../../assets/higgsfield/voyage/anim-ship-sail.webp";
import animShipSailSmoothUrl from "../../assets/higgsfield/voyage/anim-ship-sail-smooth.webp";
import animShipCheerUrl from "../../assets/higgsfield/voyage/anim-ship-cheer.webp";
import animShipWrongUrl from "../../assets/higgsfield/voyage/anim-ship-wrong.webp";
import animWavesUrl from "../../assets/higgsfield/voyage/anim-waves.webp";
import animCoinsUrl from "../../assets/higgsfield/voyage/anim-coins.webp";
import animPoseidonRiseUrl from "../../assets/higgsfield/voyage/anim-poseidon-rise.webp";
import animSharkAttackUrl from "../../assets/higgsfield/voyage/anim-shark-attack.webp";
import animTreasureDrainUrl from "../../assets/higgsfield/voyage/anim-treasure-drain.webp";
import animFlagFlutterUrl from "../../assets/higgsfield/voyage/anim-flag-flutter.webp";
import uiLockButtonUrl from "../../assets/higgsfield/voyage/ui-lock-button.webp";
import type { PowerUpId } from "@treasure-trap/shared";

export const VOYAGE = {
  bgSea: { key: "voyage-bg-sea", url: bgSevenSeasUrl },
  bgQuiz: { key: "voyage-bg-quiz", url: bgQuizCaribbeanUrl },
  bgLobby: { key: "voyage-bg-lobby", url: bgLobbyDeckUrl },
  bgLoot: { key: "voyage-bg-loot", url: bgLootMapUrl },
  islands: { key: "voyage-islands", url: sheetIslandsUrl, cols: 2, rows: 2 },
  biomes: { key: "voyage-biomes", url: sheetBiomesUrl, cols: 4, rows: 2 },
  ships: { key: "voyage-ships", url: sheetShipsUrl, cols: 3, rows: 3 },
  scouts: { key: "voyage-scouts", url: sheetScoutsUrl, cols: 4, rows: 2 },
  /** 3×3 open-chest drain states (full → empty → closed). */
  potDrain: { key: "voyage-pot-drain", url: sheetPotDrainUrl, cols: 3, rows: 3 },
  pirates: { key: "voyage-pirates", url: sheetPiratesUrl, cols: 4, rows: 2 },
  plunderBiomes: { key: "voyage-plunder-biomes", url: sheetPlunderBiomesUrl, cols: 4, rows: 2 },
  lootParticles: { key: "voyage-loot-particles", url: sheetLootParticlesUrl, cols: 4, rows: 2 },
  smashFx: { key: "voyage-smash-fx", url: sheetSmashFxUrl, cols: 4, rows: 2 },
  wrongReact: { key: "voyage-wrong-react", url: sheetWrongReactUrl, cols: 4, rows: 2 },
  avatars: { key: "voyage-avatars", url: sheetAvatarsUrl, cols: 3, rows: 3 },
  items: { key: "voyage-items", url: sheetItemsUrl, cols: 4, rows: 4 },
  fx: { key: "voyage-fx", url: sheetFxUrl, cols: 4, rows: 2 },
  chest: { key: "voyage-chest", url: sheetChestUrl, cols: 3, rows: 3 },
  poseidon: { key: "voyage-poseidon", url: poseidonKeyUrl },
  shark: { key: "voyage-shark", url: sharkKeyUrl },
  maroon: { key: "voyage-maroon", url: maroonKeyUrl },
  shipIdle: { key: "voyage-ship-idle", url: animShipIdleUrl, cols: 2, rows: 4 },
  shipSail: { key: "voyage-ship-sail", url: animShipSailUrl, cols: 2, rows: 4 },
  /** 24-frame video-extracted sail bob (preferred fleet motion). */
  shipSailSmooth: {
    key: "voyage-ship-sail-smooth",
    url: animShipSailSmoothUrl,
    cols: 6,
    rows: 4,
  },
  shipCheer: { key: "voyage-ship-cheer", url: animShipCheerUrl, cols: 3, rows: 2 },
  shipWrong: { key: "voyage-ship-wrong", url: animShipWrongUrl, cols: 3, rows: 2 },
  waves: { key: "voyage-waves", url: animWavesUrl, cols: 2, rows: 4 },
  coins: { key: "voyage-coins", url: animCoinsUrl, cols: 2, rows: 4 },
  poseidonRise: { key: "voyage-poseidon-rise", url: animPoseidonRiseUrl, cols: 2, rows: 4 },
  sharkAttack: { key: "voyage-shark-attack", url: animSharkAttackUrl, cols: 2, rows: 4 },
  treasureDrain: { key: "voyage-treasure-drain", url: animTreasureDrainUrl, cols: 2, rows: 4 },
  flag: { key: "voyage-flag", url: animFlagFlutterUrl, cols: 2, rows: 4 },
  lockButton: { key: "voyage-lock-button", url: uiLockButtonUrl, cols: 2, rows: 4 },
} as const;

/** Order matches STYLE-001 item sheet prompt (cell 0…12). */
export const ITEM_ICON_INDEX: Record<PowerUpId, number> = {
  eyepatch: 0,
  parrot: 1,
  telescope: 2,
  hook: 3,
  whiteFlag: 4,
  secretX: 5,
  rumRush: 6,
  walkThePlank: 7,
  cannonball: 8,
  cannonballBarrage: 9,
  barnacle: 10,
  barnacleInfestation: 11,
  swordFight: 12,
};

export const FX_INDEX = {
  cannonball: 0,
  hook: 1,
  parrot: 2,
  net: 3,
  whiteFlag: 4,
  eyepatch: 5,
  telescope: 6,
  rum: 7,
} as const;

export function preloadVoyageAssets(load: { image: (key: string, url: string) => unknown }): void {
  for (const asset of Object.values(VOYAGE)) {
    load.image(asset.key, asset.url);
  }
}
