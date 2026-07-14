import Phaser from "phaser";
import { PROC } from "../assets/spriteKeys";
import type { AssetManager } from "../systems/AssetManager";
import { ConfidenceFlag } from "./ConfidenceFlag";

const LETTERS = ["A", "B", "C", "D"];
const ISLAND_TINTS = [0x2ee6ff, 0xff4fd8, 0xffd23e, 0x7cff4f];

export interface AnswerIslandCallbacks {
  onTapAdd: (index: number) => void;
  onRemove: (index: number) => void;
  onHover: (index: number, over: boolean) => void;
}

/**
 * One of the four treasure islands players drop loot onto.
 * Owns its plaque, allocation counter, chip stack, confidence flags and
 * reveal-state visuals.
 */
export class AnswerIsland extends Phaser.GameObjects.Container {
  readonly index: number;

  private glow: Phaser.GameObjects.Image;
  private islandSprite: Phaser.GameObjects.Image;
  private plaque: Phaser.GameObjects.Image;
  private letterBadge: Phaser.GameObjects.Text;
  private answerText: Phaser.GameObjects.Text;
  private allocBadge: Phaser.GameObjects.Container;
  private allocText: Phaser.GameObjects.Text;
  private chipStack: Phaser.GameObjects.Container;
  private flags: Phaser.GameObjects.Container;
  private skullStamp: Phaser.GameObjects.Image | null = null;
  private minusHint: Phaser.GameObjects.Text;

