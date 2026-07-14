import Phaser from "phaser";
import { PROC, PLAYER_COLORS, avatarKey, flagKey, emoteKey } from "./spriteKeys";

/**
 * Runtime-generated fallback art. Every texture the game needs exists after
 * generateAllTextures() runs, so the scene can never break on missing files.
 * Style goal: chunky cartoon shapes, thick outlines, neon-pirate palette --
 * placeholder art that still looks intentional.
 */

type Draw = (g: Phaser.GameObjects.Graphics) => void;

function makeTexture(scene: Phaser.Scene, key: string, w: number, h: number, draw: Draw): void {
  if (scene.textures.exists(key)) return;
  const g = scene.add.graphics({ x: 0, y: 0 });
  draw(g);
  g.generateTexture(key, w, h);
  g.destroy();
}

function lerpColor(a: number, b: number, t: number): number {
  const ca = Phaser.Display.Color.IntegerToColor(a);
  const cb = Phaser.Display.Color.IntegerToColor(b);
  const c = Phaser.Display.Color.Interpolate.ColorWithColor(ca, cb, 100, Math.round(t * 100));
  return Phaser.Display.Color.GetColor(c.r, c.g, c.b);
}

// --------------------------------------------------------------- background

function drawOcean(g: Phaser.GameObjects.Graphics): void {
  const W = 1280;
  const H = 720;
  const top = 0x0a0824; // deep night purple
  const mid = 0x0c2247;
  const bottom = 0x0e3a63; // teal-blue water
  const bands = 48;
  for (let i = 0; i < bands; i++) {
    const t = i / (bands - 1);
    const color = t < 0.45 ? lerpColor(top, mid, t / 0.45) : lerpColor(mid, bottom, (t - 0.45) / 0.55);
    g.fillStyle(color, 1);
    g.fillRect(0, (H / bands) * i, W, H / bands + 1);
  }
  // horizon glow strip (casino neon on the waterline)
  for (let i = 0; i < 6; i++) {
    g.fillStyle(0x2ee6ff, 0.05 - i * 0.007);
    g.fillRect(0, 300 - i * 8, W, 16 + i * 16);
  }
  g.fillStyle(0xff4fd8, 0.03);
  g.fillRect(0, 320, W, 60);
  // stars
  for (let i = 0; i < 90; i++) {
    const x = Math.random() * W;
    const y = Math.random() * 280;
    const r = Math.random() * 1.6 + 0.4;
    g.fillStyle(0xffffff, 0.25 + Math.random() * 0.5);
    g.fillCircle(x, y, r);
  }
  // faint distant island silhouettes on horizon
  g.fillStyle(0x081a33, 1);
  g.fillEllipse(200, 318, 180, 40);
  g.fillEllipse(1080, 322, 220, 46);
  g.fillEllipse(660, 316, 120, 30);
  // subtle wave streaks in the water
  for (let i = 0; i < 60; i++) {
    const y = 340 + Math.random() * 360;
    const x = Math.random() * W;
    const len = 30 + Math.random() * 120;
    g.fillStyle(lerpColor(0x2ee6ff, 0xffffff, Math.random() * 0.5), 0.045 + Math.random() * 0.05);
    g.fillRoundedRect(x, y, len, 3, 2);
  }
}

function drawWaveLayer(g: Phaser.GameObjects.Graphics): void {
  // tileable scalloped wave band, 512 x 96
  const W = 512;
  const scallops = 8;
  const r = W / scallops / 2;
  g.fillStyle(0x1d5c8f, 0.55);
  g.fillRect(0, r, W, 96 - r);
  for (let i = 0; i < scallops; i++) {
    g.fillCircle(i * r * 2 + r, r, r);
  }
  g.fillStyle(0x2ee6ff, 0.25);
  for (let i = 0; i < scallops; i++) {
    g.fillCircle(i * r * 2 + r, r, r * 0.55);
  }
}

