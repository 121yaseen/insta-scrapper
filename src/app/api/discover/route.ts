import { NextResponse } from "next/server";

// Mark this route as dynamic to prevent build errors
export const dynamic = "force-dynamic";

// Import types from our service
import { ApiResponse } from "@/services/discoverService";

// Default parameters
const defaultParams = {
  platform: "instagram",
  sort_by: {
    field: "FOLLOWER_COUNT",
    order: "DESCENDING",
  },
  has_contact_details: false,
  is_verified: false,
  has_sponsored_posts: false,
  include_business_accounts: false,
  offset: 0,
};

// Map our internal sort fields to the external API's expected fields
const mapSortField = (field: string): string => {
  switch (field) {
    case "AVERAGE_LIKES":
      return "AVERAGE_LIKES";
    case "ENGAGEMENT_RATE":
      return "ENGAGEMENT_RATE";
    case "FOLLOWER_COUNT":
    default:
      return "FOLLOWER_COUNT";
  }
};

export async function POST(request: Request) {
  try {
    // Extract request parameters from the client
    const requestParams = await request.json();

    // Only include essential parameters for the external API request
    const apiParams: any = {
      platform: "instagram",
      sort_by: {
        field: requestParams.sort_by?.field || "FOLLOWER_COUNT",
        order: requestParams.sort_by?.order || "DESCENDING",
      },
      has_contact_details:
        requestParams.has_contact_details === undefined
          ? false
          : requestParams.has_contact_details,
      is_verified:
        requestParams.is_verified === undefined
          ? false
          : requestParams.is_verified,
      has_sponsored_posts:
        requestParams.has_sponsored_posts === undefined
          ? false
          : requestParams.has_sponsored_posts,
      include_business_accounts:
        requestParams.include_business_accounts === undefined
          ? false
          : requestParams.include_business_accounts,
      offset: requestParams.offset || 0,
    };

    // Format creator_locations if needed (this is a key parameter from the successful request)
    if (
      Array.isArray(requestParams.creator_locations) &&
      requestParams.creator_locations.length > 0
    ) {
      apiParams.creator_locations = requestParams.creator_locations;
    }

    // Add creator_language if specified (for Malayalam language support)
    if (requestParams.creator_language) {
      apiParams.creator_language = requestParams.creator_language;
    }

    // Handle search parameters if present
    if (requestParams.username) {
      apiParams.username = requestParams.username;
    }

    if (requestParams.searchField) {
      apiParams.searchField = requestParams.searchField;
    }

    console.log("API request params:", JSON.stringify(apiParams));

    // Make the external API call from the server
    const response = await fetch(
      "https://apigw.impulze.ai/api/v1/customer/discoverProfiles",
      {
        method: "POST",
        headers: {
          accept: "application/json, text/plain, */*",
          "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
          "content-type": "application/json",
          origin: "https://socialiq.impulze.ai",
          priority: "u=1, i",
          referer: "https://socialiq.impulze.ai/",
          "sec-ch-ua":
            '"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"macOS"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-site",
          "user-agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
          "x-access-token":
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2N2YyMThhYTgyY2VhMTIxNGY2ZDUzOTkiLCJpYXQiOjE3NDM5MTkyNzQsImV4cCI6MTc3NTQ1NTI3NH0.8QetT4C_Bf1yQxh0p0dRL_y2QhYonYQ1IllZi4PyihI",
        },
        body: JSON.stringify(apiParams),
      }
    );

    if (!response.ok) {
      // Add status code and response text to error for debugging
      const responseText = await response.text();

      // Try to parse the response if it's JSON
      try {
        const errorData = JSON.parse(responseText);

        // Check for access limit error (code 423)
        if (response.status === 423 || errorData?.name === "AccessLimited") {
          return NextResponse.json(
            {
              error:
                "Access limited: You've reached your API usage limit. Please try again later or upgrade your plan.",
              name: errorData?.name || "AccessLimited",
              field: errorData?.field || "influencerSearch",
            },
            { status: 423 }
          );
        }
      } catch (e) {
        // If parsing fails, just use the text as is
      }

      throw new Error(
        `API request failed with status ${response.status}: ${responseText}`
      );
    }

    // Parse and return the API response
    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in discover API:", error);

    // Format error message
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";

    // Check if it's an API error with status code included
    const statusMatch = errorMessage.match(
      /API request failed with status (\d+)/
    );
    const status = statusMatch ? parseInt(statusMatch[1]) : 500;

    return NextResponse.json({ error: errorMessage }, { status });
  }
}
