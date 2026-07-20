-- CreateTable
CREATE TABLE "ProfileTopBook" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "ProfileTopBook_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProfileTopBook_userId_idx" ON "ProfileTopBook"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ProfileTopBook_userId_bookId_key" ON "ProfileTopBook"("userId", "bookId");

-- AddForeignKey
ALTER TABLE "ProfileTopBook" ADD CONSTRAINT "ProfileTopBook_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileTopBook" ADD CONSTRAINT "ProfileTopBook_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;
