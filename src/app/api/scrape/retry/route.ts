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

    // Update the request status back to pending
    const updatedRequest = await prisma.scrapeRequest.update({
      where: { id: requestId },
      data: {
        status: "pending",
        error: null,
      },
    });

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
