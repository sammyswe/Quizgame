import Phaser from "phaser";
import { PROC } from "../assets/spriteKeys";

/**
 * A single flying coin/chip. Used for the drag ghost and for tap-to-allocate
 * flights from the pile to an island.
 */
export class CoinChip extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, x: number, y: number, kind: "coin" | "chip" = "coin") {
    super(scene, x, y, kind === "coin" ? PROC.coin : PROC.chip);
    scene.add.existing(this);
    this.setDepth(920);
  }

  /** Arc flight to a target point, then destroy. */
  flyTo(x: number, y: number, duration = 420, onArrive?: () => void): void {
    const scene = this.scene;
    const midX = (this.x + x) / 2 + Phaser.Math.Between(-40, 40);
    const midY = Math.min(this.y, y) - Phaser.Math.Between(50, 110);
    const curve = new Phaser.Curves.QuadraticBezier(
      new Phaser.Math.Vector2(this.x, this.y),
      new Phaser.Math.Vector2(midX, midY),
      new Phaser.Math.Vector2(x, y),
    );
    const follower = { t: 0 };
    scene.tweens.add({
      targets: follower,
      t: 1,
      duration,
      ease: "Sine.easeIn",
      onUpdate: () => {
        const p = curve.getPoint(follower.t);
        this.setPosition(p.x, p.y);
        this.setAngle(follower.t * 360);
      },
      onComplete: () => {
        onArrive?.();
        this.destroy();
      },
    });
  }
}
