import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveUser } from "@/lib/auth/resolve-user";
import { findOrCreateLink } from "@/lib/find-or-create-link";

// Called by the extension's content script (bearer token, cross-origin from
// whatever page the user is highlighting on) and the web app.
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: NextRequest) {
  const identity = await resolveUser(request);
  if (!identity) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: CORS_HEADERS });
  }

  const body = await request.json().catch(() => null);
  if (!body?.url || !body?.quote) {
    return NextResponse.json(
      { error: "Missing url or quote" },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  let normalizedUrl: string;
  try {
    normalizedUrl = new URL(body.url).toString();
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400, headers: CORS_HEADERS });
  }

  const admin = createAdminClient();

  // Highlighting a page implicitly saves it if it isn't already in the
  // library — see find-or-create-link.ts.
  const link = await findOrCreateLink(admin, identity.userId, {
    url: normalizedUrl,
    title: body.title,
    source: body.source,
  });

  if (!link) {
    return NextResponse.json(
      { error: "Failed to save the page for this highlight" },
      { status: 500, headers: CORS_HEADERS },
    );
  }

  const { data: highlight, error: insertError } = await admin
    .from("highlights")
    .insert({
      link_id: link.id,
      user_id: identity.userId,
      quote: String(body.quote).trim(),
      text_fragment_url: body.textFragmentUrl || null,
      note: body.note || null,
    })
    .select("id")
    .single();

  if (insertError || !highlight) {
    return NextResponse.json(
      { error: insertError?.message ?? "Failed to save highlight" },
      { status: 500, headers: CORS_HEADERS },
    );
  }

  return NextResponse.json(
    { id: highlight.id, linkId: link.id },
    { status: 201, headers: CORS_HEADERS },
  );
}

// Recent highlights for the signed-in user, joined with their parent link's
// url/title — used by the extension's New Tab page.
export async function GET(request: NextRequest) {
  const identity = await resolveUser(request);
  if (!identity) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: CORS_HEADERS });
  }

  const admin = createAdminClient();
  const limit = Math.min(Number(request.nextUrl.searchParams.get("limit")) || 20, 50);

  const { data: highlights } = await admin
    .from("highlights")
    .select("id, quote, text_fragment_url, note, created_at, links(id, url, title)")
    .eq("user_id", identity.userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return NextResponse.json({ highlights: highlights ?? [] }, { headers: CORS_HEADERS });
}
