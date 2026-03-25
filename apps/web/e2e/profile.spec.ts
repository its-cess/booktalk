import { test, expect } from "@playwright/test";
import { TEST_USER_1 } from "./test-users";

test.use({ storageState: ".auth/user1.json" });

test("own profile shows username and edit controls", async ({ page }) => {
  await page.goto(`/${TEST_USER_1.username}`);
  const header = page.getByTestId("profile-header");
  // Wait for auth to initialize (Edit buttons only appear when isOwn is true)
  await expect(header.getByRole("button", { name: "Edit" }).first()).toBeVisible();
  await expect(header.getByText(`@${TEST_USER_1.username}`)).toBeVisible();
});

test("edit bio saves and displays the updated text", async ({ page }) => {
  await page.goto(`/${TEST_USER_1.username}`);
  const header = page.getByTestId("profile-header");
  await expect(header.getByRole("button", { name: "Edit" }).last()).toBeVisible();

  // Bio Edit button is the last Edit button in the header
  await header.getByRole("button", { name: "Edit" }).last().click();

  const bio = `E2E bio ${Date.now()}`;
  await page.locator("main").getByRole("textbox").fill(bio);
  await page.getByRole("button", { name: "Save changes" }).click();

  await expect(header.getByText(bio)).toBeVisible();
});

test("edit display name saves and displays the updated text", async ({ page }) => {
  await page.goto(`/${TEST_USER_1.username}`);
  const header = page.getByTestId("profile-header");
  await expect(header.getByRole("button", { name: "Edit" }).first()).toBeVisible();

  // DisplayName Edit button is the first Edit button in the header
  await header.getByRole("button", { name: "Edit" }).first().click();

  const newName = `E2E Name ${Date.now()}`;
  await page.locator("main").getByRole("textbox").fill(newName);
  await page.getByRole("button", { name: "Save changes" }).click();

  // Assert within the header only — displayName also appears in every post card
  await expect(header.getByText(newName)).toBeVisible();

  // Restore original display name so other tests aren't affected
  await header.getByRole("button", { name: "Edit" }).first().click();
  await page.locator("main").getByRole("textbox").fill(TEST_USER_1.displayName);
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(header.getByText(TEST_USER_1.displayName)).toBeVisible();
});
