#!/usr/bin/env node
/**
 * Fire Higgsfield nano_banana_pro jobs for the multi-scene voyage pack.
 * Usage: node scripts/gen-scene-pack.mjs
 */
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const rawDir = path.join(root, "raw");
const STYLE =
  "Treasure Trap, a 2–8 player cartoon pirate party quiz. Premium 2D mobile arcade game art, adventurous storybook pirate excursion across tropical seas, warm daylight colour, expressive chunky shapes, thick dark outlines, glossy highlights, readable silhouettes at phone size, playful Brawl Stars-style energy, funny and dramatic but suitable for ages 9+, no text, no logos, no photorealism. Warm flat vector cartoon with soft gradients and glossy highlights. Chunky Brawl Stars proportions with Disney-TV warmth and moderate dark-brown comic outlines. High contrast readable silhouettes at phone size, consistent three-quarter diorama voyage perspective.";

const jobs = [
  // --- 10 voyage scenes (9:16) — painted water channel in centre, no ships ---
  {
    key: "scene-00",
    ar: "9:16",
    out: "raw/scenes/scene-00.png",
    prompt: `Full-bleed vertical mobile game backdrop of a sparkling emerald tropical lagoon. Wide clear turquoise water CHANNEL running vertically through the exact centre for ships to sail. Sandy palm islands clustered lower-left and upper-right only. Coral accents, soft golden-hour sky, birds tiny in distance. Empty water in the middle — no boats, no UI, no text, no characters. Beautifully composed, aesthetic storybook paradise. ${STYLE}`,
  },
  {
    key: "scene-01",
    ar: "9:16",
    out: "raw/scenes/scene-01.png",
    prompt: `Full-bleed vertical mobile game backdrop of a volcanic sunset archipelago. Magenta-orange sky, smoking volcano on the far right horizon. Centre vertical water channel stays open and deep teal for sailing. Black-sand beaches and jagged rocks on the sides only. Dramatic but warm and beautiful, no ships, no UI, no text. ${STYLE}`,
  },
  {
    key: "scene-02",
    ar: "9:16",
    out: "raw/scenes/scene-02.png",
    prompt: `Full-bleed vertical mobile game backdrop of a moonlit pirate cove. Soft indigo sky, huge cream moon, gentle bioluminescent sparkles on a clear centre water channel. Cliff caves and hanging lanterns on left and right shores only. Magical aesthetic night voyage, no ships, no UI, no text. ${STYLE}`,
  },
  {
    key: "scene-03",
    ar: "9:16",
    out: "raw/scenes/scene-03.png",
    prompt: `Full-bleed vertical mobile game backdrop of a coral cathedral sea. Crystal cyan water channel centred vertically. Towering pink and orange coral arches framing left and right edges. Tiny tropical fish silhouettes underwater. Bright joyful aesthetic, no ships, no UI, no text. ${STYLE}`,
  },
  {
    key: "scene-04",
    ar: "9:16",
    out: "raw/scenes/scene-04.png",
    prompt: `Full-bleed vertical mobile game backdrop of misty mangrove waterways. Soft green mist, twisted mangrove trees on both side banks, open calm water channel straight down the middle. Warm filtered sunlight, fireflies, poetic and beautiful. No ships, no UI, no text. ${STYLE}`,
  },
  {
    key: "scene-05",
    ar: "9:16",
    out: "raw/scenes/scene-05.png",
    prompt: `Full-bleed vertical mobile game backdrop of golden sandbar islands at midday. Bright azure centre water channel. Crescent sandbars and tiny palm tufts arranged asymmetrically on left then right. White seabirds, glittery waves, clean aesthetic postcard look. No ships, no UI, no text. ${STYLE}`,
  },
  {
    key: "scene-06",
    ar: "9:16",
    out: "raw/scenes/scene-06.png",
    prompt: `Full-bleed vertical mobile game backdrop of a dramatic but beautiful storm-break sea. Purple-grey clouds parting to a silver sunbeam on a clear centre water channel. Rocky spires on the outer edges only. Moody cinematic aesthetic, still cartoon-warm, no ships, no UI, no text. ${STYLE}`,
  },
  {
    key: "scene-07",
    ar: "9:16",
    out: "raw/scenes/scene-07.png",
    prompt: `Full-bleed vertical mobile game backdrop of a crystal ice-blue fantasy atoll (tropical-arctic mashup). Pale turquoise centre channel, ice-crystal islands and pastel aurora sky. Soft, dreamy, highly aesthetic. No ships, no UI, no text. ${STYLE}`,
  },
  {
    key: "scene-08",
    ar: "9:16",
    out: "raw/scenes/scene-08.png",
    prompt: `Full-bleed vertical mobile game backdrop of a jungle river mouth opening to the sea. Lush green canopy and waterfalls on the upper sides, open teal sailing channel in the centre leading to bright horizon. Rich botanical detail, beautiful composition. No ships, no UI, no text. ${STYLE}`,
  },
  {
    key: "scene-09",
    ar: "9:16",
    out: "raw/scenes/scene-09.png",
    prompt: `Full-bleed vertical mobile game backdrop of a lantern-lit treasure archipelago at dusk. Floating paper lanterns, warm amber glow on water, clear centre sailing channel, whimsical islets with treasure chests on the side shores only. Romantic aesthetic festival mood. No ships, no UI, no text. ${STYLE}`,
  },
  // --- Loot Drop rooms ---
  {
    key: "below-deck",
    ar: "9:16",
    out: "raw/scenes/below-deck.png",
    prompt: `Full-bleed vertical mobile game scene looking along the BELOW-DECK cabin of a wooden pirate ship. Warm lantern light, oak beams, brass fittings, maps and charts on a big table in the foreground, portholes showing ocean glow. Inviting cosy aesthetic interior for allocating treasure. Empty of people and ships. No UI, no text, no readable writing on maps. ${STYLE}`,
  },
  {
    key: "loot-voyage",
    ar: "9:16",
    out: "raw/scenes/loot-voyage.png",
    prompt: `Full-bleed vertical mobile game backdrop of a wide open ceremonial sailing bay at golden hour. Broad clear centre water for MANY small ships to sail toward four distant treasure islands arranged in a wide arc on the horizon. Epic aesthetic reveal stage. No ships painted in yet, no UI, no text. ${STYLE}`,
  },
  // --- Island packs (green key) ---
  {
    key: "islands-pack-a",
    ar: "1:1",
    out: "raw/islands/pack-a.png",
    prompt: `2x2 sprite sheet of four distinct cartoon pirate answer islands, each in its own quadrant with clear spacing. Palm cove, rocky skull, jungle ruin, crystal spire. Each island floating alone. Plain solid bright green background #00FF00 for cutout. No text, no UI, thick outlines, phone-readable. ${STYLE}`,
  },
  {
    key: "islands-pack-b",
    ar: "1:1",
    out: "raw/islands/pack-b.png",
    prompt: `2x2 sprite sheet of four distinct cartoon pirate answer islands: volcanic crater, frozen iceberg islet, mangrove stump, sandbar with chest. Clear spacing between quadrants. Plain solid bright green background #00FF00 for cutout. No text, no UI. ${STYLE}`,
  },
  {
    key: "islands-pack-c",
    ar: "1:1",
    out: "raw/islands/pack-c.png",
    prompt: `2x2 sprite sheet of four distinct cartoon pirate answer islands: lighthouse rock, bamboo pier, mushroom fantasy isle, bone reef. Clear spacing. Plain solid bright green background #00FF00 for cutout. No text, no UI. ${STYLE}`,
  },
  {
    key: "islands-pack-d",
    ar: "1:1",
    out: "raw/islands/pack-d.png",
    prompt: `2x2 sprite sheet of four distinct cartoon pirate answer islands: waterfall cliff, desert mesa, cherry blossom isle, shipwreck reef. Clear spacing. Plain solid bright green background #00FF00 for cutout. No text, no UI. ${STYLE}`,
  },
  // --- Ship sheets: 16 facing directions, blank hull plaque for names ---
  {
    key: "ship-0-16",
    ar: "1:1",
    out: "raw/ships/ship-0-16.png",
    prompt: `4x4 sprite sheet of ONE red-sailed cartoon pirate ship shown in 16 evenly spaced facing directions (full 360° turn), each cell clear spacing. Ship only, NO water wake under hull, NO ocean. Flat blank wooden hull panel on the side for a nameplate. Plain solid bright green background #00FF00. Thick outlines, glossy, phone-readable. No text. ${STYLE}`,
  },
  {
    key: "ship-1-16",
    ar: "1:1",
    out: "raw/ships/ship-1-16.png",
    prompt: `4x4 sprite sheet of ONE blue-sailed cartoon pirate ship shown in 16 evenly spaced facing directions (full 360° turn), each cell clear spacing. Ship only, NO water wake under hull, NO ocean. Flat blank wooden hull panel on the side for a nameplate. Plain solid bright green background #00FF00. Thick outlines, glossy, phone-readable. No text. ${STYLE}`,
  },
  {
    key: "ship-2-16",
    ar: "1:1",
    out: "raw/ships/ship-2-16.png",
    prompt: `4x4 sprite sheet of ONE green-sailed cartoon pirate ship shown in 16 evenly spaced facing directions (full 360° turn), each cell clear spacing. Ship only, NO water wake under hull, NO ocean. Flat blank wooden hull panel on the side for a nameplate. Plain solid bright green background #00FF00. Thick outlines, glossy, phone-readable. No text. ${STYLE}`,
  },
  {
    key: "ship-3-16",
    ar: "1:1",
    out: "raw/ships/ship-3-16.png",
    prompt: `4x4 sprite sheet of ONE gold-sailed cartoon pirate ship shown in 16 evenly spaced facing directions (full 360° turn), each cell clear spacing. Ship only, NO water wake under hull, NO ocean. Flat blank wooden hull panel on the side for a nameplate. Plain solid bright green background #00FF00. Thick outlines, glossy, phone-readable. No text. ${STYLE}`,
  },
];

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
    let out = "", err = "";
    p.stdout.on("data", (d) => (out += d));
    p.stderr.on("data", (d) => (err += d));
    p.on("exit", (code) => {
      if (code !== 0) reject(new Error(err || out || `exit ${code}`));
      else resolve(out);
    });
  });
}

