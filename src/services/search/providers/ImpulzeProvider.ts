import { BaseProvider } from "./BaseProvider";
import { SearchQuery } from "../interfaces/SearchQuery";
import { SearchResult, ProfileData } from "../interfaces/SearchResult";

/**
 * Provider for Impulze API
 */
export class ImpulzeProvider extends BaseProvider {
  public readonly id = "impulze";
  public readonly name = "Impulze Social IQ";
  public readonly priority = 1;
  public readonly baseUrl =
    "https://apigw.impulze.ai/api/v1/customer/discoverProfiles";
  public readonly accessToken: string;

  constructor(config?: Record<string, any>) {
    super(config);
    this.accessToken =
      config?.accessToken ||
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2N2YyMThhYTgyY2VhMTIxNGY2ZDUzOTkiLCJpYXQiOjE3NDM5MTkyNzQsImV4cCI6MTc3NTQ1NTI3NH0.8QetT4C_Bf1yQxh0p0dRL_y2QhYonYQ1IllZi4PyihI";
    console.log(
      "ImpulzeProvider initialized with token length:",
      this.accessToken.length
    );
  }

  /**
   * Always accept Instagram queries regardless of other parameters
   * Overriding the base class implementation
   */
  public canHandle(query: SearchQuery): boolean {
    console.log(
      "ImpulzeProvider.canHandle called with platform:",
      query.platform
    );
    // Accept all queries, but particularly Instagram ones
    return (
      !query.platform ||
      query.platform.toLowerCase() === "instagram" ||
      query.platform.toLowerCase() === this.id.toLowerCase()
    );
  }

  /**
   * Transform standard query to Impulze-specific format
   */
  protected transformQuery(query: SearchQuery): any {
    // Exactly match the original API format with all the expected parameters
    const impulzeQuery: any = {
      platform: query.platform || "instagram",
      sort_by: {
        field: this.mapSortField(query.sortBy?.field),
        order: query.sortBy?.order || "DESCENDING",
      },
      has_contact_details:
        query.hasContactDetails === undefined ? false : query.hasContactDetails,
      is_verified: query.isVerified === undefined ? false : query.isVerified,
      has_sponsored_posts:
        query.hasSponsoredPosts === undefined ? false : query.hasSponsoredPosts,
      include_business_accounts:
        query.includeBusinessAccounts === undefined
          ? false
          : query.includeBusinessAccounts,
      offset: query.offset || 0,
    };

    // Add optional parameters if they exist
    if (
      Array.isArray(query.creatorLocations) &&
      query.creatorLocations.length > 0
    ) {
      impulzeQuery.creator_locations = query.creatorLocations;
    }

    if (query.creatorLanguage) {
      impulzeQuery.creator_language = query.creatorLanguage;
    }

    if (query.username) {
      impulzeQuery.username = query.username;
    }

    if (query.searchField) {
      impulzeQuery.searchField = query.searchField;
    }

    console.log("Impulze API parameters:", JSON.stringify(impulzeQuery));
    return impulzeQuery;
  }

  /**
   * Map sort field to Impulze format
   */
  private mapSortField(field?: string): string {
    if (!field) return "FOLLOWER_COUNT";

    switch (field.toUpperCase()) {
      case "AVERAGE_LIKES":
        return "AVERAGE_LIKES";
      case "ENGAGEMENT_RATE":
        return "ENGAGEMENT_RATE";
      case "FOLLOWER_COUNT":
      default:
        return "FOLLOWER_COUNT";
    }
  }

  /**
   * Execute search request to Impulze API
   */
  protected async executeSearch(providerQuery: any): Promise<any> {
    console.log(
      "Executing Impulze API search with parameters:",
      JSON.stringify(providerQuery)
    );

    // Exactly match the original request headers and format
    const response = await fetch(this.baseUrl, {
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
        "x-access-token": this.accessToken,
      },
      body: JSON.stringify(providerQuery),
    });

    if (!response.ok) {
      const responseText = await response.text();

      try {
        const errorData = JSON.parse(responseText);

        // Check for access limit error
        if (response.status === 423 || errorData?.name === "AccessLimited") {
          throw new Error(
            "Access limited: You've reached your API usage limit. Please try again later or upgrade your plan."
          );
        }

        throw new Error(
          `API request failed: ${errorData.message || responseText}`
        );
      } catch (e) {
        // If parsing fails, use text as is
        throw new Error(
          `API request failed with status ${response.status}: ${responseText}`
        );
      }
    }

    const data = await response.json();
    console.log(
      `Impulze API response received with ${data?.data?.length || 0} profiles`
    );
    return data;
  }

  /**
   * Transform Impulze-specific response to standard format
   */
  protected transformResponse(rawResponse: any): SearchResult {
    if (!rawResponse || !Array.isArray(rawResponse.data)) {
      return {
        profiles: [],
        provider: this.id,
        error: {
          message: "Invalid response format from provider",
          details: rawResponse,
        },
      };
    }

    // Map Impulze profiles to our standard format
    const profiles: ProfileData[] = rawResponse.data.map((item: any) => ({
      id: item.external_id || `${this.id}-${item.platform_username}`,
      platform: item.work_platform?.name?.toLowerCase() || "instagram",
      platformUsername: item.platform_username,
      externalId: item.external_id,
      url: item.url,
      imageUrl: item.image_url,
      fullName: item.full_name,
      introduction: item.introduction,
      isVerified: item.is_verified,
      accountType: item.platform_account_type,
      gender: item.gender,
      ageGroup: item.age_group,
      language: item.language,
      followerCount: item.follower_count,
      subscriberCount: item.subscriber_count,
      contentCount: item.content_count,
      engagementRate: item.engagement_rate,
      averageLikes: item.average_likes,
      averageViews: item.average_views,
      location: item.creator_location,
      contactDetails: item.contact_details || [],
      metadata: {
        filterMatch: item.filter_match,
        livestreamMetrics: item.livestream_metrics,
      },
    }));

    return {
      profiles,
      totalCount: profiles.length,
      nextPageToken: rawResponse.nextPageToken || null,
      provider: this.id,
      rawResponse,
    };
  }
}
