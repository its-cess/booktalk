import { FastifyInstance } from "fastify";
import { z } from "zod";
import { randomUUID } from "crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { updateProfileSchema, setTopBooksSchema, MAX_TOP_BOOKS } from "@booktalk/shared";
import { prisma } from "../prisma.js";
import { pushActivity } from "../lib/push.js";
import { requireAuth } from "../middleware/auth.js";
import { loadAuthorBookRatings, postRatingFor } from "../lib/rating.js";
import { ensureWantToRead, shelfListInclude, shelfSummary } from "../lib/shelves.js";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const userSummarySelect = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
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

export default async function userRoutes(app: FastifyInstance) {
  // GET /users/search?q= — mention autocomplete (must be before /:username)
  app.get("/search", async (request, reply) => {
    const { q } = request.query as { q?: string };
    if (!q || q.trim().length < 1) {
      return reply.send({ users: [] });
    }
    const term = q.trim();
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: term, mode: "insensitive" } },
          { displayName: { contains: term, mode: "insensitive" } },
        ],
      },
      select: { id: true, username: true, displayName: true, avatarUrl: true },
      take: 10,
      orderBy: { username: "asc" },
    });
    return reply.send({ users });
  });

  // GET /users/:username — public profile with posts
  app.get("/:username", async (request, reply) => {
    const { username } = request.params as { username: string };
    const userId = await getOptionalUserId(request);

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
            bookId: true,
            book: { select: bookSelect },
            bookTitle: true,
            bookAuthor: true,
            hasSpoilers: true,
            commentsDisabled: true,
            gifUrl: true,
            showsRating: true,
            createdAt: true,
            author: {
              select: { id: true, username: true, displayName: true, avatarUrl: true },
            },
            _count: { select: { comments: true, likes: true } },
          },
        },
      },
    });

    if (!user) {
      return reply.status(404).send({ error: "User not found" });
    }

    const [userLikes, followRecord] = await Promise.all([
      userId
        ? prisma.postLike.findMany({
            where: { userId, post: { author: { username } } },
            select: { postId: true },
          })
        : Promise.resolve([]),
      userId && userId !== user.id
        ? prisma.follow.findUnique({
            where: { followerId_followingId: { followerId: userId, followingId: user.id } },
          })
        : Promise.resolve(null),
    ]);

    const likedPostIds = new Set(userLikes.map((l) => l.postId));

    const { _count, posts, ...rest } = user;
    const ratingMap = await loadAuthorBookRatings(
      posts.map((p) => ({ authorId: user.id, bookId: p.bookId, showsRating: p.showsRating }))
    );
    return reply.send({
      user: {
        ...rest,
        followersCount: _count.followers,
        followingCount: _count.following,
        isFollowing: !!followRecord,
        posts: posts.map(({ _count: postCount, ...post }) => ({
          ...post,
          ...postRatingFor(
            { authorId: user.id, bookId: post.bookId, showsRating: post.showsRating },
            ratingMap
          ),
          likeCount: postCount.likes,
          commentCount: postCount.comments,
          isLiked: likedPostIds.has(post.id),
        })),
      },
    });
  });

  // POST /users/:username/follow — toggle follow/unfollow (requires auth)
  app.post("/:username/follow", { preHandler: [requireAuth] }, async (request, reply) => {
    const payload = request.user as { userId: string };
    const { username } = request.params as { username: string };

    const targetUser = await prisma.user.findUnique({ where: { username } });
    if (!targetUser) return reply.status(404).send({ error: "User not found" });
    if (targetUser.id === payload.userId) {
      return reply.status(400).send({ error: "Cannot follow yourself" });
    }

    const existing = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: payload.userId,
          followingId: targetUser.id,
        },
      },
    });

    if (existing) {
      await prisma.follow.delete({ where: { id: existing.id } });
      return reply.send({ isFollowing: false });
    } else {
      await prisma.follow.create({
        data: { followerId: payload.userId, followingId: targetUser.id },
      });
      // Notify the followed user (non-blocking)
      prisma.notification
        .create({
          data: {
            userId: targetUser.id,
            actorId: payload.userId,
            type: "FOLLOW",
          },
        })
        .catch(console.error);
      pushActivity({ recipientIds: [targetUser.id], actorId: payload.userId, type: "FOLLOW" });
      return reply.send({ isFollowing: true });
    }
  });

  // GET /users/:username/followers — list of followers
  app.get("/:username/followers", async (request, reply) => {
    const { username } = request.params as { username: string };
    const viewerId = await getOptionalUserId(request);

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return reply.status(404).send({ error: "User not found" });

    const [follows, viewerFollowing] = await Promise.all([
      prisma.follow.findMany({
        where: { followingId: user.id },
        orderBy: { createdAt: "desc" },
        include: { follower: { select: userSummarySelect } },
      }),
      viewerId
        ? prisma.follow.findMany({
            where: { followerId: viewerId },
            select: { followingId: true },
          })
        : Promise.resolve([]),
    ]);

    const viewerFollowingIds = new Set(viewerFollowing.map((f) => f.followingId));

    return reply.send({
      users: follows.map((f) => ({
        ...f.follower,
        isFollowing: viewerFollowingIds.has(f.follower.id),
      })),
    });
  });

  // GET /users/:username/following — list of users this person follows
  app.get("/:username/following", async (request, reply) => {
    const { username } = request.params as { username: string };
    const viewerId = await getOptionalUserId(request);

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return reply.status(404).send({ error: "User not found" });

    const [follows, viewerFollowing] = await Promise.all([
      prisma.follow.findMany({
        where: { followerId: user.id },
        orderBy: { createdAt: "desc" },
        include: { following: { select: userSummarySelect } },
      }),
      viewerId
        ? prisma.follow.findMany({
            where: { followerId: viewerId },
            select: { followingId: true },
          })
        : Promise.resolve([]),
    ]);

    const viewerFollowingIds = new Set(viewerFollowing.map((f) => f.followingId));

    return reply.send({
      users: follows.map((f) => ({
        ...f.following,
        isFollowing: viewerFollowingIds.has(f.following.id),
      })),
    });
  });

  // GET /users/:username/shelves — public list of a user's shelves
  app.get("/:username/shelves", async (request, reply) => {
    const { username } = request.params as { username: string };
    const viewerId = await getOptionalUserId(request);

    const user = await prisma.user.findUnique({ where: { username }, select: { id: true } });
    if (!user) return reply.status(404).send({ error: "User not found" });

    const isOwner = viewerId === user.id;
    // Ensure the owner always sees their system "Want to Read" shelf.
    if (isOwner) await ensureWantToRead(user.id);

    const shelves = await prisma.shelf.findMany({
      where: {
        userId: user.id,
        // Hide private shelves from everyone but the owner.
        ...(isOwner ? {} : { isPrivate: false }),
      },
      orderBy: [{ isSystem: "desc" }, { createdAt: "asc" }],
      include: shelfListInclude,
    });

    return reply.send({ shelves: shelves.map(shelfSummary) });
  });

  // GET /users/:username/top-books — public "Top 8" favorite books
  app.get("/:username/top-books", async (request, reply) => {
    const { username } = request.params as { username: string };
    const user = await prisma.user.findUnique({ where: { username }, select: { id: true } });
    if (!user) return reply.status(404).send({ error: "User not found" });

    const rows = await prisma.profileTopBook.findMany({
      where: { userId: user.id },
      orderBy: { position: "asc" },
      include: { book: { select: { id: true, title: true, author: true, coverUrl: true } } },
    });
    return reply.send({ books: rows.map((r) => r.book) });
  });

  // PUT /users/me/top-books — replace the current user's Top 8 (ordered book IDs)
  app.put("/me/top-books", { preHandler: [requireAuth] }, async (request, reply) => {
    try {
      const { userId } = request.user as { userId: string };
      const { bookIds } = setTopBooksSchema.parse(request.body);

      // Keep only real books, dedupe, preserve order, cap at the max.
      const existing = await prisma.book.findMany({
        where: { id: { in: bookIds } },
        select: { id: true },
      });
      const existingSet = new Set(existing.map((b) => b.id));
      const ordered: string[] = [];
      for (const id of bookIds) {
        if (existingSet.has(id) && !ordered.includes(id)) ordered.push(id);
        if (ordered.length >= MAX_TOP_BOOKS) break;
      }

      await prisma.$transaction([
        prisma.profileTopBook.deleteMany({ where: { userId } }),
        prisma.profileTopBook.createMany({
          data: ordered.map((bookId, position) => ({ userId, bookId, position })),
        }),
      ]);

      const rows = await prisma.profileTopBook.findMany({
        where: { userId },
        orderBy: { position: "asc" },
        include: { book: { select: { id: true, title: true, author: true, coverUrl: true } } },
      });
      return reply.send({ books: rows.map((r) => r.book) });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return reply.status(400).send({ errors: err.issues });
      }
      console.error(err);
      return reply.status(500).send({ error: "Internal server error" });
    }
  });

  // POST /users/me/avatar-upload-url — get presigned R2 URL to upload an avatar
  app.post("/me/avatar-upload-url", { preHandler: [requireAuth] }, async (request, reply) => {
    const payload = request.user as { userId: string };
    const { contentType } = request.body as { contentType?: string };

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!contentType || !allowed.includes(contentType)) {
      return reply.status(400).send({ error: "contentType must be jpeg, png, webp, or gif" });
    }

    const ext = contentType.split("/")[1];
    const key = `avatars/${payload.userId}/${randomUUID()}.${ext}`;

    const uploadUrl = await getSignedUrl(
      r2,
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
        ContentType: contentType,
      }),
      { expiresIn: 300 }
    );

    const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;
    return reply.send({ uploadUrl, publicUrl });
  });

  // DELETE /users/me — permanently delete own account and all associated data
  app.delete("/me", { preHandler: [requireAuth] }, async (request, reply) => {
    const payload = request.user as { userId: string };
    await prisma.user.delete({ where: { id: payload.userId } });
    return reply.status(204).send();
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
