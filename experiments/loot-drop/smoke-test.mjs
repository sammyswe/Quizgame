/**
 * Two-player end-to-end smoke test for the Loot Drop vertical slice.
 * Boots two headless browsers, creates/joins a room, starts the game,
 * allocates loot by clicking islands, locks in, and screenshots the reveal.
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:5173";
const OUT = "/tmp/shots";
mkdirSync(OUT, { recursive: true });

const ISLANDS = [
  [330, 240],
  [950, 240],
  [330, 470],
  [950, 470],
];
const LOCK_BTN = [1078, 648];

async function clickCanvas(page, x, y) {
  const canvas = page.locator("canvas");
  await canvas.click({ position: { x, y }, force: true });
}

const browser = await chromium.launch();
const ctxA = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const ctxB = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const host = await ctxA.newPage();
const friend = await ctxB.newPage();

host.on("pageerror", (e) => console.log("[host pageerror]", e.message));
friend.on("pageerror", (e) => console.log("[friend pageerror]", e.message));
host.on("console", (m) => m.type() === "error" && console.log("[host console]", m.text()));

// --- host creates room
await host.goto(BASE);
await host.fill(".field", "HostPirate");
await host.click("text=CREATE ROOM");
await host.waitForSelector(".room-code");
const code = (await host.textContent(".room-code")).trim();
console.log("room code:", code);
await host.screenshot({ path: `${OUT}/01-lobby-host.png` });

// --- friend joins
await friend.goto(BASE);
await friend.fill(".field", "FriendPirate");
await friend.fill(".field-code", code);
await friend.click(".btn-cyan");
await friend.waitForSelector(".room-code");
console.log("friend joined");

// --- host starts
await host.click("text=START LOOT DROP");
await host.waitForSelector("canvas", { timeout: 15000 });
await friend.waitForSelector("canvas", { timeout: 15000 });
console.log("game scene mounted on both");
await host.waitForTimeout(3500);
await host.screenshot({ path: `${OUT}/02-scene-host.png` });
await friend.screenshot({ path: `${OUT}/03-scene-friend.png` });

// --- host allocates: 40 on A, 30 on B, 30 on C (tap = +10)
for (const [i, n] of [[0, 4], [1, 3], [2, 3]]) {
  for (let k = 0; k < n; k++) {
    await clickCanvas(host, ...ISLANDS[i]);
    await host.waitForTimeout(180);
  }
}
await host.waitForTimeout(800);
await host.screenshot({ path: `${OUT}/04-allocated-host.png` });

// --- friend allocates 100 on island D
for (let k = 0; k < 10; k++) {
  await clickCanvas(friend, ...ISLANDS[3]);
  await friend.waitForTimeout(150);
}
await friend.waitForTimeout(600);

// --- both lock in
await clickCanvas(host, ...LOCK_BTN);
await host.waitForTimeout(400);
await host.screenshot({ path: `${OUT}/05-locked-host.png` });
await clickCanvas(friend, ...LOCK_BTN);
console.log("both locked in; reveal should start");

// --- capture the reveal sequence
await host.waitForTimeout(3000);
await host.screenshot({ path: `${OUT}/06-reveal-gold.png` });
await host.waitForTimeout(2500);
await host.screenshot({ path: `${OUT}/07-reveal-ships.png` });
await host.waitForTimeout(2000);
await host.screenshot({ path: `${OUT}/08-reveal-plunder.png` });
await host.waitForTimeout(3500);
await host.screenshot({ path: `${OUT}/09-reveal-payout.png` });
await host.waitForTimeout(1500);
await host.screenshot({ path: `${OUT}/10-leaderboard.png` });
await friend.screenshot({ path: `${OUT}/11-leaderboard-friend.png` });

// --- wait for next question
await host.waitForTimeout(6000);
await host.screenshot({ path: `${OUT}/12-next-question.png` });

console.log("smoke test finished");
await browser.close();
