import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

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

    // Fetch all scrape requests for the user, ordered by most recent first
    const scrapeRequests = await prisma.scrapeRequest.findMany({
      where: {
        userId: dbUser.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        instagramProfile: {
          select: {
            username: true,
            profilePicUrl: true,
          },
        },
      },
    });

    return NextResponse.json({
      scrapeRequests: scrapeRequests.map((req) => ({
        id: req.id,
        username: req.username,
        status: req.status,
        createdAt: req.createdAt,
        updatedAt: req.updatedAt,
        error: req.error,
        profilePicUrl: req.instagramProfile?.profilePicUrl,
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
