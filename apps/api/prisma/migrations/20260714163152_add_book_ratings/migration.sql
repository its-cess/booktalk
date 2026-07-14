/*
  Warnings:

  - You are about to drop the column `ratingDnf` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the column `ratingHalfStars` on the `Post` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Post" DROP COLUMN "ratingDnf",
DROP COLUMN "ratingHalfStars",
ADD COLUMN     "showsRating" BOOLEAN NOT NULL DEFAULT false;
