/*
  Warnings:

  - You are about to drop the column `caption` on the `Reel` table. All the data in the column will be lost.
  - You are about to drop the column `commentsCount` on the `Reel` table. All the data in the column will be lost.
  - You are about to drop the column `likesCount` on the `Reel` table. All the data in the column will be lost.
  - You are about to drop the column `mediaUrl` on the `Reel` table. All the data in the column will be lost.
  - You are about to drop the column `shortcode` on the `Reel` table. All the data in the column will be lost.
  - You are about to drop the column `timestamp` on the `Reel` table. All the data in the column will be lost.
  - You are about to drop the column `viewsCount` on the `Reel` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Reel_shortcode_key";

-- AlterTable
ALTER TABLE "InstagramProfile" ADD COLUMN     "externalUrl" TEXT,
ADD COLUMN     "reelsCount" INTEGER,
ADD COLUMN     "scrapeTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Reel" DROP COLUMN "caption",
DROP COLUMN "commentsCount",
DROP COLUMN "likesCount",
DROP COLUMN "mediaUrl",
DROP COLUMN "shortcode",
DROP COLUMN "timestamp",
DROP COLUMN "viewsCount",
ADD COLUMN     "comments" INTEGER,
ADD COLUMN     "likes" INTEGER,
ADD COLUMN     "postedDate" TIMESTAMP(3),
ADD COLUMN     "thumbnail" TEXT,
ADD COLUMN     "url" TEXT,
ADD COLUMN     "views" INTEGER;
