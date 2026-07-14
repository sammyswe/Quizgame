import Phaser from "phaser";

/** Pop-in, float-up, fade-out text used for +40 / Plundered -60 moments. */
export class FloatingText {
  static spawn(
    scene: Phaser.Scene,
    x: number,
    y: number,
    text: string,
    color = "#ffd23e",
    fontSize = 40,
  ): void {
    const label = scene.add
      .text(x, y, text, {
        fontFamily: '"Luckiest Guy", "Arial Black", sans-serif',
        fontSize: `${fontSize}px`,
        color,
        stroke: "#1c1230",
        strokeThickness: Math.max(6, fontSize * 0.2),
      })
      .setOrigin(0.5)
      .setDepth(950)
      .setScale(0.2);
    scene.tweens.add({
      targets: label,
      scale: 1.12,
      duration: 240,
      ease: "Back.easeOut",
      onComplete: () => {
        scene.tweens.add({
          targets: label,
          y: y - 70,
          alpha: 0,
          duration: 900,
          delay: 380,
          ease: "Cubic.easeIn",
          onComplete: () => label.destroy(),
        });
      },
    });
  }
}
