import { NextRequest, NextResponse } from "next/server";

// Export config for Edge runtime
export const runtime = "edge";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json(
      { error: "URL parameter is required" },
      { status: 400 }
    );
  }

  try {
    // Decode the URL if it's encoded
    const decodedUrl = decodeURIComponent(url);

    // Validate the URL is from Instagram domains
    const validDomains = [
      "instagram.fcok7-1.fna.fbcdn.net",
      "instagram.com",
      "www.instagram.com",
      "scontent.cdninstagram.com",
      "scontent-iad3-1.cdninstagram.com",
      "graph.instagram.com",
      "instagram.f", // Cover all regional subdomains
      "scontent", // Cover all scontent variations
      "cdninstagram.com",
    ];

    const urlObj = new URL(decodedUrl);
    const isValidDomain = validDomains.some((domain) =>
      urlObj.hostname.includes(domain)
    );

    if (!isValidDomain) {
      console.error(`Invalid domain detected: ${urlObj.hostname}`);
      return NextResponse.json(
        { error: "Invalid image domain" },
        { status: 403 }
      );
    }

    // Add custom headers to avoid Instagram restrictions
    const headers = new Headers();
    headers.append(
      "User-Agent",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36"
    );
    headers.append(
      "Accept",
      "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
    );
    headers.append("Accept-Language", "en-US,en;q=0.9");
    headers.append("Referer", "https://www.instagram.com/");

    // Fetch the image with custom headers
    const response = await fetch(decodedUrl, {
      headers,
      cache: "force-cache",
    });

    if (!response.ok) {
      console.error(
        `Failed to fetch image: ${response.status} - ${response.statusText}`
      );
      return NextResponse.json(
        { error: `Failed to fetch image: ${response.statusText}` },
        { status: response.status }
      );
    }

    // Get the image data as an array buffer
    const imageData = await response.arrayBuffer();

    if (!imageData || imageData.byteLength === 0) {
      console.error("Empty image data received");
      return NextResponse.json(
        { error: "Empty image data received" },
        { status: 500 }
      );
    }

    // Return the image with appropriate headers
    return new NextResponse(imageData, {
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "image/jpeg",
        "Cache-Control": "public, max-age=86400", // Cache for 24 hours
        "Access-Control-Allow-Origin": "*", // Allow CORS
      },
    });
  } catch (error) {
    console.error("Error proxying image:", error);
    return NextResponse.json(
      { error: "Failed to proxy image" },
      { status: 500 }
    );
  }
}
