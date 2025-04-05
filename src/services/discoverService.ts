// Types
export interface WorkPlatform {
  id: string;
  name: string;
}

export interface FilterMatch {
  [key: string]: any;
}

export interface ProfileData {
  work_platform: WorkPlatform;
  platform_username: string;
  external_id: string;
  url: string;
  image_url: string;
  full_name: string;
  introduction: string;
  is_verified: boolean;
  platform_account_type: string;
  gender: string | null;
  age_group: string | null;
  language: string | null;
  follower_count: number;
  subscriber_count: number | null;
  content_count: number | null;
  engagement_rate: number;
  average_likes: number;
  average_views: number | null;
  creator_location: string | null;
  filter_match: FilterMatch;
  livestream_metrics: any;
  contact_details: any[];
}

export interface ApiResponse {
  message: string;
  data: ProfileData[];
  metadata: any;
  nextPageToken: string | null;
}

export interface ApiError {
  error: string;
  name?: string;
  field?: string;
  status?: number;
}

export interface DiscoverApiParams {
  platform: string;
  sort_by: {
    field: "FOLLOWER_COUNT" | "AVERAGE_LIKES" | "ENGAGEMENT_RATE";
    order: "ASCENDING" | "DESCENDING";
  };
  has_contact_details: boolean;
  is_verified: boolean;
  has_sponsored_posts: boolean;
  include_business_accounts: boolean;
  offset: number;
}

// Default parameters
const defaultParams: DiscoverApiParams = {
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

/**
 * Fetches discover profiles from our server API, which will proxy to the external API
 */
export async function fetchDiscoverProfiles(
  params: Partial<DiscoverApiParams> = {}
): Promise<ApiResponse> {
  const apiParams = { ...defaultParams, ...params };

  try {
    console.log("Sending API request with params:", JSON.stringify(apiParams));

    // Call our internal API endpoint which will handle the external API request
    const response = await fetch("/api/discover", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(apiParams),
    });

    const data = await response.json();

    if (!response.ok) {
      // Create a rich error object with more details
      const error: ApiError = {
        error:
          data.error || `API request failed with status ${response.status}`,
        status: response.status,
      };

      // Add additional data if available
      if (data.name) error.name = data.name;
      if (data.field) error.field = data.field;

      console.error("API error response:", error);

      // Throw the enhanced error object
      throw error;
    }

    console.log("API response successful:", {
      message: data.message,
      count: data.data?.length || 0,
      metadata: data.metadata,
    });

    return data;
  } catch (error) {
    console.error("Error fetching discover profiles:", error);

    // Check if it's already our ApiError type
    if (typeof error === "object" && error !== null && "error" in error) {
      throw error;
    }

    // Otherwise, create a generic error
    throw {
      error:
        error instanceof Error ? error.message : "Failed to fetch profiles",
      status: 500,
    };
  }
}

/**
 * Formats large numbers with K, M, B for readability
 */
export function formatNumber(num: number): string {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + "B";
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
}

/**
 * Formats engagement rate as percentage
 */
export function formatEngagementRate(rate: number): string {
  return (rate * 100).toFixed(2) + "%";
}
