import { FastifyInstance } from "fastify";
import { ZodError } from "zod";
import { pushSubscriptionSchema } from "@booktalk/shared";
import { prisma } from "../prisma.js";
import { requireAuth } from "../middleware/auth.js";

export default async function pushRoutes(app: FastifyInstance) {
  // GET /push/vapid-public-key — public key the browser needs to subscribe.
  app.get("/vapid-public-key", async (_request, reply) => {
    return reply.send({ key: process.env.VAPID_PUBLIC_KEY ?? null });
  });

  // POST /push/subscribe — save (or refresh) this device's subscription.
  app.post("/subscribe", { preHandler: [requireAuth] }, async (request, reply) => {
    const { userId } = request.user as { userId: string };
    try {
      const sub = pushSubscriptionSchema.parse(request.body);
      await prisma.pushSubscription.upsert({
        where: { endpoint: sub.endpoint },
        create: { userId, endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth },
        update: { userId, p256dh: sub.keys.p256dh, auth: sub.keys.auth },
      });
      return reply.send({ success: true });
    } catch (err) {
      if (err instanceof ZodError) return reply.status(400).send({ errors: err.issues });
      throw err;
    }
  });

  // POST /push/unsubscribe — remove this device's subscription.
  app.post("/unsubscribe", { preHandler: [requireAuth] }, async (request, reply) => {
    const { userId } = request.user as { userId: string };
    const { endpoint } = (request.body ?? {}) as { endpoint?: string };
    if (!endpoint) return reply.status(400).send({ error: "endpoint is required" });
    await prisma.pushSubscription.deleteMany({ where: { endpoint, userId } });
    return reply.send({ success: true });
  });
}
