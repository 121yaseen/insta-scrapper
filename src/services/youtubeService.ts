interface VideoMetadata {
  videoId: string;
  title: string;
  description: string;
  duration: number;
  thumbnail: string;
  availableLanguages: {
    code: string;
    name: string;
  }[];
  formats: {
    quality: string;
    url: string;
    mimeType: string;
    width?: number;
    height?: number;
  }[];
  captionsUrl?: string;
}

interface YouTubeResponse {
  videoDetails?: {
    videoId: string;
    title: string;
    shortDescription: string;
    lengthSeconds: string;
    thumbnail: {
      thumbnails: Array<{
        url: string;
        width: number;
        height: number;
      }>;
    };
  };
  captions?: {
    playerCaptionsTracklistRenderer?: {
      captionTracks?: Array<{
        baseUrl: string;
        name: {
          runs: Array<{ text: string }>;
        };
        languageCode: string;
      }>;
      translationLanguages?: Array<{
        languageCode: string;
        languageName: {
          runs: Array<{ text: string }>;
        };
      }>;
    };
  };
  streamingData?: {
    formats?: Array<{
      url: string;
      mimeType: string;
      quality: string;
      width?: number;
      height?: number;
    }>;
  };
}

/**
 * Fetches video metadata from YouTube API
 * @param videoId YouTube video ID
 * @returns Processed video metadata
 */
export async function fetchYouTubeVideoData(
  videoId: string
): Promise<VideoMetadata | null> {
  try {
    // Prepare the fetch request to the YouTube API
    const response = await fetch(
      "https://www.youtube.com/youtubei/v1/player?prettyPrint=false",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "*/*",
          "Accept-Language": "en-US,en;q=0.9",
          Origin: "https://www.youtube.com",
          Referer: `https://www.youtube.com/watch?v=${videoId}`,
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
        },
        body: JSON.stringify({
          videoId,
          context: {
            client: {
              hl: "en",
              gl: "US",
              clientName: "WEB",
              clientVersion: "2.20230816.01.00",
            },
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch video data: ${response.status}`);
    }

    const data: YouTubeResponse = await response.json();

    if (!data.videoDetails) {
      throw new Error("Invalid response format");
    }

    // Extract and format the video details
    const result: VideoMetadata = {
      videoId: data.videoDetails.videoId,
      title: data.videoDetails.title,
      description: data.videoDetails.shortDescription,
      duration: parseInt(data.videoDetails.lengthSeconds, 10),
      thumbnail:
        data.videoDetails.thumbnail.thumbnails[
          data.videoDetails.thumbnail.thumbnails.length - 1
        ].url,
      availableLanguages: [],
      formats: [],
    };

    // Extract available languages for translation
    if (data.captions?.playerCaptionsTracklistRenderer?.translationLanguages) {
      result.availableLanguages =
        data.captions.playerCaptionsTracklistRenderer.translationLanguages.map(
          (lang) => ({
            code: lang.languageCode,
            name: lang.languageName.runs[0].text,
          })
        );
    }

    // Add caption URL if available
    if (data.captions?.playerCaptionsTracklistRenderer?.captionTracks?.[0]) {
      result.captionsUrl =
        data.captions.playerCaptionsTracklistRenderer.captionTracks[0].baseUrl;
    }

    // Extract available video formats
    if (data.streamingData?.formats) {
      result.formats = data.streamingData.formats.map((format) => ({
        quality: format.quality,
        url: format.url,
        mimeType: format.mimeType,
        width: format.width,
        height: format.height,
      }));
    }

    return result;
  } catch (error) {
    console.error("Error fetching YouTube video data:", error);
    return null;
  }
}

/**
 * Fetch captions for a YouTube video in a specific language
 * @param captionUrl The caption URL from the video metadata
 * @param languageCode Language code to fetch captions for
 * @returns Caption text
 */
export async function fetchYouTubeCaptions(
  captionUrl: string,
  languageCode: string
): Promise<string | null> {
  try {
    // Add language parameter to the caption URL
    const url = new URL(captionUrl);
    url.searchParams.set("lang", languageCode);

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Failed to fetch captions: ${response.status}`);
    }

    const data = await response.text();
    return data;
  } catch (error) {
    console.error("Error fetching YouTube captions:", error);
    return null;
  }
}