async function createJob(job) {
  const args = [
    "generate", "create", "nano_banana_pro",
    "--prompt", job.prompt,
    "--aspect_ratio", job.ar,
    "--resolution", "2k",
    "--json",
  ];
  const out = await run("higgsfield", args);
  const j = JSON.parse(out);
  const id = Array.isArray(j) ? j[0] : (j.id || j.job_id || j.jobId);
  if (!id) throw new Error("no job id: " + out.slice(0, 200));
  console.log("created", job.key, id);
  return { ...job, id };
}

async function waitAndDownload(job) {
  const out = await run("higgsfield", ["generate", "wait", job.id, "--json", "--timeout", "15m"]);
  const j = JSON.parse(out);
  const url =
    j.url ||
    j.result_url ||
    (j.urls && j.urls[0]) ||
    (j.images && j.images[0] && (j.images[0].url || j.images[0])) ||
    (j.results && j.results[0] && (j.results[0].url || j.results[0]));
  if (!url) {
    console.error("no url for", job.key, JSON.stringify(j).slice(0, 400));
    return { ...job, ok: false };
  }
  const dest = path.join(root, job.out);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  await run("curl", ["-fsSL", url, "-o", dest]);
  console.log("saved", job.key, dest);
  return { ...job, ok: true, url, id: job.id };
}

const manifestPath = path.join(root, "design", "scene-pack-jobs.json");

async function main() {
  fs.mkdirSync(rawDir, { recursive: true });
  // Create all jobs first (parallel, limited concurrency)
  const created = [];
  const queue = [...jobs];
  const workers = 4;
  async function worker() {
    while (queue.length) {
      const job = queue.shift();
      try {
        created.push(await createJob(job));
      } catch (e) {
        console.error("create fail", job.key, e.message);
      }
    }
  }
  await Promise.all(Array.from({ length: workers }, () => worker()));
  fs.writeFileSync(manifestPath, JSON.stringify(created, null, 2));
  console.log("waiting", created.length, "jobs…");
  const done = [];
  const wq = [...created];
  async function waiter() {
    while (wq.length) {
      const job = wq.shift();
      try {
        done.push(await waitAndDownload(job));
      } catch (e) {
        console.error("wait fail", job.key, e.message);
        done.push({ ...job, ok: false, error: e.message });
      }
    }
  }
  await Promise.all(Array.from({ length: 6 }, () => waiter()));
  fs.writeFileSync(manifestPath, JSON.stringify(done, null, 2));
  console.log("DONE ok=", done.filter((d) => d.ok).length, "/", done.length);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
