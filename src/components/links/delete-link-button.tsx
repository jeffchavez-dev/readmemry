"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function DeleteLinkButton({ linkId }: { linkId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!window.confirm("Remove this saved link? This can't be undone.")) return;

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from("links").delete().eq("id", linkId);
    setLoading(false);

    if (error) {
      window.alert(error.message);
      return;
    }

    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className="text-sm text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
    >
      {loading ? "Removing…" : "Remove"}
    </button>
  );
}
