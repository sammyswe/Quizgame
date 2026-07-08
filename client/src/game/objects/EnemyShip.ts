import Phaser from "phaser";
import { PROC } from "../assets/spriteKeys";
import type { VfxSystem } from "../systems/VfxSystem";

/**
 * A raider ship that sails in during the reveal, bombards a wrong island and
 * hauls the plundered loot away.
 */
export class EnemyShip extends Phaser.GameObjects.Container {
  private ship: Phaser.GameObjects.Image;
  private bobTween: Phaser.Tweens.Tween | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    scene.add.existing(this);
    this.setDepth(700);
    this.ship = scene.add.image(0, 0, PROC.shipEnemy).setScale(0.7);
    this.add(this.ship);
    this.setAlpha(0);
  }

  sailTo(x: number, y: number, duration = 1400, onArrive?: () => void): void {
    this.ship.setFlipX(x < this.x);
    this.setAlpha(1);
    this.scene.tweens.add({
      targets: this,
      x,
      y,
      duration,
      ease: "Sine.easeInOut",
      onComplete: () => {
        this.startBob();
        onArrive?.();
      },
    });
  }

  private startBob(): void {
    this.bobTween = this.scene.tweens.add({
      targets: this,
      y: this.y + 5,
      angle: { from: -2, to: 2 },
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  /** Fires a cannonball at the target; calls onImpact when it lands. */
  fireCannon(target: { x: number; y: number }, vfx: VfxSystem, onImpact?: () => void): void {
    // recoil + muzzle smoke
    const dir = target.x > this.x ? 1 : -1;
    this.scene.tweens.add({
      targets: this,
      x: this.x - dir * 14,
      duration: 90,
      yoyo: true,
      ease: "Quad.easeOut",
    });
    vfx.smokePuff(this.x + dir * 44, this.y - 10, 4);

    const ball = this.scene.add
      .image(this.x + dir * 40, this.y - 14, PROC.cannonball)
      .setDepth(910);
    const midX = (ball.x + target.x) / 2;
    const midY = Math.min(ball.y, target.y) - 130;
    const curve = new Phaser.Curves.QuadraticBezier(
      new Phaser.Math.Vector2(ball.x, ball.y),
      new Phaser.Math.Vector2(midX, midY),
      new Phaser.Math.Vector2(target.x, target.y),
    );
    const follower = { t: 0 };
    this.scene.tweens.add({
      targets: follower,
      t: 1,
      duration: 620,
      ease: "Quad.easeIn",
      onUpdate: () => {
        const p = curve.getPoint(follower.t);
        ball.setPosition(p.x, p.y).setAngle(follower.t * 540);
      },
      onComplete: () => {
        ball.destroy();
        onImpact?.();
      },
    });
  }

  retreat(exitX: number, duration = 1300): void {
    this.bobTween?.remove();
    this.bobTween = null;
    this.ship.setFlipX(exitX < this.x);
    this.scene.tweens.add({
      targets: this,
      x: exitX,
      alpha: 0,
      duration,
      ease: "Sine.easeIn",
      onComplete: () => this.destroy(),
    });
  }
}
