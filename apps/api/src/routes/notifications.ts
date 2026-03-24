import { FastifyInstance } from "fastify";
import { prisma } from "../prisma.js";
import { requireAuth } from "../middleware/auth.js";
import type { GroupedNotification, NotificationActor, NotificationType } from "@booktalk/shared";

export default async function notificationRoutes(app: FastifyInstance) {
  // GET /notifications — grouped notifications for the authenticated user
  app.get("/", { preHandler: [requireAuth] }, async (request, reply) => {
    const { userId } = request.user as { userId: string };

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        actor: { select: { id: true, username: true, displayName: true } },
      },
    });

    const unreadCount = notifications.filter((n) => !n.read).length;

    // Group by (type, postId) — multiple events on same post+type become one row
    // FOLLOW notifications have no postId and are grouped together as one item
    const groupMap = new Map<
      string,
      {
        ids: string[];
        type: NotificationType;
        postId?: string;
        commentId?: string;
        actorMap: Map<string, NotificationActor>;
        read: boolean;
        createdAt: Date;
      }
    >();

    for (const n of notifications) {
      // FOLLOW: group all follows into a single "FOLLOW" key
      // Others: group by type+postId (skip if no postId)
      const key = n.type === "FOLLOW" ? "FOLLOW" : n.postId ? `${n.type}:${n.postId}` : null;
      if (!key) continue;
      const existing = groupMap.get(key);
      if (existing) {
        existing.ids.push(n.id);
        if (!existing.actorMap.has(n.actorId)) {
          existing.actorMap.set(n.actorId, n.actor as NotificationActor);
        }
        if (!n.read) existing.read = false;
      } else {
        groupMap.set(key, {
          ids: [n.id],
          type: n.type as NotificationType,
          postId: n.postId ?? undefined,
          commentId: n.commentId ?? undefined,
          actorMap: new Map([[n.actorId, n.actor as NotificationActor]]),
          read: n.read,
          createdAt: n.createdAt,
        });
      }
    }

    const groups: GroupedNotification[] = Array.from(groupMap.entries()).map(
      ([, g]) => {
        const allActors = Array.from(g.actorMap.values());
        return {
          id: g.ids[0],
          ids: g.ids,
          type: g.type,
          postId: g.postId,
          commentId: g.commentId,
          actors: allActors.slice(0, 2),
          totalActors: allActors.length,
          read: g.read,
          createdAt: g.createdAt.toISOString(),
        };
      }
    );

    return reply.send({ notifications: groups, unreadCount });
  });

  // POST /notifications/read-all — mark all as read
  app.post("/read-all", { preHandler: [requireAuth] }, async (request, reply) => {
    const { userId } = request.user as { userId: string };
    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
    return reply.send({ success: true });
  });

  // POST /notifications/:id/read — mark one notification group as read
  app.post("/:id/read", { preHandler: [requireAuth] }, async (request, reply) => {
    const { userId } = request.user as { userId: string };
    const { id } = request.params as { id: string };

    // Find the notification to get its (type, postId) group
    const notif = await prisma.notification.findUnique({ where: { id } });
    if (!notif || notif.userId !== userId) {
      return reply.status(404).send({ error: "Not found" });
    }

    // Mark all notifications in the same group as read
    await prisma.notification.updateMany({
      where: {
        userId,
        type: notif.type,
        postId: notif.postId,
        read: false,
      },
      data: { read: true },
    });

    return reply.send({ success: true });
  });
}
