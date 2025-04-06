/**
 * This is a manual test to demonstrate the search service in action.
 * In a real application, you would use Jest or another testing framework.
 */

import { SearchService } from "../SearchService";
import { AggregationStrategy } from "../aggregators/SearchAggregator";
import { MockProvider } from "../providers/MockProvider";
import { SearchQuery } from "../interfaces/SearchQuery";

/**
 * Run test for the search service
 */
async function testSearchService() {
  console.log("===== SEARCH SERVICE TEST =====");

  try {
    // Get the search service singleton instance
    const searchService = SearchService.getInstance();
    await searchService.initialize();
    console.log("Search service initialized");

    // Add a mock provider for testing
    searchService.addProvider(new MockProvider());
    console.log("Added mock provider");

    // Show active providers
    const providers = searchService.getProviders();
    console.log(`Active providers: ${providers.map((p) => p.id).join(", ")}`);

    // Run a test query with highest priority strategy
    console.log("\nRunning search with HIGHEST_PRIORITY strategy:");
    searchService.updateAggregationStrategy(
      AggregationStrategy.HIGHEST_PRIORITY
    );

    const query: SearchQuery = {
      platform: "instagram",
      username: "mock",
      sortBy: {
        field: "FOLLOWER_COUNT",
        order: "DESCENDING",
      },
    };

    const result1 = await searchService.search(query);
    console.log(
      `Search returned ${result1.profiles.length} profiles from provider: ${result1.provider}`
    );
    console.log("First profile:", result1.profiles[0]?.platformUsername);

    // Run the same query with ALL strategy
    console.log("\nRunning search with ALL strategy:");
    searchService.updateAggregationStrategy(AggregationStrategy.ALL);

    const result2 = await searchService.search(query);
    console.log(
      `Search returned ${result2.profiles.length} profiles from provider: ${result2.provider}`
    );
    console.log(
      "Found profiles from providers:",
      [...new Set(result2.profiles.map((p) => p.platform))].join(", ")
    );

    console.log("\nSearch service test completed successfully");
  } catch (error) {
    console.error("Test failed with error:", error);
  }
}

// Function to run the test manually (in browser or Node.js)
export async function runTest() {
  await testSearchService();
}

// Auto-run in Node.js environments
if (typeof window === "undefined") {
  testSearchService().catch(console.error);
}
