import { NextResponse } from "next/server";
import { SearchService } from "@/services/search/SearchService";
import { SearchQuery } from "@/services/search/interfaces/SearchQuery";
import { ImpulzeProvider } from "@/services/search/providers/ImpulzeProvider";
import { ModashProvider } from "@/services/search/providers/ModashProvider";
import { AggregationStrategy } from "@/services/search/aggregators/SearchAggregator";

// Mark this route as dynamic to prevent build errors
export const dynamic = "force-dynamic";

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

// Fallback access token
const FALLBACK_ACCESS_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2N2YyMThhYTgyY2VhMTIxNGY2ZDUzOTkiLCJpYXQiOjE3NDM5MTkyNzQsImV4cCI6MTc3NTQ1NTI3NH0.8QetT4C_Bf1yQxh0p0dRL_y2QhYonYQ1IllZi4PyihI";

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

/**
 * Direct implementation of the Impulze API call without using the search service
 * This ensures we have a working fallback if the search service has issues
 */
async function directImpulzeCall(requestParams: any): Promise<any> {
  try {
    console.log("Making direct Impulze API call");

    // Format the request body exactly as in the original implementation
    const apiParams: any = {
      platform: requestParams.platform || "instagram",
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

    // Add optional parameters if they exist
    if (
      Array.isArray(requestParams.creator_locations) &&
      requestParams.creator_locations.length > 0
    ) {
      apiParams.creator_locations = requestParams.creator_locations;
    }

    if (requestParams.creator_language) {
      apiParams.creator_language = requestParams.creator_language;
    }

    if (requestParams.username) {
      apiParams.username = requestParams.username;
    }

    if (requestParams.searchField) {
      apiParams.searchField = requestParams.searchField;
    }

    console.log("Direct API request params:", JSON.stringify(apiParams));

    // Make the request with all needed headers
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
          "x-access-token": FALLBACK_ACCESS_TOKEN,
        },
        body: JSON.stringify(apiParams),
      }
    );

    if (!response.ok) {
      const responseText = await response.text();

      try {
        const errorData = JSON.parse(responseText);

        if (response.status === 423 || errorData?.name === "AccessLimited") {
          throw new Error(
            "Access limited: You've reached your API usage limit. Please try again later or upgrade your plan."
          );
        }
      } catch (e) {
        // If parsing fails, just use the text as is
      }

      throw new Error(
        `API request failed with status ${response.status}: ${responseText}`
      );
    }

    // Return the raw API response
    return await response.json();
  } catch (error) {
    console.error("Error in direct Impulze API call:", error);
    throw error;
  }
}

/**
 * Use the search aggregator with all providers
 */
async function useSearchAggregator(searchQuery: SearchQuery): Promise<any> {
  // Initialize the search service
  const searchService = await SearchService.getInstance().initialize();

  // Override the aggregation strategy to use ALL providers instead of highest priority only
  console.log(
    "Setting aggregation strategy to ALL to ensure both providers are used"
  );
  searchService.updateAggregationStrategy(AggregationStrategy.ALL);

  // Create providers with appropriate configuration
  const impulzeProvider = new ImpulzeProvider({
    accessToken: FALLBACK_ACCESS_TOKEN,
  });

  // Create ModashProvider - it now uses hardcoded cookies internally
  const modashProvider = new ModashProvider();
  console.log("Created ModashProvider and ImpulzeProvider instances");

  // Register the providers with the search service
  searchService.addProvider(impulzeProvider);
  searchService.addProvider(modashProvider);
  console.log("Registered both providers with search service");

  // Execute search with all providers
  console.log("Executing search with all providers");
  return await searchService.search(searchQuery);
}

export async function POST(request: Request) {
  try {
    console.log("Discover API POST endpoint called");

    // Extract request parameters from the client
    const requestParams = await request.json();
    console.log("Request parameters:", JSON.stringify(requestParams));

    // No need to extract cookies from the request anymore

    // Try three approaches in sequence to ensure we get a response
    let result;
    let responseData;

    // Map request parameters to our standardized SearchQuery format
    const searchQuery: SearchQuery = {
      platform: requestParams.platform || "instagram",
      sortBy: {
        field: requestParams.sort_by?.field || "FOLLOWER_COUNT",
        order: requestParams.sort_by?.order || "DESCENDING",
      },
      hasContactDetails: requestParams.has_contact_details,
      isVerified: requestParams.is_verified,
      hasSponsoredPosts: requestParams.has_sponsored_posts,
      includeBusinessAccounts: requestParams.include_business_accounts,
      offset: requestParams.offset || 0,
      limit: requestParams.limit || 20,
      username: requestParams.username,
      searchField: requestParams.searchField,
      creatorLocations: requestParams.creator_locations,
      creatorLanguage: requestParams.creator_language,
    };

    // If the search includes keywords, add them to extendedParams
    if (requestParams.keywords) {
      searchQuery.extendedParams = {
        keywords: requestParams.keywords,
      };
    }

    try {
      // Try using the search aggregator with all providers
      result = await useSearchAggregator(searchQuery);
      console.log("Aggregator returned", result.profiles.length, "profiles");

      // Format the response for the client
      responseData = {
        message: "Success",
        dataCount: result.profiles.length,
        totalCount: result.totalCount || result.profiles.length,
        data: result.profiles.map((profile: any) => ({
          // Map our standard profile format back to the client-expected format
          work_platform: {
            id: profile.platform,
            name:
              profile.platform.charAt(0).toUpperCase() +
              profile.platform.slice(1),
          },
          platform_username: profile.platformUsername,
          external_id: profile.externalId,
          url: profile.url,
          image_url: profile.imageUrl,
          full_name: profile.fullName,
          introduction: profile.introduction,
          is_verified: profile.isVerified,
          platform_account_type: profile.accountType,
          gender: profile.gender,
          age_group: profile.ageGroup,
          language: profile.language,
          follower_count: profile.followerCount,
          subscriber_count: profile.subscriberCount,
          content_count: profile.contentCount,
          engagement_rate: profile.engagementRate,
          average_likes: profile.averageLikes,
          average_views: profile.averageViews,
          creator_location: profile.location,
          contact_details: profile.contactDetails,
          filter_match: profile.metadata?.filterMatch || {},
          livestream_metrics: profile.metadata?.livestreamMetrics || {},
        })),
        metadata: {
          providers: result.providerIds || [result.provider],
          totalCount: result.totalCount,
          providerInfo: `Used ${
            result.providerIds ? result.providerIds.join(", ") : result.provider
          } provider(s)`,
        },
      };

      console.log(
        "About to return aggregator response:",
        JSON.stringify({
          message: responseData.message,
          dataCount: responseData.dataCount,
          totalCount: responseData.totalCount,
        })
      );

      return NextResponse.json(responseData);
    } catch (aggregatorError) {
      console.error(
        "Search aggregator failed, trying direct Impulze API:",
        aggregatorError
      );

      try {
        // Fallback to direct Impulze API call
        const directResponse = await directImpulzeCall(requestParams);
        console.log(
          `Direct API call returned ${
            directResponse?.data?.length || 0
          } profiles`
        );

        // Format the response for the client
        return NextResponse.json(directResponse);
      } catch (directError) {
        console.error("All API request approaches failed:", directError);

        return NextResponse.json(
          {
            error: "All API request approaches failed. Please try again later.",
          },
          { status: 500 }
        );
      }
    }
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
