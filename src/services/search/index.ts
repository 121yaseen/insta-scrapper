// Main service
export { SearchService } from "./SearchService";

// Interfaces
export type { ISearchProvider } from "./interfaces/ISearchProvider";
export type { SearchQuery } from "./interfaces/SearchQuery";
export type { SearchResult, ProfileData } from "./interfaces/SearchResult";

// Providers
export { BaseProvider } from "./providers/BaseProvider";
export { ImpulzeProvider } from "./providers/ImpulzeProvider";
export { MockProvider } from "./providers/MockProvider";
export { ModashProvider } from "./providers/ModashProvider";
export { ProviderFactory } from "./providers/ProviderFactory";

// Aggregator
export {
  SearchAggregator,
  AggregationStrategy,
} from "./aggregators/SearchAggregator";
export type { SearchAggregatorConfig } from "./aggregators/SearchAggregator";

// Configuration
export { SearchConfig } from "./config/SearchConfig";
export type {
  ProviderConfig,
  SearchServiceConfig,
} from "./config/SearchConfig";

// Testing
export { runTest } from "./tests/SearchServiceTest";
