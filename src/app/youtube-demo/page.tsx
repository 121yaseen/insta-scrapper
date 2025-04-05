"use client";

import { useState } from "react";
import YouTubeMetadata from "@/app/components/YouTubeMetadata";

export default function YouTubeDemoPage() {
  const [videoId, setVideoId] = useState<string>("W5WgPebBKqw"); // Default to the video ID from the example
  const [inputValue, setInputValue] = useState<string>("W5WgPebBKqw");

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
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">
        YouTube Metadata Demo
      </h1>

      <div className="max-w-2xl mx-auto mb-8">
        <form onSubmit={handleSubmit} className="flex space-x-2">
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
        </form>
        <p className="mt-2 text-sm text-gray-600">
          Example: Enter a YouTube video ID (e.g., dQw4w9WgXcQ) or full URL
        </p>
      </div>

      {videoId && <YouTubeMetadata videoId={videoId} />}
    </div>
  );
}
