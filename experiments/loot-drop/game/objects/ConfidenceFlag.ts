import Phaser from "phaser";
import { flagKey } from "../assets/spriteKeys";

/** Small player-coloured flag planted on an island once its owner locks in. */
export class ConfidenceFlag extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, x: number, y: number, avatarId: number) {
    super(scene, x, y, flagKey(avatarId));
    scene.add.existing(this);
    this.setOrigin(0.2, 1).setDepth(420).setScale(0);
    scene.tweens.add({
      targets: this,
      scale: 1,
      duration: 380,
      ease: "Back.easeOut",
    });
    scene.tweens.add({
      targets: this,
      angle: { from: -4, to: 4 },
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }
}
