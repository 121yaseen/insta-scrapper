import { SearchQuery } from "./interfaces/SearchQuery";
import { SearchResult } from "./interfaces/SearchResult";
import { SearchConfig } from "./config/SearchConfig";
import {
  SearchAggregator,
  AggregationStrategy,
} from "./aggregators/SearchAggregator";
import { ProviderFactory } from "./providers/ProviderFactory";
import { ISearchProvider } from "./interfaces/ISearchProvider";

/**
 * Main search service that coordinates providers and aggregation
 */
export class SearchService {
  private static instance: SearchService;
  private config: SearchConfig;
  private aggregator: SearchAggregator;
  private initialized: boolean = false;
  private initializationPromise: Promise<SearchService> | null = null;

  /**
   * Create a new search service
   */
  private constructor() {
    this.config = SearchConfig.getInstance();
    this.aggregator = new SearchAggregator();

    // Start initialization immediately
    this.initializationPromise = this.initialize();
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): SearchService {
    if (!SearchService.instance) {
      SearchService.instance = new SearchService();
    }
    return SearchService.instance;
  }

  /**
   * Initialize the search service
   * @returns The service instance for chaining
   */
  public async initialize(): Promise<SearchService> {
    // If already initializing, return the existing promise
    if (this.initializationPromise && !this.initialized) {
      return this.initializationPromise;
    }

    // If already initialized, return immediately
    if (this.initialized) {
      return Promise.resolve(this);
    }

    try {
      // Get configuration
      const serviceConfig = this.config.getConfig();

      // Create providers from configuration
      const providers = ProviderFactory.createProviders(
        serviceConfig.providers.filter((p) => p.enabled)
      );

      if (providers.length === 0) {
        console.warn(
          "No enabled providers found. Adding default Impulze provider."
        );
        const impulzeConfig = this.config.getProviderConfig("impulze");

        if (impulzeConfig) {
          impulzeConfig.enabled = true;
          const impulzeProvider = ProviderFactory.createProvider(impulzeConfig);
          if (impulzeProvider) {
            providers.push(impulzeProvider);
          }
        }
      }

      // Update aggregator with providers and config
      this.aggregator = new SearchAggregator(providers, {
        strategy:
          serviceConfig.aggregationStrategy ||
          AggregationStrategy.HIGHEST_PRIORITY,
        defaultProviderId: serviceConfig.defaultProviderId || "impulze",
        parallelExecution: serviceConfig.parallelExecution,
        requestTimeout: serviceConfig.requestTimeout,
      });

      this.initialized = true;
      console.log(
        "Search service initialized with providers:",
        providers.map((p) => `${p.id} (priority: ${p.priority})`).join(", ")
      );

      return this;
    } catch (error) {
      console.error("Failed to initialize search service:", error);

      // Reset initialization state so we can try again
      this.initialized = false;
      this.initializationPromise = null;

      // Rethrow to allow caller to handle error
      throw error;
    }
  }

  /**
   * Search for profiles
   * @param query Search query
   * @returns Search results from the configured providers
   */
  public async search(query: SearchQuery): Promise<SearchResult> {
    try {
      // Ensure the service is initialized
      if (!this.initialized) {
        await this.initialize();
      }

      // Execute search through the aggregator
      return await this.aggregator.search(query);
    } catch (error) {
      console.error("Error executing search:", error);

      // Return a standardized error response
      return {
        profiles: [],
        provider: "search-service",
        error: {
          message:
            error instanceof Error ? error.message : "Unknown search error",
          details: error,
        },
      };
    }
  }

  /**
   * Reload configuration and reinitialize providers
   */
  public async reloadConfiguration(): Promise<void> {
    this.initialized = false;
    this.initializationPromise = null;
    await this.initialize();
  }

  /**
   * Add a new provider at runtime
   * @param provider Provider instance
   */
  public addProvider(provider: ISearchProvider): void {
    this.aggregator.registerProvider(provider);
  }

  /**
   * Remove a provider at runtime
   * @param providerId Provider ID to remove
   */
  public removeProvider(providerId: string): void {
    this.aggregator.deregisterProvider(providerId);
  }

  /**
   * Get all currently active providers
   * @returns Array of active providers
   */
  public getProviders(): ISearchProvider[] {
    return this.aggregator.getProviders();
  }

  /**
   * Update aggregation strategy
   * @param strategy New aggregation strategy
   */
  public updateAggregationStrategy(strategy: string): void {
    this.aggregator.updateConfig({ strategy: strategy as any });

    // Also update the persisted configuration
    const config = this.config.getConfig();
    this.config.updateConfig({
      ...config,
      aggregationStrategy: strategy as any,
    });
  }
}
