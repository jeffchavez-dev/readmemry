import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Server-only client using the service role key. Never import this from client components.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}
