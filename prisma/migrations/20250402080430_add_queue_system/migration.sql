-- CreateTable
CREATE TABLE "UserRequest" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "instagramProfileId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QueuedRequest" (
    "id" TEXT NOT NULL,
    "userRequestId" TEXT NOT NULL,
    "scrapeRequestId" TEXT,
    "username" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "lastQueued" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QueuedRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserRequest_userId_idx" ON "UserRequest"("userId");

-- CreateIndex
CREATE INDEX "UserRequest_username_idx" ON "UserRequest"("username");

-- CreateIndex
CREATE INDEX "UserRequest_instagramProfileId_idx" ON "UserRequest"("instagramProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "QueuedRequest_userRequestId_key" ON "QueuedRequest"("userRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "QueuedRequest_scrapeRequestId_key" ON "QueuedRequest"("scrapeRequestId");

-- CreateIndex
CREATE INDEX "QueuedRequest_username_idx" ON "QueuedRequest"("username");

-- CreateIndex
CREATE INDEX "QueuedRequest_status_idx" ON "QueuedRequest"("status");

-- CreateIndex
CREATE INDEX "QueuedRequest_lastQueued_idx" ON "QueuedRequest"("lastQueued");

-- AddForeignKey
ALTER TABLE "UserRequest" ADD CONSTRAINT "UserRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRequest" ADD CONSTRAINT "UserRequest_instagramProfileId_fkey" FOREIGN KEY ("instagramProfileId") REFERENCES "InstagramProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QueuedRequest" ADD CONSTRAINT "QueuedRequest_userRequestId_fkey" FOREIGN KEY ("userRequestId") REFERENCES "UserRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QueuedRequest" ADD CONSTRAINT "QueuedRequest_scrapeRequestId_fkey" FOREIGN KEY ("scrapeRequestId") REFERENCES "ScrapeRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
