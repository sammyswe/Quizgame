import Phaser from "phaser";
import type { AvatarReaction } from "../../../../shared/src/types";
import { PROC, avatarKey, emoteKey } from "../assets/spriteKeys";

/**
 * A pirate medallion avatar with a nickname, score, lock indicator and a set
 * of reactions (squash/stretch + emote bubble + tint flashes).
 */
export class PlayerAvatar extends Phaser.GameObjects.Container {
  readonly playerId: string;

  private medallion: Phaser.GameObjects.Image;
  private nameText: Phaser.GameObjects.Text;
  private scoreText: Phaser.GameObjects.Text;
  private lockIcon: Phaser.GameObjects.Image;
  private targetGlow: Phaser.GameObjects.Image;
  private emoteBubble: Phaser.GameObjects.Image | null = null;
  private scaredLoop: Phaser.Tweens.Tween | null = null;
  private idleTween: Phaser.Tweens.Tween;
  private baseScale: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    playerId: string,
    avatarId: number,
    nickname: string,
    scale = 1,
  ) {
    super(scene, x, y);
    this.playerId = playerId;
    this.baseScale = scale;
    scene.add.existing(this);
    this.setDepth(600);
    this.setScale(scale);

    this.targetGlow = scene.add
      .image(0, 0, PROC.glowSoft)
      .setTint(0xff2244)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setScale(1.4)
      .setAlpha(0);
    this.add(this.targetGlow);

    this.medallion = scene.add.image(0, 0, avatarKey(avatarId));
    this.add(this.medallion);

    this.nameText = scene.add
      .text(0, 58, nickname, {
        fontFamily: '"Nunito", sans-serif',
        fontSize: "16px",
        fontStyle: "900",
        color: "#fdf6dd",
        stroke: "#1c1230",
        strokeThickness: 4,
      })
      .setOrigin(0.5);
    this.add(this.nameText);

    this.scoreText = scene.add
      .text(0, 78, "0", {
        fontFamily: '"Luckiest Guy", "Arial Black", sans-serif',
        fontSize: "17px",
        color: "#ffd23e",
        stroke: "#1c1230",
        strokeThickness: 4,
      })
      .setOrigin(0.5);
    this.add(this.scoreText);

    this.lockIcon = scene.add.image(36, -34, emoteKey("locked")).setScale(0).setAlpha(0);
    this.add(this.lockIcon);

    this.idleTween = scene.tweens.add({
      targets: this.medallion,
      y: { from: 0, to: -5 },
      duration: 1600 + Math.random() * 600,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  setScore(score: number): void {
    this.scoreText.setText(String(score));
  }

  setLocked(locked: boolean): void {
    if (locked && this.lockIcon.alpha === 0) {
      this.lockIcon.setAlpha(1);
      this.scene.tweens.add({
        targets: this.lockIcon,
        scale: { from: 1.8, to: 0.9 },
        duration: 260,
        ease: "Back.easeOut",
      });
      this.squash();
    } else if (!locked) {
      this.lockIcon.setAlpha(0).setScale(0);
    }
  }

  setConnected(connected: boolean): void {
    this.setAlpha(connected ? 1 : 0.4);
  }

  /** Red glow while an item drag hovers this player. */
  setTargeted(targeted: boolean): void {
    this.scene.tweens.add({
      targets: this.targetGlow,
      alpha: targeted ? 0.9 : 0,
      duration: 140,
    });
    if (targeted) {
      this.scene.tweens.add({
        targets: this.medallion,
        angle: { from: -3, to: 3 },
        duration: 70,
        yoyo: true,
        repeat: 3,
        onComplete: () => this.medallion.setAngle(0),
      });
    }
  }

  setScared(scared: boolean): void {
    if (scared && !this.scaredLoop) {
      this.showEmote("scared", 0);
      this.scaredLoop = this.scene.tweens.add({
        targets: this.medallion,
        x: { from: -3, to: 3 },
        duration: 90,
        yoyo: true,
        repeat: -1,
      });
      this.medallion.setTint(0xaab6ff);
    } else if (!scared && this.scaredLoop) {
      this.scaredLoop.remove();
      this.scaredLoop = null;
      this.medallion.setX(0).clearTint();
      this.hideEmote();
    }
  }

  react(reaction: AvatarReaction): void {
    switch (reaction) {
      case "happy":
        this.showEmote("happy");
        this.bounce();
        this.flashTint(0x7cff4f);
        break;
      case "shocked":
        this.showEmote("shocked");
        this.squash();
        this.flashTint(0x9fdcff);
        break;
      case "angry":
        this.showEmote("angry");
        this.shakeAngry();
        this.flashTint(0xff4f5e);
        break;
      case "scared":
        this.showEmote("scared");
        this.squash();
        break;
      case "winner":
        this.showEmote("winner", 3200);
        this.bounce();
        this.flashTint(0xffd23e);
        break;
      case "locked":
        this.setLocked(true);
        break;
      default:
        break;
    }
  }

  private showEmote(
    emote: "happy" | "shocked" | "angry" | "scared" | "winner" | "locked",
    autoHideMs = 2100,
  ): void {
    this.hideEmote();
    this.emoteBubble = this.scene.add.image(-38, -44, emoteKey(emote)).setScale(0);
    this.add(this.emoteBubble);
    this.scene.tweens.add({
      targets: this.emoteBubble,
      scale: 1,
      duration: 240,
      ease: "Back.easeOut",
    });
    if (autoHideMs > 0) {
      this.scene.time.delayedCall(autoHideMs, () => this.hideEmote());
    }
  }

  private hideEmote(): void {
    this.emoteBubble?.destroy();
    this.emoteBubble = null;
  }

  private squash(): void {
    this.scene.tweens.add({
      targets: this,
      scaleX: this.baseScale * 1.18,
      scaleY: this.baseScale * 0.84,
      duration: 110,
      yoyo: true,
      ease: "Quad.easeOut",
      onComplete: () => this.setScale(this.baseScale),
    });
  }

  private bounce(): void {
    this.scene.tweens.add({
      targets: this,
      y: this.y - 16,
      duration: 170,
      yoyo: true,
      repeat: 1,
      ease: "Quad.easeOut",
    });
  }

  private shakeAngry(): void {
    this.scene.tweens.add({
      targets: this,
      x: { from: this.x - 4, to: this.x + 4 },
      duration: 60,
      yoyo: true,
      repeat: 4,
      onComplete: () => void 0,
    });
  }

  private flashTint(color: number): void {
    this.medallion.setTint(color);
    this.scene.time.delayedCall(340, () => {
      if (!this.scaredLoop) this.medallion.clearTint();
    });
  }

  destroy(fromScene?: boolean): void {
    this.idleTween.remove();
    this.scaredLoop?.remove();
    super.destroy(fromScene);
  }
}
