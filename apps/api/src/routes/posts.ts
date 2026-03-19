import { FastifyInstance } from "fastify";
import { z } from "zod";
import { createPostSchema, updatePostSchema, createCommentSchema } from "@booktalk/shared";
import { prisma } from "../prisma.js";
import { requireAuth } from "../middleware/auth.js";

const authorSelect = {
  id: true,
  username: true,
  displayName: true,
};

const bookSelect = {
  id: true,
  openLibraryKey: true,
  title: true,
  author: true,
  coverUrl: true,
};

async function getOptionalUserId(request: any): Promise<string | null> {
  try {
    await request.jwtVerify();
    return (request.user as { userId: string }).userId;
  } catch {
    return null;
  }
}

export default async function postRoutes(app: FastifyInstance) {
  // GET /posts — feed (newest first)
  app.get("/", async (request, reply) => {
    const userId = await getOptionalUserId(request);

    const [posts, userLikes] = await Promise.all([
      prisma.post.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          author: { select: authorSelect },
          book: { select: bookSelect },
          _count: { select: { comments: true, likes: true } },
        },
      }),
      userId
        ? prisma.postLike.findMany({ where: { userId }, select: { postId: true } })
        : Promise.resolve([]),
    ]);

    const likedPostIds = new Set(userLikes.map((l) => l.postId));

    return reply.send({
      posts: posts.map(({ _count, ...post }) => ({
        ...post,
        likeCount: _count.likes,
        commentCount: _count.comments,
        isLiked: likedPostIds.has(post.id),
      })),
    });
  });

  // GET /posts/search?q= — full-text search across content and book fields
  app.get("/search", async (request, reply) => {
    const userId = await getOptionalUserId(request);
    const { q } = request.query as { q?: string };

    if (!q || q.trim().length < 2) {
      return reply.send({ posts: [] });
    }

    const term = q.trim();

    const [posts, userLikes] = await Promise.all([
      prisma.post.findMany({
        where: {
          OR: [
            { content: { contains: term } },
            { bookTitle: { contains: term } },
            { bookAuthor: { contains: term } },
            { book: { title: { contains: term } } },
            { book: { author: { contains: term } } },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          author: { select: authorSelect },
          book: { select: bookSelect },
          _count: { select: { comments: true, likes: true } },
        },
      }),
      userId
        ? prisma.postLike.findMany({ where: { userId }, select: { postId: true } })
        : Promise.resolve([]),
    ]);

    const likedPostIds = new Set(userLikes.map((l) => l.postId));

    return reply.send({
      posts: posts.map(({ _count, ...post }) => ({
        ...post,
        likeCount: _count.likes,
        commentCount: _count.comments,
        isLiked: likedPostIds.has(post.id),
      })),
    });
  });

  // GET /posts/:id — single post
  app.get("/:id", async (request, reply) => {
    const userId = await getOptionalUserId(request);
    const { id } = request.params as { id: string };

    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: { select: authorSelect },
        book: { select: bookSelect },
        _count: { select: { comments: true, likes: true } },
      },
    });

    if (!post) return reply.status(404).send({ error: "Post not found" });

    const isLiked = userId
      ? !!(await prisma.postLike.findUnique({
          where: { postId_userId: { postId: id, userId } },
        }))
      : false;

    const { _count, ...postData } = post;
    return reply.send({
      post: {
        ...postData,
        likeCount: _count.likes,
        commentCount: _count.comments,
        isLiked,
      },
    });
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
          hasSpoilers: data.hasSpoilers,
          // OpenLibrary book takes precedence; fall back to manual fields
          ...(data.bookId
            ? { bookId: data.bookId }
            : {
                bookTitle: data.bookTitle ?? null,
                bookAuthor: data.bookAuthor ?? null,
              }),
        },
        include: {
          author: { select: authorSelect },
          book: { select: bookSelect },
          _count: { select: { comments: true, likes: true } },
        },
      });

      const { _count, ...postData } = post;
      return reply.status(201).send({
        post: {
          ...postData,
          likeCount: _count.likes,
          commentCount: _count.comments,
          isLiked: false,
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
        data: {
          ...(data.content !== undefined && { content: data.content }),
          ...(data.hasSpoilers !== undefined && { hasSpoilers: data.hasSpoilers }),
          ...(data.commentsDisabled !== undefined && { commentsDisabled: data.commentsDisabled }),
          ...(data.clearBook && { bookId: null, bookTitle: null, bookAuthor: null }),
          ...(data.bookId && { bookId: data.bookId, bookTitle: null, bookAuthor: null }),
          ...(data.bookTitle && !data.bookId && {
            bookTitle: data.bookTitle,
            bookAuthor: data.bookAuthor ?? null,
            bookId: null,
          }),
        },
        include: {
          author: { select: authorSelect },
          book: { select: bookSelect },
          _count: { select: { comments: true, likes: true } },
        },
      });

      const isLiked = !!(await prisma.postLike.findUnique({
        where: { postId_userId: { postId: id, userId: payload.userId } },
      }));

      const { _count, ...postData } = updated;
      return reply.send({
        post: {
          ...postData,
          likeCount: _count.likes,
          commentCount: _count.comments,
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

  // POST /posts/:id/like — toggle like on a post (requires auth)
  app.post("/:id/like", { preHandler: [requireAuth] }, async (request, reply) => {
    const payload = request.user as { userId: string };
    const { id } = request.params as { id: string };

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) return reply.status(404).send({ error: "Post not found" });

    const existing = await prisma.postLike.findUnique({
      where: { postId_userId: { postId: id, userId: payload.userId } },
    });

    if (existing) {
      await prisma.postLike.delete({ where: { id: existing.id } });
      return reply.send({ isLiked: false });
    } else {
      await prisma.postLike.create({ data: { postId: id, userId: payload.userId } });
      return reply.send({ isLiked: true });
    }
  });

  // GET /posts/:id/comments — list comments for a post
  app.get("/:id/comments", async (request, reply) => {
    const userId = await getOptionalUserId(request);
    const { id } = request.params as { id: string };

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) return reply.status(404).send({ error: "Post not found" });

    const [comments, userCommentLikes] = await Promise.all([
      prisma.comment.findMany({
        where: { postId: id },
        orderBy: { createdAt: "asc" },
        include: {
          author: { select: authorSelect },
          _count: { select: { likes: true } },
        },
      }),
      userId
        ? prisma.commentLike.findMany({
            where: { userId, comment: { postId: id } },
            select: { commentId: true },
          })
        : Promise.resolve([]),
    ]);

    const likedCommentIds = new Set(userCommentLikes.map((l) => l.commentId));

    return reply.send({
      comments: comments.map(({ _count, ...comment }) => ({
        ...comment,
        likeCount: _count.likes,
        isLiked: likedCommentIds.has(comment.id),
      })),
    });
  });

  // POST /posts/:id/comments — add a comment (requires auth)
  app.post("/:id/comments", { preHandler: [requireAuth] }, async (request, reply) => {
    try {
      const payload = request.user as { userId: string };
      const { id } = request.params as { id: string };

      const post = await prisma.post.findUnique({ where: { id } });
      if (!post) return reply.status(404).send({ error: "Post not found" });
      if (post.commentsDisabled) return reply.status(403).send({ error: "Comments are disabled" });

      const data = createCommentSchema.parse(request.body);

      const comment = await prisma.comment.create({
        data: {
          postId: id,
          authorId: payload.userId,
          content: data.content,
        },
        include: {
          author: { select: authorSelect },
          _count: { select: { likes: true } },
        },
      });

      const { _count, ...commentData } = comment;
      return reply.status(201).send({
        comment: {
          ...commentData,
          likeCount: _count.likes,
          isLiked: false,
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
}
