import webpush from "web-push";
import { prisma } from "../prisma.js";

// Web Push is optional: if VAPID keys aren't configured, every send is a no-op so
// the app runs fine locally/in CI without them.
let configured: boolean | null = null;

function ensureConfigured(): boolean {
  if (configured !== null) return configured;
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) {
    configured = false;
    return false;
  }
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:notifications@booktalksocial.com",
    pub,
    priv
  );
  configured = true;
  return true;
}

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

/** Send a payload to every subscription a user has, pruning dead ones. */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  if (!ensureConfigured()) return;
  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  if (subs.length === 0) return;

  const data = JSON.stringify(payload);
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          data
        );
      } catch (err) {
        const status = (err as { statusCode?: number })?.statusCode;
        // 404/410 mean the subscription is gone — drop it so we stop retrying.
        if (status === 404 || status === 410) {
          await prisma.pushSubscription.delete({ where: { endpoint: s.endpoint } }).catch(() => {});
        } else {
          console.error("web-push send failed", status ?? err);
        }
      }
    })
  );
}

type Activity = "POST_LIKE" | "COMMENT" | "FOLLOW" | "MENTION_POST" | "MENTION_COMMENT";

const ACTION: Record<Activity, string> = {
  POST_LIKE: "liked your post",
  COMMENT: "commented on your post",
  FOLLOW: "started following you",
  MENTION_POST: "mentioned you in a post",
  MENTION_COMMENT: "mentioned you in a comment",
};

/**
 * Fire-and-forget push for an activity. Looks up the actor once and fans out to
 * every recipient. Never throws into the request path.
 */
export function pushActivity(opts: {
  recipientIds: string[];
  actorId: string;
  type: Activity;
  postId?: string;
}): void {
  const { recipientIds, actorId, type, postId } = opts;
  const targets = recipientIds.filter((id) => id && id !== actorId);
  if (targets.length === 0 || !ensureConfigured()) return;

  void (async () => {
    const actor = await prisma.user.findUnique({
      where: { id: actorId },
      select: { displayName: true, username: true },
    });
    if (!actor) return;

    const url = type === "FOLLOW" ? `/${actor.username}` : postId ? `/posts/${postId}` : "/";
    const payload: PushPayload = {
      title: "BookTalk",
      body: `${actor.displayName} ${ACTION[type]}`,
      url,
      tag: `${type}:${postId ?? actor.username}`,
    };
    await Promise.all(targets.map((id) => sendPushToUser(id, payload)));
  })().catch((err) => console.error("pushActivity failed", err));
}
