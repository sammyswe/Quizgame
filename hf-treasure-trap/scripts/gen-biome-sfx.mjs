#!/usr/bin/env node
/**
 * Unique happy SFX per island biome for correct-island reveal.
 * Uses Mirelo text-to-audio (~2s stings).
 */
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outDir = path.join(root, "assets", "voyage-v2", "sfx");
const jobsPath = path.join(root, "design", "biome-sfx-jobs.json");
const waitFlag = process.argv.includes("--wait");

const PROMPTS = {
  palm: "Short happy tropical game sound effect, 1.5 seconds: bright steel-drum sparkle, soft bird chirp, warm cartoon celebration sting, no vocals, mobile game UI quality",
  volcano: "Short happy volcano island game sound, 1.5 seconds: warm friendly rumble bloom then sparkling ember chimes, joyful cartoon celebration, no danger, no vocals",
  temple: "Short happy ancient temple game sound, 1.5 seconds: bright golden chimes ascending with a soft cheerful gong sparkle, cartoon adventure win sting, no vocals",
  lighthouse: "Short happy lighthouse game sound, 1.5 seconds: bright nautical bell then warm horn sparkle, cheerful maritime win sting, cartoon, no vocals",
  skull: "Short happy cheeky skull-rock game sound, 1.5 seconds: playful bone rattle then pirate whistle sparkle, funny cute celebration, ages 9+, no scary, no vocals",
  shipwreck: "Short happy shipwreck treasure game sound, 1.5 seconds: cheerful wood creak then coin jingle cascade, cartoon win sting, no vocals",
  mangrove: "Short happy mangrove island game sound, 1.5 seconds: cute frog plip chorus then bright water splash sparkle, joyful cartoon, no vocals",
  crystal: "Short happy crystal island game sound, 1.5 seconds: crystalline glass chimes ascending rapidly with rainbow sparkle, magical win sting, no vocals",
  iceberg: "Short happy iceberg island game sound, 1.5 seconds: bright ice ting cascade then cool crystal sparkle, still warm cartoon joy, no vocals",
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

fs.mkdirSync(outDir, { recursive: true });
let registry = fs.existsSync(jobsPath) ? JSON.parse(fs.readFileSync(jobsPath, "utf8")) : {};

for (const [biome, prompt] of Object.entries(PROMPTS)) {
  const destRel = path.join("assets", "voyage-v2", "sfx", `win-${biome}.mp3`);
  const dest = path.join(root, destRel);
  if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
    console.log("have", biome);
    continue;
  }
  try {
    let id = registry[biome]?.id;
    if (!id) {
      const out = await run("higgsfield", [
        "generate", "create", "mirelo_text_to_audio",
        "--prompt", prompt,
        "--duration", "2",
        "--json",
      ]);
      const j = JSON.parse(out);
      id = Array.isArray(j) ? j[0] : j.id;
      if (!id) throw new Error("no id " + out.slice(0, 160));
      registry[biome] = { id, out: destRel, prompt, model: "mirelo_text_to_audio", at: new Date().toISOString() };
      fs.writeFileSync(jobsPath, JSON.stringify(registry, null, 2));
      console.log("created", biome, id);
    } else {
      console.log("queued", biome, id);
    }
    if (waitFlag) {
      const out = await run("higgsfield", ["generate", "wait", id, "--json", "--timeout", "10m", "--quiet"]);
      const j = JSON.parse(out);
      const url = pickUrl(j);
      if (!url) throw new Error("no url " + biome);
      await run("curl", ["-fsSL", url, "-o", dest]);
      console.log("saved", biome, fs.statSync(dest).size);
    }
  } catch (e) {
    console.error("fail", biome, e.message);
  }
}

console.log("done sfx registry", Object.keys(registry).length);
