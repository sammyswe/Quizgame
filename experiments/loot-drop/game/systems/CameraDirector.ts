import Phaser from "phaser";
import { gameSettings, intensityScale } from "../settings";

/**
 * Owns all camera motion: ambient idle drift, dramatic zooms during lock-in
 * and reveal, shakes on impacts, pans to points of interest.
 */
export class CameraDirector {
  private cam: Phaser.Cameras.Scene2D.Camera;
  private driftTween: Phaser.Tweens.Tween | null = null;
  private baseZoom = 1;

  constructor(private scene: Phaser.Scene) {
    this.cam = scene.cameras.main;
  }

  startIdleDrift(): void {
    if (gameSettings.animationIntensity === "reduced") return;
    this.stopIdleDrift();
    const zoomAmp = 0.012 * intensityScale();
    this.driftTween = this.scene.tweens.add({
      targets: this.cam,
      zoom: { from: this.baseZoom, to: this.baseZoom + zoomAmp },
      duration: 5200,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  stopIdleDrift(): void {
    this.driftTween?.remove();
    this.driftTween = null;
  }

  zoomTo(zoom: number, duration = 700, onComplete?: () => void): void {
    this.stopIdleDrift();
    this.cam.zoomTo(zoom, duration, "Sine.easeInOut", true, (_cam, progress) => {
      if (progress === 1) onComplete?.();
    });
  }

  panTo(x: number, y: number, duration = 650): void {
    this.cam.pan(x, y, duration, "Sine.easeInOut", true);
  }

  shake(strength = 0.008, duration = 220): void {
    if (gameSettings.animationIntensity === "reduced") return;
    this.cam.shake(duration, strength * intensityScale());
  }

  /** Snappy punch-in used when the player slams LOCK IN. */
  lockInPunch(): void {
    if (gameSettings.animationIntensity === "reduced") return;
    this.stopIdleDrift();
    this.scene.tweens.add({
      targets: this.cam,
      zoom: this.baseZoom + 0.06 * intensityScale(),
      duration: 120,
      yoyo: true,
      ease: "Quad.easeOut",
      onComplete: () => this.startIdleDrift(),
    });
  }

  /** Return to neutral framing. */
  reset(duration = 600): void {
    this.cam.pan(this.scene.scale.width / 2, this.scene.scale.height / 2, duration, "Sine.easeInOut", true);
    this.cam.zoomTo(this.baseZoom, duration, "Sine.easeInOut", true, (_cam, progress) => {
      if (progress === 1) this.startIdleDrift();
    });
  }
}
