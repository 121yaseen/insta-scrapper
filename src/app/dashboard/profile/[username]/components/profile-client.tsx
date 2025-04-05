"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { ArrowLeft, Download, Instagram } from "lucide-react";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface Post {
  mediaUrl: string;
  caption?: string;
  likesCount: number;
  commentsCount: number;
  timestamp: string;
}

interface Reel {
  id: string;
  url: string;
  thumbnail: string | null;
  views: number | null;
  likes: number | null;
  comments: number | null;
  postedDate: string | null;
}

interface ProfileData {
  id: string;
  username: string;
  fullName?: string;
  bio?: string;
  profilePicUrl?: string;
  externalUrl?: string | null;
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
  isVerified?: boolean;
  isPrivate?: boolean;
  posts?: Post[];
  reels?: Reel[];
  reelsCount?: number;
  scrapeTime?: string;
  lastScraped?: string;
}

export default function ProfileClient({ username }: { username: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "posts" | "reels">(
    "overview"
  );

  useEffect(() => {
    async function fetchProfileData() {
      try {
        setLoading(true);
        // In a real app, you would fetch this from your API
        // For now, let's simulate a request to the API
        const response = await fetch(`/api/profile/${username}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch profile data for ${username}`);
        }

        const data = await response.json();
        setProfile(data.profile);
      } catch (error) {
        console.error("Error fetching profile data:", error);
        setError(
          error instanceof Error ? error.message : "Failed to load profile data"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchProfileData();
  }, [username]);

  // Function to generate mock chart data
  const generateChartData = (label: string, count: number = 12) => {
    const labels = Array.from({ length: count }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (count - i - 1));
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    });

    return {
      labels,
      datasets: [
        {
          label,
          data: Array.from({ length: count }, () =>
            Math.floor(Math.random() * 1000)
          ),
          borderColor: "rgb(219, 39, 119)",
          backgroundColor: "rgba(219, 39, 119, 0.1)",
          tension: 0.3,
        },
      ],
    };
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        titleColor: "#111827",
        bodyColor: "#111827",
        borderColor: "#e5e7eb",
        borderWidth: 1,
        padding: 10,
        boxPadding: 5,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
      },
    },
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
                alt="Pistah Logo"
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
        <div className="max-w-6xl mx-auto">
          <Link
            href="/dashboard"
            className="inline-flex items-center mb-8 text-gray-600 hover:text-purple-600"
          >
            <ArrowLeft className="mr-2 w-4 h-4" />
            Back to Dashboard
          </Link>

          {loading ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-gray-100">
              <div className="w-12 h-12 border-4 border-t-transparent border-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-700">Loading profile data...</p>
            </div>
          ) : error ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-gray-100">
              <div className="text-red-500 text-4xl mb-4">⚠️</div>
              <h2 className="text-xl font-bold mb-2 text-gray-800">
                Error Loading Profile
              </h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <Link
                href="/dashboard"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                Try Another Profile
              </Link>
            </div>
          ) : profile ? (
            <>
              {/* Profile Header */}
              <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border border-gray-100">
                <div className="flex flex-col md:flex-row items-center md:items-start">
                  <div className="md:mr-8 mb-4 md:mb-0">
                    <div className="w-28 h-28 relative rounded-full overflow-hidden ring-4 ring-purple-100">
                      <Image
                        src={
                          profile.profilePicUrl ||
                          "https://ui-avatars.com/api/?name=" + profile.username
                        }
                        alt={`${profile.username}'s profile picture`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>

                  <div className="flex-1 text-center md:text-left">
                    <div className="flex flex-col md:flex-row md:items-center mb-4">
                      <h1 className="text-2xl font-bold mb-1 md:mb-0 md:mr-3 text-gray-900 flex items-center">
                        <Instagram className="inline-block mr-2 w-5 h-5 text-pink-500" />
                        {profile.username}
                        {profile.isVerified && (
                          <span className="inline-block ml-2 text-blue-500">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              fill="currentColor"
                              viewBox="0 0 16 16"
                              className="inline-block"
                            >
                              <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z" />
                            </svg>
                          </span>
                        )}
                      </h1>
                      {profile.isPrivate && (
                        <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                          Private Account
                        </span>
                      )}
                    </div>

                    <h2 className="text-lg font-medium mb-2 text-gray-800">
                      {profile.fullName}
                    </h2>
                    <p className="text-gray-600 mb-6 max-w-2xl">
                      {profile.bio}
                    </p>

                    {profile.externalUrl && (
                      <p className="text-gray-500 mb-4">
                        <a
                          href={profile.externalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-600 hover:text-purple-800"
                        >
                          {profile.externalUrl}
                        </a>
                      </p>
                    )}

                    <div className="flex flex-wrap justify-center md:justify-start gap-8 mb-6">
                      <div className="text-center md:text-left">
                        <div className="font-bold text-2xl text-gray-900">
                          {profile.postsCount}
                        </div>
                        <div className="text-gray-500 text-sm">Posts</div>
                      </div>
                      <div className="text-center md:text-left">
                        <div className="font-bold text-2xl text-gray-900">
                          {profile.followersCount?.toLocaleString()}
                        </div>
                        <div className="text-gray-500 text-sm">Followers</div>
                      </div>
                      <div className="text-center md:text-left">
                        <div className="font-bold text-2xl text-gray-900">
                          {profile.followingCount?.toLocaleString()}
                        </div>
                        <div className="text-gray-500 text-sm">Following</div>
                      </div>
                    </div>

                    <button
                      className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity"
                      onClick={() => {
                        // In a real app, implement the CSV export logic here
                        alert(
                          "Export functionality would be implemented in a real app"
                        );
                      }}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export Data
                    </button>
                  </div>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="mb-8">
                <div className="flex border-b">
                  <button
                    className={`px-4 py-3 font-medium ${
                      activeTab === "overview"
                        ? "border-b-2 border-purple-600 text-purple-600"
                        : "text-gray-600 hover:text-purple-600"
                    }`}
                    onClick={() => setActiveTab("overview")}
                  >
                    Overview
                  </button>
                  <button
                    className={`px-4 py-3 font-medium ${
                      activeTab === "posts"
                        ? "border-b-2 border-purple-600 text-purple-600"
                        : "text-gray-600 hover:text-purple-600"
                    }`}
                    onClick={() => setActiveTab("posts")}
                  >
                    Posts
                  </button>
                  <button
                    className={`px-4 py-3 font-medium ${
                      activeTab === "reels"
                        ? "border-b-2 border-purple-600 text-purple-600"
                        : "text-gray-600 hover:text-purple-600"
                    }`}
                    onClick={() => setActiveTab("reels")}
                  >
                    Reels
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              {activeTab === "overview" && (
                <>
                  <div className="grid md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                      <h3 className="text-lg font-bold mb-4 text-gray-900">
                        Follower Growth
                      </h3>
                      <Line
                        data={generateChartData("Followers", 30)}
                        options={chartOptions}
                      />
                    </div>
                    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                      <h3 className="text-lg font-bold mb-4 text-gray-900">
                        Post Engagement
                      </h3>
                      <Line
                        data={generateChartData("Engagement", 30)}
                        options={chartOptions}
                      />
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100">
                    <h3 className="text-lg font-bold mb-6 text-gray-900">
                      Profile Summary
                    </h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="bg-gray-50 p-6 rounded-lg">
                        <h4 className="font-medium mb-2 text-gray-700">
                          Engagement Rate
                        </h4>
                        <p className="text-2xl font-bold text-pink-600">
                          {(Math.random() * 5 + 1).toFixed(2)}%
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                          Higher than {Math.floor(Math.random() * 60) + 20}% of
                          similar accounts
                        </p>
                      </div>
                      <div className="bg-gray-50 p-6 rounded-lg">
                        <h4 className="font-medium mb-2 text-gray-700">
                          Avg. Likes per Post
                        </h4>
                        <p className="text-2xl font-bold text-purple-600">
                          {Math.floor(Math.random() * 5000)}
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                          Based on the last{" "}
                          {Math.floor(Math.random() * 20) + 10} posts
                        </p>
                      </div>
                      <div className="bg-gray-50 p-6 rounded-lg">
                        <h4 className="font-medium mb-2 text-gray-700">
                          Avg. Comments per Post
                        </h4>
                        <p className="text-2xl font-bold text-purple-600">
                          {Math.floor(Math.random() * 500)}
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                          {Math.floor(Math.random() * 50)}% increase from
                          previous month
                        </p>
                      </div>
                      <div className="bg-gray-50 p-6 rounded-lg">
                        <h4 className="font-medium mb-2 text-gray-700">
                          Post Frequency
                        </h4>
                        <p className="text-2xl font-bold text-pink-600">
                          {(Math.random() * 4 + 0.5).toFixed(1)} / week
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                          Consistent posting pattern detected
                        </p>
                      </div>
                    </div>
                  </div>

                  {profile.scrapeTime && (
                    <div className="mt-6 text-sm text-gray-500">
                      <p>
                        Last scraped:{" "}
                        {new Date(profile.scrapeTime).toLocaleString()}
                      </p>
                    </div>
                  )}
                </>
              )}

              {activeTab === "posts" && (
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-900">
                      Recent Posts
                    </h3>
                    {profile.posts && profile.posts.length > 0 && (
                      <span className="text-sm text-gray-500">
                        Showing {profile.posts.length} of {profile.postsCount}{" "}
                        posts
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {profile.posts && profile.posts.length > 0 ? (
                      profile.posts.map((post, index) => (
                        <div
                          key={index}
                          className="rounded-lg overflow-hidden shadow-sm border border-gray-200 group hover:shadow-md transition-shadow"
                        >
                          <div className="relative aspect-square">
                            <Image
                              src={post.mediaUrl}
                              alt={`Post ${index + 1}`}
                              fill
                              className="object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-start p-3">
                              <p className="text-white text-sm truncate">
                                {post.caption?.substring(0, 30)}...
                              </p>
                            </div>
                          </div>
                          <div className="p-3 bg-white">
                            <div className="flex items-center justify-between text-sm text-gray-600">
                              <div className="flex items-center gap-3">
                                <span className="flex items-center">
                                  ❤️ {post.likesCount}
                                </span>
                                <span className="flex items-center">
                                  💬 {post.commentsCount}
                                </span>
                              </div>
                              <span className="text-xs text-gray-500">
                                {new Date(post.timestamp).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full text-center py-12 text-gray-500">
                        No posts available
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "reels" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                  {profile.reels && profile.reels.length > 0 ? (
                    profile.reels.map((reel) => (
                      <div
                        key={reel.id}
                        className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                      >
                        <div className="aspect-[9/16] relative bg-gray-100">
                          {/* If thumbnail is not available, use a placeholder */}
                          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                            <Instagram className="w-12 h-12" />
                          </div>
                        </div>
                        <div className="p-4">
                          <a
                            href={reel.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-600 hover:text-purple-800 text-sm font-medium mb-2 flex items-center"
                          >
                            <Instagram className="inline-block mr-1 w-4 h-4" />
                            View on Instagram
                          </a>

                          <div className="flex items-center justify-between mt-3 text-gray-500 text-sm">
                            <div className="flex items-center">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 mr-1"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                              {reel.views ? reel.views.toLocaleString() : "N/A"}
                            </div>

                            {reel.likes && (
                              <div className="flex items-center">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4 mr-1"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                  />
                                </svg>
                                {reel.likes.toLocaleString()}
                              </div>
                            )}

                            {reel.comments && (
                              <div className="flex items-center">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4 mr-1"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                  />
                                </svg>
                                {reel.comments.toLocaleString()}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12 text-gray-500">
                      No reels found for this profile.
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-gray-100">
              <div className="text-yellow-500 text-4xl mb-4">⚠️</div>
              <h2 className="text-xl font-bold mb-2 text-gray-800">
                Profile Not Found
              </h2>
              <p className="text-gray-600 mb-6 max-w-lg mx-auto">
                We couldn&apos;t find any data for the Instagram profile &quot;@
                {username}&quot;.
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                Try Another Profile
              </Link>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 bg-gray-50 text-gray-600 border-t border-gray-200 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center mb-4">
            <Image
              src="/images/pistah.svg"
              alt="Pistah Logo"
              width={100}
              height={35}
            />
          </div>
          <p className="text-gray-500">
            &copy; {new Date().getFullYear()} Pistah. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
