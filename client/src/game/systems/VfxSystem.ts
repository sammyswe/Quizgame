import Phaser from "phaser";
import { intensityScale } from "../settings";
import { PROC } from "../assets/spriteKeys";
import { FloatingText } from "../objects/FloatingText";

/**
 * Reusable juice helpers. All particle counts / strengths respect the global
 * animation intensity setting.
 */
export class VfxSystem {
  constructor(private scene: Phaser.Scene) {}

  private count(base: number): number {
    return Math.max(1, Math.round(base * intensityScale()));
  }

  coinBurst(x: number, y: number, amount = 10): void {
    const emitter = this.scene.add.particles(x, y, PROC.coin, {
      speed: { min: 90, max: 260 },
      angle: { min: 200, max: 340 },
      gravityY: 500,
      scale: { start: 0.7, end: 0.25 },
      lifespan: { min: 400, max: 800 },
      quantity: this.count(amount),
      emitting: false,
    });
    emitter.setDepth(900);
    emitter.explode();
    this.scene.time.delayedCall(1000, () => emitter.destroy());
  }

  sparkleBurst(x: number, y: number, tint = 0xffe27a, amount = 14): void {
    const emitter = this.scene.add.particles(x, y, PROC.spark, {
      speed: { min: 60, max: 220 },
      scale: { start: 1.1, end: 0 },
      lifespan: { min: 300, max: 650 },
      quantity: this.count(amount),
      tint,
      blendMode: Phaser.BlendModes.ADD,
      emitting: false,
    });
    emitter.setDepth(900);
    emitter.explode();
    this.scene.time.delayedCall(800, () => emitter.destroy());
  }

  smokePuff(x: number, y: number, amount = 6): void {
    const emitter = this.scene.add.particles(x, y, PROC.smoke, {
      speed: { min: 20, max: 80 },
      scale: { start: 0.6, end: 1.4 },
      alpha: { start: 0.8, end: 0 },
      lifespan: { min: 500, max: 900 },
      quantity: this.count(amount),
      emitting: false,
    });
    emitter.setDepth(890);
    emitter.explode();
    this.scene.time.delayedCall(1000, () => emitter.destroy());
  }

  cannonImpact(x: number, y: number): void {
    this.sparkleBurst(x, y, 0xff8844, 12);
    this.smokePuff(x, y, 8);
    const flash = this.scene.add.image(x, y, PROC.glowSoft).setTint(0xffaa33).setDepth(895);
    flash.setBlendMode(Phaser.BlendModes.ADD).setScale(0.4);
    this.scene.tweens.add({
      targets: flash,
      scale: 2.6 * intensityScale(),
      alpha: 0,
      duration: 320,
      ease: "Cubic.easeOut",
      onComplete: () => flash.destroy(),
    });
  }

  splash(x: number, y: number): void {
    const emitter = this.scene.add.particles(x, y, PROC.spark, {
      speed: { min: 100, max: 240 },
      angle: { min: 230, max: 310 },
      gravityY: 700,
      scale: { start: 0.9, end: 0.1 },
      tint: [0x9fdcff, 0x2ee6ff, 0xffffff],
      lifespan: { min: 350, max: 700 },
      quantity: this.count(12),
      emitting: false,
    });
    emitter.setDepth(880);
    emitter.explode();
    this.scene.time.delayedCall(900, () => emitter.destroy());
  }

  /**
   * Streams coin sprites from one point to another (plunder / payout).
   * Returns the total duration in ms.
   */
  plunderTrail(
    from: { x: number; y: number },
    to: { x: number; y: number },
    coins: number,
    opts: { tint?: number; onEach?: () => void; onDone?: () => void } = {},
  ): number {
    const n = Phaser.Math.Clamp(coins, 3, Math.round(14 * intensityScale()) + 4);
    const stagger = 70;
    const flight = 520;
    for (let i = 0; i < n; i++) {
      this.scene.time.delayedCall(i * stagger, () => {
        const coin = this.scene.add
          .image(from.x + Phaser.Math.Between(-24, 24), from.y + Phaser.Math.Between(-14, 8), PROC.coin)
          .setDepth(910)
          .setScale(0.8);
        if (opts.tint) coin.setTint(opts.tint);
        const midX = (from.x + to.x) / 2 + Phaser.Math.Between(-60, 60);
        const midY = Math.min(from.y, to.y) - Phaser.Math.Between(40, 120);
        const curve = new Phaser.Curves.QuadraticBezier(
          new Phaser.Math.Vector2(coin.x, coin.y),
          new Phaser.Math.Vector2(midX, midY),
          new Phaser.Math.Vector2(to.x, to.y),
        );
        const follower = { t: 0 };
        this.scene.tweens.add({
          targets: follower,
          t: 1,
          duration: flight,
          ease: "Sine.easeIn",
          onUpdate: () => {
            const p = curve.getPoint(follower.t);
            coin.setPosition(p.x, p.y);
            coin.setScale(0.8 - follower.t * 0.3);
          },
          onComplete: () => {
            coin.destroy();
            opts.onEach?.();
            if (i === n - 1) opts.onDone?.();
          },
        });
      });
    }
    return n * stagger + flight;
  }

  correctGlow(x: number, y: number): void {
    const glow = this.scene.add
      .image(x, y, PROC.glowSoft)
      .setTint(0xffd23e)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(300)
      .setScale(1);
    this.scene.tweens.add({
      targets: glow,
      scale: 4.5 * intensityScale(),
      alpha: { from: 0.9, to: 0 },
      duration: 900,
      ease: "Cubic.easeOut",
      onComplete: () => glow.destroy(),
    });
    this.sparkleBurst(x, y, 0xffd23e, 22);
  }

  wrongFlash(x: number, y: number): void {
    const glow = this.scene.add
      .image(x, y, PROC.glowSoft)
      .setTint(0xff2244)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(300)
      .setScale(2);
    this.scene.tweens.add({
      targets: glow,
      alpha: { from: 0.8, to: 0 },
      scale: 3,
      duration: 500,
      onComplete: () => glow.destroy(),
    });
  }

  scorePop(x: number, y: number, text: string, color: string): void {
    FloatingText.spawn(this.scene, x, y, text, color);
  }
}
