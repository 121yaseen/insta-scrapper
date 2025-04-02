import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { InstagramScraper } from "@/services/instagram-scraper";

export async function GET(
  req: NextRequest,
  context: { params: { username: string } }
) {
  try {
    // Get authenticated user
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { username } = context.params;

    if (!username) {
      return NextResponse.json(
        { error: "Instagram username is required" },
        { status: 400 }
      );
    }

    // Check if the Instagram profile exists
    let profile = await prisma.instagramProfile.findUnique({
      where: { username },
      include: {
        posts: {
          orderBy: {
            timestamp: "desc",
          },
          take: 12,
        },
        reels: {
          orderBy: {
            createdAt: "desc",
          },
          take: 10,
        },
      },
    });

    // If profile doesn't exist, check if there's a pending scrape request
    if (!profile) {
      const pendingRequest = await prisma.scrapeRequest.findFirst({
        where: {
          username,
          status: {
            in: ["pending", "processing"],
          },
        },
      });

      if (pendingRequest) {
        return NextResponse.json(
          {
            message: "Profile data is currently being processed",
            status: pendingRequest.status,
          },
          { status: 202 }
        );
      }

      // Profile doesn't exist and no pending request, simulate scraping
      try {
        // Create a user if it doesn't exist
        let dbUser = await prisma.user.findFirst({
          where: {
            clerkId: userId,
          },
        });

        if (!dbUser) {
          dbUser = await prisma.user.create({
            data: {
              clerkId: userId,
              email: `user-${userId}@example.com`, // This would come from Clerk in a real app
              name: "Demo User",
            },
          });
        }

        // Create a scrape request
        const scrapeRequest = await prisma.scrapeRequest.create({
          data: {
            username,
            status: "processing",
            userId: dbUser.id,
          },
        });

        // Process the request (normally this would be done by a background job)
        await InstagramScraper.processScrapeRequest(scrapeRequest.id);

        // Fetch the newly created profile
        profile = await prisma.instagramProfile.findUnique({
          where: { username },
          include: {
            posts: {
              orderBy: {
                timestamp: "desc",
              },
              take: 12,
            },
            reels: {
              orderBy: {
                createdAt: "desc",
              },
              take: 10,
            },
          },
        });

        if (!profile) {
          throw new Error("Failed to create profile");
        }
      } catch (error) {
        console.error("Error creating profile:", error);
        return NextResponse.json(
          { error: "Failed to retrieve profile data" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      profile,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to retrieve profile data" },
      { status: 500 }
    );
  }
}
