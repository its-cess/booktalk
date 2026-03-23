import { FastifyInstance } from "fastify";
import { prisma } from "../prisma.js";

const bookSelect = {
  id: true,
  openLibraryKey: true,
  title: true,
  author: true,
  coverUrl: true,
  description: true,
};

interface OpenLibraryWorkResponse {
  description?: string | { type: string; value: string };
}

interface OpenLibraryDoc {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
}

interface OpenLibraryResponse {
  docs: OpenLibraryDoc[];
}

const postAuthorSelect = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
};

export default async function bookRoutes(app: FastifyInstance) {
  // GET /books/:id — book detail with cached description + posts
  app.get("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };

    let book = await prisma.book.findUnique({ where: { id }, select: bookSelect });
    if (!book) return reply.status(404).send({ error: "Book not found" });

    // Fetch and cache description if missing
    if (!book.description) {
      try {
        const url = `https://openlibrary.org${book.openLibraryKey}.json`;
        const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
        if (res.ok) {
          const data = (await res.json()) as OpenLibraryWorkResponse;
          const raw = data.description;
          const description = typeof raw === "string" ? raw : raw?.value ?? null;
          if (description) {
            book = await prisma.book.update({
              where: { id },
              data: { description },
              select: bookSelect,
            });
          }
        }
      } catch (err) {
        app.log.warn(err, "OpenLibrary description fetch failed, serving book without description");
      }
    }

    const posts = await prisma.post.findMany({
      where: { bookId: id },
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: postAuthorSelect },
        _count: { select: { comments: true, likes: true } },
      },
    });

    return reply.send({
      book,
      posts: posts.map(({ _count, ...post }) => ({
        ...post,
        likeCount: _count.likes,
        commentCount: _count.comments,
        isLiked: false,
      })),
    });
  });

  // GET /books/search?q= — search OpenLibrary and cache results in DB
  app.get("/search", async (request, reply) => {
    const { q } = request.query as { q?: string };

    if (!q || q.trim().length < 2) {
      return reply.send({ books: [] });
    }

    const query = q.trim();

    try {
      const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=10&fields=key,title,author_name,cover_i`;
      const response = await fetch(url, {
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        throw new Error(`OpenLibrary returned ${response.status}`);
      }

      const data = (await response.json()) as OpenLibraryResponse;
      const docs = (data.docs ?? []).filter((d) => d.key && d.title);

      // Upsert all results into DB so they're available by ID when a post is created
      const books = await Promise.all(
        docs.map((doc) => {
          const coverUrl = doc.cover_i
            ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
            : null;

          return prisma.book.upsert({
            where: { openLibraryKey: doc.key },
            update: {},
            create: {
              openLibraryKey: doc.key,
              title: doc.title,
              author: doc.author_name?.[0] ?? "Unknown",
              coverUrl,
            },
            select: bookSelect,
          });
        })
      );

      return reply.send({ books });
    } catch (err) {
      // If OpenLibrary is unreachable, fall back to whatever we have cached in DB
      app.log.error(err, "OpenLibrary search failed, falling back to DB cache");

      const cached = await prisma.book.findMany({
        where: {
          OR: [
            { title: { contains: query } },
            { author: { contains: query } },
          ],
        },
        take: 10,
        select: bookSelect,
      });

      return reply.send({ books: cached });
    }
  });
}