function drawFog(g: Phaser.GameObjects.Graphics): void {
  // soft cloud blob 420 x 140
  const blobs: [number, number, number][] = [
    [110, 84, 62],
    [180, 66, 74],
    [260, 84, 66],
    [330, 72, 52],
    [210, 96, 80],
  ];
  for (const [x, y, r] of blobs) {
    for (let i = 4; i >= 1; i--) {
      g.fillStyle(0xbcd8ff, 0.028 * i);
      g.fillCircle(x, y, (r * i) / 4 + r * 0.6);
    }
  }
}

function drawMoon(g: Phaser.GameObjects.Graphics): void {
  const c = 80;
  for (let i = 5; i >= 1; i--) {
    g.fillStyle(0xfff2c9, 0.05 * i);
    g.fillCircle(c, c, 44 + i * 7);
  }
  g.fillStyle(0xfdf6dd, 1);
  g.fillCircle(c, c, 44);
  g.fillStyle(0xe8dcb8, 1);
  g.fillCircle(c - 14, c - 8, 9);
  g.fillCircle(c + 12, c + 14, 6);
  g.fillCircle(c + 18, c - 16, 4);
}

function drawGlowSoft(g: Phaser.GameObjects.Graphics): void {
  const c = 64;
  for (let i = 10; i >= 1; i--) {
    g.fillStyle(0xffffff, 0.05 + (10 - i) * 0.012);
    g.fillCircle(c, c, (64 * i) / 10);
  }
}

// ------------------------------------------------------------------ island

function drawIsland(g: Phaser.GameObjects.Graphics): void {
  // 280 x 190, three-quarter cartoon island with palm + treasure hint
  const cx = 140;
  // water shadow
  g.fillStyle(0x06121f, 0.5);
  g.fillEllipse(cx, 150, 250, 62);
  // sand base with thick outline
  g.lineStyle(7, 0x1c1230, 1);
  g.fillStyle(0xf2cc7c, 1);
  g.fillEllipse(cx, 128, 226, 84);
  g.strokeEllipse(cx, 128, 226, 84);
  // sand top highlight
  g.fillStyle(0xffe6a8, 1);
  g.fillEllipse(cx, 118, 190, 58);
  // grass tuft
  g.fillStyle(0x2fbf71, 1);
  g.lineStyle(5, 0x1c1230, 1);
  g.fillEllipse(cx - 46, 106, 84, 34);
  g.strokeEllipse(cx - 46, 106, 84, 34);
  // rocks
  g.fillStyle(0x8d8fb0, 1);
  g.fillEllipse(cx + 74, 118, 40, 26);
  g.strokeEllipse(cx + 74, 118, 40, 26);
  g.fillStyle(0xa6a8cc, 1);
  g.fillEllipse(cx + 62, 108, 24, 16);
  // palm trunk
  g.lineStyle(9, 0x1c1230, 1);
  g.beginPath();
  g.moveTo(cx - 40, 104);
  g.lineTo(cx - 52, 44);
  g.strokePath();
  g.lineStyle(5, 0x9a6a3f, 1);
  g.beginPath();
  g.moveTo(cx - 41, 102);
  g.lineTo(cx - 52, 46);
  g.strokePath();
  // palm fronds
  g.fillStyle(0x35d98a, 1);
  g.lineStyle(4, 0x1c1230, 1);
  const fx = cx - 53;
  const fy = 42;
  for (const [dx, dy] of [
    [-38, -6],
    [-24, -24],
    [4, -30],
    [30, -18],
    [38, 2],
  ] as const) {
    g.fillEllipse(fx + dx / 1.6, fy + dy / 1.6, 46, 16);
    g.strokeEllipse(fx + dx / 1.6, fy + dy / 1.6, 46, 16);
  }
  // buried treasure hint: coins poking out of sand
  g.fillStyle(0xffd23e, 1);
  g.lineStyle(3, 0x1c1230, 1);
  g.fillCircle(cx + 26, 128, 9);
  g.strokeCircle(cx + 26, 128, 9);
  g.fillCircle(cx + 42, 132, 7);
  g.strokeCircle(cx + 42, 132, 7);
  g.fillStyle(0xfff3b0, 1);
  g.fillCircle(cx + 24, 126, 3.5);
}

