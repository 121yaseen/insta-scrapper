import { NextRequest, NextResponse } from "next/server";

// Mark this route as dynamic to prevent build errors
export const dynamic = "force-dynamic";

// Cache the locations data to avoid making too many requests
let cachedLocations: any[] | null = null;
let lastFetchTime: number = 0;
const CACHE_DURATION = 3600000; // 1 hour in milliseconds

export async function GET(request: NextRequest) {
  try {
    const currentTime = Date.now();

    // Use cached data if available and not expired
    if (cachedLocations && currentTime - lastFetchTime < CACHE_DURATION) {
      return NextResponse.json({ locations: cachedLocations });
    }

    // Get access token from request headers if available
    const accessToken =
      request.headers.get("x-access-token") ||
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2N2YyMThhYTgyY2VhMTIxNGY2ZDUzOTkiLCJpYXQiOjE3NDM5MTkyNzQsImV4cCI6MTc3NTQ1NTI3NH0.8QetT4C_Bf1yQxh0p0dRL_y2QhYonYQ1IllZi4PyihI";

    // Prepare headers
    const headers: HeadersInit = {
      accept: "application/json, text/plain, */*",
      "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
      origin: "https://socialiq.impulze.ai",
      referer: "https://socialiq.impulze.ai/",
      "sec-ch-ua":
        '"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"macOS"',
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
    };

    // If access token is provided, add it to headers
    if (accessToken) {
      headers["x-access-token"] = accessToken;
    }

    // Fetch from external API
    const response = await fetch(
      "https://apigw.impulze.ai/api/v1/misc/locations",
      {
        headers,
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch locations: ${response.status}`);
    }

    const data = await response.json();

    // Update cache
    cachedLocations = data.locations;
    lastFetchTime = currentTime;

    return NextResponse.json({ locations: data.locations });
  } catch (error) {
    console.error("Error fetching locations:", error);
    return NextResponse.json(
      { error: "Failed to fetch locations" },
      { status: 500 }
    );
  }
}
