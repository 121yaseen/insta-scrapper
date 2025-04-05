"use client";

import { useState, useEffect } from "react";

interface Language {
  code: string;
  name: string;
}

interface VideoFormat {
  quality: string;
  url: string;
  mimeType: string;
  width?: number;
  height?: number;
}

interface VideoMetadata {
  videoId: string;
  title: string;
  description: string;
  duration: number;
  thumbnail: string;
  availableLanguages: Language[];
  formats: VideoFormat[];
  captionsUrl?: string;
}

interface UseYouTubeDataResult {
  videoData: VideoMetadata | null;
  loading: boolean;
  error: string | null;
  fetchCaptions: (languageCode: string) => Promise<string | null>;
}

/**
 * Hook to fetch and manage YouTube video metadata including language information
 * @param videoId The YouTube video ID
 * @returns Video metadata, loading state, error, and caption fetching function
 */
export function useYouTubeData(videoId: string): UseYouTubeDataResult {
  const [videoData, setVideoData] = useState<VideoMetadata | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!videoId) {
        setError("Video ID is required");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/youtube?videoId=${videoId}`);

        if (!response.ok) {
          throw new Error(`Error fetching video data: ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        setVideoData(data.videoData);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "An unknown error occurred";
        setError(errorMessage);
        console.error("Error fetching YouTube data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [videoId]);

  /**
   * Fetch captions for a specific language
   * @param languageCode The language code to fetch captions for
   * @returns Captions text or null if unavailable
   */
  const fetchCaptions = async (
    languageCode: string
  ): Promise<string | null> => {
    if (!videoData?.captionsUrl) {
      return null;
    }

    try {
      const response = await fetch(
        `/api/youtube?videoId=${videoId}&captions=true&captionUrl=${encodeURIComponent(
          videoData.captionsUrl
        )}&lang=${languageCode}`
      );

      if (!response.ok) {
        throw new Error(`Error fetching captions: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      return data.captions;
    } catch (err) {
      console.error("Error fetching captions:", err);
      return null;
    }
  };

  return { videoData, loading, error, fetchCaptions };
}