function drawIslandGlow(g: Phaser.GameObjects.Graphics): void {
  // 340 x 220 soft ellipse glow (tinted at runtime)
  for (let i = 8; i >= 1; i--) {
    g.fillStyle(0xffffff, 0.028 * (9 - i));
    g.fillEllipse(170, 110, (300 * i) / 8, (180 * i) / 8);
  }
}

// ------------------------------------------------------------------- ships

function drawShip(g: Phaser.GameObjects.Graphics, opts: { hull: number; sail: number; enemy: boolean }): void {
  // 190 x 170 side-view cartoon ship
  const outline = 0x1c1230;
  // hull
  g.lineStyle(7, outline, 1);
  g.fillStyle(opts.hull, 1);
  g.beginPath();
  g.moveTo(18, 108);
  g.lineTo(176, 108);
  g.lineTo(154, 152);
  g.lineTo(44, 152);
  g.closePath();
  g.fillPath();
  g.strokePath();
  // hull stripe
  g.fillStyle(0xffd23e, 1);
  g.fillRect(24, 112, 146, 9);
  // mast
  g.lineStyle(8, outline, 1);
  g.beginPath();
  g.moveTo(98, 108);
  g.lineTo(98, 16);
  g.strokePath();
  g.lineStyle(4, 0x9a6a3f, 1);
  g.beginPath();
  g.moveTo(98, 106);
  g.lineTo(98, 18);
  g.strokePath();
  // sail (billowing)
  g.fillStyle(opts.sail, 1);
  g.lineStyle(6, outline, 1);
  g.beginPath();
  g.moveTo(98, 22);
  g.lineTo(158, 40);
  g.lineTo(150, 84);
  g.lineTo(98, 96);
  g.closePath();
  g.fillPath();
  g.strokePath();
  if (opts.enemy) {
    // skull emblem on sail
    g.fillStyle(0xffffff, 1);
    g.fillCircle(126, 56, 11);
    g.fillRect(120, 62, 12, 7);
    g.fillStyle(0x1c1230, 1);
    g.fillCircle(122, 54, 3.4);
    g.fillCircle(130, 54, 3.4);
  } else {
    // sun/coin emblem
    g.fillStyle(0xffd23e, 1);
    g.lineStyle(3, outline, 1);
    g.fillCircle(126, 58, 10);
    g.strokeCircle(126, 58, 10);
  }
  // small flag on top
  g.fillStyle(opts.enemy ? 0x2a2440 : 0xff4fd8, 1);
  g.lineStyle(4, outline, 1);
  g.beginPath();
  g.moveTo(98, 16);
  g.lineTo(62, 24);
  g.lineTo(98, 34);
  g.closePath();
  g.fillPath();
  g.strokePath();
  // portholes
  g.fillStyle(0x2ee6ff, 1);
  g.lineStyle(3, outline, 1);
  for (const x of [62, 96, 130]) {
    g.fillCircle(x, 132, 6.5);
    g.strokeCircle(x, 132, 6.5);
  }
}

// ------------------------------------------------------------- coins/chips

function drawCoin(g: Phaser.GameObjects.Graphics): void {
  const c = 24;
  g.lineStyle(4, 0x1c1230, 1);
  g.fillStyle(0xffc93e, 1);
  g.fillCircle(c, c, 20);
  g.strokeCircle(c, c, 20);
  g.fillStyle(0xf0a417, 1);
  g.fillCircle(c, c, 14);
  g.fillStyle(0xffc93e, 1);
  g.fillCircle(c, c, 11);
  // shine
  g.fillStyle(0xfff3b0, 0.95);
  g.fillEllipse(c - 7, c - 8, 10, 6);
}

