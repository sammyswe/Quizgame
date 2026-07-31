#!/usr/bin/env node
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const STYLE = fs.readFileSync(path.join(root, "design", "STYLE_FORMULA.txt"), "utf8").trim();
const EX = "Treasure Trap cartoon pirate party quiz. Premium glossy Coin Master-tier 2D mobile arcade art. Ages 9+. No logos, no readable text, no photorealism, no UI chrome.";
function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
    let out = "", err = "";
    p.stdout.on("data", (d) => (out += d));
    p.stderr.on("data", (d) => (err += d));
    p.on("exit", (c) => (c === 0 ? resolve(out) : reject(new Error(err || out || String(c)))));
  });
}
async function create(job) {
  const out = await run("higgsfield", ["generate","create","nano_banana_pro","--prompt",job.prompt,"--aspect_ratio",job.ar,"--resolution","2k","--json"]);
  const j = JSON.parse(out);
  const id = Array.isArray(j) ? j[0] : j.id;
  console.log("created", job.key, id);
  return { ...job, id };
}
function pickUrl(j) { return j.result_url || j.min_result_url || j.url || null; }
async function waitSave(job) {
  const dest = path.join(root, job.out);
  if (fs.existsSync(dest) && fs.statSync(dest).size > 2000) { console.log("have", job.key); return job; }
  const out = await run("higgsfield", ["generate","wait",job.id,"--json","--timeout","15m","--quiet"]);
  const j = JSON.parse(out);
  const url = pickUrl(j);
  if (!url) throw new Error("no url "+job.key);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  await run("curl", ["-fsSL", url, "-o", dest]);
  console.log("saved", job.key, fs.statSync(dest).size);
  return job;
}
const colors = [
  ["0","RED","#e74c3c"],
  ["1","BLUE","#3498db"],
  ["2","GREEN","#2ecc71"],
  ["3","GOLD","#f1c40f"],
];
const jobs = [];
for (const [i, name, hex] of colors) {
  jobs.push({
    key: `ship16-${i}`,
    ar: "1:1",
    out: `raw/voyage-v2/ship16-${i}.png`,
    prompt: `STRICT 4x4 sprite sheet grid with thick dark separators. Exactly ONE cartoon pirate ship per cell. Row-major order clockwise facing directions starting facing RIGHT (east): cell0 east,1 ESE,2 SE,3 SSE,4 south,5 SSW,6 SW,7 WSW,8 west,9 WNW,10 NW,11 NNW,12 north,13 NNE,14 NE,15 ENE. EACH CELL MUST SHOW A DIFFERENT FACING — no duplicates. ${name} sails and flag colour ${hex}. Blank wooden hull name plaque. Ship only, NO ocean, NO wake. Plain solid bright green #00FF00 background. Coin Master gloss, thick outlines, phone-readable. ${EX} ${STYLE}`,
  });
  jobs.push({
    key: `ship-idle-${i}`,
    ar: "1:1",
    out: `raw/voyage-v2/ship-idle-${i}.png`,
    prompt: `2x3 sprite sheet of ONE pirate ship facing southeast, 6 idle animation frames: gentle sail flap and hull bob. ${name} sails ${hex}. Blank hull plaque. Plain solid bright green #00FF00 background. Coin Master gloss. ${EX} ${STYLE}`,
  });
  jobs.push({
    key: `ship-cheer-${i}`,
    ar: "1:1",
    out: `raw/voyage-v2/ship-cheer-${i}.png`,
    prompt: `2x2 sprite sheet pirate ship celebrating: flags up, crew cheering, sparkles. ${name} sails. Green #00FF00 background. Coin Master reward gloss. ${EX} ${STYLE}`,
  });
  jobs.push({
    key: `ship-sad-${i}`,
    ar: "1:1",
    out: `raw/voyage-v2/ship-sad-${i}.png`,
    prompt: `2x2 sprite sheet pirate ship disappointed: sagging sails, sad crew. ${name} sails. Green #00FF00 background. ${EX} ${STYLE}`,
  });
}
// VFX packs
jobs.push({
  key: "vfx-fireworks",
  ar: "1:1",
  out: "raw/voyage-v2/vfx-fireworks.png",
  prompt: `2x2 sprite sheet of cartoon fireworks bursts in warm gold magenta cyan for mobile game celebration. Plain solid dark background #101018 for cutout. Coin Master jackpot energy. ${EX}`,
});
jobs.push({
  key: "vfx-treasure",
  ar: "1:1",
  out: "raw/voyage-v2/vfx-treasure.png",
  prompt: `2x2 sprite sheet coin burst treasure sparkle confetti for mobile game. Plain solid dark #101018 background. Coin Master reward gloss. ${EX}`,
});
jobs.push({
  key: "vfx-wake-foam",
  ar: "1:1",
  out: "raw/voyage-v2/vfx-wake-foam.png",
  prompt: `4x4 sprite sheet white water wake foam ripples for ship travel, transparent-ready. Plain solid bright green #00FF00 background. Stylized cartoon water. ${EX}`,
});
jobs.push({
  key: "ambient-birds",
  ar: "1:1",
  out: "raw/voyage-v2/ambient-birds.png",
  prompt: `2x3 sprite sheet tropical cartoon seabird flap cycle, 6 frames. Plain solid bright green #00FF00. ${EX}`,
});
jobs.push({
  key: "ambient-fish",
  ar: "1:1",
  out: "raw/voyage-v2/ambient-fish.png",
  prompt: `2x2 sprite sheet tiny cartoon tropical fish silhouettes swimming. Green #00FF00 background. ${EX}`,
});
jobs.push({
  key: "island-glow-correct",
  ar: "1:1",
  out: "raw/voyage-v2/island-glow-correct.png",
  prompt: `2x2 magical golden glow ring and firework halo overlays for correct answer island celebration. Dark #101018 background for additive cutout. Coin Master reward. ${EX}`,
});

const created = [];
for (let i=0;i<jobs.length;i+=4) {
  const batch = jobs.slice(i,i+4);
  created.push(...await Promise.all(batch.map(create)));
}
fs.writeFileSync(path.join(root,"design/voyage-v2-ships-jobs.json"), JSON.stringify(created,null,2));
console.log("jobs", created.length);
for (let i=0;i<created.length;i+=4) {
  await Promise.all(created.slice(i,i+4).map(waitSave));
}
console.log("DONE", created.length);
