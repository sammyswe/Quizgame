#!/usr/bin/env node
/**
 * Voyage v2 — careful Higgsfield pack (style locks + 10 baked-island seas).
 * CLI create returns ["uuid"]. Downloads via wait.
 */
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const STYLE = fs.readFileSync(path.join(root, "design", "STYLE_FORMULA.txt"), "utf8").trim();
const EX =
  "Treasure Trap cartoon pirate party quiz. Premium glossy Coin Master-tier 2D mobile arcade art, Brawl Stars readable silhouettes, Clash Royale clean travel readability. Ages 9+. No logos, no readable text, no photorealism, no UI chrome.";

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
  const args = [
    "generate", "create", "nano_banana_pro",
    "--prompt", job.prompt,
    "--aspect_ratio", job.ar,
    "--resolution", "2k",
    "--json",
  ];
  const out = await run("higgsfield", args);
  const j = JSON.parse(out);
  const id = Array.isArray(j) ? j[0] : j.id;
  if (!id) throw new Error("no id " + out.slice(0, 120));
  console.log("created", job.key, id);
  return { ...job, id };
}

function pickUrl(j) {
  return j.result_url || j.min_result_url || j.url || null;
}

async function waitSave(job) {
  const dest = path.join(root, job.out);
  if (fs.existsSync(dest) && fs.statSync(dest).size > 2000) {
    console.log("have", job.key);
    return { ...job, ok: true, skipped: true };
  }
  const out = await run("higgsfield", ["generate", "wait", job.id, "--json", "--timeout", "15m", "--quiet"]);
  const j = JSON.parse(out);
  const url = pickUrl(j);
  if (!url) throw new Error("no url " + job.key);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  await run("curl", ["-fsSL", url, "-o", dest]);
  console.log("saved", job.key, fs.statSync(dest).size);
  return { ...job, ok: true, url };
}

const scenes = [
  {
    key: "S00",
    islands: "lower-left palm cove with blank wooden plaque board, upper-right skull rock with blank plaque, lower-right shipwreck isle with blank plaque, upper-left lighthouse rock with blank plaque",
    vibe: "emerald lagoon golden hour, generous open water lanes in a clean plus-shaped channel between the four corner islands",
  },
  {
    key: "S01",
    islands: "upper-right volcano isle with blank plaque, lower-left palm cove blank plaque, upper-left crystal spire isle blank plaque, lower-right mangrove islet blank plaque",
    vibe: "warm volcanic sunset teal water, wide centre fairway for ships",
  },
  {
    key: "S02",
    islands: "lower-left stone temple ruin isle blank plaque, upper-right soft iceberg isle blank plaque, upper-left palm cove blank plaque, lower-right skull rock blank plaque",
    vibe: "bright tropical bay with cool crystal light, open sailing corridors",
  },
  {
    key: "S03",
    islands: "upper-left lighthouse blank plaque, lower-right shipwreck blank plaque, lower-left crystal isle blank plaque, upper-right volcano blank plaque",
    vibe: "midday sparkling sea, postcard gloss, clear fairways",
  },
  {
    key: "S04",
    islands: "lower-left mangrove blank plaque, upper-right temple blank plaque, upper-left palm blank plaque, lower-right iceberg blank plaque",
    vibe: "misty-bright mangrove estuary still mostly open water",
  },
  {
    key: "S05",
    islands: "upper-left skull blank plaque, lower-right lighthouse blank plaque, lower-left shipwreck blank plaque, upper-right crystal blank plaque",
    vibe: "treasure-hunt bay, lantern-warm accents, huge water space",
  },
  {
    key: "S06",
    islands: "lower-left palm blank plaque, upper-right volcano blank plaque, upper-left temple blank plaque, lower-right mangrove blank plaque",
    vibe: "lush green-gold archipelago, wide centre lane",
  },
  {
    key: "S07",
    islands: "upper-left iceberg blank plaque, lower-right crystal blank plaque, lower-left palm blank plaque, upper-right skull blank plaque",
    vibe: "fantasy ice-tropical mashup still warm-lit and glossy",
  },
  {
    key: "S08",
    islands: "lower-left shipwreck blank plaque, upper-right lighthouse blank plaque, upper-left temple blank plaque, lower-right volcano blank plaque",
    vibe: "adventurous reef bay, cinematic but clean lanes",
  },
  {
    key: "S09",
    islands: "four corner islands palm, skull, crystal, lighthouse each with blank plaque, tiny floating lanterns in sky only",
    vibe: "festival dusk archipelago, warm amber sparkles on water, maximum polish",
  },
];

