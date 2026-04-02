import { prisma } from "../prisma.js";

const MENTION_RE = /@([a-zA-Z0-9_-]+)/g;

/** Extract unique usernames mentioned in content (without the @ prefix). */
export function parseMentionUsernames(content: string): string[] {
  const matches = content.matchAll(MENTION_RE);
  const usernames = new Set<string>();
  for (const match of matches) {
    usernames.add(match[1].toLowerCase());
  }
  return Array.from(usernames);
}

/**
 * Create MENTION_POST or MENTION_COMMENT notifications for all @username
 * references found in content. Skips the actor themselves.
 */
export async function notifyMentions({
  content,
  actorId,
  postId,
  commentId,
  type,
}: {
  content: string;
  actorId: string;
  postId: string;
  commentId?: string;
  type: "MENTION_POST" | "MENTION_COMMENT";
}): Promise<void> {
  const usernames = parseMentionUsernames(content);
  if (usernames.length === 0) return;

  const users = await prisma.user.findMany({
    where: { username: { in: usernames } },
    select: { id: true },
  });

  const recipients = users
    .map((u) => u.id)
    .filter((id) => id !== actorId);

  if (recipients.length === 0) return;

  await prisma.notification.createMany({
    data: recipients.map((userId) => ({
      userId,
      actorId,
      type,
      postId,
      commentId: commentId ?? null,
    })),
  });
}
