import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    // Get authenticated user
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse the request body
    const body = await req.json();
    const { requestId } = body;

    if (!requestId) {
      return NextResponse.json(
        { error: "Request ID is required" },
        { status: 400 }
      );
    }

    // Verify the user owns this request
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: "User not found in database" },
        { status: 404 }
      );
    }

    // Find the scrape request
    const scrapeRequest = await prisma.scrapeRequest.findUnique({
      where: { id: requestId },
      include: {
        queuedRequest: true,
      },
    });

    if (!scrapeRequest) {
      return NextResponse.json(
        { error: "Scrape request not found" },
        { status: 404 }
      );
    }

    // Verify the user owns this request
    if (scrapeRequest.userId !== dbUser.id) {
      return NextResponse.json(
        { error: "You do not have permission to retry this request" },
        { status: 403 }
      );
    }

    // Create a new user request entry
    const userRequest = await prisma.userRequest.create({
      data: {
        username: scrapeRequest.username,
        userId: dbUser.id,
        instagramProfileId: scrapeRequest.instagramProfileId,
      },
    });

    // Update the request status back to pending
    const updatedRequest = await prisma.scrapeRequest.update({
      where: { id: requestId },
      data: {
        status: "pending",
        error: null,
      },
    });

    // Create or update the QueuedRequest
    // If there's already an associated QueuedRequest, update it
    if (scrapeRequest.queuedRequest) {
      await prisma.queuedRequest.update({
        where: {
          id: scrapeRequest.queuedRequest.id,
        },
        data: {
          status: "pending",
          lastQueued: new Date(),
          updatedAt: new Date(),
        },
      });
    } else {
      // Create a new QueuedRequest
      await prisma.queuedRequest.create({
        data: {
          userRequestId: userRequest.id,
          scrapeRequestId: updatedRequest.id,
          username: scrapeRequest.username,
          status: "pending",
        },
      });
    }

    return NextResponse.json({
      message: "Scrape request has been queued for retry",
      requestId: updatedRequest.id,
    });
  } catch (error) {
    console.error("Retry request error:", error);
    return NextResponse.json(
      { error: "Failed to process retry request" },
      { status: 500 }
    );
  }
}
