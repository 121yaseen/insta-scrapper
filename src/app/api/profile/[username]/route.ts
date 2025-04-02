import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { InstagramScraper } from "@/services/instagram-scraper";

interface PostData {
  postId: string;
  shortcode: string;
  caption?: string;
  mediaType?: string;
  mediaUrl?: string;
  likesCount?: number;
  commentsCount?: number;
  timestamp?: Date;
}

interface ReelData {
  reelId: string;
  shortcode: string;
  caption?: string;
  mediaUrl?: string;
  viewsCount?: number;
  likesCount?: number;
  commentsCount?: number;
  timestamp?: Date;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    // Get authenticated user
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { username } = params;

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
            timestamp: "desc",
          },
          take: 6,
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

      // Profile doesn't exist and no pending request, create a mock profile for demo
      // In a real app, you would create a scrape request here
      const mockData = await InstagramScraper.scrapeProfile(username);

      if (mockData) {
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

        // Create a profile
        profile = await prisma.instagramProfile.create({
          data: {
            username: mockData.username,
            fullName: mockData.fullName,
            bio: mockData.bio,
            profilePicUrl: mockData.profilePicUrl,
            followersCount: mockData.followersCount,
            followingCount: mockData.followingCount,
            postsCount: mockData.postsCount,
            isVerified: mockData.isVerified,
            isPrivate: mockData.isPrivate,
            posts: {
              create:
                mockData.posts?.map((post: PostData) => ({
                  postId: post.postId,
                  shortcode: post.shortcode,
                  caption: post.caption,
                  mediaType: post.mediaType,
                  mediaUrl: post.mediaUrl,
                  likesCount: post.likesCount,
                  commentsCount: post.commentsCount,
                  timestamp: post.timestamp,
                })) || [],
            },
            reels: {
              create:
                mockData.reels?.map((reel: ReelData) => ({
                  reelId: reel.reelId,
                  shortcode: reel.shortcode,
                  caption: reel.caption,
                  mediaUrl: reel.mediaUrl,
                  viewsCount: reel.viewsCount,
                  likesCount: reel.likesCount,
                  commentsCount: reel.commentsCount,
                  timestamp: reel.timestamp,
                })) || [],
            },
            scrapeRequests: {
              create: {
                username: mockData.username,
                status: "completed",
                userId: dbUser.id,
              },
            },
          },
          include: {
            posts: {
              orderBy: {
                timestamp: "desc",
              },
              take: 12,
            },
            reels: {
              orderBy: {
                timestamp: "desc",
              },
              take: 6,
            },
          },
        });
      } else {
        return NextResponse.json(
          { error: "Failed to retrieve profile data" },
          { status: 404 }
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
