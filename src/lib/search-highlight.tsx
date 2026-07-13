import { Fragment } from "react";

// Splits `text` on every case-insensitive occurrence of `query` and wraps
// matches in <mark>. Returns the plain string unchanged when query is empty
// so callers don't need to branch.
export function highlightMatch(text: string, query: string) {
  const trimmed = query.trim();
  if (!trimmed) return text;

  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  if (parts.length === 1) return text;

  return parts.map((part, i) =>
    part.toLowerCase() === trimmed.toLowerCase() ? (
      <mark key={i} className="rounded-sm bg-primary/25 text-foreground">
        {part}
      </mark>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}

export function matchesQuery(text: string | null | undefined, query: string) {
  if (!text) return false;
  return text.toLowerCase().includes(query.toLowerCase());
}
