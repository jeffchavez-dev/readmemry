import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCachedUser } from "@/lib/auth/get-cached-user";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BackButton } from "@/components/links/back-button";
import { CommentThread } from "@/components/links/comment-thread";
import { HighlightItem } from "@/components/links/highlight-item";
import { StatusChip } from "@/components/links/status-chip";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SavedLink, Profile, LinkComment, Highlight } from "@/lib/types";

type LinkDetail = SavedLink & {
  profiles: Profile;
  link_tags: { tag: { id: string; name: string } }[];
};

type CommentWithProfile = LinkComment & { profiles: Profile };

function hostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export default async function LinkDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // All independent of each other — fire together rather than waterfall.
  // If the link turns out not to exist, the comments/highlights results are
  // just discarded below; that's cheaper than the alternative of always
  // paying a second round-trip on the (common) case where it does exist.
  const [{ data: link }, { data: comments }, { data: highlights }, viewer] = await Promise.all([
    supabase
      .from("links")
      .select("*, profiles(*), link_tags(tag:tags(id, name))")
      .eq("id", id)
      .single<LinkDetail>(),
    supabase
      .from("comments")
      .select("*, profiles(*)")
      .eq("link_id", id)
      .order("created_at", { ascending: true })
      .returns<CommentWithProfile[]>(),
    supabase
      .from("highlights")
      .select("*")
      .eq("link_id", id)
      .order("created_at", { ascending: true })
      .returns<Highlight[]>(),
    getCachedUser(),
  ]);

  if (!link) notFound();

  return (
    <article className="mx-auto max-w-2xl">
      <BackButton />

      {link.image_url && (
        // eslint-disable-next-line @next/next/no-img-element -- remote thumbnail, no loader config
        <img
          src={link.image_url}
          alt=""
          className="mb-6 aspect-video w-full rounded-lg border border-border/60 object-cover"
        />
      )}

      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        {link.favicon_url && (
          // eslint-disable-next-line @next/next/no-img-element -- remote favicon, no loader config
          <img src={link.favicon_url} alt="" className="size-4 rounded-sm" />
        )}
        <a href={link.url} target="_blank" rel="noreferrer" className="hover:underline">
          {hostname(link.url)}
        </a>
      </div>

      <h1 className="mt-1 font-heading text-3xl leading-tight break-words">
        <a href={link.url} target="_blank" rel="noreferrer" className="hover:underline">
          {link.title || link.url}
        </a>
      </h1>

      {link.description && (
        <p className="mt-3 text-muted-foreground">{link.description}</p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Link href={`/l/${link.id}/read`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
          Read & highlight
        </Link>
        {viewer?.id === link.user_id && (
          <>
            <StatusChip linkId={link.id} status={link.status} />
            <Link href={`/l/${link.id}/edit`} className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
              Edit
            </Link>
          </>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Link href={`/u/${link.profiles.username}`} className="flex items-center gap-2 text-sm">
          <Avatar className="size-6">
            <AvatarImage src={link.profiles.avatar_url ?? undefined} alt={link.profiles.username} />
            <AvatarFallback className="text-xs">
              {link.profiles.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium">@{link.profiles.username}</span>
        </Link>
        <span className="text-sm text-muted-foreground">
          saved {new Date(link.created_at).toLocaleDateString()}
        </span>
        {link.is_private && (
          <Badge variant="outline" className="text-xs">
            Private
          </Badge>
        )}
      </div>

      {link.link_tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {link.link_tags.map(({ tag }) => (
            <Badge key={tag.id} variant="secondary" className="text-xs">
              {tag.name}
            </Badge>
          ))}
        </div>
      )}

      {link.note && (
        <div className="mt-6 rounded-lg border border-border/80 bg-card p-4">
          <p className="text-sm whitespace-pre-wrap">{link.note}</p>
        </div>
      )}

      {highlights && highlights.length > 0 && (
        <div className="mt-6">
          <h2 className="font-heading text-lg">
            {highlights.length} highlight{highlights.length === 1 ? "" : "s"}
          </h2>
          <div className="mt-3 space-y-3">
            {highlights.map((highlight) => (
              <HighlightItem
                key={highlight.id}
                highlight={highlight}
                fallbackUrl={link.url}
                isOwner={viewer?.id === link.user_id}
              />
            ))}
          </div>
        </div>
      )}

      <CommentThread linkId={link.id} initialComments={comments ?? []} canComment={!!viewer} />
    </article>
  );
}
