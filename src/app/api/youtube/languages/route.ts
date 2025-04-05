import { NextResponse } from "next/server";

// Mark this route as dynamic to prevent build errors
export const dynamic = "force-dynamic";

// Define types for language data
interface Language {
  code: string;
  name: string;
}

// Cache for languages to avoid excessive API requests
let languagesCache: Language[] | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 86400000; // 24 hours in milliseconds

/**
 * GET handler for fetching all available YouTube languages
 */
export async function GET() {
  try {
    // Use cache if it's fresh
    const now = Date.now();
    if (languagesCache && now - lastFetchTime < CACHE_DURATION) {
      return NextResponse.json({ languages: languagesCache });
    }

    // Otherwise fetch from YouTube API
    const response = await fetch(
      "https://www.googleapis.com/youtube/v3/i18nLanguages?part=snippet&key=" +
        process.env.YOUTUBE_API_KEY
    );

    if (!response.ok) {
      throw new Error(`Error fetching languages: ${response.status}`);
    }

    const data = await response.json();

    // Add null check for items array
    if (!data.items || !Array.isArray(data.items)) {
      throw new Error("Invalid response format from YouTube API");
    }

    // Process the data
    const languages: Language[] = data.items
      .map((item: any) => {
        // Add null checks to prevent errors
        if (!item || !item.id || !item.snippet || !item.snippet.name) {
          return null;
        }

        return {
          code: item.id,
          name: item.snippet.name,
        };
      })
      .filter(Boolean) as Language[]; // Remove any null entries

    // Update cache
    languagesCache = languages;
    lastFetchTime = now;

    return NextResponse.json({ languages });
  } catch (error) {
    console.error("Error fetching YouTube languages:", error);

    // Return an empty array instead of failing completely
    return NextResponse.json(
      {
        languages: [],
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
