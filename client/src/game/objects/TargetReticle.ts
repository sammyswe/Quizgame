import Phaser from "phaser";
import { PROC } from "../assets/spriteKeys";

/**
 * The Fear Shot targeting reticle. Dragged from the item slot onto another
 * player's avatar; spins and pulses while armed.
 */
export class TargetReticle extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, PROC.reticle);
    scene.add.existing(this);
    this.setDepth(990);
    scene.tweens.add({
      targets: this,
      angle: 360,
      duration: 1800,
      repeat: -1,
    });
    scene.tweens.add({
      targets: this,
      scale: { from: 1, to: 1.2 },
      duration: 400,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }
}
