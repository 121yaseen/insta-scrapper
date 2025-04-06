import { ISearchProvider } from "../interfaces/ISearchProvider";
import { SearchQuery } from "../interfaces/SearchQuery";
import { SearchResult, ProfileData } from "../interfaces/SearchResult";

/**
 * Aggregation strategy for combining results from multiple providers
 */
export enum AggregationStrategy {
  /**
   * Use results from all providers
   */
  ALL = "all",

  /**
   * Use results only from the highest priority provider that returns results
   */
  HIGHEST_PRIORITY = "highest_priority",

  /**
   * Use a specified provider, fall back to others in priority order
   */
  SPECIFIED_WITH_FALLBACK = "specified_with_fallback",
}

/**
 * Configuration for the search aggregator
 */
export interface SearchAggregatorConfig {
  /**
   * Strategy for aggregating results
   */
  strategy: AggregationStrategy;

  /**
   * Default provider to use in SPECIFIED_WITH_FALLBACK strategy
   */
  defaultProviderId?: string;

  /**
   * Whether to execute provider requests in parallel
   */
  parallelExecution?: boolean;

  /**
   * Timeout for provider requests in milliseconds
   */
  requestTimeout?: number;
}

/**
 * Search aggregator that manages multiple providers and combines their results
 */
export class SearchAggregator {
  /**
   * Default configuration
   */
  private static readonly DEFAULT_CONFIG: SearchAggregatorConfig = {
    strategy: AggregationStrategy.ALL,
    parallelExecution: true,
    requestTimeout: 10000, // 10 seconds
  };

  /**
   * Registered search providers
   */
  private providers: ISearchProvider[] = [];

  /**
   * Current aggregator configuration
   */
  private config: SearchAggregatorConfig;

  /**
   * Creates a new search aggregator
   * @param providers Initial list of search providers
   * @param config Aggregator configuration
   */
  constructor(
    providers: ISearchProvider[] = [],
    config: Partial<SearchAggregatorConfig> = {}
  ) {
    this.providers = [...providers];
    this.config = { ...SearchAggregator.DEFAULT_CONFIG, ...config };

    // Sort providers by priority (ascending)
    this.sortProviders();
  }

  /**
   * Register a new search provider
   * @param provider Provider to register
   * @returns The aggregator instance for chaining
   */
  public registerProvider(provider: ISearchProvider): SearchAggregator {
    this.providers.push(provider);
    this.sortProviders();
    return this;
  }

  /**
   * Deregister a search provider by id
   * @param providerId Provider id to deregister
   * @returns The aggregator instance for chaining
   */
  public deregisterProvider(providerId: string): SearchAggregator {
    this.providers = this.providers.filter((p) => p.id !== providerId);
    return this;
  }

  /**
   * Update aggregator configuration
   * @param config New partial configuration
   * @returns The aggregator instance for chaining
   */
  public updateConfig(
    config: Partial<SearchAggregatorConfig>
  ): SearchAggregator {
    this.config = { ...this.config, ...config };
    return this;
  }

  /**
   * Get all registered providers
   * @returns Array of registered providers
   */
  public getProviders(): ISearchProvider[] {
    return [...this.providers];
  }

  /**
   * Execute search across providers according to the configured strategy
   * @param query Search query
   * @returns Aggregated search results
   */
  public async search(query: SearchQuery): Promise<SearchResult> {
    // Filter providers that can handle this query
    const applicableProviders = this.providers.filter(
      (p) => p.isEnabled && p.canHandle(query)
    );

    console.log(
      `SearchAggregator: Found ${applicableProviders.length} applicable providers out of ${this.providers.length} total providers`
    );
    console.log(
      `SearchAggregator: Provider details: ${this.providers
        .map((p) => `${p.id}(enabled=${p.isEnabled})`)
        .join(", ")}`
    );

    if (applicableProviders.length === 0) {
      console.error(
        "SearchAggregator: No applicable providers found for query:",
        JSON.stringify(query)
      );

      // If we have providers but none can handle the query, try to use Impulze anyway
      const impulzeProvider = this.providers.find((p) => p.id === "impulze");
      if (impulzeProvider && impulzeProvider.isEnabled) {
        console.log(
          "SearchAggregator: Using Impulze provider anyway as fallback"
        );
        return impulzeProvider.search(query);
      }

      return {
        profiles: [],
        provider: "aggregator",
        error: {
          message: "No applicable providers available for this query",
          code: "NO_PROVIDERS",
        },
      };
    }

    switch (this.config.strategy) {
      case AggregationStrategy.HIGHEST_PRIORITY:
        return this.executeHighestPriorityStrategy(applicableProviders, query);

      case AggregationStrategy.SPECIFIED_WITH_FALLBACK:
        return this.executeSpecifiedWithFallbackStrategy(
          applicableProviders,
          query
        );

      case AggregationStrategy.ALL:
      default:
        return this.executeAllProvidersStrategy(applicableProviders, query);
    }
  }

