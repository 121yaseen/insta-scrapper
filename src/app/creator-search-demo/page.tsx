"use client";

import { useState } from "react";
import CreatorLanguageFilter from "@/app/components/filters/CreatorLanguageFilter";
import YouTubeMetadata from "@/app/components/YouTubeMetadata";

export default function CreatorSearchDemoPage() {
  const [videoId, setVideoId] = useState<string>("W5WgPebBKqw");
  const [inputValue, setInputValue] = useState<string>("W5WgPebBKqw");
  const [language, setLanguage] = useState<string | null>(null);
  const [searchSubmitted, setSearchSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputValue.trim()) return;

    // Extract video ID from URL if needed
    let extractedId = inputValue.trim();

    // Handle full YouTube URLs
    const youtubeRegex =
      /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = inputValue.match(youtubeRegex);

    if (match && match[1]) {
      extractedId = match[1];
    }

    setVideoId(extractedId);
    setSearchSubmitted(true);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Creator Search Demo
      </h1>

      <div className="max-w-4xl mx-auto mb-8 bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Search Filters</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              YouTube Video ID or URL
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Enter YouTube video ID or URL"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Load
              </button>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Example: Enter a YouTube video ID (e.g., dQw4w9WgXcQ) or full URL
            </p>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <CreatorLanguageFilter
              value={language}
              onChange={setLanguage}
              label="Filter by Creator Language"
            />
          </div>

          <div className="flex justify-between border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={() => {
                setLanguage(null);
              }}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Reset Filters
            </button>

            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Search
            </button>
          </div>
        </form>
      </div>

      {searchSubmitted && (
        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Search Results</h2>
            {language && (
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                Language: {language}
              </div>
            )}
          </div>

          {videoId && <YouTubeMetadata videoId={videoId} />}
        </div>
      )}
    </div>
  );
}
