import { FastifyInstance } from "fastify";
import { z } from "zod";
import { updateCommentSchema } from "@booktalk/shared";
import { prisma } from "../prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { notifyMentions } from "../lib/mentions.js";

export default async function commentRoutes(app: FastifyInstance) {
  // PATCH /comments/:id — edit own comment (requires auth)
  app.patch("/:id", { preHandler: [requireAuth] }, async (request, reply) => {
    try {
      const payload = request.user as { userId: string };
      const { id } = request.params as { id: string };
      const data = updateCommentSchema.parse(request.body);

      const comment = await prisma.comment.findUnique({ where: { id } });
      if (!comment) return reply.status(404).send({ error: "Comment not found" });
      if (comment.authorId !== payload.userId) return reply.status(403).send({ error: "Forbidden" });

      const updated = await prisma.comment.update({
        where: { id },
        data: { content: data.content },
        include: {
          author: { select: { id: true, username: true, displayName: true } },
          _count: { select: { likes: true } },
        },
      });

      const isLiked = !!(await prisma.commentLike.findUnique({
        where: { commentId_userId: { commentId: id, userId: payload.userId } },
      }));

      // Notify any @mentioned users added in the edit (non-blocking)
      notifyMentions({
        content: data.content,
        actorId: payload.userId,
        postId: updated.postId,
        commentId: id,
        type: "MENTION_COMMENT",
      }).catch(console.error);

      const { _count, ...commentData } = updated;
      return reply.send({
        comment: {
          ...commentData,
          likeCount: _count.likes,
          isLiked,
        },
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return reply.status(400).send({ errors: err.issues });
      }
      console.error(err);
      return reply.status(500).send({ error: "Internal server error" });
    }
  });

  // DELETE /comments/:id — delete comment (own or post owner)
  app.delete("/:id", { preHandler: [requireAuth] }, async (request, reply) => {
    const payload = request.user as { userId: string };
    const { id } = request.params as { id: string };

    const comment = await prisma.comment.findUnique({
      where: { id },
      include: { post: { select: { authorId: true } } },
    });

    if (!comment) return reply.status(404).send({ error: "Comment not found" });

    const isCommentOwner = comment.authorId === payload.userId;
    const isPostOwner = comment.post.authorId === payload.userId;

    if (!isCommentOwner && !isPostOwner) {
      return reply.status(403).send({ error: "Forbidden" });
    }

    await prisma.comment.delete({ where: { id } });
    return reply.send({ success: true });
  });

  // POST /comments/:id/like — toggle like on a comment (requires auth)
  app.post("/:id/like", { preHandler: [requireAuth] }, async (request, reply) => {
    const payload = request.user as { userId: string };
    const { id } = request.params as { id: string };

    const comment = await prisma.comment.findUnique({ where: { id } });
    if (!comment) return reply.status(404).send({ error: "Comment not found" });

    const existing = await prisma.commentLike.findUnique({
      where: { commentId_userId: { commentId: id, userId: payload.userId } },
    });

    if (existing) {
      await prisma.commentLike.delete({ where: { id: existing.id } });
      return reply.send({ isLiked: false });
    } else {
      await prisma.commentLike.create({ data: { commentId: id, userId: payload.userId } });
      return reply.send({ isLiked: true });
    }
  });
}
