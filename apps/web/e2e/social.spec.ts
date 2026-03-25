import { test, expect } from "@playwright/test";
import { TEST_USER_2, TEST_POST_CONTENT } from "./test-users";

// Social tests run as user1
test.use({ storageState: ".auth/user1.json" });

test("follow a user from their profile and see their post in the feed", async ({ page }) => {
  await page.goto(`/${TEST_USER_2.username}`);

  // Handle re-runs: if user1 is already following user2, unfollow first
  // (we're already on the profile page so no second navigation needed)
  const unfollowBtn = page.getByRole("button", { name: "Unfollow" });
  const followBtn = page.getByRole("button", { name: "Follow" });

  await expect(unfollowBtn.or(followBtn)).toBeVisible();

  if (await unfollowBtn.isVisible()) {
    await unfollowBtn.click();
    await expect(followBtn).toBeVisible();
  }

  // Follow user2
  await followBtn.click();
  await expect(unfollowBtn).toBeVisible();

  // Navigate home — user2's post should now be in the feed
  await page.goto("/");
  await expect(page.getByText(TEST_POST_CONTENT).first()).toBeVisible();
});
