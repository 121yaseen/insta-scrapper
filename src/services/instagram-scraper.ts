import { prisma } from "@/lib/prisma";

// New format from the JSON file
interface ReelData {
  id: string;
  url: string;
  thumbnail: string | null;
  views: number | null;
  likes: number | null;
  comments: number | null;
  posted_date: string | null;
}

// New format from JSON
interface InstagramData {
  username: string;
  scrape_time?: string;
  full_name?: string;
  is_verified?: boolean;
  bio?: string;
  external_url?: string | null;
  profile_pic_url?: string;
  is_private?: boolean;
  posts_count?: number;
  followers_count?: number;
  following_count?: number;
  recent_posts?: unknown[];
  reels_count?: number;
  reels?: ReelData[];
}

// Converted format for database
interface ConvertedProfileData {
  username: string;
  fullName?: string;
  bio?: string;
  profilePicUrl?: string;
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
  isVerified?: boolean;
  isPrivate?: boolean;
  scrapeTime?: Date;
  externalUrl?: string | null;
  reelsCount?: number;
}

// Converted reel format for database
interface ConvertedReelData {
  reelId: string;
  url?: string | null;
  thumbnail?: string | null;
  views?: number | null;
  likes?: number | null;
  comments?: number | null;
  postedDate?: Date | null;
}

export class InstagramScraper {
  /**
   * Convert new format to database format
   */
  private static convertToDbFormat(data: InstagramData): {
    profile: ConvertedProfileData;
    reels: ConvertedReelData[];
  } {
    // Convert profile data
    const profile: ConvertedProfileData = {
      username: data.username,
      fullName: data.full_name,
      bio: data.bio || "",
      profilePicUrl: data.profile_pic_url,
      followersCount: data.followers_count,
      followingCount: data.following_count,
      postsCount: data.posts_count,
      isVerified: data.is_verified,
      isPrivate: data.is_private,
      scrapeTime: data.scrape_time ? new Date(data.scrape_time) : new Date(),
      externalUrl: data.external_url,
      reelsCount: data.reels_count,
    };

    // Convert reels data
    const reels: ConvertedReelData[] = (data.reels || []).map((reel) => ({
      reelId: reel.id,
      url: reel.url,
      thumbnail: reel.thumbnail,
      views: reel.views,
      likes: reel.likes,
      comments: reel.comments,
      postedDate: reel.posted_date ? new Date(reel.posted_date) : null,
    }));

    return { profile, reels };
  }

  /**
   * Scrape Instagram profile and save to database
   */
  static async scrapeProfile(username: string): Promise<InstagramData | null> {
    try {
      // In a real application, you'd use a proper scraping service like Apify or Puppeteer
      // This is a placeholder that simulates fetching Instagram data
      console.log(`Scraping Instagram profile for ${username}...`);

      // Simulate delay for API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // For demo purposes, we'll generate mock data in the new format
      const mockData: InstagramData = {
        username,
        scrape_time: new Date().toISOString(),
        full_name: `${
          username.charAt(0).toUpperCase() + username.slice(1)
        } User`,
        is_verified: Math.random() > 0.8,
        bio: `This is a mock bio for ${username}`,
        external_url:
          Math.random() > 0.5 ? `https://www.example.com/${username}` : null,
        profile_pic_url: `https://ui-avatars.com/api/?name=${username}&background=random`,
        is_private: Math.random() > 0.7,
        posts_count: Math.floor(Math.random() * 100),
        followers_count: Math.floor(Math.random() * 10000),
        following_count: Math.floor(Math.random() * 1000),
        recent_posts: [],
        reels_count: 10,
        reels: Array.from({ length: 10 }, (_, i) => ({
          id: `reel_${i}`,
          url: `https://www.instagram.com/${username}/reel/reel_${i}/`,
          thumbnail: null,
          views: Math.floor(Math.random() * 5000),
          likes: Math.floor(Math.random() * 2000),
          comments: Math.floor(Math.random() * 200),
          posted_date: null,
        })),
      };

      return mockData;
    } catch (error) {
      console.error(`Error scraping Instagram profile for ${username}:`, error);
      return null;
    }
  }

