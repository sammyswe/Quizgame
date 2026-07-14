/**
 * Tests the physical interactions: drag a coin from the pile to an island,
 * right-click removal, and dragging the Fear Shot reticle onto another player.
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:5173";
const OUT = "/tmp/shots";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const host = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
const friend = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
host.on("pageerror", (e) => console.log("[host pageerror]", e.message));

await host.goto(BASE);
await host.fill(".field", "DragTester");
await host.click("text=CREATE ROOM");
await host.waitForSelector(".room-code");
const code = (await host.textContent(".room-code")).trim();

await friend.goto(BASE);
await friend.fill(".field", "Victim");
await friend.fill(".field-code", code);
await friend.click(".btn-cyan");
await friend.waitForSelector(".room-code");

await host.click("text=START LOOT DROP");
await host.waitForSelector("canvas");
await host.waitForTimeout(3000);

const canvas = host.locator("canvas");
const box = await canvas.boundingBox();
const pt = (x, y) => ({ x: box.x + x * (box.width / 1280), y: box.y + y * (box.height / 720) });

// --- drag a coin from the pile (372,648) to island B (950,240)
const pileP = pt(372, 640);
const islandB = pt(950, 240);
await host.mouse.move(pileP.x, pileP.y);
await host.mouse.down();
for (let i = 1; i <= 12; i++) {
  await host.mouse.move(
    pileP.x + ((islandB.x - pileP.x) * i) / 12,
    pileP.y + ((islandB.y - pileP.y) * i) / 12,
  );
  await host.waitForTimeout(30);
}
await host.screenshot({ path: `${OUT}/20-dragging-coin.png` });
await host.mouse.up();
await host.waitForTimeout(800);
await host.screenshot({ path: `${OUT}/21-after-drag-drop.png` });

// --- right-click island B to remove 10
await canvas.click({ position: { x: 950 * (box.width / 1280), y: 240 * (box.height / 720) }, button: "right", force: true });
await host.waitForTimeout(800);
await host.screenshot({ path: `${OUT}/22-after-rightclick-remove.png` });

// --- drag Fear Shot from item slot (500,648) onto Victim avatar (54,208)
const slotP = pt(500, 648);
const victimP = pt(54, 208);
await host.mouse.move(slotP.x, slotP.y);
await host.mouse.down();
for (let i = 1; i <= 14; i++) {
  await host.mouse.move(
    slotP.x + ((victimP.x - slotP.x) * i) / 14,
    slotP.y + ((victimP.y - slotP.y) * i) / 14,
  );
  await host.waitForTimeout(30);
}
await host.screenshot({ path: `${OUT}/23-reticle-on-target.png` });
await host.mouse.up();
await host.waitForTimeout(900);
await host.screenshot({ path: `${OUT}/24-fear-shot-fired.png` });
await friend.screenshot({ path: `${OUT}/25-victim-view-scared.png` });

console.log("interaction test finished");
await browser.close();
