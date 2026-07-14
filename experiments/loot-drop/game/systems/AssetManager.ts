import Phaser from "phaser";
import { gameSettings } from "../settings";
import { HF, PROC } from "../assets/spriteKeys";

/**
 * Resolves the texture (and optional frame) to use for a visual role.
 * Prefers Higgsfield art when it has been loaded and assetMode allows it,
 * otherwise falls back to the procedural texture. Scene code never touches
 * raw paths.
 */
export class AssetManager {
  constructor(private scene: Phaser.Scene) {}

  private useHf(key: string): boolean {
    return gameSettings.assetMode !== "procedural" && this.scene.textures.exists(key);
  }

  background(): string {
    return this.useHf(HF.background) ? HF.background : PROC.oceanBg;
  }

  island(index: number): { key: string; frame?: string } {
    if (this.useHf(HF.islands)) {
      const frame = `q${index % 4}`;
      if (this.scene.textures.get(HF.islands).has(frame)) return { key: HF.islands, frame };
    }
    return { key: PROC.island };
  }

  enemyShip(): { key: string; frame?: string } {
    // dark magenta raider from the Higgsfield ship sheet (row 3)
    if (this.useHf(HF.ships) && this.scene.textures.get(HF.ships).has("q14")) {
      return { key: HF.ships, frame: "q14" };
    }
    return { key: PROC.shipEnemy };
  }

  playerShip(): { key: string; frame?: string } {
    // blue/gold player ship from the Higgsfield ship sheet (row 0)
    if (this.useHf(HF.ships) && this.scene.textures.get(HF.ships).has("q0")) {
      return { key: HF.ships, frame: "q0" };
    }
    return { key: PROC.shipPlayer };
  }

  coin(): { key: string } {
    return { key: PROC.coin };
  }

  chip(): { key: string } {
    return { key: PROC.chip };
  }
}
