import Phaser from "phaser";
import { higgsfieldAssets } from "../assets/assetManifest";

/**
 * Loads any Higgsfield-generated art discovered in the asset folder and
 * slices sheet images into quadrant frames. Failures are non-fatal: the game
 * falls back to procedural textures for anything missing.
 */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super("Preload");
  }

  preload(): void {
    const entries = higgsfieldAssets();
    for (const entry of entries) {
      this.load.image(entry.key, entry.url);
    }
    this.load.on("loaderror", (file: Phaser.Loader.File) => {
      console.warn(`[assets] failed to load ${file.key}; procedural fallback will be used`);
    });
  }

  create(): void {
    // slice grid sheets into frames named q0..qN
    for (const entry of higgsfieldAssets()) {
      if (!entry.grid || !this.textures.exists(entry.key)) continue;
      const tex = this.textures.get(entry.key);
      const img = tex.getSourceImage();
      const fw = Math.floor(img.width / entry.grid.cols);
      const fh = Math.floor(img.height / entry.grid.rows);
      let i = 0;
      for (let r = 0; r < entry.grid.rows; r++) {
        for (let c = 0; c < entry.grid.cols; c++) {
          if (!tex.has(`q${i}`)) tex.add(`q${i}`, 0, c * fw, r * fh, fw, fh);
          i++;
        }
      }
    }
    this.scene.start("LootDrop");
  }
}