function drawChip(g: Phaser.GameObjects.Graphics): void {
  const c = 24;
  g.fillStyle(0xff4fd8, 1);
  g.fillCircle(c, c, 20);
  // edge dashes
  g.fillStyle(0xffffff, 1);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    g.slice(c, c, 20, a - 0.22, a + 0.22, false);
    g.fillPath();
  }
  g.lineStyle(4, 0x1c1230, 1);
  g.strokeCircle(c, c, 20);
  g.fillStyle(0x2a1440, 1);
  g.fillCircle(c, c, 12);
  g.lineStyle(2, 0xffffff, 0.9);
  g.strokeCircle(c, c, 12);
  g.fillStyle(0xffd23e, 1);
  g.fillCircle(c, c, 5);
}

function drawChest(g: Phaser.GameObjects.Graphics): void {
  // 100 x 86
  const outline = 0x1c1230;
  g.lineStyle(6, outline, 1);
  // base
  g.fillStyle(0x9a5c2f, 1);
  g.fillRoundedRect(10, 40, 80, 40, 8);
  g.strokeRoundedRect(10, 40, 80, 40, 8);
  // lid
  g.fillStyle(0xb56d38, 1);
  g.fillRoundedRect(8, 18, 84, 30, { tl: 16, tr: 16, bl: 4, br: 4 });
  g.strokeRoundedRect(8, 18, 84, 30, { tl: 16, tr: 16, bl: 4, br: 4 });
  // gold bands
  g.fillStyle(0xffd23e, 1);
  g.fillRect(24, 16, 10, 66);
  g.fillRect(66, 16, 10, 66);
  g.lineStyle(3, outline, 1);
  g.strokeRect(24, 16, 10, 66);
  g.strokeRect(66, 16, 10, 66);
  // lock
  g.fillStyle(0xffd23e, 1);
  g.lineStyle(4, outline, 1);
  g.fillRoundedRect(42, 42, 16, 18, 4);
  g.strokeRoundedRect(42, 42, 16, 18, 4);
  g.fillStyle(outline, 1);
  g.fillCircle(50, 50, 3);
}

function drawCannonball(g: Phaser.GameObjects.Graphics): void {
  const c = 15;
  g.lineStyle(3, 0x000000, 1);
  g.fillStyle(0x2f2f3d, 1);
  g.fillCircle(c, c, 12);
  g.strokeCircle(c, c, 12);
  g.fillStyle(0x6a6a85, 0.9);
  g.fillEllipse(c - 4, c - 5, 7, 4);
}

function drawSmoke(g: Phaser.GameObjects.Graphics): void {
  const c = 36;
  for (const [dx, dy, r, col, a] of [
    [-12, 6, 18, 0x9aa3c0, 0.9],
    [12, 8, 15, 0x848daa, 0.9],
    [0, -8, 20, 0xb9c1dd, 0.95],
    [-4, 2, 14, 0xd4daf0, 0.9],
  ] as const) {
    g.fillStyle(col, a);
    g.fillCircle(c + dx, c + dy, r);
  }
}

function drawSpark(g: Phaser.GameObjects.Graphics): void {
  const c = 12;
  g.fillStyle(0xffffff, 0.35);
  g.fillCircle(c, c, 11);
  g.fillStyle(0xfff3b0, 0.9);
  g.fillCircle(c, c, 6.5);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(c, c, 3.5);
}

function drawSkull(g: Phaser.GameObjects.Graphics): void {
  const c = 36;
  // crossbones
  g.lineStyle(9, 0xf4f6ff, 1);
  g.beginPath();
  g.moveTo(8, 14);
  g.lineTo(64, 58);
  g.moveTo(64, 14);
  g.lineTo(8, 58);
  g.strokePath();
  // head
  g.lineStyle(4, 0x1c1230, 1);
  g.fillStyle(0xf4f6ff, 1);
  g.fillCircle(c, 30, 20);
  g.strokeCircle(c, 30, 20);
  g.fillRoundedRect(c - 11, 44, 22, 12, 4);
  g.strokeRoundedRect(c - 11, 44, 22, 12, 4);
  // eyes + nose
  g.fillStyle(0x1c1230, 1);
  g.fillCircle(c - 8, 28, 5.5);
  g.fillCircle(c + 8, 28, 5.5);
  g.fillTriangle(c, 36, c - 4, 42, c + 4, 42);
}

