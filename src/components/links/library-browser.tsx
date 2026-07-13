"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { LinkCard } from "@/components/links/link-card";
import { cn } from "@/lib/utils";
import { matchesQuery } from "@/lib/search-highlight";
import type { LinkStatus, SavedLink } from "@/lib/types";

export type LibraryLink = SavedLink & {
  tags: { id: string; name: string }[];
  highlights: { id: string; quote: string; note: string | null }[];
};

type SortMode = "date" | "status";

type Match = { link: LibraryLink; matchedHighlight?: string; matchedNote?: string };

const STATUS_RANK: Record<LinkStatus, number> = { to_read: 0, reading: 1, read: 2 };

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "date", label: "Date added" },
  { value: "status", label: "Status" },
];

export function LibraryBrowser({ links }: { links: LibraryLink[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("date");

  const results = useMemo(() => {
    const trimmed = query.trim();

    const filtered: Match[] = !trimmed
      ? links.map((link) => ({ link }))
      : links.flatMap((link): Match[] => {
          if (matchesQuery(link.title, trimmed) || matchesQuery(link.description, trimmed)) {
            return [{ link }];
          }
          if (matchesQuery(link.note, trimmed)) {
            return [{ link, matchedNote: link.note! }];
          }
          const highlight = link.highlights.find(
            (h) => matchesQuery(h.quote, trimmed) || matchesQuery(h.note, trimmed),
          );
          if (highlight) {
            return [
              {
                link,
                matchedHighlight: matchesQuery(highlight.quote, trimmed) ? highlight.quote : highlight.note!,
              },
            ];
          }
          return [];
        });

    return filtered.sort((a, b) => {
      if (sort === "status") {
        const rankDiff = STATUS_RANK[a.link.status] - STATUS_RANK[b.link.status];
        if (rankDiff !== 0) return rankDiff;
      }
      return new Date(b.link.created_at).getTime() - new Date(a.link.created_at).getTime();
    });
  }, [links, query, sort]);

  return (
    <div>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search titles, notes, highlights…"
            className="pl-8"
          />
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border/80 p-0.5">
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setSort(option.value)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                sort === option.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {results.length === 0 ? (
        <div className="mt-10 rounded-lg border border-dashed border-border py-16 text-center">
          <p className="text-sm text-muted-foreground">
            {query.trim() ? `No saves match "${query.trim()}".` : "Nothing saved yet."}
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {results.map(({ link, matchedHighlight, matchedNote }) => (
            <LinkCard
              key={link.id}
              link={link}
              tags={link.tags}
              isOwner
              query={query.trim()}
              matchedHighlight={matchedHighlight}
              matchedNote={matchedNote}
            />
          ))}
        </div>
      )}
    </div>
  );
}
