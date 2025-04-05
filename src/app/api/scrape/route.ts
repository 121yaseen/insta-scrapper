import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// Mark this route as dynamic to prevent build errors
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // Get authenticated user
    const { userId } = auth();
    const user = await currentUser();

    if (!userId || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse the request body
    const body = await req.json();
    const { username } = body;

    if (!username) {
      return NextResponse.json(
        { error: "Instagram username is required" },
        { status: 400 }
      );
    }

    // Check if the user already exists in our database
    let dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    // Create user if it doesn't exist
    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          clerkId: userId,
          email: user.emailAddresses[0].emailAddress,
          name: `${user.firstName} ${user.lastName}`,
        },
      });
    }

    // Check if the Instagram profile already exists
    const existingProfile = await prisma.instagramProfile.findUnique({
      where: { username },
      include: { posts: true, reels: true },
    });

    // If profile exists and was recently scraped, return it directly
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (existingProfile && existingProfile.lastScraped > oneHourAgo) {
      // Create a user request entry for tracking purposes
      await prisma.userRequest.create({
        data: {
          username,
          userId: dbUser.id,
          instagramProfileId: existingProfile.id,
        },
      });

      return NextResponse.json({
        message: "Profile data retrieved from cache",
        profile: existingProfile,
        cached: true,
      });
    }

    // 1. ALWAYS store in UserRequest table
    const userRequest = await prisma.userRequest.create({
      data: {
        username,
        userId: dbUser.id,
        instagramProfileId: existingProfile?.id,
      },
    });

    // 2. Check if the same handle exists in QueuedRequest table
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existingQueuedRequest = await prisma.queuedRequest.findFirst({
      where: {
        username,
        lastQueued: {
          gt: twentyFourHoursAgo,
        },
      },
      orderBy: {
        lastQueued: "desc",
      },
    });

    // 3. Logic for adding to QueuedRequest table
    if (existingQueuedRequest) {
      // Request was already queued within 24 hours
      return NextResponse.json({
        message: "Request already queued within last 24 hours",
        requestId: userRequest.id,
        queuedRequestId: existingQueuedRequest.id,
        alreadyQueued: true,
      });
    } else {
      // Create a new ScrapeRequest for actual processing
      const scrapeRequest = await prisma.scrapeRequest.create({
        data: {
          username,
          status: "pending",
          priority: 1,
          userId: dbUser.id,
          instagramProfileId: existingProfile?.id,
        },
      });

      // Create entry in QueuedRequest table
      const queuedRequest = await prisma.queuedRequest.create({
        data: {
          userRequestId: userRequest.id,
          scrapeRequestId: scrapeRequest.id,
          username,
          status: "pending",
        },
      });

      return NextResponse.json({
        message: "Scrape request submitted successfully",
        requestId: userRequest.id,
        scrapeRequestId: scrapeRequest.id,
        queuedRequestId: queuedRequest.id,
        alreadyQueued: false,
      });
    }
  } catch (error) {
    console.error("Scrape request error:", error);
    return NextResponse.json(
      { error: "Failed to process scrape request" },
      { status: 500 }
    );
  }
}
