"use client";

import Link from "next/link";
import { ArrowUpRight, Check, Instagram, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";

export default function Home() {
  const { userId, isLoaded } = useAuth();
  const router = useRouter();
  const [instagramHandle, setInstagramHandle] = useState("");

  // Redirect to dashboard if user is logged in
  useEffect(() => {
    if (isLoaded && userId) {
      router.push("/dashboard");
    }
  }, [isLoaded, userId, router]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    if (instagramHandle.trim()) {
      // Store the Instagram handle in localStorage
      localStorage.setItem("instagramHandle", instagramHandle.trim());

      // Redirect to sign-in page
      router.push("/sign-in");
    }
  };

  return (
    <div className="relative overflow-hidden bg-white">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 opacity-70" />

      <div className="relative pt-24 pb-32 sm:pt-32 sm:pb-40">
        <div className="container mx-auto px-4">
          <nav className="flex justify-between items-center mb-16 absolute top-0 left-0 right-0 px-4 py-6">
            <div className="text-2xl font-bold">InstaScrapr</div>
            <div className="space-x-4">
              {userId ? (
                <Link
                  href="/dashboard"
                  className="px-6 py-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:opacity-90 transition-opacity"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/sign-in"
                    className="px-6 py-2 rounded-full border border-gray-300 hover:bg-gray-100 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/sign-up"
                    className="px-6 py-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:opacity-90 transition-opacity"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </nav>

          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-8 tracking-tight">
              Unlock{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">
                Instagram
              </span>{" "}
              Analytics in Seconds
            </h1>

            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
              Enter any Instagram handle and instantly get profile insights,
              post metrics, and engagement analytics. Make data-driven decisions
              without the guesswork.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {userId ? (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center px-8 py-4 text-white bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg hover:opacity-90 transition-opacity text-lg font-medium"
                >
                  Go to Dashboard
                  <ArrowUpRight className="ml-2 w-5 h-5" />
                </Link>
              ) : (
                <Link
                  href="/sign-up"
                  className="inline-flex items-center px-8 py-4 text-white bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg hover:opacity-90 transition-opacity text-lg font-medium"
                >
                  Try It Free
                  <ArrowUpRight className="ml-2 w-5 h-5" />
                </Link>
              )}

              <Link
                href="#pricing"
                className="inline-flex items-center px-8 py-4 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-lg font-medium"
              >
                View Pricing
              </Link>
            </div>

            <div className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                <span>No Instagram login required</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                <span>Unlimited searches</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                <span>Export analytics data</span>
              </div>
            </div>

            {/* Search bar form */}
            <form
              onSubmit={handleSearch}
              className="mt-16 max-w-2xl mx-auto bg-white p-4 rounded-xl shadow-lg"
            >
              <div className="flex items-center border-2 border-gray-200 rounded-lg overflow-hidden">
                <div className="px-3 py-2 bg-gray-50">
                  <Instagram className="w-5 h-5 text-gray-500" />
                </div>
                <input
                  type="text"
                  placeholder="Enter Instagram handle (e.g., @username)"
                  className="flex-1 px-4 py-3 outline-none text-gray-700"
                  value={instagramHandle}
                  onChange={(e) => setInstagramHandle(e.target.value)}
                />
                <button
                  type="submit"
                  className="px-4 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium flex items-center"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Try our tool with your favorite Instagram profiles
              </p>
            </form>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 bg-gray-50 text-gray-600 border-t border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <div className="text-xl font-bold">InstaScrapr</div>
              <p className="text-gray-500">Instagram Analytics Tool</p>
            </div>
            <div className="flex space-x-6">
              <Link
                href="/privacy"
                className="hover:text-purple-600 transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="hover:text-purple-600 transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                href="/contact"
                className="hover:text-purple-600 transition-colors"
              >
                Contact Us
              </Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200 text-center text-gray-500">
            &copy; {new Date().getFullYear()} InstaScrapr. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
