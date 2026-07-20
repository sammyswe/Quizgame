#!/usr/bin/env node
/**
 * Generate 40 reveal cutscenes (10 scenes × 4 correct islands).
 * Seedance 1.5 image-to-video from baked bg, ~4s source played as ~2s in-game.
 *
 * Usage:
 *   node scripts/gen-reveal-cutscenes.mjs              # queue missing
 *   node scripts/gen-reveal-cutscenes.mjs --wait        # wait + download
 *   node scripts/gen-reveal-cutscenes.mjs --only S00:A  # one clip
 */
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outDir = path.join(root, "assets", "voyage-v2", "reveal");
const jobsPath = path.join(root, "design", "reveal-cutscene-jobs.json");
const STYLE = fs.readFileSync(path.join(root, "design", "STYLE_FORMULA.txt"), "utf8").trim();

const LETTERS = ["A", "B", "C", "D"];
const waitFlag = process.argv.includes("--wait");
const onlyArg = process.argv.find((a) => a.startsWith("--only="))?.slice(7)
  || (process.argv.includes("--only") ? process.argv[process.argv.indexOf("--only") + 1] : null);

const SAD = {
  palm: "wilted palm fronds, grey sad sand, drooping coconuts, quiet dust motes",
  volcano: "cold ash volcano, extinguished crater, thin grey smoke, no lava glow",
  temple: "cracked temple stones, dead braziers, settling dust, no golden light",
  lighthouse: "dark unlit lighthouse lamp, lonely fog, muted colours",
  skull: "skull rock with hollow dark eye sockets, dry dust puff, no treasure glint",
  shipwreck: "sagging torn sail on wreck, dull barnacles, empty melancholy",
  mangrove: "drooping mangrove leaves, muddy still water, grey-green sadness",
  crystal: "dull grey crystal shards with sparkle killed, flat lifeless light",
  iceberg: "soft melting sad iceberg drips, grey-blue cold, no sparkle",
};

const WIN = {
  palm: "palm cove celebrates — bright fronds bounce, warm gold sand sparkle, cheerful tropical light, soft confetti petals",
  volcano: "volcano isle celebrates — warm friendly ember sparkles (not dangerous), happy glow pulse, gold glitter",
  temple: "temple isle celebrates — soft golden god-rays, bright chime sparkles, restored warm stone",
  lighthouse: "lighthouse celebrates — bright warm lamp sweep, joyful sea-spray sparkle",
  skull: "skull rock celebrates — cheeky friendly eye sparkles, playful gold dust (not scary)",
  shipwreck: "shipwreck isle celebrates — sail lifts cheerfully, coin sparkles from hold, warm rescue light",
  mangrove: "mangrove celebrates — leaves perk up, bright water ripples, firefly sparkles",
  crystal: "crystal isle celebrates — brilliant prism rainbow sparkles, joyful shimmer",
  iceberg: "iceberg celebrates — bright crystal ice tingles, friendly cool sparkle (still warm cartoon)",
};

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
    let out = "", err = "";
    p.stdout.on("data", (d) => (out += d));
    p.stderr.on("data", (d) => (err += d));
    p.on("exit", (c) => (c === 0 ? resolve(out) : reject(new Error(err || out || String(c)))));
  });
}

function pickUrl(j) {
  return j.result_url || j.min_result_url || j.url
    || (Array.isArray(j.results) && j.results[0] && (j.results[0].url || j.results[0].result_url))
    || null;
}

function loadLanes() {
  const raw = fs.readFileSync(path.join(root, "assets", "voyage-v2", "lanes.js"), "utf8");
  const m = raw.match(/window\.VOYAGE_LANES\s*=\s*(\[[\s\S]*\]);?/);
  if (!m) throw new Error("lanes parse fail");
  return JSON.parse(m[1]);
}

