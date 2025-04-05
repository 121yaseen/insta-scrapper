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
          },
        },
      },
    });

    return NextResponse.json({
      scrapeRequests: userRequests.map((req) => ({
        id: req.queuedRequest?.scrapeRequest?.id || req.id,
        username: req.username,
        status:
          req.queuedRequest?.scrapeRequest?.status ||
          (req.queuedRequest
            ? req.queuedRequest.status
            : req.instagramProfile
            ? "completed"
            : "pending"),
        createdAt: req.createdAt,
        updatedAt: req.queuedRequest?.updatedAt || req.createdAt,
        error: req.queuedRequest?.scrapeRequest?.error,
        profilePicUrl: req.instagramProfile?.profilePicUrl,
        lastQueued: req.queuedRequest?.lastQueued,
        queuedRequestId: req.queuedRequest?.id,
      })),
    });
  } catch (error) {
    console.error("Error fetching scrape history:", error);
    return NextResponse.json(
      { error: "Failed to fetch scrape history" },
      { status: 500 }
    );
  }
}
