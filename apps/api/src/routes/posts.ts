import { FastifyInstance } from "fastify";
import { z } from "zod";
import { createPostSchema } from "@booktalk/shared";
import { prisma } from "../prisma.js";
import { requireAuth } from "../middleware/auth.js";

const authorSelect = {
  id: true,
  username: true,
  displayName: true,
};

export default async function postRoutes(app: FastifyInstance) {
  // GET /posts — feed (newest first)
  app.get("/", async (_request, reply) => {
    const posts = await prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      include: { author: { select: authorSelect } },
    });
    return reply.send({ posts });
  });

  // POST /posts — create a post (requires auth)
  app.post("/", { preHandler: [requireAuth] }, async (request, reply) => {
    try {
      const payload = request.user as { userId: string };
      const data = createPostSchema.parse(request.body);

      const post = await prisma.post.create({
        data: {
          authorId: payload.userId,
          content: data.content,
          bookTitle: data.bookTitle ?? null,
          bookAuthor: data.bookAuthor ?? null,
          hasSpoilers: data.hasSpoilers,
        },
        include: { author: { select: authorSelect } },
      });

      return reply.status(201).send({ post });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return reply.status(400).send({ errors: err.issues });
      }
      console.error(err);
      return reply.status(500).send({ error: "Internal server error" });
    }
  });
}
