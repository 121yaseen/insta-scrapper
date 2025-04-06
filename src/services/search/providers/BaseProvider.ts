import { ISearchProvider } from "../interfaces/ISearchProvider";
import { SearchQuery } from "../interfaces/SearchQuery";
import { SearchResult } from "../interfaces/SearchResult";

/**
 * Abstract base class for search providers
 * Implements common functionality that all providers share
 */
export abstract class BaseProvider implements ISearchProvider {
  /**
   * Unique identifier for the provider
   */
  public abstract readonly id: string;

  /**
   * Display name of the provider
   */
  public abstract readonly name: string;

  /**
   * Priority of the provider (lower number means higher priority)
   */
  public abstract readonly priority: number;

  /**
   * Whether the provider is enabled
   */
  public readonly isEnabled: boolean = true;

  /**
   * Create a new provider instance
   * @param config Optional provider configuration
   */
  constructor(protected config?: Record<string, any>) {}

  /**
   * Transform standard query format to provider-specific format
   * @param query Standard search query
   * @returns Provider-specific query object
   */
  protected abstract transformQuery(query: SearchQuery): any;

  /**
   * Transform provider-specific results to standard format
   * @param rawResponse Raw response from the provider
   * @returns Standardized search results
   */
  protected abstract transformResponse(rawResponse: any): SearchResult;

  /**
   * Execute search request to the provider's API
   * @param providerQuery Provider-specific query
   * @returns Raw provider response
   */
  protected abstract executeSearch(providerQuery: any): Promise<any>;

  /**
   * Check if this provider can handle the given query
   * @param query Standardized search query
   * @returns Whether this provider can handle the query
   */
  public canHandle(query: SearchQuery): boolean {
    // Default implementation checks if platform matches or is undefined
    // Providers can override for more specific logic
    return (
      !query.platform || query.platform.toLowerCase() === this.id.toLowerCase()
    );
  }

  /**
   * Search for profiles using the provider
   * @param query Standardized search query
   * @returns Promise with search results
   */
  public async search(query: SearchQuery): Promise<SearchResult> {
    try {
      // Transform query to provider-specific format
      const providerQuery = this.transformQuery(query);

      // Execute search
      const rawResponse = await this.executeSearch(providerQuery);

      // Transform response to standard format
      const result = this.transformResponse(rawResponse);

      // Add provider information
      result.provider = this.id;

      return result;
    } catch (error) {
      // Handle errors and return standardized error result
      console.error(`Error in ${this.name} provider:`, error);

      return {
        profiles: [],
        provider: this.id,
        error: {
          message: error instanceof Error ? error.message : "Unknown error",
          details: error,
        },
      };
    }
  }
}
