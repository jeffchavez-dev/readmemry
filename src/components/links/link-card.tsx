import Link from "next/link";
import { Badge } from "@/components/ui/badge";
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
}: {
  link: SavedLink;
  tags?: { id: string; name: string }[];
}) {
  return (
    <Link
      href={`/l/${link.id}`}
      className="block rounded-lg border border-border/80 bg-card p-4 transition-colors hover:border-primary/40"
    >
      <div className="flex gap-4">
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
            {link.title || link.url}
          </h3>
          {link.description && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{link.description}</p>
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
      </div>
    </Link>
  );
}
