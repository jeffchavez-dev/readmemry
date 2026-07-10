"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { parseTagInput, upsertTags } from "@/lib/tags";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { SavedLink } from "@/lib/types";

type SaveFormProps = {
  source?: SavedLink["source"];
  initial?: {
    url?: string;
    title?: string;
    description?: string;
    imageUrl?: string;
    faviconUrl?: string;
  };
};

export function SaveForm({ source = "web", initial }: SaveFormProps) {
  const router = useRouter();

  const [url, setUrl] = useState(initial?.url ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");
  const [faviconUrl, setFaviconUrl] = useState(initial?.faviconUrl ?? "");
  const [tagInput, setTagInput] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingMetadata, setFetchingMetadata] = useState(false);
  const [hasClipboardApi, setHasClipboardApi] = useState(false);
  const [pasteError, setPasteError] = useState<string | null>(null);

  async function fetchMetadata(rawUrl: string) {
    let normalized: string;
    try {
      normalized = new URL(rawUrl).toString();
    } catch {
      return;
    }

    setFetchingMetadata(true);
    try {
      const res = await fetch(`/api/metadata?url=${encodeURIComponent(normalized)}`);
      if (!res.ok) return;
      const data = await res.json();
      if (!title && data.title) setTitle(data.title);
      if (!description && data.description) setDescription(data.description);
      if (data.image) setImageUrl(data.image);
      if (data.favicon) setFaviconUrl(data.favicon);
    } catch (metadataError) {
      // Never block the save flow on a failed metadata fetch.
      console.error("Metadata fetch failed:", metadataError);
    } finally {
      setFetchingMetadata(false);
    }
  }

  useEffect(() => {
    if (initial?.url) {
      // Deferred to a microtask so the metadata fetch's setState calls don't
      // happen synchronously within the effect body (react-hooks/set-state-in-effect).
      queueMicrotask(() => fetchMetadata(initial.url!));
    }
    // Only run once on mount, when a url arrives pre-filled (e.g. from the
    // PWA share target) — user-driven fetches happen via the onBlur handler.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Checked client-side only (navigator is unavailable during SSR) to
    // avoid a hydration mismatch. iOS Safari in particular only allows
    // clipboard reads triggered by a direct user gesture — an explicit
    // "Paste" button satisfies that, a silent auto-read on mount wouldn't.
    // Deferred to a microtask, same reason as the metadata-fetch effect above.
    queueMicrotask(() => {
      setHasClipboardApi(typeof navigator !== "undefined" && !!navigator.clipboard?.readText);
    });
  }, []);

  function handlePasteUrl() {
    setPasteError(null);
    // Deliberately a direct promise chain, not async/await — the clipboard
    // read call itself needs to be the very next thing that happens after
    // the click for iOS Safari to reliably treat this as still "within" the
    // user gesture; this removes any doubt about an async function wrapper
    // affecting that.
    navigator.clipboard
      .readText()
      .then((text) => {
        const trimmed = text.trim();
        if (!trimmed) {
          setPasteError("Clipboard is empty.");
          return;
        }
        setUrl(trimmed);
        fetchMetadata(trimmed);
      })
      .catch((err) => {
        // Surfaced (not silently swallowed) so we can actually tell whether
        // this is a permission denial, an empty clipboard, or something else.
        console.error("Clipboard read failed:", err);
        setPasteError("Couldn't read clipboard — try pasting into the field directly instead.");
      });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    let normalizedUrl: string;
    try {
      normalizedUrl = new URL(url).toString();
    } catch {
      setError("Enter a valid URL, including https://");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You need to be signed in to save a link.");
      setLoading(false);
      return;
    }

    const { data: link, error: insertError } = await supabase
      .from("links")
      .insert({
        user_id: user.id,
        url: normalizedUrl,
        title: title || null,
        description: description || null,
        image_url: imageUrl || null,
        favicon_url: faviconUrl || null,
        note: note || null,
        source,
      })
      .select("id")
      .single();

    if (insertError || !link) {
      setError(insertError?.message ?? "Something went wrong saving this link.");
      setLoading(false);
      return;
    }

    const tagNames = parseTagInput(tagInput);
    if (tagNames.length > 0) {
      try {
        const tags = await upsertTags(supabase, tagNames);
        await supabase
          .from("link_tags")
          .insert(tags.map((tag) => ({ link_id: link.id, tag_id: tag.id })));
      } catch (tagError) {
        // Tagging failure shouldn't lose the save itself.
        console.error("Failed to attach tags:", tagError);
      }
    }

    setLoading(false);
    router.push(`/l/${link.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="url">URL</Label>
          {hasClipboardApi && !url && (
            <button
              type="button"
              onClick={handlePasteUrl}
              className="text-xs font-medium text-primary underline underline-offset-2"
            >
              Paste from clipboard
            </button>
          )}
        </div>
        <Input
          id="url"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onBlur={(e) => fetchMetadata(e.target.value)}
          placeholder="https://example.com/article"
          required
          autoFocus={!initial?.url}
        />
        {pasteError && <p className="text-xs text-destructive">{pasteError}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="title">
          Title {fetchingMetadata && <span className="text-muted-foreground">(fetching details…)</span>}
        </Label>
        <Input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="(optional)"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="(optional)"
          rows={2}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="tags">Tags</Label>
        <Input
          id="tags"
          type="text"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          placeholder="comma, separated, tags"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="note">Note</Label>
        <Textarea
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Why did this catch your eye?"
          rows={3}
        />
      </div>
      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
