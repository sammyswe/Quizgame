/**
 * Headless playtest: chest spin → explode, plus sail corridor smoke check.
 * Usage: node scripts/playtest-chest.mjs
 */
import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outDir = "/opt/cursor/artifacts/screenshots";
fs.mkdirSync(outDir, { recursive: true });

const mime = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".mp4": "video/mp4",
  ".json": "application/json",
};

const server = http.createServer((req, res) => {
  let url = decodeURIComponent((req.url || "/").split("?")[0]);
  if (url === "/") url = "/index.html";
  const fp = path.join(root, url.replace(/^\//, ""));
  if (!fp.startsWith(root) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) {
    res.writeHead(404); res.end("missing"); return;
  }
  res.writeHead(200, { "Content-Type": mime[path.extname(fp)] || "application/octet-stream" });
  fs.createReadStream(fp).pipe(res);
});

await new Promise((r) => server.listen(8765, "127.0.0.1", r));
const base = "http://127.0.0.1:8765";

const puppeteer = await import("puppeteer-core").catch(() => null);
if (!puppeteer) {
  console.error("puppeteer-core missing — installing…");
  await new Promise((resolve, reject) => {
    const p = spawn("npm", ["install", "--no-save", "puppeteer-core"], { cwd: root, stdio: "inherit" });
    p.on("exit", (c) => (c === 0 ? resolve() : reject(new Error("npm install failed"))));
  });
}
const { default: launch } = await import("puppeteer-core");

const browser = await launch.launch({
  executablePath: "/usr/local/bin/google-chrome",
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu", "--window-size=390,844"],
  defaultViewport: { width: 390, height: 844, deviceScaleFactor: 2 },
});

const page = await browser.newPage();
await page.goto(`${base}/index.html?chestTest=1&sailDebug=1&room=ptest`, { waitUntil: "networkidle0", timeout: 60000 });
await page.waitForSelector("#worldFx.on", { timeout: 8000 });
await page.screenshot({ path: path.join(outDir, "chest-spin.png") });

// Tap the chest several times
const box = await page.$eval("#worldFx", (el) => {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
});
for (let i = 0; i < 10; i++) {
  await page.mouse.click(box.x, box.y);
  await new Promise((r) => setTimeout(r, 120));
}
await page.waitForFunction(() => document.getElementById("worldFx").classList.contains("exploding"), { timeout: 5000 });
await page.screenshot({ path: path.join(outDir, "chest-explode.png") });
await new Promise((r) => setTimeout(r, 900));
await page.screenshot({ path: path.join(outDir, "chest-after.png") });

// Sail corridor: inject a path and screenshot
await page.goto(`${base}/index.html?sailDebug=1&room=sail`, { waitUntil: "networkidle0", timeout: 60000 });
await page.waitForSelector("#nickModal");
await page.click("#nickBot");
await new Promise((r) => setTimeout(r, 1500));
await page.screenshot({ path: path.join(outDir, "sail-corridor.png") });

const fxOn = fs.existsSync(path.join(outDir, "chest-spin.png"));
const fxBoom = fs.existsSync(path.join(outDir, "chest-explode.png"));
console.log(JSON.stringify({ ok: fxOn && fxBoom, shots: ["chest-spin.png", "chest-explode.png", "chest-after.png", "sail-corridor.png"] }));

await browser.close();
server.close();
process.exit(fxOn && fxBoom ? 0 : 1);