// ---------------------------------------------------------------------- UI

function drawLockInButton(g: Phaser.GameObjects.Graphics): void {
  // 300 x 104 chunky slam button
  const outline = 0x1c1230;
  g.fillStyle(0x000000, 0.35);
  g.fillRoundedRect(8, 14, 288, 90, 26);
  g.lineStyle(7, outline, 1);
  g.fillStyle(0xb3122e, 1);
  g.fillRoundedRect(4, 4, 292, 92, 26);
  g.strokeRoundedRect(4, 4, 292, 92, 26);
  g.fillStyle(0xe6213f, 1);
  g.fillRoundedRect(12, 10, 276, 62, 20);
  // gloss
  g.fillStyle(0xff7385, 0.85);
  g.fillRoundedRect(22, 16, 256, 22, 12);
  // gold rivets
  g.fillStyle(0xffd23e, 1);
  g.lineStyle(3, outline, 1);
  for (const x of [26, 274]) {
    g.fillCircle(x, 50, 7);
    g.strokeCircle(x, 50, 7);
  }
}

function drawPlaque(g: Phaser.GameObjects.Graphics): void {
  // 264 x 72 wooden answer plaque with gold border
  const outline = 0x1c1230;
  g.fillStyle(0x000000, 0.4);
  g.fillRoundedRect(6, 10, 254, 62, 14);
  g.lineStyle(5, outline, 1);
  g.fillStyle(0x123252, 0.97);
  g.fillRoundedRect(2, 2, 258, 66, 14);
  g.strokeRoundedRect(2, 2, 258, 66, 14);
  g.lineStyle(3, 0xffd23e, 0.9);
  g.strokeRoundedRect(8, 8, 246, 54, 10);
}

function drawReticle(g: Phaser.GameObjects.Graphics): void {
  const c = 40;
  g.lineStyle(6, 0xff2244, 1);
  g.strokeCircle(c, c, 28);
  g.lineStyle(4, 0xff2244, 1);
  g.strokeCircle(c, c, 14);
  g.lineStyle(5, 0xff2244, 1);
  for (const [x1, y1, x2, y2] of [
    [c, 2, c, 18],
    [c, 62, c, 78],
    [2, c, 18, c],
    [62, c, 78, c],
  ] as const) {
    g.beginPath();
    g.moveTo(x1, y1);
    g.lineTo(x2, y2);
    g.strokePath();
  }
}

// -------------------------------------------------------------- characters

