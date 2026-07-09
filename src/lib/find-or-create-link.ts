import type { SupabaseClient } from "@supabase/supabase-js";

type NewLinkInput = {
  url: string;
  title?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  faviconUrl?: string | null;
  source?: string;
};

// Highlighting a page should implicitly save it if it isn't already in the
// user's library, matching Curius's behavior — a highlight is an annotation
// on a save, and you shouldn't have to save a page twice just to highlight it.
export async function findOrCreateLink(
  admin: SupabaseClient,
  userId: string,
  input: NewLinkInput,
): Promise<{ id: string } | null> {
  const { data: existing } = await admin
    .from("links")
    .select("id")
    .eq("user_id", userId)
    .eq("url", input.url)
    .maybeSingle();

  if (existing) return existing;

  const { data: created, error } = await admin
    .from("links")
    .insert({
      user_id: userId,
      url: input.url,
      title: input.title || null,
      description: input.description || null,
      image_url: input.imageUrl || null,
      favicon_url: input.faviconUrl || null,
      source: input.source === "extension" ? "extension" : "web",
    })
    .select("id")
    .single();

  if (error || !created) return null;
  return created;
}
