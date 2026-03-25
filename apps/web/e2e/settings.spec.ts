import { test, expect } from "@playwright/test";
import { TEST_USER_1 } from "./test-users";

test.use({ storageState: ".auth/user1.json" });

test("navigate to settings via the gear icon on the profile page", async ({ page }) => {
  await page.goto(`/${TEST_USER_1.username}`);
  await page.getByRole("link", { name: "Account settings" }).click();
  await expect(page).toHaveURL("/settings");
});

test("settings page shows expected headings and account info", async ({ page }) => {
  await page.goto("/settings");

  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  await expect(page.getByText("Account info")).toBeVisible();
  await expect(page.getByText("Change password")).toBeVisible();
  await expect(page.getByText("Danger zone")).toBeVisible();

  await expect(page.getByText(TEST_USER_1.email)).toBeVisible();
  await expect(page.getByText(`@${TEST_USER_1.username}`)).toBeVisible();
});
