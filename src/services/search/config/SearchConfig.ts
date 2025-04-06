import { AggregationStrategy } from "../aggregators/SearchAggregator";

/**
 * Provider configuration
 */
export interface ProviderConfig {
  /**
   * Provider identifier
   */
  id: string;

  /**
   * Whether this provider is enabled
   */
  enabled: boolean;

  /**
   * Provider priority (lower is higher priority)
   */
  priority: number;

  /**
   * Provider-specific settings
   */
  settings: Record<string, any>;
}

/**
 * Search service configuration
 */
export interface SearchServiceConfig {
  /**
   * Provider configurations
   */
  providers: ProviderConfig[];

  /**
   * Aggregation strategy
   */
  aggregationStrategy: AggregationStrategy;

  /**
   * Default provider ID to use (if applicable)
   */
  defaultProviderId?: string;

  /**
   * Whether to execute provider requests in parallel
   */
  parallelExecution: boolean;

  /**
   * Provider request timeout in milliseconds
   */
  requestTimeout: number;
}

/**
 * Default search configuration
 */
const DEFAULT_CONFIG: SearchServiceConfig = {
  providers: [
    {
      id: "impulze",
      enabled: true,
      priority: 1,
      settings: {
        accessToken:
          process.env.IMPULZE_ACCESS_TOKEN ||
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2N2YyMThhYTgyY2VhMTIxNGY2ZDUzOTkiLCJpYXQiOjE3NDM5MTkyNzQsImV4cCI6MTc3NTQ1NTI3NH0.8QetT4C_Bf1yQxh0p0dRL_y2QhYonYQ1IllZi4PyihI",
      },
    },
    {
      id: "modash",
      enabled: true,
      priority: 2,
      settings: {
        // Cookies will be passed from the API request
      },
    },
    // Mock provider is disabled by default in production
    {
      id: "mock",
      enabled: false,
      priority: 10,
      settings: {},
    },
  ],
  // Always use Impulze as the default provider
  aggregationStrategy: AggregationStrategy.HIGHEST_PRIORITY,
  defaultProviderId: "impulze",
  parallelExecution: true,
  requestTimeout: 15000, // 15 seconds to allow for slower API responses
};

/**
 * Search configuration manager
 */
export class SearchConfig {
  private static instance: SearchConfig;
  private config: SearchServiceConfig;

  /**
   * Create a new search config instance
   * @param initialConfig Initial configuration (optional)
   */
  private constructor(initialConfig?: Partial<SearchServiceConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...initialConfig };
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): SearchConfig {
    if (!SearchConfig.instance) {
      SearchConfig.instance = new SearchConfig();
    }
    return SearchConfig.instance;
  }

  /**
   * Update the configuration
   * @param configUpdate Partial configuration update
   */
  public updateConfig(configUpdate: Partial<SearchServiceConfig>): void {
    this.config = { ...this.config, ...configUpdate };
  }

  /**
   * Get the current configuration
   */
  public getConfig(): SearchServiceConfig {
    return { ...this.config };
  }

  /**
   * Get configuration for a specific provider
   * @param providerId Provider ID
   */
  public getProviderConfig(providerId: string): ProviderConfig | undefined {
    return this.config.providers.find((p) => p.id === providerId);
  }

  /**
   * Update configuration for a specific provider
   * @param providerId Provider ID
   * @param config New provider configuration
   */
  public updateProviderConfig(
    providerId: string,
    config: Partial<ProviderConfig>
  ): void {
    const index = this.config.providers.findIndex((p) => p.id === providerId);

    if (index !== -1) {
      // Update existing provider config
      this.config.providers[index] = {
        ...this.config.providers[index],
        ...config,
      };
    } else {
      // Add new provider config if ID is provided
      if (config.id) {
        this.config.providers.push({
          id: config.id,
          enabled: config.enabled ?? true,
          priority: config.priority ?? 999,
          settings: config.settings ?? {},
        });
      }
    }
  }

  /**
   * Remove a provider configuration
   * @param providerId Provider ID to remove
   */
  public removeProviderConfig(providerId: string): void {
    this.config.providers = this.config.providers.filter(
      (p) => p.id !== providerId
    );
  }
}
