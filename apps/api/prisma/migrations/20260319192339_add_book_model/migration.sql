-- CreateTable
CREATE TABLE "Book" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "openLibraryKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "coverUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Post" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "bookId" TEXT,
    "bookTitle" TEXT,
    "bookAuthor" TEXT,
    "hasSpoilers" BOOLEAN NOT NULL DEFAULT false,
    "commentsDisabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Post_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Post" ("authorId", "bookAuthor", "bookTitle", "commentsDisabled", "content", "createdAt", "hasSpoilers", "id", "updatedAt") SELECT "authorId", "bookAuthor", "bookTitle", "commentsDisabled", "content", "createdAt", "hasSpoilers", "id", "updatedAt" FROM "Post";
DROP TABLE "Post";
ALTER TABLE "new_Post" RENAME TO "Post";
CREATE INDEX "Post_authorId_idx" ON "Post"("authorId");
CREATE INDEX "Post_createdAt_idx" ON "Post"("createdAt");
CREATE INDEX "Post_bookId_idx" ON "Post"("bookId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Book_openLibraryKey_key" ON "Book"("openLibraryKey");
