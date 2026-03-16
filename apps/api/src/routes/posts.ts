import { FastifyInstance } from "fastify";
import { z } from "zod";
import { createPostSchema, updatePostSchema } from "@booktalk/shared";
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

  // PATCH /posts/:id — edit a post (requires auth, must be author)
  app.patch("/:id", { preHandler: [requireAuth] }, async (request, reply) => {
    try {
      const payload = request.user as { userId: string };
      const { id } = request.params as { id: string };
      const data = updatePostSchema.parse(request.body);

      const post = await prisma.post.findUnique({ where: { id } });
      if (!post) return reply.status(404).send({ error: "Post not found" });
      if (post.authorId !== payload.userId) return reply.status(403).send({ error: "Forbidden" });

      const updated = await prisma.post.update({
        where: { id },
        data: { content: data.content },
        include: { author: { select: authorSelect } },
      });

      return reply.send({ post: updated });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return reply.status(400).send({ errors: err.issues });
      }
      console.error(err);
      return reply.status(500).send({ error: "Internal server error" });
    }
  });

  // DELETE /posts/:id — delete a post (requires auth, must be author)
  app.delete("/:id", { preHandler: [requireAuth] }, async (request, reply) => {
    const payload = request.user as { userId: string };
    const { id } = request.params as { id: string };

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) return reply.status(404).send({ error: "Post not found" });
    if (post.authorId !== payload.userId) return reply.status(403).send({ error: "Forbidden" });

    await prisma.post.delete({ where: { id } });
    return reply.send({ success: true });
  });
}
