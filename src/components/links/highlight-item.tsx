"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Highlight } from "@/lib/types";

export function HighlightItem({
  highlight,
  fallbackUrl,
  isOwner,
}: {
  highlight: Highlight;
  fallbackUrl: string;
  isOwner: boolean;
}) {
  const [note, setNote] = useState(highlight.note ?? "");
  const [draft, setDraft] = useState(note);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("highlights")
      .update({ note: draft.trim() || null })
      .eq("id", highlight.id);

    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setNote(draft.trim());
    setEditing(false);
  }

  return (
    <div className="rounded-lg border-l-4 border-primary/50 bg-accent/40 px-4 py-3">
      <a
        href={highlight.text_fragment_url || fallbackUrl}
        target="_blank"
        rel="noreferrer"
        className="block hover:underline"
      >
        <p className="text-sm break-words italic text-foreground">&ldquo;{highlight.quote}&rdquo;</p>
      </a>

      {!editing && note && <p className="mt-2 text-sm text-muted-foreground">{note}</p>}

      {isOwner && !editing && (
        <button
          type="button"
          onClick={() => {
            setDraft(note);
            setEditing(true);
          }}
          className="mt-2 text-xs font-medium text-primary underline underline-offset-2"
        >
          {note ? "Edit note" : "Add note"}
        </button>
      )}

      {isOwner && editing && (
        <div className="mt-2 space-y-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={2}
            placeholder="Why does this passage matter?"
            autoFocus
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
