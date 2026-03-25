import { test, expect, type Page } from "@playwright/test";
import { TEST_USER_1, TEST_USER_2 } from "./test-users";

// All tests view notifications as user1
test.use({ storageState: ".auth/user1.json" });

const API_URL = "http://localhost:3000";

async function getToken(user: typeof TEST_USER_1): Promise<string> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: user.email, password: user.password }),
  });
  if (!res.ok) throw new Error(`Login failed for ${user.username}: ${res.status}`);
  const data = (await res.json()) as { token: string };
  return data.token;
}

// Creates a post as user1 and triggers like + comment + follow from user2.
// Returns the post ID so individual tests can reference it.
async function setupNotifications(): Promise<string> {
  const user1Token = await getToken(TEST_USER_1);
  const user2Token = await getToken(TEST_USER_2);

  // Create a post as user1
  const postRes = await fetch(`${API_URL}/posts`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${user1Token}` },
    body: JSON.stringify({ content: `E2E notification post ${Date.now()}`, hasSpoilers: false }),
  });
  if (!postRes.ok) throw new Error(`Post creation failed: ${postRes.status}`);
  const { post } = (await postRes.json()) as { post: { id: string } };

  // user2 likes the post
  await fetch(`${API_URL}/posts/${post.id}/like`, {
    method: "POST",
    headers: { Authorization: `Bearer ${user2Token}` },
  });

  // user2 comments on the post
  await fetch(`${API_URL}/posts/${post.id}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${user2Token}` },
    body: JSON.stringify({ content: "E2E test comment" }),
  });

  // user2 follows user1 — toggle endpoint, so if already following it unfollows.
  // Call once; if it unfollowed, call again to ensure we end up following (and a
  // fresh FOLLOW notification is created).
  const followRes = await fetch(`${API_URL}/users/${TEST_USER_1.username}/follow`, {
    method: "POST",
    headers: { Authorization: `Bearer ${user2Token}` },
  });
  const followData = (await followRes.json()) as { isFollowing: boolean };
  if (!followData.isFollowing) {
    // We just unfollowed (was already following); follow again to create notification
    await fetch(`${API_URL}/users/${TEST_USER_1.username}/follow`, {
      method: "POST",
      headers: { Authorization: `Bearer ${user2Token}` },
    });
  }

  return post.id;
}

// Opens the notifications panel and waits until at least one notification is visible.
// Uses .first() because repeated test runs accumulate multiple notifications in the DB.
async function openNotifications(page: Page) {
  await page.getByTestId("notifications-toggle").click();
  await expect(
    page.getByText(/liked your post|commented on your post|started following you/).first()
  ).toBeVisible();
}

let postId: string;

test.beforeAll(async () => {
  postId = await setupNotifications();
});

test("notification panel shows a like notification", async ({ page }) => {
  await page.goto("/");
  await openNotifications(page);
  await expect(
    page.getByText(`${TEST_USER_2.displayName} liked your post`).first()
  ).toBeVisible();
});

test("notification panel shows a comment notification", async ({ page }) => {
  await page.goto("/");
  await openNotifications(page);
  await expect(
    page.getByText(`${TEST_USER_2.displayName} commented on your post`).first()
  ).toBeVisible();
});

test("notification panel shows a follow notification", async ({ page }) => {
  await page.goto("/");
  await openNotifications(page);
  // Use regex — accumulated test runs may add "and N other(s)" between the
  // display name and "started following you"
  await expect(
    page.getByText(/started following you/).first()
  ).toBeVisible();
});

test("unread notifications show the unread dot indicator", async ({ page }) => {
  await page.goto("/");
  await openNotifications(page);
  await expect(page.getByTestId("unread-dot").first()).toBeVisible();
});

test("mark all read removes unread dot indicators", async ({ page }) => {
  await page.goto("/");
  await openNotifications(page);
  await page.getByRole("button", { name: "Mark all read" }).click();
  await expect(page.getByTestId("unread-dot")).toHaveCount(0);
});

test("clicking a like notification navigates to the post", async ({ page }) => {
  await page.goto("/");
  await openNotifications(page);
  // Use .first() — repeated runs create multiple "liked your post" items;
  // notifications are sorted newest-first so .first() is this run's notification.
  await page.getByText(`${TEST_USER_2.displayName} liked your post`).first().click();
  await expect(page).toHaveURL(`/posts/${postId}`);
});

test("clicking a follow notification navigates to the follower's profile", async ({ page }) => {
  await page.goto("/");
  await openNotifications(page);
  await page.getByText(/started following you/).first().click();
  await expect(page).toHaveURL(`/${TEST_USER_2.username}`);
});
