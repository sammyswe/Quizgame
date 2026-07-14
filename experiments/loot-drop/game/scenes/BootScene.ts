import Phaser from "phaser";
import { generateAllTextures } from "../assets/generatedTextures";

/** Generates every procedural fallback texture, then hands off to Preload. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super("Boot");
  }

  create(): void {
    generateAllTextures(this);
    this.scene.start("Preload");
  }
}
