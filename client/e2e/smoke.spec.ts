import { expect, test } from "@playwright/test";

/**
 * Smoke test: app loads → host creates a room → a friend joins from a second
 * browser context → host starts the game → both see the first round intro.
 */
test("two players can create, join, and start a game", async ({ browser }) => {
  const hostContext = await browser.newContext();
  const host = await hostContext.newPage();

  await host.goto("/");
  await expect(host.getByText("TREASURE", { exact: false })).toBeVisible();

  // Host creates a game.
  await host.getByRole("button", { name: /start a game/i }).click();
  await host.getByLabel("Nickname").fill("Cap'n Test");
  await host.getByRole("button", { name: /^⚓ start$/i }).click();

  // Room code appears in the lobby.
  const codeButton = host.getByRole("button", { name: /room code/i });
  await expect(codeButton).toBeVisible({ timeout: 15_000 });
  const roomCode = (await codeButton.innerText()).trim();
  expect(roomCode).toMatch(/^[A-Z0-9]{4,6}$/);

  // Friend joins from a second browser context (separate "laptop").
  const friendContext = await browser.newContext();
  const friend = await friendContext.newPage();
  await friend.goto("/");
  await friend.getByRole("button", { name: /join with a code/i }).click();
  await friend.getByLabel("Room code").fill(roomCode);
  await friend.getByLabel("Nickname").fill("First Mate");
  await friend.getByRole("button", { name: /^🦜 join$/i }).click();

  // Both lobbies show both pirates.
  await expect(host.getByText("First Mate")).toBeVisible({ timeout: 15_000 });
  await expect(friend.getByText("Cap'n Test")).toBeVisible({ timeout: 15_000 });

  // Host starts the game.
  await host.getByRole("button", { name: /start game/i }).click();

  // Both players reach the first round intro (Round 1 of N).
  await expect(host.getByText(/round 1 of/i)).toBeVisible({ timeout: 15_000 });
  await expect(friend.getByText(/round 1 of/i)).toBeVisible({ timeout: 15_000 });

  await hostContext.close();
  await friendContext.close();
});
