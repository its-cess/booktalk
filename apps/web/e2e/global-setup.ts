import { chromium } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { TEST_USER_1, TEST_USER_2, TEST_POST_CONTENT } from "./test-users";

const API_URL = "http://localhost:3000";
const BASE_URL = "http://localhost:5173";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_DIR = path.join(__dirname, "../.auth");

async function ensureUser(user: typeof TEST_USER_1): Promise<void> {
  const res = await fetch(`${API_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user),
  });
  if (res.ok) return;
  const body = await res.json() as { error?: string };
  // "already taken" means the user exists from a previous run — that's fine
  if (body.error?.includes("already taken")) return;
  throw new Error(`Signup failed for ${user.username}: ${res.status} ${JSON.stringify(body)}`);
}

async function getToken(user: typeof TEST_USER_1): Promise<string> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: user.email, password: user.password }),
  });
  if (!res.ok) {
    throw new Error(`Login failed for ${user.username}: ${res.status}`);
  }
  const data = await res.json() as { token: string };
  return data.token;
}

async function ensurePost(token: string, content: string): Promise<void> {
  // Check if the post already exists to avoid duplicates on re-runs
  const feedRes = await fetch(`${API_URL}/posts/trending`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (feedRes.ok) {
    const { posts } = await feedRes.json() as { posts: { content: string }[] };
    if (posts.some((p) => p.content === content)) return;
  }

  const res = await fetch(`${API_URL}/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ content, hasSpoilers: false }),
  });
  if (!res.ok) {
    throw new Error(`Post creation failed: ${res.status} ${await res.text()}`);
  }
}

async function saveAuthState(
  user: typeof TEST_USER_1,
  filePath: string
): Promise<void> {
  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  await page.goto(`${BASE_URL}/login`);
  await page.locator('[name="identifier"]').fill(user.email);
  await page.locator('[name="password"]').fill(user.password);
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL(`${BASE_URL}/`);

  await ctx.storageState({ path: filePath });
  await browser.close();
}

export default async function globalSetup() {
  if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
  }

  // Create both test users (idempotent)
  await ensureUser(TEST_USER_1);
  await ensureUser(TEST_USER_2);

  // Reset user1's display name in case a previous test run left it dirty
  const user1Token = await getToken(TEST_USER_1);
  await fetch(`${API_URL}/users/me`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${user1Token}` },
    body: JSON.stringify({ displayName: TEST_USER_1.displayName }),
  });

  // Ensure user2 has a post for the social follow test
  const user2Token = await getToken(TEST_USER_2);
  await ensurePost(user2Token, TEST_POST_CONTENT);

  // Save browser auth state for both users
  await saveAuthState(TEST_USER_1, path.join(AUTH_DIR, "user1.json"));
  await saveAuthState(TEST_USER_2, path.join(AUTH_DIR, "user2.json"));
}
