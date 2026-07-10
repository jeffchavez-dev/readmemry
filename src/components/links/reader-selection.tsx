"use client";

import { useEffect, useRef, useState } from "react";
import { buildTextFragmentUrl } from "@/lib/text-fragment";
import { Button } from "@/components/ui/button";

type PendingSelection = {
  text: string;
  top: number;
  left: number;
};

export function ReaderSelection({
  pageUrl,
  pageTitle,
  contentHtml,
}: {
  pageUrl: string;
  pageTitle: string;
  contentHtml: string;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [pending, setPending] = useState<PendingSelection | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    function handleSelectionChange() {
      const selection = window.getSelection();
      const text = selection?.toString().trim();

      if (!selection || !text || selection.isCollapsed || selection.rangeCount === 0) {
        setPending(null);
        return;
      }

      const range = selection.getRangeAt(0);
      const container = contentRef.current;
      if (!container || !container.contains(range.commonAncestorContainer)) {
        setPending(null);
        return;
      }

      const rect = range.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return;

      setStatus("idle");
      // Captured now, at selection time — a tap on the save button can
      // dismiss the live selection on mobile before the click handler runs,
      // so the click handler reads this stored copy rather than re-querying
      // window.getSelection() itself.
      setPending({
        text,
        top: Math.max(8, rect.top - 44),
        left: rect.left,
      });
    }

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => document.removeEventListener("selectionchange", handleSelectionChange);
  }, []);

  async function handleSave() {
    if (!pending) return;
    setStatus("saving");

    const textFragmentUrl = buildTextFragmentUrl(pageUrl, pending.text);

    try {
      // Same-origin request — the browser attaches the Supabase session
      // cookie automatically. No Authorization header here: /api/highlights
      // treats a bearer token as a PAT lookup, not a session JWT, so sending
      // one would actually break auth instead of reinforcing it.
      const res = await fetch("/api/highlights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: pageUrl,
          title: pageTitle,
          quote: pending.text,
          textFragmentUrl,
          source: "web",
        }),
      });

      setStatus(res.ok ? "saved" : "error");
    } catch {
      setStatus("error");
    }

    setTimeout(() => {
      setPending(null);
      setStatus("idle");
    }, 1200);
  }

  return (
    <>
      <div
        ref={contentRef}
        className="prose prose-neutral max-w-none break-words prose-headings:font-heading prose-a:text-primary prose-blockquote:border-primary prose-img:rounded-lg"
        // Sanitized server-side with DOMPurify before this ever reaches the client.
        dangerouslySetInnerHTML={{ __html: contentHtml }}
      />

      {pending && (
        <Button
          size="sm"
          className="fixed z-50 shadow-lg"
          style={{ top: pending.top, left: pending.left }}
          onClick={handleSave}
          disabled={status === "saving"}
        >
          {status === "saving" && "Saving…"}
          {status === "saved" && "Saved!"}
          {status === "error" && "Failed — try again"}
          {status === "idle" && "Save highlight"}
        </Button>
      )}
    </>
  );
}