  /**
   * Process a scrape request from the queue
   */
  static async processScrapeRequest(requestId: string): Promise<void> {
    try {
      // Get the scrape request
      const request = await prisma.scrapeRequest.findUnique({
        where: { id: requestId },
      });

      if (!request) {
        throw new Error(`Scrape request ${requestId} not found`);
      }

      // Update request status
      await prisma.scrapeRequest.update({
        where: { id: requestId },
        data: { status: "processing" },
      });

      // Scrape the profile
      const instagramData = await this.scrapeProfile(request.username);

      if (!instagramData) {
        throw new Error(
          `Failed to scrape Instagram profile for ${request.username}`
        );
      }

      // Convert to database format
      const { profile: convertedProfile, reels: convertedReels } =
        this.convertToDbFormat(instagramData);

      // Check if profile already exists
      let profile = await prisma.instagramProfile.findUnique({
        where: { username: request.username },
      });

      // Create or update the profile
      if (profile) {
        profile = await prisma.instagramProfile.update({
          where: { id: profile.id },
          data: {
            fullName: convertedProfile.fullName,
            bio: convertedProfile.bio,
            profilePicUrl: convertedProfile.profilePicUrl,
            followersCount: convertedProfile.followersCount,
            followingCount: convertedProfile.followingCount,
            postsCount: convertedProfile.postsCount,
            isVerified: convertedProfile.isVerified,
            isPrivate: convertedProfile.isPrivate,
            lastScraped: new Date(),
            // Add these fields only if they exist in the schema
            ...(convertedProfile.externalUrl !== undefined && {
              externalUrl: convertedProfile.externalUrl,
            }),
            ...(convertedProfile.reelsCount !== undefined && {
              reelsCount: convertedProfile.reelsCount,
            }),
            ...(convertedProfile.scrapeTime !== undefined && {
              scrapeTime: convertedProfile.scrapeTime,
            }),
          },
        });
      } else {
        profile = await prisma.instagramProfile.create({
          data: {
            username: convertedProfile.username,
            fullName: convertedProfile.fullName,
            bio: convertedProfile.bio,
            profilePicUrl: convertedProfile.profilePicUrl,
            followersCount: convertedProfile.followersCount,
            followingCount: convertedProfile.followingCount,
            postsCount: convertedProfile.postsCount,
            isVerified: convertedProfile.isVerified,
            isPrivate: convertedProfile.isPrivate,
            // Add these fields only if they exist in the schema
            ...(convertedProfile.externalUrl !== undefined && {
              externalUrl: convertedProfile.externalUrl,
            }),
            ...(convertedProfile.reelsCount !== undefined && {
              reelsCount: convertedProfile.reelsCount,
            }),
            ...(convertedProfile.scrapeTime !== undefined && {
              scrapeTime: convertedProfile.scrapeTime,
            }),
          },
        });
      }

      // Process reels
      if (convertedReels.length > 0) {
        // Delete existing reels first to avoid duplicates
        await prisma.reel.deleteMany({
          where: { instagramProfileId: profile.id },
        });

        // Create new reels
        for (const reelData of convertedReels) {
          await prisma.reel.create({
            data: {
              reelId: reelData.reelId,
              url: reelData.url,
              thumbnail: reelData.thumbnail,
              views: reelData.views,
              likes: reelData.likes,
              comments: reelData.comments,
              postedDate: reelData.postedDate,
              instagramProfileId: profile.id,
            },
          });
        }
      }

      // Update scrape request
      await prisma.scrapeRequest.update({
        where: { id: requestId },
        data: {
          status: "completed",
          instagramProfileId: profile.id,
        },
      });

      console.log(
        `Successfully processed scrape request ${requestId} for ${request.username}`
      );
    } catch (error) {
      console.error(`Error processing scrape request ${requestId}:`, error);

      // Update request status to failed
      await prisma.scrapeRequest.update({
        where: { id: requestId },
        data: {
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
        },
      });
    }
  }
}
