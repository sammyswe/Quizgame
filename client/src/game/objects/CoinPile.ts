import Phaser from "phaser";
import { PROC } from "../assets/spriteKeys";

/**
 * The player's treasure pile: the drag source for loot allocation.
 * Shows remaining loot and shrinks visually as it is spent.
 */
export class CoinPile extends Phaser.GameObjects.Container {
  private coins: Phaser.GameObjects.Image[] = [];
  private countText: Phaser.GameObjects.Text;
  private label: Phaser.GameObjects.Text;
  private glow: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    scene.add.existing(this);
    this.setDepth(650);

    this.glow = scene.add
      .image(0, 0, PROC.glowSoft)
      .setTint(0xffd23e)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setScale(1.7)
      .setAlpha(0.35);
    this.add(this.glow);

    // heap of coins & chips
    const layout: [number, number, number, string][] = [
      [-34, 8, 0.85, PROC.coin],
      [-10, 12, 0.9, PROC.chip],
      [16, 9, 0.85, PROC.coin],
      [36, 13, 0.8, PROC.chip],
      [-22, -2, 0.9, PROC.chip],
      [4, -4, 0.95, PROC.coin],
      [28, -1, 0.85, PROC.coin],
      [-8, -14, 0.9, PROC.coin],
      [14, -15, 0.85, PROC.chip],
      [3, -25, 0.9, PROC.coin],
    ];
    for (const [cx, cy, s, key] of layout) {
      const c = scene.add.image(cx, cy, key).setScale(s);
      this.coins.push(c);
      this.add(c);
    }

    this.countText = scene.add
      .text(0, -52, "100", {
        fontFamily: '"Luckiest Guy", "Arial Black", sans-serif',
        fontSize: "30px",
        color: "#ffd23e",
        stroke: "#1c1230",
        strokeThickness: 7,
      })
      .setOrigin(0.5);
    this.add(this.countText);

    this.label = scene.add
      .text(0, 34, "DRAG LOOT TO AN ISLAND", {
        fontFamily: '"Nunito", sans-serif',
        fontSize: "12px",
        fontStyle: "900",
        color: "#9fdcff",
        stroke: "#1c1230",
        strokeThickness: 3,
      })
      .setOrigin(0.5);
    this.add(this.label);

    scene.tweens.add({
      targets: this.glow,
      alpha: { from: 0.35, to: 0.6 },
      scale: { from: 1.7, to: 2.0 },
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    const hit = new Phaser.Geom.Rectangle(-60, -50, 120, 90);
    this.setInteractive({ hitArea: hit, hitAreaCallback: Phaser.Geom.Rectangle.Contains, useHandCursor: true });
  }

  setRemaining(remaining: number): void {
    this.countText.setText(String(remaining));
    const frac = remaining / 100;
    this.coins.forEach((c, i) => {
      c.setVisible(i / this.coins.length < frac || i === 0);
    });
    this.glow.setAlpha(remaining > 0 ? 0.35 : 0.08);
    this.label.setText(remaining > 0 ? "DRAG LOOT TO AN ISLAND" : "ALL LOOT PLACED");
    this.scene.tweens.add({
      targets: this.countText,
      scale: { from: 1.3, to: 1 },
      duration: 160,
      ease: "Back.easeOut",
    });
  }
}
