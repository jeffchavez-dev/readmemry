"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { badgeVariants } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { LinkStatus } from "@/lib/types";

const STATUS_ORDER: LinkStatus[] = ["to_read", "reading", "read"];

const STATUS_LABEL: Record<LinkStatus, string> = {
  to_read: "To read",
  reading: "Reading",
  read: "Read",
};

const STATUS_VARIANT: Record<LinkStatus, "outline" | "default" | "secondary"> = {
  to_read: "outline",
  reading: "default",
  read: "secondary",
};

// Owner-only, deliberately: reading status is personal housekeeping, not a
// public signal, so this only ever renders in contexts where isOwner is
// already true (the caller decides whether to render it at all).
export function StatusChip({ linkId, status }: { linkId: string; status: LinkStatus }) {
  const [current, setCurrent] = useState(status);
  const [saving, setSaving] = useState(false);

  async function handleClick() {
    if (saving) return;

    const previous = current;
    const next = STATUS_ORDER[(STATUS_ORDER.indexOf(current) + 1) % STATUS_ORDER.length];
    setCurrent(next);
    setSaving(true);

    const supabase = createClient();
    const { error } = await supabase.from("links").update({ status: next }).eq("id", linkId);
    setSaving(false);

    if (error) {
      // Revert — better than silently showing a status that didn't save.
      setCurrent(previous);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={saving}
      className={cn(
        badgeVariants({ variant: STATUS_VARIANT[current] }),
        "cursor-pointer disabled:cursor-default disabled:opacity-60",
      )}
      title="Click to change reading status"
    >
      {STATUS_LABEL[current]}
    </button>
  );
}
