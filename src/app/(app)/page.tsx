import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LinkCard } from "@/components/links/link-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { SavedLink, Profile } from "@/lib/types";

type LinkRow = SavedLink & {
  profiles: Profile;
  link_tags: { tag: { id: string; name: string } }[];
};

export default async function FeedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: following } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", user.id);

  const followingIds = (following ?? []).map((f) => f.following_id);

  const { data: links } =
    followingIds.length > 0
      ? await supabase
          .from("links")
          .select("*, profiles(*), link_tags(tag:tags(id, name))")
          .in("user_id", followingIds)
          .eq("is_private", false)
          .order("created_at", { ascending: false })
          .returns<LinkRow[]>()
      : { data: [] as LinkRow[] };

  return (
    <div>
      <h1 className="font-heading text-2xl">Feed</h1>

      {!links || links.length === 0 ? (
        <div className="mt-10 rounded-lg border border-dashed border-border py-16 text-center">
          <p className="text-sm text-muted-foreground">
            {followingIds.length === 0
              ? "Follow people to see what they're reading here."
              : "Nobody you follow has saved anything yet."}
          </p>
          <Link href="/library" className="mt-4 inline-block text-sm font-medium text-primary underline">
            Go to your library
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {links.map((link) => (
            <div key={link.id}>
              <Link
                href={`/u/${link.profiles.username}`}
                className="mb-1.5 flex items-center gap-2 text-sm"
              >
                <Avatar className="size-5">
                  <AvatarImage src={link.profiles.avatar_url ?? undefined} alt={link.profiles.username} />
                  <AvatarFallback className="text-[10px]">
                    {link.profiles.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium text-muted-foreground">@{link.profiles.username}</span>
              </Link>
              <LinkCard link={link} tags={link.link_tags.map((lt) => lt.tag)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
