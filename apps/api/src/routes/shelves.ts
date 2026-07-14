import { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  createShelfSchema,
  updateShelfSchema,
  addShelfItemSchema,
  type ShelfMembership,
} from "@booktalk/shared";
import { prisma } from "../prisma.js";
import { requireAuth } from "../middleware/auth.js";
import {
  ensureWantToRead,
  shelfSummary,
  shelfListInclude,
} from "../lib/shelves.js";

async function getOptionalUserId(request: any): Promise<string | null> {
  try {
    await request.jwtVerify();
    return (request.user as { userId: string }).userId;
  } catch {
    return null;
  }
}

export default async function shelfRoutes(app: FastifyInstance) {
  // GET /shelves/me?bookId= — the current user's shelves (+ membership for a book)
  app.get("/me", { preHandler: [requireAuth] }, async (request, reply) => {
    const { userId } = request.user as { userId: string };
    const { bookId } = request.query as { bookId?: string };

    await ensureWantToRead(userId);

    const shelves = await prisma.shelf.findMany({
      where: { userId },
      orderBy: [{ isSystem: "desc" }, { createdAt: "asc" }],
    });

    let containedShelfIds = new Set<string>();
    if (bookId) {
      const items = await prisma.shelfItem.findMany({
        where: { bookId, shelf: { userId } },
        select: { shelfId: true },
      });
      containedShelfIds = new Set(items.map((i) => i.shelfId));
    }

    const result: ShelfMembership[] = shelves.map((s) => ({
      id: s.id,
      name: s.name,
      isSystem: s.isSystem,
      containsBook: containedShelfIds.has(s.id),
    }));
    return reply.send({ shelves: result });
  });

  // GET /shelves/:id — shelf detail with books (private shelves are owner-only)
  app.get("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const viewerId = await getOptionalUserId(request);

    const shelf = await prisma.shelf.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, username: true, displayName: true } },
        items: {
          orderBy: { addedAt: "desc" },
          include: { book: { select: { id: true, title: true, author: true, coverUrl: true } } },
        },
      },
    });

    if (!shelf) return reply.status(404).send({ error: "Shelf not found" });
    // Don't reveal a private shelf (or its existence) to anyone but the owner.
    if (shelf.isPrivate && shelf.userId !== viewerId) {
      return reply.status(404).send({ error: "Shelf not found" });
    }

    return reply.send({
      shelf: {
        id: shelf.id,
        name: shelf.name,
        isSystem: shelf.isSystem,
        isPrivate: shelf.isPrivate,
        createdAt: shelf.createdAt.toISOString(),
        owner: shelf.user,
        books: shelf.items.map((i) => ({
          id: i.book.id,
          title: i.book.title,
          author: i.book.author,
          coverUrl: i.book.coverUrl,
          addedAt: i.addedAt.toISOString(),
        })),
      },
    });
  });

  // POST /shelves — create a custom shelf
  app.post("/", { preHandler: [requireAuth] }, async (request, reply) => {
    try {
      const { userId } = request.user as { userId: string };
      const { name, isPrivate } = createShelfSchema.parse(request.body);

      const existing = await prisma.shelf.findUnique({
        where: { userId_name: { userId, name } },
      });
      if (existing) {
        return reply.status(409).send({ error: "You already have a shelf with that name" });
      }

      const shelf = await prisma.shelf.create({
        data: { userId, name, isSystem: false, isPrivate: isPrivate ?? false },
        include: shelfListInclude,
      });
      return reply.status(201).send({ shelf: shelfSummary(shelf) });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return reply.status(400).send({ errors: err.issues });
      }
      console.error(err);
      return reply.status(500).send({ error: "Internal server error" });
    }
  });

  // PATCH /shelves/:id — rename and/or toggle privacy on a shelf
  app.patch("/:id", { preHandler: [requireAuth] }, async (request, reply) => {
    try {
      const { userId } = request.user as { userId: string };
      const { id } = request.params as { id: string };
      const { name, isPrivate } = updateShelfSchema.parse(request.body);

      const shelf = await prisma.shelf.findUnique({ where: { id } });
      if (!shelf) return reply.status(404).send({ error: "Shelf not found" });
      if (shelf.userId !== userId) return reply.status(403).send({ error: "Forbidden" });
      // The system shelf can't be renamed, but its privacy can still be toggled.
      if (name !== undefined && shelf.isSystem) {
        return reply.status(400).send({ error: "This shelf can't be renamed" });
      }

      if (name !== undefined) {
        const clash = await prisma.shelf.findUnique({
          where: { userId_name: { userId, name } },
        });
        if (clash && clash.id !== id) {
          return reply.status(409).send({ error: "You already have a shelf with that name" });
        }
      }

      const updated = await prisma.shelf.update({
        where: { id },
        data: {
          ...(name !== undefined && { name }),
          ...(isPrivate !== undefined && { isPrivate }),
        },
        include: shelfListInclude,
      });
      return reply.send({ shelf: shelfSummary(updated) });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return reply.status(400).send({ errors: err.issues });
      }
      console.error(err);
      return reply.status(500).send({ error: "Internal server error" });
    }
  });

  // DELETE /shelves/:id — delete a custom shelf (and its items via cascade)
  app.delete("/:id", { preHandler: [requireAuth] }, async (request, reply) => {
    const { userId } = request.user as { userId: string };
    const { id } = request.params as { id: string };

    const shelf = await prisma.shelf.findUnique({ where: { id } });
    if (!shelf) return reply.status(404).send({ error: "Shelf not found" });
    if (shelf.userId !== userId) return reply.status(403).send({ error: "Forbidden" });
    if (shelf.isSystem) {
      return reply.status(400).send({ error: "This shelf can't be deleted" });
    }

    await prisma.shelf.delete({ where: { id } });
    return reply.send({ success: true });
  });

  // POST /shelves/:id/items — add a book to a shelf (idempotent)
  app.post("/:id/items", { preHandler: [requireAuth] }, async (request, reply) => {
    try {
      const { userId } = request.user as { userId: string };
      const { id } = request.params as { id: string };
      const { bookId } = addShelfItemSchema.parse(request.body);

      const shelf = await prisma.shelf.findUnique({ where: { id } });
      if (!shelf) return reply.status(404).send({ error: "Shelf not found" });
      if (shelf.userId !== userId) return reply.status(403).send({ error: "Forbidden" });

      const book = await prisma.book.findUnique({ where: { id: bookId }, select: { id: true } });
      if (!book) return reply.status(404).send({ error: "Book not found" });

      await prisma.shelfItem.upsert({
        where: { shelfId_bookId: { shelfId: id, bookId } },
        update: {},
        create: { shelfId: id, bookId },
      });
      return reply.status(201).send({ success: true });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return reply.status(400).send({ errors: err.issues });
      }
      console.error(err);
      return reply.status(500).send({ error: "Internal server error" });
    }
  });

  // DELETE /shelves/:id/items/:bookId — remove a book from a shelf
  app.delete("/:id/items/:bookId", { preHandler: [requireAuth] }, async (request, reply) => {
    const { userId } = request.user as { userId: string };
    const { id, bookId } = request.params as { id: string; bookId: string };

    const shelf = await prisma.shelf.findUnique({ where: { id } });
    if (!shelf) return reply.status(404).send({ error: "Shelf not found" });
    if (shelf.userId !== userId) return reply.status(403).send({ error: "Forbidden" });

    await prisma.shelfItem.deleteMany({ where: { shelfId: id, bookId } });
    return reply.send({ success: true });
  });
}
