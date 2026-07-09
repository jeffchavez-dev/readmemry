import { createHash } from "crypto";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

// Requests can be authenticated two ways: a Supabase session cookie (web app,
// installed PWA) or an `Authorization: Bearer <token>` personal access token
// (Chrome extension — MV3 service workers can't hold a browser session).
export async function resolveUser(request: Request): Promise<{ userId: string } | null> {
  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1];

  if (bearerToken) {
    const admin = createAdminClient();
    const tokenHash = hashToken(bearerToken);

    const { data } = await admin
      .from("access_tokens")
      .select("id, user_id")
      .eq("token_hash", tokenHash)
      .single();

    if (!data) return null;

    await admin
      .from("access_tokens")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", data.id);

    return { userId: data.user_id };
  }

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user ? { userId: user.id } : null;
}
