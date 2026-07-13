import Link from "next/link";
import { Quote } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DeleteLinkButton } from "@/components/links/delete-link-button";
import { StatusChip } from "@/components/links/status-chip";
import { highlightMatch } from "@/lib/search-highlight";
import type { SavedLink } from "@/lib/types";

function hostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function LinkCard({
  link,
  tags = [],
  isOwner = false,
  query = "",
  matchedHighlight,
  matchedNote,
}: {
  link: SavedLink;
  tags?: { id: string; name: string }[];
  isOwner?: boolean;
  // When set, occurrences of `query` in the title/description are wrapped
  // in <mark>. matchedHighlight/matchedNote surface *why* a card matched a
  // search when the match isn't otherwise visible on the card (a link's
  // note and its highlights' quotes aren't rendered here by default).
  query?: string;
  matchedHighlight?: string;
  matchedNote?: string;
}) {
  return (
    <div className="rounded-lg border border-border/80 bg-card p-4 transition-colors hover:border-primary/40">
      <Link href={`/l/${link.id}`} className="flex gap-4">
        {link.image_url && (
          // eslint-disable-next-line @next/next/no-img-element -- remote thumbnail from arbitrary saved sites, no loader config
          <img
            src={link.image_url}
            alt=""
            className="h-20 w-20 shrink-0 rounded-md border border-border/60 object-cover"
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {link.favicon_url && (
              // eslint-disable-next-line @next/next/no-img-element -- remote favicon, no loader config
              <img src={link.favicon_url} alt="" className="size-3.5 rounded-sm" />
            )}
            <span>{hostname(link.url)}</span>
          </div>
          <h3 className="mt-0.5 truncate font-heading text-base leading-snug text-foreground">
            {highlightMatch(link.title || link.url, query)}
          </h3>
          {link.description && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {highlightMatch(link.description, query)}
            </p>
          )}
          {matchedNote && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground italic">
              {highlightMatch(matchedNote, query)}
            </p>
          )}
          {matchedHighlight && (
            <p className="mt-1.5 flex items-start gap-1 text-sm text-muted-foreground">
              <Quote className="mt-0.5 size-3 shrink-0" />
              <span className="line-clamp-2">{highlightMatch(matchedHighlight, query)}</span>
            </p>
          )}
          {tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {tags.map((tag) => (
                <Badge key={tag.id} variant="secondary" className="text-xs">
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </Link>
      {isOwner && (
        <div className="mt-3 flex items-center gap-3 border-t border-border/60 pt-2">
          <StatusChip linkId={link.id} status={link.status} />
          <Link
            href={`/l/${link.id}/edit`}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Edit
          </Link>
          <DeleteLinkButton linkId={link.id} />
        </div>
      )}
    </div>
  );
}
