import { Prisma } from "../generated/prisma/index.js";
import { prisma } from "../prisma.js";
import { WANT_TO_READ, type ShelfSummary } from "@booktalk/shared";

// Shared include for building shelf summaries: item count + a few cover previews.
export const shelfListInclude = {
  _count: { select: { items: true } },
  items: {
    orderBy: { addedAt: "desc" },
    take: 3, // matches the max cover previews shown on a shelf card
    select: { book: { select: { coverUrl: true } } },
  },
} satisfies Prisma.ShelfInclude;

type ShelfWithPreview = Prisma.ShelfGetPayload<{ include: typeof shelfListInclude }>;

export function shelfSummary(shelf: ShelfWithPreview): ShelfSummary {
  return {
    id: shelf.id,
    name: shelf.name,
    isSystem: shelf.isSystem,
    isPrivate: shelf.isPrivate,
    itemCount: shelf._count.items,
    coverUrls: shelf.items.map((i) => i.book.coverUrl),
    createdAt: shelf.createdAt.toISOString(),
  };
}

/** Idempotently create the user's system "Want to Read" shelf. */
export async function ensureWantToRead(userId: string): Promise<void> {
  await prisma.shelf.upsert({
    where: { userId_name: { userId, name: WANT_TO_READ } },
    update: {},
    create: { userId, name: WANT_TO_READ, isSystem: true },
  });
}
