/**
 * Standard profile data format returned by all providers
 */
export interface ProfileData {
  id: string;
  platform: string;
  platformUsername: string;
  externalId: string;
  url: string;
  imageUrl: string;
  fullName: string;
  introduction?: string;
  isVerified: boolean;
  accountType?: string;
  gender?: string | null;
  ageGroup?: string | null;
  language?: string | null;
  followerCount: number;
  subscriberCount?: number | null;
  contentCount?: number | null;
  engagementRate?: number;
  averageLikes?: number;
  averageViews?: number | null;
  location?: string | null;
  contactDetails?: any[];
  metadata?: Record<string, any>;
}

/**
 * Standard search result format returned by all providers
 */
export interface SearchResult {
  /**
   * List of profiles matching the search query
   */
  profiles: ProfileData[];

  /**
   * Total count of results (if available)
   */
  totalCount?: number;

  /**
   * Token for next page (if available)
   */
  nextPageToken?: string | null;

  /**
   * Provider that produced these results
   */
  provider: string;

  /**
   * Error details (if any)
   */
  error?: {
    message: string;
    code?: string | number;
    details?: any;
  } | null;

  /**
   * Raw response from the provider
   */
  rawResponse?: any;
}
