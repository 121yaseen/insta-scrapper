import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// Mark this route as dynamic to prevent build errors
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Get authenticated user
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find user in database
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: "User not found in database" },
        { status: 404 }
      );
    }

    // Fetch all user requests for the user, joined with queue data and scrape requests
    const userRequests = await prisma.userRequest.findMany({
      where: {
        userId: dbUser.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        queuedRequest: {
          include: {
            scrapeRequest: true,
          },
        },
        instagramProfile: {
          select: {
            username: true,
            profilePicUrl: true,
            id: true,
            lastScraped: true,
          },
        },
      },
    });

    // Fetch all completed scrape requests to cross-reference
    const completedScrapeRequests = await prisma.scrapeRequest.findMany({
      where: {
        status: "completed",
        username: {
          in: userRequests.map((req) => req.username),
        },
      },
    });

    // Create a map of completed usernames for quick lookup
    const completedUsernames = new Set(
      completedScrapeRequests.map((req) => req.username)
    );

    return NextResponse.json({
      scrapeRequests: userRequests.map((req) => {
        // If we have an Instagram profile and the username is in our completed set, it's definitely completed
        const isCompleted =
          !!req.instagramProfile || completedUsernames.has(req.username);

        // Determine the correct status
        let status = req.queuedRequest?.scrapeRequest?.status;
        if (!status) {
          status = req.queuedRequest?.status;
        }

        // If we have evidence of completion but status is still pending, override it
        if (isCompleted && (!status || status === "pending")) {
          status = "completed";
        }

        // If no status is determined yet, use pending as fallback
        if (!status) {
          status = "pending";
        }

        return {
          id: req.queuedRequest?.scrapeRequest?.id || req.id,
          username: req.username,
          status: status,
          createdAt: req.createdAt,
          updatedAt: req.queuedRequest?.updatedAt || req.createdAt,
          error: req.queuedRequest?.scrapeRequest?.error,
          profilePicUrl: req.instagramProfile?.profilePicUrl,
          lastQueued: req.queuedRequest?.lastQueued,
          queuedRequestId: req.queuedRequest?.id,
        };
      }),
    });
  } catch (error) {
    console.error("Error fetching scrape history:", error);
    return NextResponse.json(
      { error: "Failed to fetch scrape history" },
      { status: 500 }
    );
  }
}
