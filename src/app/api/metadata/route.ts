import { NextResponse, type NextRequest } from "next/server";
import ogs from "open-graph-scraper";

// Shared by both the web/PWA save flow and the Chrome extension (cross-origin,
// hence the permissive CORS headers below — auth for this route is by design
// public/unauthenticated, it just fetches public page metadata).
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url param" }, { status: 400, headers: CORS_HEADERS });
  }

  try {
    new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400, headers: CORS_HEADERS });
  }

  // Metadata fetching must never block a save — always resolve, worst case
  // with empty fields the user fills in by hand.
  try {
    const { result } = await ogs({ url, timeout: 5, fetchOptions: { headers: { "user-agent": "Mozilla/5.0" } } });

    return NextResponse.json(
      {
        title: result.ogTitle || result.twitterTitle || null,
        description: result.ogDescription || result.twitterDescription || null,
        image: result.ogImage?.[0]?.url || result.twitterImage?.[0]?.url || null,
        favicon: result.favicon || null,
      },
      { headers: CORS_HEADERS },
    );
  } catch (error) {
    console.error(`Metadata fetch failed for ${url}:`, error);
    return NextResponse.json(
      { title: null, description: null, image: null, favicon: null },
      { headers: CORS_HEADERS },
    );
  }
}
