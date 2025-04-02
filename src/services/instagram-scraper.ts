import axios from "axios";
import { prisma } from "@/lib/prisma";

interface InstagramData {
  username: string;
  fullName?: string;
  bio?: string;
  profilePicUrl?: string;
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
  isVerified?: boolean;
  isPrivate?: boolean;
  posts?: any[];
  reels?: any[];
}

export class InstagramScraper {
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

      // For demo purposes, we'll generate mock data
      // In a real application, you would implement actual scraping logic
      const mockData: InstagramData = {
        username,
        fullName: `${
          username.charAt(0).toUpperCase() + username.slice(1)
        } User`,
        bio: `This is a mock bio for ${username}`,
        profilePicUrl: `https://ui-avatars.com/api/?name=${username}&background=random`,
        followersCount: Math.floor(Math.random() * 10000),
        followingCount: Math.floor(Math.random() * 1000),
        postsCount: Math.floor(Math.random() * 100),
        isVerified: Math.random() > 0.8,
        isPrivate: Math.random() > 0.7,
        posts: Array.from({ length: 12 }, (_, i) => ({
          postId: `post_${username}_${i}`,
          shortcode: `shortcode_${username}_${i}`,
          caption: `Post caption ${i} for ${username}`,
          mediaType: Math.random() > 0.3 ? "image" : "video",
          mediaUrl: `https://picsum.photos/500/500?random=${i}`,
          likesCount: Math.floor(Math.random() * 1000),
          commentsCount: Math.floor(Math.random() * 100),
          timestamp: new Date(
            Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
          ),
        })),
        reels: Array.from({ length: 6 }, (_, i) => ({
          reelId: `reel_${username}_${i}`,
          shortcode: `shortcode_reel_${username}_${i}`,
          caption: `Reel caption ${i} for ${username}`,
          mediaUrl: `https://picsum.photos/500/800?random=${i + 100}`,
          viewsCount: Math.floor(Math.random() * 5000),
          likesCount: Math.floor(Math.random() * 2000),
          commentsCount: Math.floor(Math.random() * 200),
          timestamp: new Date(
            Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000
          ),
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

      // Check if profile already exists
      let profile = await prisma.instagramProfile.findUnique({
        where: { username: request.username },
      });

      // Create or update the profile
      if (profile) {
        profile = await prisma.instagramProfile.update({
          where: { id: profile.id },
          data: {
            fullName: instagramData.fullName,
            bio: instagramData.bio,
            profilePicUrl: instagramData.profilePicUrl,
            followersCount: instagramData.followersCount,
            followingCount: instagramData.followingCount,
            postsCount: instagramData.postsCount,
            isVerified: instagramData.isVerified,
            isPrivate: instagramData.isPrivate,
            lastScraped: new Date(),
          },
        });
      } else {
        profile = await prisma.instagramProfile.create({
          data: {
            username: instagramData.username,
            fullName: instagramData.fullName,
            bio: instagramData.bio,
            profilePicUrl: instagramData.profilePicUrl,
            followersCount: instagramData.followersCount,
            followingCount: instagramData.followingCount,
            postsCount: instagramData.postsCount,
            isVerified: instagramData.isVerified,
            isPrivate: instagramData.isPrivate,
          },
        });
      }

      // Process posts
      if (instagramData.posts && instagramData.posts.length > 0) {
        for (const postData of instagramData.posts) {
          // Check if post exists
          const existingPost = await prisma.post.findUnique({
            where: { postId: postData.postId },
          });

          if (existingPost) {
            // Update existing post
            await prisma.post.update({
              where: { id: existingPost.id },
              data: {
                caption: postData.caption,
                mediaType: postData.mediaType,
                mediaUrl: postData.mediaUrl,
                likesCount: postData.likesCount,
                commentsCount: postData.commentsCount,
                timestamp: postData.timestamp,
              },
            });
          } else {
            // Create new post
            await prisma.post.create({
              data: {
                postId: postData.postId,
                shortcode: postData.shortcode,
                caption: postData.caption,
                mediaType: postData.mediaType,
                mediaUrl: postData.mediaUrl,
                likesCount: postData.likesCount,
                commentsCount: postData.commentsCount,
                timestamp: postData.timestamp,
                instagramProfileId: profile.id,
              },
            });
          }
        }
      }

      // Process reels
      if (instagramData.reels && instagramData.reels.length > 0) {
        for (const reelData of instagramData.reels) {
          // Check if reel exists
          const existingReel = await prisma.reel.findUnique({
            where: { reelId: reelData.reelId },
          });

          if (existingReel) {
            // Update existing reel
            await prisma.reel.update({
              where: { id: existingReel.id },
              data: {
                caption: reelData.caption,
                mediaUrl: reelData.mediaUrl,
                viewsCount: reelData.viewsCount,
                likesCount: reelData.likesCount,
                commentsCount: reelData.commentsCount,
                timestamp: reelData.timestamp,
              },
            });
          } else {
            // Create new reel
            await prisma.reel.create({
              data: {
                reelId: reelData.reelId,
                shortcode: reelData.shortcode,
                caption: reelData.caption,
                mediaUrl: reelData.mediaUrl,
                viewsCount: reelData.viewsCount,
                likesCount: reelData.likesCount,
                commentsCount: reelData.commentsCount,
                timestamp: reelData.timestamp,
                instagramProfileId: profile.id,
              },
            });
          }
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
