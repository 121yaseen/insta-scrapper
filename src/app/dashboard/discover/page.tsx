"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import {
  Instagram,
  Search,
  Loader,
  Users,
  Heart,
  Zap,
  Bookmark,
  FileText,
  ChevronDown,
} from "lucide-react";
import Image from "next/image";
import {
  fetchDiscoverProfiles,
  formatNumber,
  formatEngagementRate,
  type ProfileData,
} from "@/services/discoverService";
import FilterPanel from "@/app/components/filters/FilterPanel";

export default function DiscoverPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [sortBy, setSortBy] = useState<
    "FOLLOWER_COUNT" | "AVERAGE_LIKES" | "ENGAGEMENT_RATE"
  >("FOLLOWER_COUNT");
  const [sortOrder, setSortOrder] = useState<"ASCENDING" | "DESCENDING">(
    "DESCENDING"
  );
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [activeFilters, setActiveFilters] = useState<any>({});
  const [filterChanged, setFilterChanged] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [profilesCount, setProfilesCount] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [searchField, setSearchField] = useState<string>("keywords");
  const [isVerified, setIsVerified] = useState<boolean>(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowSortDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    fetchProfiles();
  }, [sortBy, sortOrder, isVerified]);

  const fetchProfiles = async (filters = activeFilters) => {
    setIsLoading(true);
    setError(null);
    setErrorType(null);

    try {
      // If filters are provided, use them directly to ensure exact parameter match
      // with the reference request
      const params = { ...filters };

      // Ensure minimum required parameters are present
      if (!params.platform) params.platform = "instagram";
      if (!params.sort_by) {
        params.sort_by = {
          field: sortBy,
          order: sortOrder,
        };
      }
      if (params.is_verified === undefined) params.is_verified = isVerified;
      if (params.offset === undefined) params.offset = 0;
      if (params.has_contact_details === undefined)
        params.has_contact_details = false;
      if (params.has_sponsored_posts === undefined)
        params.has_sponsored_posts = false;
      if (params.include_business_accounts === undefined)
        params.include_business_accounts = false;

      console.log("Sending request with params:", JSON.stringify(params));

      const result = await fetchDiscoverProfiles(params);
      setProfiles(result.data || []);
      setProfilesCount(result.data?.length || 0);
    } catch (err: any) {
      // Handle API errors
      if (typeof err === "object" && err !== null) {
        // Check if it's our ApiError type
        if ("error" in err) {
          setError(err.error);

          // Set error type if available
          if ("name" in err) {
            setErrorType(err.name as string);
          } else if (err.status === 423) {
            setErrorType("AccessLimited");
          }
        } else {
          setError(
            err instanceof Error ? err.message : "Failed to fetch profiles"
          );
        }
      } else {
        setError("Failed to fetch profiles");
      }

      console.error("Error fetching profiles:", err);

      // Clear profiles on error
      setProfiles([]);
      setProfilesCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  // Update search term handler
  const handleSearchTermChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setFilterChanged(true);
  };

  // Update search field handler
  const handleSearchFieldChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSearchField(e.target.value);
    setFilterChanged(true);
  };

  // Update verified status handler
  const handleVerifiedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsVerified(e.target.checked);
    setFilterChanged(true);
  };

  // Handler for filter changes from FilterPanel
  const handleFilterChange = (filters: any) => {
    // Ensure creator_locations is properly formatted
    if (
      filters.creator_locations &&
      !Array.isArray(filters.creator_locations)
    ) {
      filters.creator_locations = [filters.creator_locations];
    }

    setActiveFilters(filters);
    setFilterChanged(true);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setActiveFilters({});
    setSearchTerm("");
    setIsVerified(false);
    setFilterChanged(true);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    // Create a clean request object with only essential parameters
    const essentialParams: any = {
      platform: "instagram",
      sort_by: {
        field: sortBy,
        order: sortOrder,
      },
      has_contact_details: false,
      is_verified: isVerified,
      has_sponsored_posts: false,
      include_business_accounts: false,
      offset: 0,
    };

    // Only add non-empty filters
    if (activeFilters.creator_locations?.length > 0) {
      essentialParams.creator_locations = activeFilters.creator_locations;
    }

    // Add language filter if present
    if (activeFilters.creator_language) {
      essentialParams.creator_language = activeFilters.creator_language;
    }

    // Add search term if present
    if (searchTerm) {
      essentialParams.username = searchTerm;
      essentialParams.searchField = searchField;
    }

    console.log(
      "Sending request with params:",
      JSON.stringify(essentialParams)
    );

    // Reset the filter changed flag
    setFilterChanged(false);

    // Fetch profiles with the minimal params
    fetchProfiles(essentialParams);
  };

  const getSortLabel = (sort: string) => {
    switch (sort) {
      case "FOLLOWER_COUNT":
        return "Follower Size";
      case "AVERAGE_LIKES":
        return "Average Likes";
      case "ENGAGEMENT_RATE":
        return "Engagement";
      default:
        return "Sort By";
    }
  };

  const handleSortChange = (
    sort: "FOLLOWER_COUNT" | "AVERAGE_LIKES" | "ENGAGEMENT_RATE",
    order: "ASCENDING" | "DESCENDING"
  ) => {
    setSortBy(sort);
    setSortOrder(order);
    setShowSortDropdown(false);
    setFilterChanged(true);
  };

  // Add a new function to handle direct username search for clevertypeai or any other account
  const handleDirectUsernameSearch = (username: string) => {
    setSearchTerm(username);
    setSearchField("username");
    setFilterChanged(true);

    const searchParams = {
      platform: "instagram",
      sort_by: {
        field: sortBy,
        order: sortOrder,
      },
      username: username,
      searchField: "username",
      has_contact_details: false,
      is_verified: isVerified,
      has_sponsored_posts: false,
      include_business_accounts: false,
      offset: 0,
    };

    console.log(
      "Performing direct username search:",
      JSON.stringify(searchParams)
    );
    fetchProfiles(searchParams);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center">
              <Image
                src="/images/pistah.svg"
                alt="InstaScrapr Logo"
                width={120}
                height={40}
                priority
              />
            </Link>
            <div className="flex items-center space-x-6">
              <Link
                href="/dashboard"
                className="text-gray-600 hover:text-purple-600 transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/discover"
                className="text-gray-800 hover:text-purple-600 transition-colors font-medium"
              >
                Discover
              </Link>
              <Link
                href="/dashboard/history"
                className="text-gray-600 hover:text-purple-600 transition-colors"
              >
                History
              </Link>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2 text-gray-900">
                Discover Instagram Profiles
              </h1>
              <p className="text-gray-600">
                Browse and analyze popular Instagram profiles
              </p>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filter Panel */}
            <div className="lg:w-1/4">
              <FilterPanel
                onFiltersChange={handleFilterChange}
                onClearFilters={handleClearFilters}
              />
            </div>

            {/* Content Area */}
            <div className="lg:w-3/4">
              {/* Search and Sort Controls */}
              <div className="mb-6 flex justify-between items-center">
                <div className="flex items-center">
                  {/* Search input */}
                  <form onSubmit={handleSearch} className="mr-4">
                    <div className="flex items-center relative">
                      <select
                        value={searchField}
                        onChange={handleSearchFieldChange}
                        className="border-l border-y border-gray-200 rounded-l-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-sm text-black appearance-none pr-8 font-medium"
                        style={{
                          backgroundImage:
                            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23666' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E\")",
                          backgroundRepeat: "no-repeat",
                          backgroundPosition: "right 0.5rem center",
                          backgroundSize: "1.2em 1.2em",
                        }}
                      >
                        <option value="keywords">Keywords</option>
                        <option value="username">Username</option>
                        <option value="name">Name</option>
                      </select>
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={handleSearchTermChange}
                        placeholder="Search creators..."
                        className="border-y border-r border-gray-200 py-2 px-4 focus:outline-none focus:ring-2 focus:ring-purple-500 w-64 text-black"
                      />
                      <button
                        type="submit"
                        disabled={!filterChanged && profiles.length > 0}
                        className={`bg-purple-600 text-white px-4 py-2 rounded-r-lg transition-colors ${
                          !filterChanged && profiles.length > 0
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:bg-purple-700"
                        }`}
                      >
                        <Search className="w-4 h-4" />
                      </button>
                    </div>
                  </form>

                  <div className="flex items-center mr-4">
                    <input
                      type="checkbox"
                      id="verified"
                      checked={isVerified}
                      onChange={handleVerifiedChange}
                      className="mr-2"
                    />
                    <label htmlFor="verified" className="text-black">
                      Verified
                    </label>
                  </div>

                  {profilesCount > 0 && (
                    <div className="text-gray-600">
                      <span className="font-bold">{profilesCount}</span>{" "}
                      creators found
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-gray-700 font-medium">Sort By</span>
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setShowSortDropdown(!showSortDropdown)}
                      className="bg-white border border-gray-200 rounded-full py-2.5 px-6 flex items-center justify-between min-w-[220px] text-[15px]"
                    >
                      <span className="text-gray-800 font-normal">
                        {getSortLabel(sortBy)}
                      </span>
                      <ChevronDown className="w-5 h-5 text-gray-600 ml-2" />
                    </button>

                    {showSortDropdown && (
                      <div className="absolute top-full right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-100 w-full z-10 overflow-hidden">
                        <ul className="divide-y divide-gray-100">
                          <li
                            className={`py-3.5 px-5 hover:bg-pink-50 cursor-pointer text-[15px] text-gray-800 transition-colors`}
                            onClick={() => {
                              handleSortChange("FOLLOWER_COUNT", "DESCENDING");
                            }}
                          >
                            Follower Size
                          </li>
                          <li
                            className={`py-3.5 px-5 hover:bg-pink-50 cursor-pointer text-[15px] text-gray-800 transition-colors`}
                            onClick={() => {
                              handleSortChange("AVERAGE_LIKES", "DESCENDING");
                            }}
                          >
                            Average Likes
                          </li>
                          <li
                            className={`py-3.5 px-5 hover:bg-pink-50 cursor-pointer text-[15px] text-gray-800 transition-colors`}
                            onClick={() => {
                              handleSortChange("ENGAGEMENT_RATE", "DESCENDING");
                            }}
                          >
                            Engagement
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div
                  className={`mb-4 p-4 rounded-md ${
                    errorType === "AccessLimited"
                      ? "bg-amber-50 border border-amber-200"
                      : "bg-red-50 border border-red-200"
                  }`}
                >
                  <div className="flex">
                    <div className="flex-shrink-0">
                      {errorType === "AccessLimited" ? (
                        <Zap className="h-5 w-5 text-amber-400" />
                      ) : (
                        <div className="h-5 w-5 text-red-400">⚠️</div>
                      )}
                    </div>
                    <div className="ml-3">
                      <h3
                        className={`text-sm font-medium ${
                          errorType === "AccessLimited"
                            ? "text-amber-800"
                            : "text-red-800"
                        }`}
                      >
                        {errorType === "AccessLimited"
                          ? "API Usage Limit Reached"
                          : "Error"}
                      </h3>
                      <div
                        className={`mt-2 text-sm ${
                          errorType === "AccessLimited"
                            ? "text-amber-700"
                            : "text-red-700"
                        }`}
                      >
                        <p>{error}</p>
                        {errorType === "AccessLimited" && (
                          <p className="mt-2">
                            Try removing some filters or try again later. You
                            can also upgrade your plan for increased limits.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Loading and Error States */}
              {isLoading && (
                <div className="flex justify-center items-center p-12">
                  <Loader className="w-8 h-8 text-purple-600 animate-spin" />
                  <span className="ml-3 text-gray-600">
                    Loading profiles...
                  </span>
                </div>
              )}

              {/* Profile Cards Grid */}
              {!isLoading && !error && profiles.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                  {profiles.map((profile) => (
                    <div
                      key={profile.external_id}
                      className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow relative"
                    >
                      {/* Checkbox in top-right corner */}
                      <div className="absolute top-4 right-4">
                        <div className="w-6 h-6 rounded border border-gray-300"></div>
                      </div>

                      <div className="p-8">
                        {/* Profile Header */}
                        <div className="flex items-center mb-6">
                          <div className="relative w-16 h-16 mr-4 overflow-hidden">
                            <a
                              href={profile.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block cursor-pointer"
                            >
                              {profile.image_url ? (
                                <img
                                  src={profile.image_url}
                                  alt={
                                    profile.full_name ||
                                    profile.platform_username
                                  }
                                  className="w-16 h-16 rounded-full object-cover"
                                />
                              ) : (
                                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gray-200 text-gray-500">
                                  <Instagram className="w-8 h-8" />
                                </div>
                              )}
                              {/* Instagram icon overlay */}
                              <div className="absolute bottom-0 right-0 bg-gray-800 rounded-full w-6 h-6 flex items-center justify-center">
                                <Instagram className="w-3.5 h-3.5 text-white" />
                              </div>
                            </a>
                          </div>
                          <div>
                            <div className="flex items-center">
                              <a
                                href={profile.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-blue-600 transition-colors"
                              >
                                <h3 className="text-lg font-bold text-gray-900">
                                  {profile.full_name ||
                                    profile.platform_username}
                                </h3>
                              </a>
                              {profile.is_verified && (
                                <span className="ml-2">
                                  <div className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center">
                                    <svg
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      className="w-3 h-3"
                                      stroke="currentColor"
                                      strokeWidth="3"
                                    >
                                      <path
                                        d="M5 12l5 5L20 7"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                    </svg>
                                  </div>
                                </span>
                              )}
                            </div>
                            <div className="text-gray-500 text-sm">
                              <a
                                href={profile.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-blue-600 transition-colors"
                              >
                                @{profile.platform_username}
                              </a>
                            </div>
                          </div>
                        </div>

                        {/* Creator Type Badge */}
                        <div className="mb-4">
                          <span className="inline-block px-4 py-1 rounded-full bg-gray-100 text-gray-700 text-sm font-medium">
                            {profile.platform_account_type === "CREATOR"
                              ? "Creator"
                              : profile.platform_account_type}
                          </span>
                        </div>

                        {/* Bio/Introduction */}
                        {profile.introduction && (
                          <p className="text-gray-800 text-base mb-6 line-clamp-2">
                            {profile.introduction}
                          </p>
                        )}

                        {/* Average Likes */}
                        <div className="flex items-center mb-6">
                          <Heart className="w-5 h-5 text-red-500 mr-2 fill-current" />
                          <span className="text-black font-medium">
                            Avg Likes :{" "}
                            <span className="text-black">
                              {formatNumber(profile.average_likes)}
                            </span>
                          </span>
                        </div>

                        {/* Stats Section */}
                        <div className="grid grid-cols-2 mb-6 rounded-2xl overflow-hidden border border-gray-200">
                          <div className="py-4 px-2 text-center border-r border-gray-200">
                            <div className="uppercase text-xs text-gray-500 font-medium mb-1">
                              FOLLOWERS
                            </div>
                            <div className="text-2xl font-bold text-gray-900">
                              {formatNumber(profile.follower_count)}
                            </div>
                          </div>
                          <div className="py-4 px-2 text-center">
                            <div className="uppercase text-xs text-gray-500 font-medium mb-1">
                              ENGAGEMENT
                            </div>
                            <div className="text-2xl font-bold text-gray-900">
                              {formatEngagementRate(profile.engagement_rate)}
                            </div>
                          </div>
                        </div>

                        {/* Upgrade Banner */}
                        <div className="bg-gray-50 rounded-xl py-3 px-4 flex items-center mb-6">
                          <Zap className="w-5 h-5 text-green-500 mr-2" />
                          <span className="text-gray-600 text-sm">
                            Upgrade to view contacts
                          </span>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-3 text-black">
                          <button className="flex items-center justify-center py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium text-sm">
                            <Bookmark className="w-4 h-4 mr-2" />
                            Save
                          </button>
                          <a
                            href={profile.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium text-sm"
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            View Report
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Empty State */}
              {!isLoading && !error && profiles.length === 0 && (
                <div className="bg-gray-50 rounded-xl p-12 text-center">
                  <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-xl font-medium text-gray-800 mb-2">
                    No profiles found
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Try adjusting your filters or check back later
                  </p>
                  <button
                    onClick={() => fetchProfiles()}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors inline-flex items-center"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Refresh
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 bg-gray-50 text-gray-600 border-t border-gray-200 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center mb-4">
            <Image
              src="/images/pistah.svg"
              alt="InstaScrapr Logo"
              width={100}
              height={35}
            />
          </div>
          <p className="text-gray-500">
            &copy; {new Date().getFullYear()} InstaScrapr. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
