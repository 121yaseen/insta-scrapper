"use client";

import { useState } from "react";
import { useYouTubeData } from "@/hooks/useYouTubeData";
import LanguageDropdown from "./LanguageDropdown";

interface YouTubeMetadataProps {
  videoId: string;
}

export default function YouTubeMetadata({ videoId }: YouTubeMetadataProps) {
  const { videoData, loading, error, fetchCaptions } = useYouTubeData(videoId);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("");
  const [captions, setCaptions] = useState<string | null>(null);
  const [captionsLoading, setCaptionsLoading] = useState<boolean>(false);

  const handleLanguageChange = async (languageCode: string) => {
    if (!languageCode) return;

    setSelectedLanguage(languageCode);
    setCaptionsLoading(true);

    try {
      const captionsData = await fetchCaptions(languageCode);
      setCaptions(captionsData);
    } catch (err) {
      console.error("Error fetching captions:", err);
      setCaptions(null);
    } finally {
      setCaptionsLoading(false);
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Loading video metadata...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">Error: {error}</div>;
  }

  if (!videoData) {
    return <div className="p-4 text-center">No video data available</div>;
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">{videoData.title}</h1>
        <div className="aspect-video mb-4">
          <img
            src={videoData.thumbnail}
            alt={videoData.title}
            className="w-full h-full object-cover rounded-lg"
          />
        </div>
        <p className="text-gray-700 mb-2">
          <span className="font-semibold">Duration:</span>{" "}
          {Math.floor(videoData.duration / 60)}:
          {(videoData.duration % 60).toString().padStart(2, "0")}
        </p>
        <p className="text-gray-700 mb-4">{videoData.description}</p>
      </div>

      {videoData.availableLanguages.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Creator Language</h2>
          <div className="mb-4">
            <LanguageDropdown
              languages={videoData.availableLanguages}
              selectedLanguage={selectedLanguage}
              onChange={handleLanguageChange}
              placeholder="Select creator language"
              label="Select a language for captions:"
              disabled={captionsLoading}
            />
          </div>

          {captionsLoading && (
            <div className="text-center py-2">Loading captions...</div>
          )}

          {captions && (
            <div className="border rounded-lg p-4 bg-gray-50 max-h-60 overflow-y-auto">
              <h3 className="font-semibold mb-2">Captions</h3>
              <pre className="text-sm whitespace-pre-wrap">{captions}</pre>
            </div>
          )}
        </div>
      )}

      <div>
        <h2 className="text-xl font-semibold mb-3">Available Formats</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {videoData.formats.map((format, index) => (
            <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
              <h3 className="font-medium mb-1">{format.quality}</h3>
              {format.width && format.height && (
                <p className="text-sm text-gray-600 mb-1">
                  Resolution: {format.width}x{format.height}
                </p>
              )}
              <p className="text-sm text-gray-600 mb-2">
                Format: {format.mimeType.split(";")[0]}
              </p>
              <a
                href={format.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                Open stream
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
