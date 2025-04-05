import { NextResponse } from "next/server";
import { fetchYouTubeVideoData } from "@/services/youtubeService";

// Cache to prevent excessive API calls
let languagesCache: {
  data: { code: string; name: string }[];
  timestamp: number;
} | null = null;

const CACHE_DURATION = 86400000; // 24 hours in milliseconds
const SAMPLE_VIDEO_ID = "W5WgPebBKqw"; // Sample video to get languages from

/**
 * GET handler for fetching all available YouTube languages
 */
export async function GET() {
  try {
    const currentTime = Date.now();

    // Check if we have valid cached data
    if (
      languagesCache &&
      currentTime - languagesCache.timestamp < CACHE_DURATION
    ) {
      return NextResponse.json({ languages: languagesCache.data });
    }

    // Fetch fresh data from YouTube
    const videoData = await fetchYouTubeVideoData(SAMPLE_VIDEO_ID);

    if (
      !videoData ||
      !videoData.availableLanguages ||
      videoData.availableLanguages.length === 0
    ) {
      return NextResponse.json(
        { error: "Failed to fetch language data" },
        { status: 500 }
      );
    }

    // Sort languages alphabetically by name
    const sortedLanguages = [...videoData.availableLanguages].sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    // Store in cache
    languagesCache = {
      data: sortedLanguages,
      timestamp: currentTime,
    };

    return NextResponse.json({ languages: sortedLanguages });
  } catch (error) {
    console.error("Error in YouTube languages API route:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
