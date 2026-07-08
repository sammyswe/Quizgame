import Phaser from "phaser";
import type { AssetManager } from "../systems/AssetManager";

/** The local player's ship, moored at the dock, bobbing on the waves. */
export class PlayerShip extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, x: number, y: number, assets: AssetManager) {
    super(scene, x, y, assets.playerShip().key);
    scene.add.existing(this);
    this.setDepth(500).setScale(0.62);
    scene.tweens.add({
      targets: this,
      y: y + 6,
      angle: { from: -2, to: 2 },
      duration: 2100,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }
}
