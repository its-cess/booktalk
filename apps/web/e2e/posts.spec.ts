import { test, expect } from "@playwright/test";

// All post tests run as user1
test.use({ storageState: ".auth/user1.json" });

// Helper: create a post and return the post card locator
async function createPost(page: import("@playwright/test").Page, content: string) {
  await page.getByTestId("post-composer").getByPlaceholder("What are you reading?").fill(content);
  await page.getByTestId("post-composer").getByRole("button", { name: "Post" }).click();
  const postCard = page.getByTestId("post-card").filter({ hasText: content });
  await expect(postCard).toBeVisible();
  return postCard;
}

test("create a post and see it in the feed", async ({ page }) => {
  await page.goto("/");
  await createPost(page, `E2E create post ${Date.now()}`);
});

test("delete a post removes it from the feed", async ({ page }) => {
  await page.goto("/");
  const content = `E2E delete post ${Date.now()}`;
  const postCard = await createPost(page, content);

  await postCard.getByRole("button", { name: "Post options" }).click();
  await page.getByRole("menuitem", { name: "Delete post" }).click();
  await page.getByRole("button", { name: "Delete" }).click();

  await expect(page.getByText(content)).not.toBeVisible();
});

test("like a post increments the count and toggles the button", async ({ page }) => {
  await page.goto("/");
  const postCard = await createPost(page, `E2E like post ${Date.now()}`);

  const likeBtn = postCard.getByRole("button", { name: "Like post" });
  await likeBtn.click();
  await expect(postCard.getByRole("button", { name: "Unlike post" })).toBeVisible();

  // Like count should now be 1
  await expect(postCard.getByRole("button", { name: "Unlike post" })).toContainText("1");
});

test("clicking view comments navigates to the post detail page", async ({ page }) => {
  await page.goto("/");
  const content = `E2E detail nav ${Date.now()}`;
  const postCard = await createPost(page, content);

  await postCard.getByRole("button", { name: "View comments" }).click();

  await expect(page).toHaveURL(/\/posts\/.+/);
  await expect(page.getByText(content)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Comments" })).toBeVisible();
});

test("comment on a post appears in the comments section", async ({ page }) => {
  await page.goto("/");
  const postCard = await createPost(page, `E2E comment post ${Date.now()}`);

  // Navigate to post detail
  await postCard.getByRole("button", { name: "View comments" }).click();
  await expect(page).toHaveURL(/\/posts\/.+/);

  // Submit a comment
  const commentText = `E2E comment ${Date.now()}`;
  await page.getByPlaceholder("Add a comment").fill(commentText);
  await page.getByRole("button", { name: "Send" }).click();

  await expect(page.getByText(commentText)).toBeVisible();
});
