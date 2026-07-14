import Phaser from "phaser";
import { PROC } from "../assets/spriteKeys";

/**
 * The big chunky LOCK IN slam button. Pulses while armed, squashes on press,
 * slams with a shockwave when confirmed.
 */
export class LockInButton extends Phaser.GameObjects.Container {
  private img: Phaser.GameObjects.Image;
  private label: Phaser.GameObjects.Text;
  private pulseTween: Phaser.Tweens.Tween | null = null;
  private locked = false;

  constructor(scene: Phaser.Scene, x: number, y: number, private onLock: () => void) {
    super(scene, x, y);
    scene.add.existing(this);
    this.setDepth(800);

    this.img = scene.add.image(0, 0, PROC.lockInButton);
    this.add(this.img);

    this.label = scene.add
      .text(0, -8, "LOCK IN", {
        fontFamily: '"Luckiest Guy", "Arial Black", sans-serif',
        fontSize: "36px",
        color: "#fff8e1",
        stroke: "#1c1230",
        strokeThickness: 8,
      })
      .setOrigin(0.5);
    this.add(this.label);

    this.setSize(300, 108);
    this.setScale(0.82);
    this.setInteractive({ useHandCursor: true });

    this.on("pointerover", () => {
      if (this.locked) return;
      this.scene.tweens.add({ targets: this, scale: 0.88, duration: 120, ease: "Quad.easeOut" });
    });
    this.on("pointerout", () => {
      if (this.locked) return;
      this.scene.tweens.add({ targets: this, scale: 0.82, duration: 120 });
    });
    this.on("pointerdown", () => {
      if (this.locked) return;
      this.scene.tweens.add({
        targets: this,
        scaleX: 0.92,
        scaleY: 0.72,
        duration: 80,
        yoyo: true,
        ease: "Quad.easeOut",
        onComplete: () => this.onLock(),
      });
    });

    this.startPulse();
  }

  private startPulse(): void {
    this.pulseTween = this.scene.tweens.add({
      targets: this,
      scale: 0.86,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  /** Big slam confirmation. Returns center point for VFX. */
  slam(): void {
    if (this.locked) return;
    this.locked = true;
    this.pulseTween?.remove();
    this.pulseTween = null;
    this.label.setText("LOCKED!");
    this.scene.tweens.add({
      targets: this,
      scale: { from: 1.25, to: 0.82 },
      duration: 260,
      ease: "Bounce.easeOut",
    });
    this.img.setTint(0x8a8aa0);
  }

  setLockedState(locked: boolean): void {
    if (locked) {
      this.slam();
    } else {
      this.locked = false;
      this.label.setText("LOCK IN");
      this.img.clearTint();
      if (!this.pulseTween) this.startPulse();
    }
  }

  isLocked(): boolean {
    return this.locked;
  }
}
