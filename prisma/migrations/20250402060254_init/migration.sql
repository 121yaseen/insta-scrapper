-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstagramProfile" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "fullName" TEXT,
    "bio" TEXT,
    "profilePicUrl" TEXT,
    "followersCount" INTEGER,
    "followingCount" INTEGER,
    "postsCount" INTEGER,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "lastScraped" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstagramProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "shortcode" TEXT NOT NULL,
    "caption" TEXT,
    "mediaType" TEXT,
    "mediaUrl" TEXT,
    "likesCount" INTEGER,
    "commentsCount" INTEGER,
    "timestamp" TIMESTAMP(3),
    "instagramProfileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reel" (
    "id" TEXT NOT NULL,
    "reelId" TEXT NOT NULL,
    "shortcode" TEXT NOT NULL,
    "caption" TEXT,
    "mediaUrl" TEXT,
    "viewsCount" INTEGER,
    "likesCount" INTEGER,
    "commentsCount" INTEGER,
    "timestamp" TIMESTAMP(3),
    "instagramProfileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScrapeRequest" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "priority" INTEGER NOT NULL DEFAULT 1,
    "userId" TEXT NOT NULL,
    "instagramProfileId" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScrapeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "InstagramProfile_username_key" ON "InstagramProfile"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Post_postId_key" ON "Post"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "Post_shortcode_key" ON "Post"("shortcode");

-- CreateIndex
CREATE INDEX "Post_instagramProfileId_idx" ON "Post"("instagramProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "Reel_reelId_key" ON "Reel"("reelId");

-- CreateIndex
CREATE UNIQUE INDEX "Reel_shortcode_key" ON "Reel"("shortcode");

-- CreateIndex
CREATE INDEX "Reel_instagramProfileId_idx" ON "Reel"("instagramProfileId");

-- CreateIndex
CREATE INDEX "ScrapeRequest_userId_idx" ON "ScrapeRequest"("userId");

-- CreateIndex
CREATE INDEX "ScrapeRequest_instagramProfileId_idx" ON "ScrapeRequest"("instagramProfileId");

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_instagramProfileId_fkey" FOREIGN KEY ("instagramProfileId") REFERENCES "InstagramProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reel" ADD CONSTRAINT "Reel_instagramProfileId_fkey" FOREIGN KEY ("instagramProfileId") REFERENCES "InstagramProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScrapeRequest" ADD CONSTRAINT "ScrapeRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScrapeRequest" ADD CONSTRAINT "ScrapeRequest_instagramProfileId_fkey" FOREIGN KEY ("instagramProfileId") REFERENCES "InstagramProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
