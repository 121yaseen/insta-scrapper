# Multi-Provider Search Service Architecture

This document outlines the architectural design and implementation of the multi-provider search service.

## Overview

The search service is designed to support multiple search data providers simultaneously, with flexible configuration options for query transformation, result aggregation, and fallback strategies. The architecture follows SOLID principles and emphasizes clean separation of concerns, extensibility, and maintainability.

## Core Components

### Interfaces

- **ISearchProvider**: Interface that all search providers must implement
- **SearchQuery**: Standardized search query format used across all providers
- **SearchResult**: Standardized search result format returned by all providers

### Providers

- **BaseProvider**: Abstract base class implementing common provider functionality
- **ImpulzeProvider**: Concrete implementation for the Impulze API
- **MockProvider**: Sample mock provider for testing
- **ProviderFactory**: Factory for creating provider instances from configuration

### Aggregation

- **SearchAggregator**: Manages multiple providers and aggregates results
- **AggregationStrategy**: Different strategies for combining results (ALL, HIGHEST_PRIORITY, SPECIFIED_WITH_FALLBACK)

### Configuration

- **SearchConfig**: Singleton for managing search service configuration
- **ProviderConfig**: Configuration for individual providers
- **SearchServiceConfig**: Overall search service configuration

### Main Service

- **SearchService**: Core service that orchestrates providers and aggregation

## Design Patterns Used

1. **Strategy Pattern**: For different result aggregation strategies
2. **Factory Pattern**: For creating provider instances
3. **Template Method Pattern**: In BaseProvider for common provider workflow
4. **Singleton Pattern**: For SearchService and SearchConfig
5. **Adapter Pattern**: For transforming between standardized and provider-specific formats

## Flow Diagram

```
┌─────────────┐     ┌─────────────┐     ┌───────────────┐
│   Client    │────▶│    API      │────▶│ SearchService │
└─────────────┘     └─────────────┘     └───────┬───────┘
                                                │
                                                ▼
                                        ┌───────────────┐
                                        │SearchAggregator│
                                        └───────┬───────┘
                                                │
                         ┌────────────────┬────┴────┬────────────────┐
                         │                │         │                │
                         ▼                ▼         ▼                ▼
                   ┌──────────┐    ┌──────────┐   ...        ┌──────────┐
                   │Provider 1 │    │Provider 2 │             │Provider n │
                   └──────────┘    └──────────┘              └──────────┘
```

## Request/Response Flow

1. Client sends search parameters to API endpoint
2. API transforms parameters to standardized SearchQuery format
3. SearchService receives the query and passes it to the SearchAggregator
4. SearchAggregator determines which providers to use based on the strategy
5. For each provider:
   - Provider transforms query to provider-specific format
   - Provider executes the search request
   - Provider transforms response to standardized format
6. SearchAggregator combines results according to the strategy
7. SearchService returns the aggregated results
8. API transforms results back to client-expected format

## Adding a New Provider

To add a new search provider to the system:

1. Create a new class that extends `BaseProvider`
2. Implement the required abstract methods:
   - `transformQuery`: Convert standardized query to provider format
   - `executeSearch`: Send the query to the provider's API
   - `transformResponse`: Convert provider response to standardized format
3. Define provider metadata (id, name, priority)
4. Register the provider with ProviderFactory
5. Add provider configuration to SearchConfig

Example:

```typescript
// 1. Create a new provider class
export class NewApiProvider extends BaseProvider {
  public readonly id = 'newapi';
  public readonly name = 'New API Provider';
  public readonly priority = 2;
  
  // 2. Implement required methods
  protected transformQuery(query: SearchQuery): any {
    // Transform to provider-specific format
  }
  
  protected async executeSearch(providerQuery: any): Promise<any> {
    // Execute search against provider API
  }
  
  protected transformResponse(rawResponse: any): SearchResult {
    // Transform to standardized format
  }
}

// 3. Register with the factory
ProviderFactory.registerProviderType('newapi', NewApiProvider);

// 4. Add provider configuration
const config = SearchConfig.getInstance();
config.updateProviderConfig('newapi', {
  id: 'newapi',
  enabled: true,
  priority: 2,
  settings: {
    apiKey: 'your-api-key'
  }
});
```

## Error Handling and Fallbacks

The architecture includes robust error handling at multiple levels:

- Each provider handles its own errors and returns standardized error responses
- The aggregator catches provider errors and can fall back to other providers
- Multiple aggregation strategies allow for different fallback behaviors
- The search service handles initialization errors

## Configuration Approach

Configuration is managed through the SearchConfig singleton:

- Provider-specific settings (API keys, endpoints, etc.)
- Global settings (timeouts, parallel execution)
- Aggregation strategy selection
- Provider priorities and enabled/disabled state

The configuration can be updated at runtime to change behavior without service restart. 