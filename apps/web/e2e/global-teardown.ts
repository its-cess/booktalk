import { TEST_USER_1, TEST_USER_2 } from "./test-users";

const API_URL = "http://localhost:3000";

async function deleteUser(user: typeof TEST_USER_1): Promise<void> {
  const loginRes = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: user.email, password: user.password }),
  });
  if (!loginRes.ok) return; // user doesn't exist — nothing to clean up

  const { token } = (await loginRes.json()) as { token: string };

  await fetch(`${API_URL}/users/me`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export default async function globalTeardown() {
  // Delete both test users; Prisma cascades remove all their posts,
  // notifications, follows, likes, and comments automatically.
  await Promise.all([deleteUser(TEST_USER_1), deleteUser(TEST_USER_2)]);
}
