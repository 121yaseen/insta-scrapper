import { SearchQuery } from "./SearchQuery";
import { SearchResult } from "./SearchResult";

/**
 * Interface for search providers
 * Any new search provider must implement this interface
 */
export interface ISearchProvider {
  /**
   * Unique identifier for the provider
   */
  readonly id: string;

  /**
   * Display name of the provider
   */
  readonly name: string;

  /**
   * Priority of the provider (lower number means higher priority)
   */
  readonly priority: number;

  /**
   * Whether the provider is enabled
   */
  readonly isEnabled: boolean;

  /**
   * Search for profiles using the provider
   * @param query Standardized search query
   * @returns Promise with search results
   */
  search(query: SearchQuery): Promise<SearchResult>;

  /**
   * Check if this provider can handle the given query
   * @param query Standardized search query
   * @returns Whether this provider can handle the query
   */
  canHandle(query: SearchQuery): boolean;
}
