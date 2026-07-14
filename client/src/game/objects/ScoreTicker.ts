import Phaser from "phaser";
import { PROC } from "../assets/spriteKeys";

/** Animated rolling score counter with a coin icon. */
export class ScoreTicker extends Phaser.GameObjects.Container {
  private valueText: Phaser.GameObjects.Text;
  private displayed = 0;
  private target = 0;
  private rollTween: Phaser.Tweens.Tween | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    scene.add.existing(this);
    this.setDepth(800);

    const bg = scene.add.graphics();
    bg.fillStyle(0x1c1230, 0.85);
    bg.fillRoundedRect(-84, -26, 168, 52, 16);
    bg.lineStyle(3, 0xffd23e, 0.85);
    bg.strokeRoundedRect(-84, -26, 168, 52, 16);
    this.add(bg);

    const coin = scene.add.image(-56, 0, PROC.coin).setScale(0.8);
    this.add(coin);

    this.valueText = scene.add
      .text(12, 0, "0", {
        fontFamily: '"Luckiest Guy", "Arial Black", sans-serif',
        fontSize: "30px",
        color: "#ffd23e",
      })
      .setOrigin(0.5);
    this.add(this.valueText);
  }

  setScore(value: number, animate = true): void {
    this.target = value;
    if (!animate) {
      this.displayed = value;
      this.valueText.setText(String(value));
      return;
    }
    this.rollTween?.remove();
    const proxy = { v: this.displayed };
    this.rollTween = this.scene.tweens.add({
      targets: proxy,
      v: this.target,
      duration: 900,
      ease: "Cubic.easeOut",
      onUpdate: () => {
        this.displayed = Math.round(proxy.v);
        this.valueText.setText(String(this.displayed));
      },
    });
    this.scene.tweens.add({
      targets: this,
      scale: { from: 1.18, to: 1 },
      duration: 300,
      ease: "Back.easeOut",
    });
  }

  get center(): { x: number; y: number } {
    return { x: this.x, y: this.y };
  }
}
