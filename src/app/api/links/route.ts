import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveUser } from "@/lib/auth/resolve-user";
import { parseTagInput } from "@/lib/tags";

// Called by the web app (session cookie), the PWA save flow, and the Chrome
// extension (bearer token, cross-origin from chrome-extension://) — hence
// both dual auth (resolveUser) and explicit CORS headers.
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

// ?url= does a duplicate-detection lookup (used by the extension popup);
// with no url param, returns the user's most recent saves (used by the
// extension's New Tab page).
export async function GET(request: NextRequest) {
  const identity = await resolveUser(request);
  if (!identity) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: CORS_HEADERS });
  }

  const admin = createAdminClient();
  const url = request.nextUrl.searchParams.get("url");

  if (url) {
    const { data: link } = await admin
      .from("links")
      .select("id, url, title")
      .eq("user_id", identity.userId)
      .eq("url", url)
      .maybeSingle();

    return NextResponse.json({ link }, { headers: CORS_HEADERS });
  }

  const limit = Math.min(Number(request.nextUrl.searchParams.get("limit")) || 20, 50);
  const { data: links } = await admin
    .from("links")
    .select("id, url, title, favicon_url, created_at")
    .eq("user_id", identity.userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return NextResponse.json({ links: links ?? [] }, { headers: CORS_HEADERS });
}

export async function POST(request: NextRequest) {
  const identity = await resolveUser(request);
  if (!identity) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: CORS_HEADERS });
  }

  const body = await request.json().catch(() => null);
  if (!body?.url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400, headers: CORS_HEADERS });
  }

  let normalizedUrl: string;
  try {
    normalizedUrl = new URL(body.url).toString();
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400, headers: CORS_HEADERS });
  }

  const admin = createAdminClient();

  const { data: link, error: insertError } = await admin
    .from("links")
    .insert({
      user_id: identity.userId,
      url: normalizedUrl,
      title: body.title || null,
      description: body.description || null,
      image_url: body.imageUrl || null,
      favicon_url: body.faviconUrl || null,
      note: body.note || null,
      source: body.source === "extension" ? "extension" : "web",
    })
    .select("id")
    .single();

  if (insertError || !link) {
    return NextResponse.json(
      { error: insertError?.message ?? "Failed to save link" },
      { status: 500, headers: CORS_HEADERS },
    );
  }

  const tagNames = parseTagInput(String(body.tags ?? ""));
  if (tagNames.length > 0) {
    const { data: tags } = await admin
      .from("tags")
      .upsert(
        tagNames.map((name) => ({ name })),
        { onConflict: "name" },
      )
      .select("id, name");

    if (tags) {
      await admin
        .from("link_tags")
        .insert(tags.map((tag) => ({ link_id: link.id, tag_id: tag.id })));
    }
  }

  return NextResponse.json({ id: link.id }, { status: 201, headers: CORS_HEADERS });
}
