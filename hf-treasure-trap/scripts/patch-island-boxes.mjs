#!/usr/bin/env node
/** Add islandBoxes to voyage lane JSON + rebuild lanes.js */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const lanesDir = path.join(root, "design", "lanes");
const LETTERS = ["A", "B", "C", "D"];

const BOX_W = 0.32;
const BOX_H = 0.28;

function boxFor(center, letter) {
  // Keep box above Q&A band; dock edge faces channel (x=0.5)
  const cx = center.x;
  const cy = Math.min(center.y, 0.50);
  const x = Math.max(0.02, Math.min(0.66, cx - BOX_W / 2));
  const y = Math.max(0.04, Math.min(0.40, cy - BOX_H * 0.55));
  return { x, y, w: BOX_W, h: Math.min(BOX_H, 0.56 - y) };
}

function dockOnEdge(box, letter) {
  const towardCenter = letter === "A" || letter === "C" ? 1 : -1; // left isles → right edge
  const midY = box.y + box.h * 0.62;
  const x = towardCenter > 0 ? box.x + box.w + 0.01 : box.x - 0.01;
  return { x: Math.max(0.22, Math.min(0.78, x)), y: Math.min(0.56, midY) };
}

const scenes = [];
for (let i = 0; i < 10; i++) {
  const id = `S${String(i).padStart(2, "0")}`;
  const fp = path.join(lanesDir, `${id}.json`);
  const s = JSON.parse(fs.readFileSync(fp, "utf8"));
  s.islandBoxes = {};
  for (const L of LETTERS) {
    const c = s.islandCenters[L];
    s.islandBoxes[L] = boxFor(c, L);
    // Keep docks on the water edge of the box (ships never enter land box)
    s.docks[L] = dockOnEdge(s.islandBoxes[L], L);
    // Path endpoint = dock
    const path = s.paths[L];
    if (path && path.length) {
      path[path.length - 1] = { ...s.docks[L] };
    }
  }
  // Water / play band for 60/40: sea uses upper 60%
  s.waterTop = 0.06;
  s.waterBot = 0.58;
  s.uiSeaFrac = 0.6;
  s.uiSheetFrac = 0.4;
  fs.writeFileSync(fp, JSON.stringify(s, null, 2) + "\n");
  scenes.push(s);
  console.log(id, "boxes", LETTERS.map((L) => `${L}:${s.islandBoxes[L].x.toFixed(2)},${s.islandBoxes[L].y.toFixed(2)}`).join(" "));
}

const outJs = `window.VOYAGE_LANES = ${JSON.stringify(scenes)};\n`;
fs.writeFileSync(path.join(root, "assets", "voyage-v2", "lanes.js"), outJs);
fs.writeFileSync(path.join(lanesDir, "embedded-scenes.js"), outJs);
console.log("wrote lanes.js + embedded-scenes.js");
