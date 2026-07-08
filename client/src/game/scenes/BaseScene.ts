import Phaser from "phaser";
import { AssetManager } from "../systems/AssetManager";
import { VfxSystem } from "../systems/VfxSystem";
import { CameraDirector } from "../systems/CameraDirector";

/** Shared plumbing for gameplay scenes: asset resolution, VFX, camera. */
export class BaseScene extends Phaser.Scene {
  protected assets!: AssetManager;
  protected vfx!: VfxSystem;
  protected camDirector!: CameraDirector;

  protected initSystems(): void {
    this.assets = new AssetManager(this);
    this.vfx = new VfxSystem(this);
    this.camDirector = new CameraDirector(this);
  }

  /** Chunky HUD panel used for docks and banners. */
  protected addPanel(
    x: number,
    y: number,
    w: number,
    h: number,
    strokeColor = 0x2ee6ff,
  ): Phaser.GameObjects.Graphics {
    const g = this.add.graphics();
    g.fillStyle(0x0d1b33, 0.72);
    g.fillRoundedRect(x, y, w, h, 20);
    g.lineStyle(3, strokeColor, 0.55);
    g.strokeRoundedRect(x, y, w, h, 20);
    return g;
  }
}