function promptFor(scene, correctLetter) {
  const biomes = scene.biomes || ["palm", "skull", "shipwreck", "lighthouse"];
  const winIdx = LETTERS.indexOf(correctLetter);
  const winBiome = biomes[winIdx] || "palm";
  const lines = LETTERS.map((L, i) => {
    const b = biomes[i] || "palm";
    if (L === correctLetter) return `Island ${L} (${b}): ${WIN[b] || WIN.palm}`;
    return `Island ${L} (${b}): clearly lost / empty — ${SAD[b] || SAD.palm}`;
  });
  return [
    "Treasure Trap mobile quiz reveal cutscene. Exact same camera framing and island layout as the start image — do not recompose, zoom, or move islands.",
    "Animate ONLY the four islands in place for a seamless 2-second game beat. Sea and sky stay locked to the plate.",
    `CORRECT island is ${correctLetter} (${winBiome}): big happy celebration.`,
    "The other three islands show sad empty disappointment simultaneously in the same shot.",
    ...lines,
    "No ships, no people, no text, no UI, no logos, no photorealism.",
    "Warm Coin Master glossy cartoon pirate excursion. Ages 9+.",
    STYLE,
  ].join(" ");
}

async function createJob(job) {
  const args = [
    "generate", "create", "seedance1_5",
    "--prompt", job.prompt,
    "--duration", "4",
    "--aspect_ratio", "9:16",
    "--resolution", "720p",
    "--generate_audio", "false",
    "--start_image", job.startImage,
    "--json",
  ];
  const out = await run("higgsfield", args);
  const j = JSON.parse(out);
  const id = Array.isArray(j) ? j[0] : j.id;
  if (!id) throw new Error("no id " + out.slice(0, 160));
  console.log("created", job.key, id);
  return { ...job, id };
}

async function waitSave(job) {
  const dest = path.join(root, job.out);
  if (fs.existsSync(dest) && fs.statSync(dest).size > 5000) {
    console.log("have", job.key);
    return { ...job, ok: true, skipped: true };
  }
  const out = await run("higgsfield", ["generate", "wait", job.id, "--json", "--timeout", "20m", "--quiet"]);
  const j = JSON.parse(out);
  const url = pickUrl(j);
  if (!url) throw new Error("no url " + job.key + " " + out.slice(0, 200));
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  await run("curl", ["-fsSL", url, "-o", dest]);
  console.log("saved", job.key, fs.statSync(dest).size);
  return { ...job, ok: true, url };
}

const lanes = loadLanes();
const jobs = [];
for (const scene of lanes) {
  for (const L of LETTERS) {
    const key = `${scene.id}-${L}`;
    if (onlyArg && onlyArg !== key && onlyArg !== `${scene.id}:${L}`) continue;
    jobs.push({
      key,
      sceneId: scene.id,
      letter: L,
      startImage: path.join(root, "assets", "voyage-v2", `bg-${scene.id}.jpg`),
      out: path.join("assets", "voyage-v2", "reveal", `${key}.mp4`),
      prompt: promptFor(scene, L),
    });
  }
}

fs.mkdirSync(outDir, { recursive: true });
let registry = fs.existsSync(jobsPath) ? JSON.parse(fs.readFileSync(jobsPath, "utf8")) : {};

for (const job of jobs) {
  const dest = path.join(root, job.out);
  if (fs.existsSync(dest) && fs.statSync(dest).size > 5000) {
    console.log("skip have", job.key);
    continue;
  }
  if (registry[job.key]?.id && !waitFlag) {
    console.log("queued already", job.key, registry[job.key].id);
    continue;
  }
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      const created = registry[job.key]?.id
        ? { ...job, id: registry[job.key].id }
        : await createJob(job);
      registry[job.key] = {
        id: created.id,
        out: job.out,
        sceneId: job.sceneId,
        letter: job.letter,
        prompt: job.prompt,
        model: "seedance1_5",
        at: new Date().toISOString(),
      };
      fs.writeFileSync(jobsPath, JSON.stringify(registry, null, 2));
      if (waitFlag) await waitSave(created);
      break;
    } catch (e) {
      const msg = String(e.message || e);
      const rate = /rate_limit|concurrent_jobs/i.test(msg);
      console.error("fail", job.key, attempt, msg.slice(0, 160));
      if (!rate || attempt === 5) break;
      await new Promise((r) => setTimeout(r, 15000 + attempt * 5000));
    }
  }
}

console.log("done", Object.keys(registry).length, "registered");
