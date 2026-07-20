#!/usr/bin/env node
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const STYLE = fs.readFileSync(path.join(root, "design", "STYLE_FORMULA.txt"), "utf8").trim();
const EX = "Treasure Trap cartoon pirate party quiz for ages 9+. Soft friendly cartoony shapes. Premium glossy Coin Master-tier 2D mobile arcade art. No logos, no readable text, no photorealism, no UI chrome, no horror, no gore.";
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
  if (fs.existsSync(dest) && fs.statSync(dest).size > 2000) { console.log("have", job.key); return { ...job, ok: true }; }
  try {
    const out = await run("higgsfield", ["generate","wait",job.id,"--json","--timeout","15m","--quiet"]);
    const j = JSON.parse(out);
    const url = pickUrl(j);
    if (!url) throw new Error("no url "+job.key+" status="+j.status);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    await run("curl", ["-fsSL", url, "-o", dest]);
    console.log("saved", job.key, fs.statSync(dest).size);
    return { ...job, ok: true };
  } catch (e) {
    console.warn("FAIL", job.key, String(e.message || e).slice(0, 180));
    return { ...job, ok: false, error: String(e.message || e) };
  }
}
const biomes = [
  ["palm-cove","friendly palm beach cove island"],
  ["volcano","cute cartoon volcano island with warm lava glow"],
  ["stone-temple","friendly stone temple ruin island"],
  ["lighthouse-rock","friendly lighthouse on a rock island"],
  ["skull-rock","playful cartoon rock shaped like a friendly pirate skull toy, cute not scary, big smile eyes closed"],
  ["shipwreck-isle","friendly shipwreck beach island with chests"],
  ["mangrove-islet","friendly mangrove tree islet"],
  ["crystal-spire","friendly glowing crystal island"],
  ["soft-iceberg","soft rounded iceberg island still tropical-lit"],
  ["lantern-festival-cove","lantern festival cove island warm sparkles"],
];
const jobs = [];
for (const [slug, label] of biomes) {
  const heroOut = `raw/voyage-v2/isl-hero-${slug}.png`;
  const stateOut = `raw/voyage-v2/isl-states-${slug}.png`;
  if (!fs.existsSync(path.join(root, heroOut)) || fs.statSync(path.join(root, heroOut)).size < 2000) {
    jobs.push({
      key: `isl-hero-${slug}`, ar: "1:1", out: heroOut,
      prompt: `Single hero tropical island artwork for mobile kids game, biome: ${label}. About 4x wider than a toy pirate ship silhouette. Blank wooden plaque board. Plain solid bright green #00FF00 background. Coin Master gloss, thick outlines, phone-readable, wholesome. ${EX} ${STYLE}`,
    });
  }
  if (!fs.existsSync(path.join(root, stateOut)) || fs.statSync(path.join(root, stateOut)).size < 2000) {
    jobs.push({
      key: `isl-states-${slug}`, ar: "1:1", out: stateOut,
      prompt: `2x2 sprite sheet of the SAME wholesome ${label} in four states: idle soft rim light, highlight gold glow, correct celebration fireworks glow, wrong dim grey mist. Blank plaque each. Green #00FF00 background. Kids-friendly. ${EX} ${STYLE}`,
    });
  }
}
for (let i=0;i<4;i++) {
  const out = `raw/voyage-v2/sky-plate-${i}.png`;
  if (!fs.existsSync(path.join(root, out)) || fs.statSync(path.join(root, out)).size < 2000) {
    jobs.push({
      key: `sky-plate-${i}`, ar: "9:16", out,
      prompt: `Vertical mobile sky plate only: warm tropical golden-hour sky with soft clouds in top 25 percent, bottom 75 percent plain solid bright green #00FF00 for layering. No islands, no ships, no UI. ${EX} ${STYLE}`,
    });
  }
}
console.log("pending", jobs.length);
const created=[];
for (let i=0;i<jobs.length;i+=3) {
  const batch=jobs.slice(i,i+3);
  const ok=[];
  for (const j of batch) {
    try { ok.push(await create(j)); } catch (e) { console.warn("create fail", j.key, e.message); }
  }
  created.push(...ok);
}
const manifestPath=path.join(root,"design/voyage-v2-islands-jobs.json");
let prev=[]; try { prev=JSON.parse(fs.readFileSync(manifestPath,"utf8")); } catch {}
fs.writeFileSync(manifestPath, JSON.stringify([...prev, ...created], null, 2));
const results=[];
for (let i=0;i<created.length;i+=3) results.push(...await Promise.all(created.slice(i,i+3).map(waitSave)));
console.log("DONE", results.filter(r=>r.ok).length, "/", results.length);
