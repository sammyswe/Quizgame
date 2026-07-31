#!/usr/bin/env node
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

// Parsed from gen-scene-pack create responses (CLI returns ["uuid"])
const JOBS = [
  ["scene-00", "a05c67bf-aa5a-4ecb-a28c-f1b8941742cd", "raw/scenes/scene-00.png"],
  ["scene-01", "2bcdd28d-1c2a-434c-a080-c93cb3eccdd0", "raw/scenes/scene-01.png"],
  ["scene-02", "9e153ae2-759d-4937-b687-a632176ca4f7", "raw/scenes/scene-02.png"],
  ["scene-03", "c33b39c6-0a82-4cdc-bd12-4b3af264d476", "raw/scenes/scene-03.png"],
  ["scene-04", "9956b60e-b55f-4c1b-835a-8b4b6dcb61d2", "raw/scenes/scene-04.png"],
  ["scene-05", "96081569-91cd-4a1d-a6b7-786d43d97368", "raw/scenes/scene-05.png"],
  ["scene-06", "8bb44f35-6397-4334-a1ec-c52cee4ca3c8", "raw/scenes/scene-06.png"],
  ["scene-07", "a65bedd5-f11d-4a99-a4e8-1b74e7bfae31", "raw/scenes/scene-07.png"],
  ["scene-08", "b9d47721-6152-4f16-a873-9c0c76005338", "raw/scenes/scene-08.png"],
  ["scene-09", "f514f091-7c3e-46ab-a9a8-379ec7bc2d4f", "raw/scenes/scene-09.png"],
  ["below-deck", "cd3b9d2e-345b-4a3d-b63b-2ad012eace26", "raw/scenes/below-deck.png"],
  ["loot-voyage", "5eed0ecf-89c5-44d9-b0d8-7ac650a59965", "raw/scenes/loot-voyage.png"],
  ["islands-pack-a", "c65c0144-43a1-455b-bbd0-65b9382d67b3", "raw/islands/pack-a.png"],
  ["islands-pack-b", "bc232ab1-0ba0-4085-bdfd-4088e046a235", "raw/islands/pack-b.png"],
  ["islands-pack-c", "27103b8d-13b2-41fe-bb6d-3d5891827d7f", "raw/islands/pack-c.png"],
  ["islands-pack-d", "6700fe53-e6fc-479f-b1ff-a2631fbfdd36", "raw/islands/pack-d.png"],
  ["ship-0-16", "c2f6aeeb-286b-4a1b-b0f5-1b4da3baa221", "raw/ships/ship-0-16.png"],
  ["ship-1-16", "0489da31-5cf5-4022-be4d-38b990e739ee", "raw/ships/ship-1-16.png"],
  ["ship-2-16", "fd9902be-4162-486d-bac9-45affe1de377", "raw/ships/ship-2-16.png"],
  ["ship-3-16", "9e71c804-f13b-4140-836e-a0701c7ad7c2", "raw/ships/ship-3-16.png"],
];

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
    let out = "", err = "";
    p.stdout.on("data", (d) => (out += d));
    p.stderr.on("data", (d) => (err += d));
    p.on("exit", (code) => (code === 0 ? resolve(out) : reject(new Error(err || out || String(code)))));
  });
}

function pickUrl(j) {
  return (
    j.result_url ||
    j.min_result_url ||
    j.url ||
    (Array.isArray(j.results) && j.results[0] && (j.results[0].url || j.results[0])) ||
    (Array.isArray(j.images) && j.images[0] && (j.images[0].url || j.images[0])) ||
    null
  );
}

async function one([key, id, outRel]) {
  const dest = path.join(root, outRel);
  if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
    console.log("have", key);
    return { key, id, ok: true, skipped: true };
  }
  console.log("wait", key, id);
  const out = await run("higgsfield", ["generate", "wait", id, "--json", "--timeout", "15m", "--quiet"]);
  const j = JSON.parse(out);
  const url = pickUrl(j);
  if (!url) {
    console.error("no url", key, JSON.stringify(j).slice(0, 300));
    return { key, id, ok: false };
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  await run("curl", ["-fsSL", url, "-o", dest]);
  console.log("saved", key, dest, fs.statSync(dest).size);
  return { key, id, ok: true, url };
}

async function main() {
  const results = [];
  const q = [...JOBS];
  async function worker() {
    while (q.length) {
      const job = q.shift();
      try {
        results.push(await one(job));
      } catch (e) {
        console.error("fail", job[0], e.message.slice(0, 200));
        results.push({ key: job[0], id: job[1], ok: false, error: e.message });
      }
    }
  }
  await Promise.all(Array.from({ length: 6 }, () => worker()));
  fs.writeFileSync(path.join(root, "design", "scene-pack-jobs.json"), JSON.stringify(results, null, 2));
  console.log("DONE", results.filter((r) => r.ok).length, "/", results.length);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
