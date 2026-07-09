import type { SupabaseClient } from "@supabase/supabase-js";

export function parseTagInput(raw: string): string[] {
  return Array.from(
    new Set(
      raw
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
    ),
  );
}

// Upserts each tag name into the global tag vocabulary and returns their ids.
export async function upsertTags(supabase: SupabaseClient, names: string[]) {
  if (names.length === 0) return [];

  const { data, error } = await supabase
    .from("tags")
    .upsert(
      names.map((name) => ({ name })),
      { onConflict: "name" },
    )
    .select("id, name");

  if (error) throw error;
  return data;
}
