"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import {
  Instagram,
  Search,
  BarChart2,
  History,
  ArrowRight,
  Users,
} from "lucide-react";
import Image from "next/image";

export default function Dashboard() {
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Load Instagram handle from localStorage when component mounts
  useEffect(() => {
    const savedHandle = localStorage.getItem("instagramHandle");
    if (savedHandle) {
      setUsername(savedHandle);
      // Clear from localStorage to avoid persisting indefinitely
      localStorage.removeItem("instagramHandle");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username) {
      setMessage("Please enter an Instagram username");
      return;
    }

    setIsLoading(true);
    setMessage("Submitting scrape request for: " + username);

    try {
      // API call to submit scrape request
      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to submit scrape request");
      }

      if (data.alreadyQueued) {
        setMessage(
          `Notice: @${username} was already queued within the last 24 hours. Your request has been saved, but processing will use the existing queue entry.`
        );
      } else {
        setMessage(
          `Success! Request for @${username} has been submitted for analysis.`
        );
      }

      setUsername("");
    } catch (error) {
      if (error instanceof Error) {
        setMessage(`Error: ${error.message}`);
      } else {
        setMessage("An unknown error occurred");
      }
    } finally {
      setIsLoading(false);
    }
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
                className="text-gray-800 hover:text-purple-600 transition-colors font-medium"
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/discover"
                className="text-gray-600 hover:text-purple-600 transition-colors"
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
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between mb-12">
            <div>
              <h1 className="text-3xl font-bold mb-2 text-gray-900">
                Instagram Profile Analyzer
              </h1>
              <p className="text-gray-600">
                Enter any Instagram handle to get comprehensive analytics
              </p>
            </div>
            <Link
              href="/dashboard/history"
              className="flex items-center mt-4 md:mt-0 text-purple-600 hover:text-purple-700 font-medium"
            >
              <History className="w-4 h-4 mr-2" />
              View Analysis History
            </Link>
          </div>

          {/* Search Form */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-12 border border-gray-100">
            <h2 className="text-xl font-bold mb-6 text-gray-900">
              Analyze Instagram Profile
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label
                  htmlFor="username"
                  className="block text-sm font-medium mb-2 text-gray-700"
                >
                  Instagram Username
                </label>
                <div className="flex">
                  <div className="px-3 py-2 bg-gray-50 border-y border-l border-gray-300 rounded-l-lg flex items-center">
                    <Instagram className="w-5 h-5 text-gray-500" />
                  </div>
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter Instagram handle (without @)"
                    className="flex-1 p-3 border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-gray-700"
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !username}
                    className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-r-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        Analyze
                      </>
                    )}
                  </button>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Example: cristiano, kyliejenner, natgeo
                </p>
              </div>
            </form>

            {message && (
              <div
                className={`mt-4 p-4 rounded-lg ${
                  message.includes("Error")
                    ? "bg-red-50 text-red-700 border border-red-200"
                    : "bg-green-50 text-green-700 border border-green-200"
                }`}
              >
                {message}
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <h2 className="text-xl font-bold mb-6 text-gray-900">
            Recent Analysis
          </h2>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {/* Empty state */}
            <div className="col-span-3 bg-gray-50 rounded-xl p-10 text-center border border-gray-200">
              <BarChart2 className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                No recent analysis
              </h3>
              <p className="text-gray-600 mb-6">
                Start by entering an Instagram username above to analyze
                profiles
              </p>
              <div className="text-sm text-gray-500 flex flex-col gap-3 max-w-md mx-auto">
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                  <span>Analyze followers growth</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                  <span>Track engagement metrics</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                  <span>Compare content performance</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>

          {/* Discover Profiles Section */}
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-100 p-8 mb-8 shadow-sm">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="mb-6 md:mb-0">
                <h2 className="text-xl font-bold text-purple-900 mb-2 flex items-center">
                  <Users className="w-5 h-5 mr-2 text-purple-600" />
                  Discover Top Instagram Profiles
                </h2>
                <p className="text-purple-700 mb-2">
                  Browse and analyze popular Instagram creators sorted by
                  followers and engagement
                </p>
                <p className="text-sm text-purple-600">
                  Find potential collaborators and track industry leaders
                </p>
              </div>
              <Link
                href="/dashboard/discover"
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:opacity-90 transition-opacity flex items-center font-medium shadow-sm"
              >
                <Users className="w-4 h-4 mr-2" />
                Browse Profiles
              </Link>
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
