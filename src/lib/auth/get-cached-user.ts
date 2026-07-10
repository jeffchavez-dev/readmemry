import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

// supabase.auth.getUser() re-validates the session against Supabase's auth
// server on every call — a real network round-trip, not a local JWT decode
// (that's the whole point: it's the one that can't be spoofed by a stale
// cookie). Every page under (app)/layout.tsx calls it once for its own
// needs, on top of the layout already calling it for the nav — doubling
// auth latency on every request. React's cache() memoizes per-request, so
// repeated calls within the same render tree only hit the network once.
export const getCachedUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});
