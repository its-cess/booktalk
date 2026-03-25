import { test, expect } from "@playwright/test";

test.use({ storageState: ".auth/user1.json" });

// This test calls the real OpenLibrary API via the API server.
// It uses a well-known book to maximise reliability.
test("search for a book, attach it to a post, and navigate to the book detail page", async ({ page }) => {
  await page.goto("/");

  // Open the book search panel
  await page.getByTestId("post-composer").getByRole("button", { name: "Add book" }).click();
  await expect(page.getByPlaceholder("Search for a book...")).toBeVisible();

  // Search for a well-known title
  await page.getByPlaceholder("Search for a book...").fill("Dune");

  // Wait for at least one result containing "Dune" to appear
  // Give extra time since this hits the real OpenLibrary API
  await expect(
    page.getByRole("button", { name: /Dune/i }).first()
  ).toBeVisible({ timeout: 15_000 });

  // Select the first result
  await page.getByRole("button", { name: /Dune/i }).first().click();

  // The book chip should now be visible in the composer
  await expect(page.getByText(/Dune/i).first()).toBeVisible();

  // Write content and post
  const content = `E2E book post ${Date.now()}`;
  await page.getByTestId("post-composer").getByPlaceholder("What are you reading?").fill(content);
  await page.getByTestId("post-composer").getByRole("button", { name: "Post" }).click();

  // Post appears in feed
  const postCard = page.getByTestId("post-card").filter({ hasText: content });
  await expect(postCard).toBeVisible();

  // The book is linked on the post card (cover image link or text pill link)
  const bookLink = postCard.getByRole("link", { name: /Dune/i });
  await expect(bookLink).toBeVisible();

  // Clicking the book link navigates to the book detail page
  await bookLink.click();
  await expect(page).toHaveURL(/\/books\/.+/);
  await expect(page.getByText("Posts about this book")).toBeVisible();
});
