/**
 * Standard search query format used across all providers
 */
export interface SearchQuery {
  /**
   * Platform to search on (e.g., 'instagram', 'youtube', 'tiktok')
   */
  platform?: string;

  /**
   * Username to search for
   */
  username?: string;

  /**
   * Field to search in (e.g., 'bio', 'name', 'all')
   */
  searchField?: string;

  /**
   * Sorting configuration
   */
  sortBy?: {
    field: string;
    order: "ASCENDING" | "DESCENDING";
  };

  /**
   * Filter for verified accounts
   */
  isVerified?: boolean;

  /**
   * Filter for accounts with contact details
   */
  hasContactDetails?: boolean;

  /**
   * Filter for accounts with sponsored posts
   */
  hasSponsoredPosts?: boolean;

  /**
   * Whether to include business accounts
   */
  includeBusinessAccounts?: boolean;

  /**
   * Geographic locations to filter by
   */
  creatorLocations?: string[];

  /**
   * Language to filter by
   */
  creatorLanguage?: string;

  /**
   * Pagination offset
   */
  offset?: number;

  /**
   * Page size
   */
  limit?: number;

  /**
   * Extended parameters for provider-specific options
   */
  extendedParams?: Record<string, any>;
}
