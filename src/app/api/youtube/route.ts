import { NextResponse } from "next/server";
import {
  fetchYouTubeVideoData,
  fetchYouTubeCaptions,
} from "@/services/youtubeService";

// Cache to prevent excessive API calls
let metadataCache: Record<
  string,
  {
    data: any;
    timestamp: number;
  }
> = {};
const CACHE_DURATION = 3600000; // 1 hour in milliseconds

// Mark this route as dynamic to prevent build errors
export const dynamic = "force-dynamic";

/**
 * GET handler for fetching YouTube video metadata
 */
export async function GET(request: Request) {
  try {
    // Get video ID from request URL
    const url = new URL(request.url);
    const videoId = url.searchParams.get("videoId");
    const lang = url.searchParams.get("lang");

    if (!videoId) {
      return NextResponse.json(
        { error: "VideoId is required" },
        { status: 400 }
      );
    }

    // Check if we're requesting captions for a specific language
    if (lang && url.searchParams.has("captions")) {
      const captionUrl = url.searchParams.get("captionUrl");
      if (!captionUrl) {
        return NextResponse.json(
          { error: "CaptionUrl is required for captions request" },
          { status: 400 }
        );
      }

      const captions = await fetchYouTubeCaptions(captionUrl, lang);

      if (!captions) {
        return NextResponse.json(
          { error: "Failed to fetch captions" },
          { status: 500 }
        );
      }

      return NextResponse.json({ captions });
    }

    // Check cache for video metadata
    const cacheKey = videoId;
    const currentTime = Date.now();

    if (
      metadataCache[cacheKey] &&
      currentTime - metadataCache[cacheKey].timestamp < CACHE_DURATION
    ) {
      return NextResponse.json(metadataCache[cacheKey].data);
    }

    // Fetch fresh data from YouTube
    const videoData = await fetchYouTubeVideoData(videoId);

    if (!videoData) {
      return NextResponse.json(
        { error: "Failed to fetch video data" },
        { status: 500 }
      );
    }

    // Store in cache
    metadataCache[cacheKey] = {
      data: { videoData },
      timestamp: currentTime,
    };

    return NextResponse.json({ videoData });
  } catch (error) {
    console.error("Error in YouTube API route:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