function drawAvatar(g: Phaser.GameObjects.Graphics, color: number, variant: number): void {
  // 100 x 100 medallion pirate portrait
  const c = 50;
  const outline = 0x1c1230;
  // medallion ring
  g.lineStyle(6, outline, 1);
  g.fillStyle(color, 1);
  g.fillCircle(c, c, 46);
  g.strokeCircle(c, c, 46);
  g.fillStyle(0x0d1b33, 1);
  g.fillCircle(c, c, 37);
  // face
  const skins = [0xf2c48d, 0xd9a066, 0xb07945, 0xf2c48d];
  g.fillStyle(skins[variant % skins.length], 1);
  g.lineStyle(4, outline, 1);
  g.fillCircle(c, c + 5, 26);
  g.strokeCircle(c, c + 5, 26);
  // bandana in player colour
  g.fillStyle(color, 1);
  g.beginPath();
  g.arc(c, c + 4, 26, Math.PI, 0, false);
  g.closePath();
  g.fillPath();
  g.lineStyle(4, outline, 1);
  g.beginPath();
  g.moveTo(c - 26, c + 2);
  g.lineTo(c + 26, c + 2);
  g.strokePath();
  // bandana knot
  g.fillStyle(color, 1);
  g.fillCircle(c + 24, c - 12, 7);
  // eyes / eyepatch (variant flavoured)
  const patchLeft = variant % 2 === 0;
  g.fillStyle(0x1c1230, 1);
  if (variant % 3 === 0) {
    // eyepatch
    const px = patchLeft ? c - 10 : c + 10;
    g.fillCircle(px, c + 6, 8);
    g.lineStyle(3, outline, 1);
    g.beginPath();
    g.moveTo(c - 24, c + (patchLeft ? 0 : 8));
    g.lineTo(c + 24, c + (patchLeft ? 8 : 0));
    g.strokePath();
    g.fillCircle(patchLeft ? c + 10 : c - 10, c + 6, 4);
  } else {
    g.fillCircle(c - 10, c + 6, 4);
    g.fillCircle(c + 10, c + 6, 4);
  }
  // smirk
  g.lineStyle(3.5, outline, 1);
  g.beginPath();
  g.arc(c + (variant % 2 === 0 ? 2 : -2), c + 16, 9, 0.15 * Math.PI, 0.85 * Math.PI, false);
  g.strokePath();
  // gold earring
  g.lineStyle(3, 0xffd23e, 1);
  g.strokeCircle(patchLeft ? c + 25 : c - 25, c + 14, 5);
}

function drawFlag(g: Phaser.GameObjects.Graphics, color: number): void {
  // 44 x 58 confidence flag
  const outline = 0x1c1230;
  g.lineStyle(5, outline, 1);
  g.beginPath();
  g.moveTo(8, 4);
  g.lineTo(8, 54);
  g.strokePath();
  g.fillStyle(color, 1);
  g.lineStyle(4, outline, 1);
  g.beginPath();
  g.moveTo(10, 6);
  g.lineTo(40, 14);
  g.lineTo(10, 24);
  g.closePath();
  g.fillPath();
  g.strokePath();
}

function drawEmote(g: Phaser.GameObjects.Graphics, emote: string): void {
  // 44 x 44 bubble icon
  const c = 22;
  const outline = 0x1c1230;
  g.lineStyle(4, outline, 1);
  g.fillStyle(0xfffbe8, 1);
  g.fillCircle(c, c, 19);
  g.strokeCircle(c, c, 19);
  switch (emote) {
    case "happy":
      g.fillStyle(outline, 1);
      g.fillCircle(c - 7, c - 4, 3);
      g.fillCircle(c + 7, c - 4, 3);
      g.lineStyle(3.5, outline, 1);
      g.beginPath();
      g.arc(c, c + 3, 9, 0.1 * Math.PI, 0.9 * Math.PI, false);
      g.strokePath();
      break;
    case "shocked":
      g.fillStyle(outline, 1);
      g.fillCircle(c - 7, c - 5, 3.5);
      g.fillCircle(c + 7, c - 5, 3.5);
      g.lineStyle(4, outline, 1);
      g.strokeCircle(c, c + 8, 5.5);
      break;
    case "angry":
      g.lineStyle(4, 0xc22030, 1);
      g.beginPath();
      g.moveTo(c - 12, c - 9);
      g.lineTo(c - 3, c - 4);
      g.moveTo(c + 12, c - 9);
      g.lineTo(c + 3, c - 4);
      g.strokePath();
      g.fillStyle(outline, 1);
      g.fillCircle(c - 7, c - 1, 3);
      g.fillCircle(c + 7, c - 1, 3);
      g.lineStyle(4, outline, 1);
      g.beginPath();
      g.arc(c, c + 13, 7, 1.15 * Math.PI, 1.85 * Math.PI, false);
      g.strokePath();
      break;
    case "scared":
      g.fillStyle(outline, 1);
      g.fillCircle(c - 7, c - 4, 3.5);
      g.fillCircle(c + 7, c - 4, 3.5);
      g.fillStyle(0x2ee6ff, 1);
      g.fillEllipse(c + 12, c - 12, 6, 9);
      g.lineStyle(3.5, outline, 1);
      g.beginPath();
      g.moveTo(c - 6, c + 9);
      g.lineTo(c - 2, c + 6);
      g.lineTo(c + 2, c + 9);
      g.lineTo(c + 6, c + 6);
      g.strokePath();
      break;
    case "winner":
      g.fillStyle(0xffd23e, 1);
      g.lineStyle(3.5, outline, 1);
      g.beginPath();
      g.moveTo(c - 12, c + 4);
      g.lineTo(c - 12, c - 8);
      g.lineTo(c - 6, c - 2);
      g.lineTo(c, c - 10);
      g.lineTo(c + 6, c - 2);
      g.lineTo(c + 12, c - 8);
      g.lineTo(c + 12, c + 4);
      g.closePath();
      g.fillPath();
      g.strokePath();
      g.fillStyle(outline, 1);
      g.fillCircle(c - 6, c + 12, 2.5);
      g.fillCircle(c + 6, c + 12, 2.5);
      break;
    case "locked":
    default:
      g.fillStyle(0xffd23e, 1);
      g.lineStyle(3.5, outline, 1);
      g.fillRoundedRect(c - 9, c - 2, 18, 14, 4);
      g.strokeRoundedRect(c - 9, c - 2, 18, 14, 4);
      g.lineStyle(4, outline, 1);
      g.beginPath();
      g.arc(c, c - 4, 6, Math.PI, 0, false);
      g.strokePath();
      break;
  }
}

