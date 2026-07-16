import { test } from "@playwright/test";

/**
 * Not a test — a screenshot harness for PR/documentation shots.
 * Run: pnpm --filter @treasure-trap/client exec playwright test screenshots --grep @shots
 */
test("capture arcade screens @shots", async ({ browser }) => {
  test.setTimeout(120_000);
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto("/");
  await page.getByRole("button", { name: /start a game/i }).click();
  await page.getByLabel("Nickname").fill("Cap'n Shot");
  await page.getByRole("button", { name: /^⚓ start$/i }).click();
  await page.getByRole("button", { name: /room code/i }).waitFor({ timeout: 15_000 });

  // add two bots via the playtest panel
  await page.getByRole("button", { name: /playtest panel/i }).click();
  await page.getByRole("button", { name: /add bot player/i }).click();
  await page.getByRole("button", { name: /add bot player/i }).click();

  // chest ceremony in the lobby (deterministic timing)
  await page.getByRole("button", { name: /force chest/i }).click();
  await page.getByRole("button", { name: /playtest panel/i }).click(); // close panel
  await page.screenshot({ path: "/tmp/artifacts/v2-lobby.png" });
  // force: the bag bobs forever, so Playwright never sees it "stable"
  await page.locator('button[aria-label^="Open booty bag"]').click({ timeout: 8_000, force: true });
  await page.getByText("Tap to open").first().click({ timeout: 8_000 });
  await page.waitForTimeout(2400); // frame 3: jackpot build-up (777 slot)
  await page.screenshot({ path: "/tmp/artifacts/v2-chest-jackpot.png" });
  await page.waitForTimeout(3200); // frame 6: reward card
  await page.screenshot({ path: "/tmp/artifacts/v2-chest-card.png" });
  await page.getByRole("button", { name: /keep it/i }).click({ timeout: 8_000 });
  await page.getByRole("button", { name: /^close$/i }).click({ timeout: 8_000 }); // booty bag sheet

  await page.getByRole("button", { name: /set sail/i }).click();
  await page.getByText(/the seven seas/i).waitFor({ timeout: 15_000 });
  await page.screenshot({ path: "/tmp/artifacts/v2-intro.png" });

  // Phaser question scene: canvas replaces DOM answer cards.
  await page.locator("canvas").waitFor({ state: "visible", timeout: 15_000 });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: "/tmp/artifacts/v2-question.png" });

  await ctx.close();
});
