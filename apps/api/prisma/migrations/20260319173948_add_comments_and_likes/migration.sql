-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Comment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CommentLike" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "commentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CommentLike_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CommentLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PostLike" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PostLike_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PostLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Post" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "bookTitle" TEXT,
    "bookAuthor" TEXT,
    "hasSpoilers" BOOLEAN NOT NULL DEFAULT false,
    "commentsDisabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Post" ("authorId", "bookAuthor", "bookTitle", "content", "createdAt", "hasSpoilers", "id", "updatedAt") SELECT "authorId", "bookAuthor", "bookTitle", "content", "createdAt", "hasSpoilers", "id", "updatedAt" FROM "Post";
DROP TABLE "Post";
ALTER TABLE "new_Post" RENAME TO "Post";
CREATE INDEX "Post_authorId_idx" ON "Post"("authorId");
CREATE INDEX "Post_createdAt_idx" ON "Post"("createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Comment_postId_idx" ON "Comment"("postId");

-- CreateIndex
CREATE INDEX "Comment_authorId_idx" ON "Comment"("authorId");

-- CreateIndex
CREATE UNIQUE INDEX "CommentLike_commentId_userId_key" ON "CommentLike"("commentId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "PostLike_postId_userId_key" ON "PostLike"("postId", "userId");