  private allocation = 0;
  private bobTween: Phaser.Tweens.Tween;
  private revealState: "none" | "correct" | "wrong" = "none";

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    index: number,
    assets: AssetManager,
    private callbacks: AnswerIslandCallbacks,
  ) {
    super(scene, x, y);
    this.index = index;
    scene.add.existing(this);
    this.setDepth(400);

    this.glow = scene.add
      .image(0, 10, PROC.islandGlow)
      .setTint(ISLAND_TINTS[index])
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0.18);
    this.add(this.glow);

    const islandTex = assets.island(index);
    this.islandSprite = scene.add.image(0, -10, islandTex.key, islandTex.frame);
    const targetW = 250;
    this.islandSprite.setScale(targetW / this.islandSprite.width);
    this.add(this.islandSprite);

    // answer plaque hangs beneath the island
    this.plaque = scene.add.image(0, 84, PROC.plaque);
    this.add(this.plaque);

    this.letterBadge = scene.add
      .text(-108, 84, LETTERS[index], {
        fontFamily: '"Luckiest Guy", "Arial Black", sans-serif',
        fontSize: "30px",
        color: Phaser.Display.Color.IntegerToColor(ISLAND_TINTS[index]).rgba,
        stroke: "#1c1230",
        strokeThickness: 6,
      })
      .setOrigin(0.5);
    this.add(this.letterBadge);

    this.answerText = scene.add
      .text(8, 84, "", {
        fontFamily: '"Nunito", sans-serif',
        fontSize: "19px",
        fontStyle: "900",
        color: "#fdf6dd",
        align: "center",
        wordWrap: { width: 196 },
      })
      .setOrigin(0.5);
    this.add(this.answerText);

    // allocation badge (coin + amount) floats above the island
    this.allocBadge = scene.add.container(86, -74);
    const badgeBg = scene.add.graphics();
    badgeBg.fillStyle(0x1c1230, 0.85);
    badgeBg.fillRoundedRect(-38, -20, 84, 40, 14);
    badgeBg.lineStyle(3, ISLAND_TINTS[index], 0.9);
    badgeBg.strokeRoundedRect(-38, -20, 84, 40, 14);
    const badgeCoin = scene.add.image(-18, 0, PROC.coin).setScale(0.55);
    this.allocText = scene.add
      .text(12, 0, "0", {
        fontFamily: '"Luckiest Guy", "Arial Black", sans-serif',
        fontSize: "24px",
        color: "#ffd23e",
      })
      .setOrigin(0.5);
    this.allocBadge.add([badgeBg, badgeCoin, this.allocText]);
    this.allocBadge.setAlpha(0);
    this.add(this.allocBadge);

    this.minusHint = scene.add
      .text(86, -44, "right-click -10", {
        fontFamily: '"Nunito", sans-serif',
        fontSize: "11px",
        fontStyle: "700",
        color: "#9fdcff",
      })
      .setOrigin(0.5)
      .setAlpha(0);
    this.add(this.minusHint);

    this.chipStack = scene.add.container(0, 26);
    this.add(this.chipStack);

    this.flags = scene.add.container(-92, -52);
    this.add(this.flags);

    // gentle bob, staggered per island so they don't move in sync
    this.bobTween = scene.tweens.add({
      targets: this,
      y: y + 7,
      duration: 2300 + index * 240,
      delay: index * 300,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    const hit = new Phaser.Geom.Rectangle(-140, -105, 280, 230);
    this.setInteractive({ hitArea: hit, hitAreaCallback: Phaser.Geom.Rectangle.Contains, useHandCursor: true });
    this.on("pointerover", () => {
      this.callbacks.onHover(this.index, true);
      this.setHover(true);
    });
    this.on("pointerout", () => {
      this.callbacks.onHover(this.index, false);
      this.setHover(false);
    });
    this.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (pointer.rightButtonDown()) this.callbacks.onRemove(this.index);
      else this.callbacks.onTapAdd(this.index);
    });
  }

  setAnswer(text: string): void {
    this.answerText.setText(text);
  }

  get worldPoint(): { x: number; y: number } {
    return { x: this.x, y: this.y };
  }

  setHover(over: boolean): void {
    if (this.revealState !== "none") return;
    this.scene.tweens.add({
      targets: this.glow,
      alpha: over ? 0.55 : 0.18,
      duration: 160,
    });
    this.scene.tweens.add({
      targets: this.islandSprite,
      scale: (250 / this.islandSprite.width) * (over ? 1.05 : 1),
      duration: 160,
      ease: "Quad.easeOut",
    });
    this.minusHint.setAlpha(over && this.allocation > 0 ? 0.9 : 0);
  }

  /** Little pulse when loot lands here. */
  receivePulse(): void {
    this.scene.tweens.add({
      targets: this.islandSprite,
      scaleX: (250 / this.islandSprite.width) * 1.09,
      scaleY: (250 / this.islandSprite.width) * 0.94,
      duration: 110,
      yoyo: true,
      ease: "Quad.easeOut",
    });
  }

  setAllocation(amount: number): void {
    this.allocation = amount;
    this.allocText.setText(String(amount));
    this.scene.tweens.add({
      targets: this.allocBadge,
      alpha: amount > 0 ? 1 : 0,
      scale: { from: amount > 0 ? 1.3 : 1, to: 1 },
      duration: 180,
      ease: "Back.easeOut",
    });
    // one chip per 10 loot, heaped near the shore
    const want = Math.floor(amount / 10);
    while (this.chipStack.length > want) {
      this.chipStack.getAt(this.chipStack.length - 1).destroy();
    }
    while (this.chipStack.length < want) {
      const i = this.chipStack.length;
      const chip = this.scene.add
        .image(((i % 5) - 2) * 20 + ((i * 7) % 9) - 4, 14 - Math.floor(i / 5) * 10, i % 2 === 0 ? PROC.coin : PROC.chip)
        .setScale(0.62);
      this.chipStack.add(chip);
    }
  }

  getAllocation(): number {
    return this.allocation;
  }

  addConfidenceFlag(avatarId: number): void {
    const flag = new ConfidenceFlag(this.scene, this.flags.length * 22, 0, avatarId);
    this.scene.children.remove(flag);
    this.flags.add(flag);
  }

  clearConfidenceFlags(): void {
    this.flags.removeAll(true);
  }

  flagCount(): number {
    return this.flags.length;
  }

  pulse(): void {
    this.scene.tweens.add({
      targets: this,
      scale: { from: 1, to: 1.07 },
      duration: 160,
      yoyo: true,
      ease: "Quad.easeOut",
    });
  }

  setCorrect(): void {
    this.revealState = "correct";
    this.glow.setTint(0xffd23e);
    this.scene.tweens.add({ targets: this.glow, alpha: 0.85, scale: 1.25, duration: 500 });
    this.islandSprite.clearTint();
    this.scene.tweens.add({
      targets: this,
      scale: 1.08,
      duration: 420,
      ease: "Back.easeOut",
    });
  }

  setWrong(): void {
    this.revealState = "wrong";
    this.islandSprite.setTint(0x5a5a80);
    this.answerText.setAlpha(0.55);
    this.glow.setTint(0xff2244);
    this.scene.tweens.add({ targets: this.glow, alpha: 0.32, duration: 400 });
  }

  stampSkull(): void {
    if (this.skullStamp) return;
    this.skullStamp = this.scene.add.image(0, -30, PROC.skull).setScale(3).setAlpha(0);
    this.add(this.skullStamp);
    this.scene.tweens.add({
      targets: this.skullStamp,
      scale: 1.1,
      alpha: 1,
      duration: 260,
      ease: "Cubic.easeIn",
    });
  }

  /** Coins visually drained during plunder. */
  drainChips(): void {
    this.chipStack.removeAll(true);
  }

  resetForNewQuestion(): void {
    this.revealState = "none";
    this.islandSprite.clearTint();
    this.answerText.setAlpha(1);
    this.glow.setTint(ISLAND_TINTS[this.index]).setAlpha(0.18).setScale(1);
    this.setScale(1);
    this.skullStamp?.destroy();
    this.skullStamp = null;
    this.clearConfidenceFlags();
    this.setAllocation(0);
  }

  destroy(fromScene?: boolean): void {
    this.bobTween.remove();
    super.destroy(fromScene);
  }
}