  /**
   * Execute search using the highest priority provider only
   */
  private async executeHighestPriorityStrategy(
    providers: ISearchProvider[],
    query: SearchQuery
  ): Promise<SearchResult> {
    // Get highest priority provider (already sorted)
    const provider = providers[0];

    try {
      return await provider.search(query);
    } catch (error) {
      return {
        profiles: [],
        provider: "aggregator",
        error: {
          message: `Error in provider ${provider.id}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
          details: error,
        },
      };
    }
  }

  /**
   * Execute search using specified provider with fallback to others
   */
  private async executeSpecifiedWithFallbackStrategy(
    providers: ISearchProvider[],
    query: SearchQuery
  ): Promise<SearchResult> {
    // Get the specified provider if available
    let providerOrder = [...providers];

    if (this.config.defaultProviderId) {
      const defaultProvider = providers.find(
        (p) => p.id === this.config.defaultProviderId
      );

      if (defaultProvider) {
        // Move default provider to the front
        providerOrder = [
          defaultProvider,
          ...providers.filter((p) => p.id !== defaultProvider.id),
        ];
      }
    }

    // Try each provider in order until one succeeds
    for (const provider of providerOrder) {
      try {
        const result = await provider.search(query);

        // If we got results or a specific error, return immediately
        if (
          result.profiles.length > 0 ||
          (result.error && result.error.code !== "NO_RESULTS")
        ) {
          return result;
        }
      } catch (error) {
        console.error(`Error in provider ${provider.id}:`, error);
        // Continue to next provider on error
      }
    }

    // If all providers failed or returned no results
    return {
      profiles: [],
      provider: "aggregator",
      error: {
        message: "All providers failed or returned no results",
        code: "ALL_PROVIDERS_FAILED",
      },
    };
  }

  /**
   * Execute search using all providers and combine results
   */
  private async executeAllProvidersStrategy(
    providers: ISearchProvider[],
    query: SearchQuery
  ): Promise<SearchResult> {
    // Execute searches (in parallel or sequence based on config)
    let results: SearchResult[] = [];

    if (this.config.parallelExecution) {
      // Execute all provider searches in parallel with timeout
      const searchPromises = providers.map((provider) => {
        // Create a promise that rejects after timeout
        const timeoutPromise = new Promise<SearchResult>((_, reject) => {
          setTimeout(() => {
            reject(
              new Error(
                `Provider ${provider.id} timed out after ${this.config.requestTimeout}ms`
              )
            );
          }, this.config.requestTimeout);
        });

        // Race the provider search against the timeout
        return Promise.race([provider.search(query), timeoutPromise]).catch(
          (error) => ({
            profiles: [],
            provider: provider.id,
            error: {
              message: error instanceof Error ? error.message : "Unknown error",
              details: error,
            },
          })
        );
      });

      results = await Promise.all(searchPromises);
    } else {
      // Execute provider searches sequentially
      for (const provider of providers) {
        try {
          const result = await provider.search(query);
          results.push(result);
        } catch (error) {
          results.push({
            profiles: [],
            provider: provider.id,
            error: {
              message: error instanceof Error ? error.message : "Unknown error",
              details: error,
            },
          });
        }
      }
    }

    // Combine results from all providers
    const allProfiles: ProfileData[] = [];
    const errors: Record<string, any> = {};

    for (const result of results) {
      // Add profiles from this provider
      if (result.profiles.length > 0) {
        allProfiles.push(...result.profiles);
      }

      // Track errors
      if (result.error) {
        errors[result.provider] = result.error;
      }
    }

    // Remove duplicate profiles (based on platform + username)
    const uniqueProfiles = this.removeDuplicateProfiles(allProfiles);

    return {
      profiles: uniqueProfiles,
      totalCount: uniqueProfiles.length,
      provider: "aggregator",
      error:
        Object.keys(errors).length > 0
          ? {
              message: "Some providers encountered errors",
              details: errors,
            }
          : undefined,
    };
  }

  /**
   * Sort providers by priority (ascending)
   */
  private sortProviders(): void {
    this.providers.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Remove duplicate profiles from combined results
   */
  private removeDuplicateProfiles(profiles: ProfileData[]): ProfileData[] {
    const uniqueMap = new Map<string, ProfileData>();

    profiles.forEach((profile) => {
      const key = `${profile.platform}:${profile.platformUsername}`;

      // If this key already exists, keep the profile with more data
      if (uniqueMap.has(key)) {
        const existing = uniqueMap.get(key)!;

        // Simple heuristic: profile with more non-null fields wins
        const existingNonNullFields = Object.values(existing).filter(
          (v) => v != null
        ).length;
        const newNonNullFields = Object.values(profile).filter(
          (v) => v != null
        ).length;

        if (newNonNullFields > existingNonNullFields) {
          uniqueMap.set(key, profile);
        }
      } else {
        uniqueMap.set(key, profile);
      }
    });

    return Array.from(uniqueMap.values());
  }
}
