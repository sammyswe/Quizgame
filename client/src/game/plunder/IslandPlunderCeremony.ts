import Phaser from "phaser";

export type IslandTheme = "ruins" | "cave" | "port" | "temple";

export const ISLAND_THEMES: readonly IslandTheme[] = ["ruins", "cave", "port", "temple"];

type CrewMember = {
  root: Phaser.GameObjects.Container;
  color: number;
};

/**
 * Cinematic arrive → plunder → return for one answer island.
 * Uses themed particles and choreographed crew so the reveal feels authored,
 * not a pile of random beach sprites. Higgsfield video/keyframe overlays plug
 * in via texture keys `plunder-<theme>-0..n` when present.
 */
export function playIslandPlunderCeremony(
  scene: Phaser.Scene,
  opts: {
    islandIndex: number;
    islandX: number;
    islandY: number;
    shipStarts: Array<{ x: number; y: number; color: number; correct: boolean }>;
    onComplete?: () => void;
  },
): void {
  const theme = ISLAND_THEMES[opts.islandIndex] ?? "ruins";
  const correctCrew = opts.shipStarts.filter((entry) => entry.correct);
  const wrongCrew = opts.shipStarts.filter((entry) => !entry.correct);

  wrongCrew.forEach((entry, index) => {
    scene.time.delayedCall(80 + index * 90, () => {
      const phantom = makeCrew(scene, entry.x, entry.y, entry.color, 0.72);
      scene.tweens.add({
        targets: phantom.root,
        x: opts.islandX + Phaser.Math.Between(-40, 40),
        y: opts.islandY + 70,
        duration: 700,
        ease: "Sine.easeInOut",
        onComplete: () => {
          burstDust(scene, phantom.root.x, phantom.root.y, 0xd84b3f);
          floatLabel(scene, phantom.root.x, phantom.root.y - 40, "NO LOOT", "#ffb3a0");
          scene.tweens.add({
            targets: phantom.root,
            alpha: 0,
            y: phantom.root.y + 24,
            duration: 420,
            onComplete: () => phantom.root.destroy(),
          });
        },
      });
    });
  });

  if (correctCrew.length === 0) {
    scene.time.delayedCall(1200, () => opts.onComplete?.());
    return;
  }

  // Frame the island: vignette + soft zoom pulse.
  const vignette = scene.add.rectangle(640, 360, 1280, 720, 0x07121f, 0).setDepth(180);
  scene.tweens.add({ targets: vignette, fillAlpha: 0.42, duration: 280, yoyo: true, hold: 1800 });
  const focus = scene.add.ellipse(opts.islandX, opts.islandY + 10, 360, 210, themeAccent(theme), 0)
    .setStrokeStyle(6, themeAccent(theme), 0)
    .setDepth(120);
  scene.tweens.add({
    targets: focus,
    fillAlpha: 0.22,
    scaleX: 1.08,
    scaleY: 1.08,
    duration: 360,
    yoyo: true,
    hold: 1400,
    onComplete: () => focus.destroy(),
  });

  const hfKey = `plunder-${theme}`;
  const usedOverlay = tryPlayAuthoredOverlay(scene, hfKey, opts.islandX, opts.islandY);

  const landingX = opts.islandX;
  const landingY = opts.islandY + 18;
  const crew: CrewMember[] = [];

  correctCrew.forEach((entry, index) => {
    const member = makeCrew(scene, entry.x, entry.y, entry.color, 0.9);
    crew.push(member);
    const stageDelay = index * 110;

    // 1) Sail / dash to shore
    scene.tweens.add({
      targets: member.root,
      x: landingX + (index - (correctCrew.length - 1) / 2) * 38,
      y: landingY + 54,
      duration: 720,
      delay: stageDelay,
      ease: "Cubic.easeInOut",
      onComplete: () => {
        themeArrivalFx(scene, theme, member.root.x, member.root.y);
        // 2) Pop onto the island to plunder
        scene.tweens.add({
          targets: member.root,
          y: landingY - 8,
          scaleX: member.root.scaleX * 1.08,
          scaleY: member.root.scaleY * 0.92,
          duration: 180,
          yoyo: true,
          onComplete: () => {
            themePlunderFx(scene, theme, landingX, landingY - 20);
            lootBurst(scene, landingX, landingY - 10, entry.color);
            // 3) Jump back toward ship with treasure
            scene.tweens.add({
              targets: member.root,
              x: entry.x,
              y: entry.y - 10,
              duration: 780,
              delay: 220,
              ease: "Back.easeIn",
              onComplete: () => {
                member.root.setScale(member.root.scaleX * 1.05, member.root.scaleY * 0.9);
                scene.tweens.add({
                  targets: member.root,
                  scaleX: member.root.scaleX / 1.05,
                  scaleY: member.root.scaleY / 0.9,
                  duration: 160,
                  onComplete: () => {
                    floatLabel(scene, entry.x, entry.y - 48, "+LOOT", "#ffe07a");
                    coinArc(scene, landingX, landingY, entry.x, entry.y);
                    scene.time.delayedCall(400, () => member.root.destroy());
                  },
                });
              },
            });
          },
        });
      },
    });
  });

  const finishAt = usedOverlay ? 3200 : 2600 + correctCrew.length * 120;
  scene.time.delayedCall(finishAt, () => {
    vignette.destroy();
    opts.onComplete?.();
  });
}

