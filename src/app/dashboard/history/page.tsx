"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { History, Search, ArrowUpRight, ExternalLink } from "lucide-react";

interface ScrapeRequest {
  id: string;
  username: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  error?: string;
}

export default function HistoryPage() {
  const [loading, setLoading] = useState(true);
  const [scrapeRequests, setScrapeRequests] = useState<ScrapeRequest[]>([]);

  useEffect(() => {
    async function fetchScrapeHistory() {
      try {
        setLoading(true);

        // In a real app, you'd fetch this from your API
        // For now, let's generate mock data
        const mockRequests: ScrapeRequest[] = Array.from(
          { length: 10 },
          (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - i);

            const statuses = [
              "completed",
              "completed",
              "completed",
              "failed",
              "pending",
            ];
            const status =
              statuses[Math.floor(Math.random() * statuses.length)];

            return {
              id: `req-${i}`,
              username: `instagram_user_${10 - i}`,
              status,
              createdAt: date.toISOString(),
              updatedAt: date.toISOString(),
              error:
                status === "failed"
                  ? "Failed to fetch Instagram profile data"
                  : undefined,
            };
          }
        );

        setScrapeRequests(mockRequests);
      } catch (error) {
        console.error("Error fetching scrape history:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchScrapeHistory();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold">
              InstaScrapr
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
                className="text-gray-800 hover:text-purple-600 transition-colors font-medium"
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
          <div className="flex flex-col md:flex-row items-center justify-between mb-12">
            <div>
              <h1 className="text-3xl font-bold mb-2 text-gray-900">
                Analysis History
              </h1>
              <p className="text-gray-600">
                View your past Instagram profile analysis requests
              </p>
            </div>
            <Link
              href="/dashboard"
              className="flex items-center mt-4 md:mt-0 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
            >
              <Search className="w-4 h-4 mr-2" />
              New Analysis
            </Link>
          </div>

          {loading ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <div className="w-12 h-12 border-4 border-t-transparent border-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-700">Loading analysis history...</p>
            </div>
          ) : scrapeRequests.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-gray-100">
              <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2 text-gray-800">
                No Analysis History
              </h2>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                You haven&apos;t made any Instagram profile analysis requests
                yet.
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                Start Your First Analysis
                <ArrowUpRight className="ml-2 w-5 h-5" />
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Username
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {scrapeRequests.map((request) => (
                      <tr
                        key={request.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-800">
                            @{request.username}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              request.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : request.status === "pending" ||
                                  request.status === "processing"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {request.status.charAt(0).toUpperCase() +
                              request.status.slice(1)}
                          </span>
                          {request.error && (
                            <div className="text-xs text-red-600 mt-1">
                              {request.error}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(request.createdAt).toLocaleDateString()}{" "}
                          {new Date(request.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {request.status === "completed" ? (
                            <Link
                              href={`/dashboard/profile/${request.username}`}
                              className="inline-flex items-center text-purple-600 hover:text-purple-900"
                            >
                              View Profile
                              <ExternalLink className="w-4 h-4 ml-1" />
                            </Link>
                          ) : request.status === "failed" ? (
                            <button
                              onClick={() =>
                                alert(
                                  `Retry functionality would be implemented in a real app`
                                )
                              }
                              className="text-purple-600 hover:text-purple-900"
                            >
                              Retry
                            </button>
                          ) : (
                            <span className="text-gray-400">Processing</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 bg-gray-50 text-gray-600 border-t border-gray-200 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-500">
            &copy; {new Date().getFullYear()} InstaScrapr. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