// ----------------------------------------------------------------- exports

export function generateAllTextures(scene: Phaser.Scene): void {
  makeTexture(scene, PROC.oceanBg, 1280, 720, drawOcean);
  makeTexture(scene, PROC.waveLayer, 512, 96, drawWaveLayer);
  makeTexture(scene, PROC.fog, 420, 140, drawFog);
  makeTexture(scene, PROC.moon, 160, 160, drawMoon);
  makeTexture(scene, PROC.glowSoft, 128, 128, drawGlowSoft);
  makeTexture(scene, PROC.island, 280, 190, drawIsland);
  makeTexture(scene, PROC.islandGlow, 340, 220, drawIslandGlow);
  makeTexture(scene, PROC.shipPlayer, 190, 170, (g) => drawShip(g, { hull: 0x8a4b2a, sail: 0xfff3d6, enemy: false }));
  makeTexture(scene, PROC.shipEnemy, 190, 170, (g) => drawShip(g, { hull: 0x2c2440, sail: 0x574a77, enemy: true }));
  makeTexture(scene, PROC.coin, 48, 48, drawCoin);
  makeTexture(scene, PROC.chip, 48, 48, drawChip);
  makeTexture(scene, PROC.chest, 100, 86, drawChest);
  makeTexture(scene, PROC.cannonball, 30, 30, drawCannonball);
  makeTexture(scene, PROC.smoke, 72, 72, drawSmoke);
  makeTexture(scene, PROC.spark, 24, 24, drawSpark);
  makeTexture(scene, PROC.skull, 72, 72, drawSkull);
  makeTexture(scene, PROC.lockInButton, 300, 108, drawLockInButton);
  makeTexture(scene, PROC.plaque, 264, 72, drawPlaque);
  makeTexture(scene, PROC.reticle, 80, 80, drawReticle);

  PLAYER_COLORS.forEach((color, i) => {
    makeTexture(scene, avatarKey(i), 100, 100, (g) => drawAvatar(g, color, i));
    makeTexture(scene, flagKey(i), 44, 58, (g) => drawFlag(g, color));
  });

  for (const emote of ["happy", "shocked", "angry", "scared", "winner", "locked"] as const) {
    makeTexture(scene, emoteKey(emote), 44, 44, (g) => drawEmote(g, emote));
  }
}