function tryPlayAuthoredOverlay(
  scene: Phaser.Scene,
  baseKey: string,
  x: number,
  y: number,
): boolean {
  // Prefer a short video texture if registered; else a 3-frame still sequence.
  if (scene.textures.exists(`${baseKey}-video`)) {
    // Video is registered as an image sequence or video texture key by preload.
    const overlay = scene.add.image(x, y - 10, `${baseKey}-video`).setDepth(200).setAlpha(0);
    overlay.setDisplaySize(420, 260);
    scene.tweens.add({
      targets: overlay,
      alpha: 1,
      duration: 220,
      hold: 2400,
      yoyo: true,
      onComplete: () => overlay.destroy(),
    });
    return true;
  }

  const frames = [`${baseKey}-0`, `${baseKey}-1`, `${baseKey}-2`].filter((key) =>
    scene.textures.exists(key),
  );
  if (frames.length === 0) return false;

  const overlay = scene.add.image(x, y - 10, frames[0]!).setDepth(200).setAlpha(0);
  overlay.setDisplaySize(400, 250);
  scene.tweens.add({ targets: overlay, alpha: 1, duration: 180 });
  frames.forEach((key, index) => {
    if (index === 0) return;
    scene.time.delayedCall(index * 700, () => {
      if (!overlay.active) return;
      overlay.setTexture(key);
    });
  });
  scene.time.delayedCall(frames.length * 700 + 200, () => {
    scene.tweens.add({
      targets: overlay,
      alpha: 0,
      duration: 220,
      onComplete: () => overlay.destroy(),
    });
  });
  return true;
}

function makeCrew(
  scene: Phaser.Scene,
  x: number,
  y: number,
  color: number,
  scale: number,
): CrewMember {
  const root = scene.add.container(x, y).setDepth(210).setScale(scale);
  const shadow = scene.add.ellipse(0, 18, 36, 12, 0x000000, 0.25);
  const hull = scene.add.ellipse(0, 6, 46, 22, color, 1).setStrokeStyle(4, 0x17233b);
  const sail = scene.add.triangle(-4, -22, 0, 18, 22, 8, -10, 8, 0xffffff, 1).setStrokeStyle(3, 0x17233b);
  sail.setFillStyle(0xfff6d6, 1);
  const pirate = scene.add.circle(8, -6, 8, 0xf0c090, 1).setStrokeStyle(3, 0x17233b);
  root.add([shadow, hull, sail, pirate]);
  scene.tweens.add({
    targets: root,
    y: y - 4,
    duration: 380,
    yoyo: true,
    repeat: -1,
    ease: "Sine.easeInOut",
  });
  return { root, color };
}

function themeAccent(theme: IslandTheme): number {
  switch (theme) {
    case "ruins":
      return 0xffd45f;
    case "cave":
      return 0x5ad6ef;
    case "port":
      return 0xff8a5c;
    case "temple":
      return 0x7dff9a;
  }
}

