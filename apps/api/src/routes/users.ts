import { FastifyInstance } from "fastify";
import { z } from "zod";
import { updateProfileSchema } from "@booktalk/shared";
import { prisma } from "../prisma.js";
import { requireAuth } from "../middleware/auth.js";

export default async function userRoutes(app: FastifyInstance) {
  // GET /users/:username — public profile with posts
  app.get("/:username", async (request, reply) => {
    const { username } = request.params as { username: string };

    let userId: string | null = null;
    try {
      await request.jwtVerify();
      userId = (request.user as { userId: string }).userId;
    } catch {}

    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        createdAt: true,
        _count: {
          select: { followers: true, following: true },
        },
        posts: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            content: true,
            bookTitle: true,
            bookAuthor: true,
            hasSpoilers: true,
            commentsDisabled: true,
            createdAt: true,
            author: {
              select: { id: true, username: true, displayName: true },
            },
            _count: { select: { comments: true, likes: true } },
          },
        },
      },
    });

    if (!user) {
      return reply.status(404).send({ error: "User not found" });
    }

    const userLikes = userId
      ? await prisma.postLike.findMany({
          where: { userId, post: { author: { username } } },
          select: { postId: true },
        })
      : [];

    const likedPostIds = new Set(userLikes.map((l) => l.postId));

    const { _count, posts, ...rest } = user;
    return reply.send({
      user: {
        ...rest,
        followersCount: _count.followers,
        followingCount: _count.following,
        posts: posts.map(({ _count: postCount, ...post }) => ({
          ...post,
          likeCount: postCount.likes,
          commentCount: postCount.comments,
          isLiked: likedPostIds.has(post.id),
        })),
      },
    });
  });

  // PATCH /users/me — update own profile
  app.patch("/me", { preHandler: [requireAuth] }, async (request, reply) => {
    const payload = request.user as { userId: string };
    try {
      const data = updateProfileSchema.parse(request.body);

      const user = await prisma.user.update({
        where: { id: payload.userId },
        data,
        select: {
          id: true,
          username: true,
          displayName: true,
          bio: true,
          avatarUrl: true,
        },
      });

      return reply.send({ user });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return reply.status(400).send({ errors: err.issues });
      }
      console.error(err);
      return reply.status(500).send({ error: "Internal server error" });
    }
  });
}
