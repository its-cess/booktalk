import { test, expect } from "@playwright/test";

// Auth tests run without any saved auth state
test.use({ storageState: { cookies: [], origins: [] } });

test("signup creates account and redirects to feed", async ({ page }) => {
  const ts = Date.now();
  await page.goto("/signup");
  await page.locator('[name="email"]').fill(`e2e_signup_${ts}@test.com`);
  await page.locator('[name="username"]').fill(`e2esignup${ts}`);
  await page.locator('[name="displayName"]').fill("Test Signup User");
  await page.locator('[name="password"]').fill("TestPass123!");
  await page.locator('[name="confirmPassword"]').fill("TestPass123!");
  await page.getByRole("button", { name: "Sign up" }).click();
  await expect(page).toHaveURL("/");
});

test("login with valid credentials redirects to feed", async ({ page }) => {
  await page.goto("/login");
  await page.locator('[name="identifier"]').fill("e2e_user1@booktalk.test");
  await page.locator('[name="password"]').fill("TestPass123!");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL("/");
});

test("login with invalid credentials shows error", async ({ page }) => {
  await page.goto("/login");
  await page.locator('[name="identifier"]').fill("nobody@example.com");
  await page.locator('[name="password"]').fill("wrongpassword");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByText(/invalid credentials/i)).toBeVisible();
});

test("logout redirects to home and shows log in link", async ({ page }) => {
  // Log in first
  await page.goto("/login");
  await page.locator('[name="identifier"]').fill("e2e_user1@booktalk.test");
  await page.locator('[name="password"]').fill("TestPass123!");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL("/");

  // Log out via sidebar
  await page.getByTestId("logout-button").click();
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("link", { name: "Log in" })).toBeVisible();
});