const jobs = [
  {
    key: "lock-water",
    ar: "9:16",
    out: "raw/voyage-v2/lock-water.png",
    prompt: `Full-bleed vertical mobile game WATER PLATE. Composition: about 90 percent sparkling tropical teal ocean filling the frame, only a thin 10 percent warm golden-hour sky band at the very top. EMPTY of islands, rocks, ships, characters, UI, text. Coin Master glossy water with soft specular sparkles and gentle stylized waves. ${EX} ${STYLE}`,
  },
  {
    key: "lock-ship-0",
    ar: "1:1",
    out: "raw/voyage-v2/lock-ship-0.png",
    prompt: `4x4 sprite sheet of ONE hero pirate ship with vivid RED sails and flag, 16 evenly spaced facing directions clockwise starting facing right. Each cell clearly separated. Ship only — NO ocean, NO wake under hull. Flat blank polished wooden plaque panel on the hull for a painted name. Thick outlines, Coin Master gloss, phone-readable. Plain solid bright green #00FF00 background. ${EX} ${STYLE}`,
  },
  {
    key: "lock-ship-1",
    ar: "1:1",
    out: "raw/voyage-v2/lock-ship-1.png",
    prompt: `4x4 sprite sheet of ONE hero pirate ship with vivid BLUE sails and flag, 16 evenly spaced facing directions clockwise starting facing right. Ship only, NO ocean. Blank wooden hull name plaque. Plain solid bright green #00FF00 background. Coin Master gloss. ${EX} ${STYLE}`,
  },
  {
    key: "lock-ship-2",
    ar: "1:1",
    out: "raw/voyage-v2/lock-ship-2.png",
    prompt: `4x4 sprite sheet of ONE hero pirate ship with vivid GREEN sails and flag, 16 evenly spaced facing directions clockwise starting facing right. Ship only, NO ocean. Blank wooden hull name plaque. Plain solid bright green #00FF00 background. Coin Master gloss. ${EX} ${STYLE}`,
  },
  {
    key: "lock-ship-3",
    ar: "1:1",
    out: "raw/voyage-v2/lock-ship-3.png",
    prompt: `4x4 sprite sheet of ONE hero pirate ship with vivid GOLD sails and flag, 16 evenly spaced facing directions clockwise starting facing right. Ship only, NO ocean. Blank wooden hull name plaque. Plain solid bright green #00FF00 background. Coin Master gloss. ${EX} ${STYLE}`,
  },
  {
    key: "lock-wake",
    ar: "1:1",
    out: "raw/voyage-v2/lock-wake.png",
    prompt: `4x4 sprite sheet of stylized cartoon ship wake and foam ripples, white-cyan translucent looks, progressive intensity across frames. Plain solid bright green #00FF00 background. No ships. ${EX} ${STYLE}`,
  },
];

for (const s of scenes) {
  jobs.push({
    key: `bg-${s.key}`,
    ar: "9:16",
    out: `raw/voyage-v2/bg-${s.key}.png`,
    prompt: `Full-bleed vertical mobile game voyage backdrop, TOP-GROSSING glossy Coin Master quality.
CRITICAL COMPOSITION: roughly 90 percent playable sparkling tropical water, only about 10 percent sky at the top.
Bake exactly FOUR substantial answer islands into the scene: ${s.islands}.
Islands together fill about 40 percent of the water area but leave GENEROUS clear sailing lanes — a clean centre fairway and open routes so tiny ships can sail between islands without crossing land.
Each island has a blank empty wooden plaque board (NO letters, NO words) suitable for A/B/C/D labels later.
NO ships, NO characters, NO UI, NO readable text.
Mood: ${s.vibe}.
Warm tropical archipelago, jewel-bright, candy-clear, consistent three-quarter diorama.
${EX} ${STYLE}`,
  });
}

const only = process.argv[2]; // optional filter prefix

async function main() {
  let list = jobs;
  if (only) list = jobs.filter((j) => j.key.startsWith(only) || j.key.includes(only));
  console.log("jobs", list.length);
  const created = [];
  const q = [...list];
  async function worker() {
    while (q.length) {
      const job = q.shift();
      try {
        created.push(await create(job));
      } catch (e) {
        console.error("create fail", job.key, e.message.slice(0, 160));
      }
    }
  }
  await Promise.all(Array.from({ length: 4 }, () => worker()));
  fs.writeFileSync(path.join(root, "design", "voyage-v2-jobs.json"), JSON.stringify(created, null, 2));
  const done = [];
  const wq = [...created];
  async function waiter() {
    while (wq.length) {
      const job = wq.shift();
      try {
        done.push(await waitSave(job));
      } catch (e) {
        console.error("wait fail", job.key, e.message.slice(0, 160));
        done.push({ ...job, ok: false, error: e.message });
      }
    }
  }
  await Promise.all(Array.from({ length: 6 }, () => waiter()));
  fs.writeFileSync(path.join(root, "design", "voyage-v2-jobs.json"), JSON.stringify(done, null, 2));
  console.log("DONE", done.filter((d) => d.ok).length, "/", done.length);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
