import { NextRequest, NextResponse } from "next/server";

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
    ];

    const urlObj = new URL(decodedUrl);
    const isValidDomain = validDomains.some((domain) =>
      urlObj.hostname.includes(domain)
    );

    if (!isValidDomain) {
      return NextResponse.json(
        { error: "Invalid image domain" },
        { status: 403 }
      );
    }

    // Fetch the image
    const response = await fetch(decodedUrl);

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch image: ${response.statusText}` },
        { status: response.status }
      );
    }

    // Get the image data as an array buffer
    const imageData = await response.arrayBuffer();

    // Return the image with appropriate headers
    return new NextResponse(imageData, {
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "image/jpeg",
        "Cache-Control": "public, max-age=86400", // Cache for 24 hours
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