function themeArrivalFx(scene: Phaser.Scene, theme: IslandTheme, x: number, y: number): void {
  switch (theme) {
    case "ruins":
      burstDust(scene, x, y, 0xd2b48c);
      break;
    case "cave":
      for (let i = 0; i < 8; i += 1) {
        const drop = scene.add.circle(x, y - 10, 4, 0x9ef7ff, 0.9).setDepth(220);
        scene.tweens.add({
          targets: drop,
          y: y + 30,
          alpha: 0,
          duration: 420 + i * 30,
          onComplete: () => drop.destroy(),
        });
      }
      break;
    case "port":
      burstDust(scene, x, y, 0xc4a574);
      floatLabel(scene, x, y - 30, "DOCK!", "#ffd7a0");
      break;
    case "temple":
      for (let i = 0; i < 6; i += 1) {
        const leaf = scene.add.rectangle(x, y, 10, 16, 0x4caf50, 0.95).setDepth(220).setAngle(i * 28);
        scene.tweens.add({
          targets: leaf,
          x: x + Math.cos(i) * 40,
          y: y + Math.sin(i) * 28,
          alpha: 0,
          duration: 500,
          onComplete: () => leaf.destroy(),
        });
      }
      break;
  }
}

function themePlunderFx(scene: Phaser.Scene, theme: IslandTheme, x: number, y: number): void {
  const ring = scene.add.circle(x, y, 18, themeAccent(theme), 0.35).setDepth(215);
  scene.tweens.add({
    targets: ring,
    scale: 3.2,
    alpha: 0,
    duration: 480,
    onComplete: () => ring.destroy(),
  });
  if (theme === "ruins") floatLabel(scene, x, y - 36, "RELICS!", "#ffe7a8");
  if (theme === "cave") floatLabel(scene, x, y - 36, "PEARLS!", "#c8fbff");
  if (theme === "port") floatLabel(scene, x, y - 36, "HAUL!", "#ffc9a8");
  if (theme === "temple") floatLabel(scene, x, y - 36, "IDOL!", "#b7ffc8");
  scene.cameras.main.shake(120, 0.004);
}

function lootBurst(scene: Phaser.Scene, x: number, y: number, color: number): void {
  for (let i = 0; i < 10; i += 1) {
    const gem = scene.add.circle(x, y, Phaser.Math.Between(4, 8), i % 2 ? 0xffd45f : color, 1)
      .setStrokeStyle(2, 0x17233b)
      .setDepth(230);
    scene.tweens.add({
      targets: gem,
      x: x + Phaser.Math.Between(-55, 55),
      y: y + Phaser.Math.Between(-60, 10),
      alpha: 0,
      duration: 520 + i * 20,
      ease: "Cubic.easeOut",
      onComplete: () => gem.destroy(),
    });
  }
}

function coinArc(scene: Phaser.Scene, fromX: number, fromY: number, toX: number, toY: number): void {
  for (let i = 0; i < 8; i += 1) {
    const coin = scene.add.circle(fromX, fromY, 7, 0xffd45f, 1).setStrokeStyle(2, 0x8f5a1d).setDepth(240);
    scene.tweens.add({
      targets: coin,
      x: toX + Phaser.Math.Between(-16, 16),
      y: toY + Phaser.Math.Between(-10, 10),
      duration: 520 + i * 35,
      delay: i * 28,
      ease: "Cubic.easeIn",
      onComplete: () => coin.destroy(),
    });
  }
}

function burstDust(scene: Phaser.Scene, x: number, y: number, color: number): void {
  for (let i = 0; i < 7; i += 1) {
    const puff = scene.add.circle(x, y, Phaser.Math.Between(6, 12), color, 0.7).setDepth(220);
    scene.tweens.add({
      targets: puff,
      x: x + Phaser.Math.Between(-36, 36),
      y: y + Phaser.Math.Between(-28, 8),
      alpha: 0,
      scale: 0.3,
      duration: 420,
      onComplete: () => puff.destroy(),
    });
  }
}

function floatLabel(scene: Phaser.Scene, x: number, y: number, text: string, color: string): void {
  const label = scene.add.text(x, y, text, {
    fontFamily: "Lilita One",
    fontSize: "22px",
    color,
    stroke: "#17233b",
    strokeThickness: 6,
  }).setOrigin(0.5).setDepth(260);
  scene.tweens.add({
    targets: label,
    y: y - 42,
    alpha: 0,
    duration: 900,
    ease: "Cubic.easeOut",
    onComplete: () => label.destroy(),
  });
}
