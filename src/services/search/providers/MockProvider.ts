import { BaseProvider } from "./BaseProvider";
import { SearchQuery } from "../interfaces/SearchQuery";
import { SearchResult, ProfileData } from "../interfaces/SearchResult";

/**
 * Mock provider for testing and demonstration
 */
export class MockProvider extends BaseProvider {
  public readonly id = "mock";
  public readonly name = "Mock Data Provider";
  public readonly priority = 10; // Lower priority than real providers

  // Sample mock data
  private mockProfiles: ProfileData[] = [
    {
      id: "mock-1",
      platform: "instagram",
      platformUsername: "mockuser1",
      externalId: "mock-ext-1",
      url: "https://instagram.com/mockuser1",
      imageUrl: "https://via.placeholder.com/150",
      fullName: "Mock User One",
      introduction: "This is a mock user for testing",
      isVerified: true,
      accountType: "PERSONAL",
      gender: "FEMALE",
      ageGroup: "25-34",
      language: "en",
      followerCount: 10000,
      subscriberCount: null,
      contentCount: 120,
      engagementRate: 0.05,
      averageLikes: 500,
      averageViews: null,
      location: "New York, USA",
      contactDetails: [{ type: "email", value: "mock1@example.com" }],
    },
    {
      id: "mock-2",
      platform: "instagram",
      platformUsername: "mockuser2",
      externalId: "mock-ext-2",
      url: "https://instagram.com/mockuser2",
      imageUrl: "https://via.placeholder.com/150",
      fullName: "Mock User Two",
      introduction: "Another mock user for testing",
      isVerified: false,
      accountType: "BUSINESS",
      gender: "MALE",
      ageGroup: "35-44",
      language: "en",
      followerCount: 50000,
      subscriberCount: null,
      contentCount: 85,
      engagementRate: 0.03,
      averageLikes: 1500,
      averageViews: null,
      location: "Los Angeles, USA",
      contactDetails: [],
    },
    {
      id: "mock-3",
      platform: "youtube",
      platformUsername: "mockyoutube",
      externalId: "mock-yt-1",
      url: "https://youtube.com/user/mockyoutube",
      imageUrl: "https://via.placeholder.com/150",
      fullName: "Mock YouTube Creator",
      introduction: "Mock YouTube channel for testing",
      isVerified: true,
      accountType: "CREATOR",
      gender: null,
      ageGroup: null,
      language: "en",
      followerCount: 100000,
      subscriberCount: 100000,
      contentCount: 45,
      engagementRate: 0.07,
      averageLikes: 5000,
      averageViews: 25000,
      location: "London, UK",
      contactDetails: [{ type: "email", value: "youtube@example.com" }],
    },
  ];

  /**
   * Transform standard query to provider-specific format
   * For mock provider, we just pass through the query
   */
  protected transformQuery(query: SearchQuery): SearchQuery {
    return query;
  }

  /**
   * Mock execution that filters the mock data based on query parameters
   */
  protected async executeSearch(query: SearchQuery): Promise<any> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Filter profiles based on query
    let filteredProfiles = [...this.mockProfiles];

    // Filter by platform
    if (query.platform) {
      filteredProfiles = filteredProfiles.filter(
        (p) => p.platform.toLowerCase() === query.platform!.toLowerCase()
      );
    }

    // Filter by username if provided
    if (query.username) {
      const usernameQuery = query.username.toLowerCase();
      filteredProfiles = filteredProfiles.filter(
        (p) =>
          p.platformUsername.toLowerCase().includes(usernameQuery) ||
          p.fullName.toLowerCase().includes(usernameQuery)
      );
    }

    // Filter by verification status
    if (query.isVerified !== undefined) {
      filteredProfiles = filteredProfiles.filter(
        (p) => p.isVerified === query.isVerified
      );
    }

    // Sort profiles based on sortBy
    if (query.sortBy) {
      filteredProfiles.sort((a, b) => {
        let valueA: any;
        let valueB: any;

        // Map sort field to profile property
        switch (query.sortBy!.field.toUpperCase()) {
          case "FOLLOWER_COUNT":
            valueA = a.followerCount;
            valueB = b.followerCount;
            break;
          case "ENGAGEMENT_RATE":
            valueA = a.engagementRate || 0;
            valueB = b.engagementRate || 0;
            break;
          case "AVERAGE_LIKES":
            valueA = a.averageLikes || 0;
            valueB = b.averageLikes || 0;
            break;
          default:
            valueA = a.followerCount;
            valueB = b.followerCount;
        }

        // Apply sort direction
        const direction = query.sortBy!.order === "ASCENDING" ? 1 : -1;
        return (valueA - valueB) * direction;
      });
    }

    // Apply pagination
    const offset = query.offset || 0;
    const limit = query.limit || 10;
    const paginatedProfiles = filteredProfiles.slice(offset, offset + limit);

    // Construct mock response
    return {
      data: paginatedProfiles,
      totalCount: filteredProfiles.length,
      nextPageToken:
        offset + limit < filteredProfiles.length
          ? `page-${offset + limit}`
          : null,
    };
  }

  /**
   * Transform provider response to standard format
   * For mock provider, our data is already in the right format
   */
  protected transformResponse(rawResponse: any): SearchResult {
    return {
      profiles: rawResponse.data,
      totalCount: rawResponse.totalCount,
      nextPageToken: rawResponse.nextPageToken,
      provider: this.id,
    };
  }

  /**
   * Override canHandle to support multiple platforms
   */
  public canHandle(query: SearchQuery): boolean {
    // This mock provider can handle instagram and youtube queries
    if (!query.platform) return true;

    const platform = query.platform.toLowerCase();
    return platform === "instagram" || platform === "youtube";
  }
}
