interface Location {
  id: string;
  display_name: string;
}

// Function to fetch locations with token authentication if needed
export async function fetchLocationsWithAuth(
  token: string
): Promise<Location[]> {
  try {
    const response = await fetch(
      "https://apigw.impulze.ai/api/v1/misc/locations",
      {
        headers: {
          accept: "application/json, text/plain, */*",
          "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
          origin: "https://socialiq.impulze.ai",
          referer: "https://socialiq.impulze.ai/",
          "sec-ch-ua":
            '"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"macOS"',
          "user-agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
          "x-access-token": token,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch locations: ${response.status}`);
    }

    const data = await response.json();
    return data.locations || [];
  } catch (error) {
    console.error("Error fetching locations with authentication:", error);
    throw error;
  }
}

// Function to fetch locations from our local API
export async function fetchLocations(): Promise<Location[]> {
  try {
    const response = await fetch("/api/locations");

    if (!response.ok) {
      throw new Error(`Failed to fetch locations: ${response.status}`);
    }

    const data = await response.json();
    return data.locations || [];
  } catch (error) {
    console.error("Error fetching locations:", error);
    throw error;
  }
}
