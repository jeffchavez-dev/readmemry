import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LinkCard } from "@/components/links/link-card";
import { FollowButton } from "@/components/social/follow-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { SavedLink } from "@/lib/types";

type LinkRow = SavedLink & {
  link_tags: { tag: { id: string; name: string } }[];
};

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (!profile) notFound();

  const {
    data: { user: viewer },
  } = await supabase.auth.getUser();

  const [{ data: links }, { count: followerCount }, { count: followingCount }, followingRow] =
    await Promise.all([
      supabase
        .from("links")
        .select("*, link_tags(tag:tags(id, name))")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false })
        .returns<LinkRow[]>(),
      supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", profile.id),
      supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", profile.id),
      viewer
        ? supabase
            .from("follows")
            .select("follower_id")
            .eq("follower_id", viewer.id)
            .eq("following_id", profile.id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

  const isOwnProfile = viewer?.id === profile.id;

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="size-16">
            <AvatarImage src={profile.avatar_url ?? undefined} alt={profile.username} />
            <AvatarFallback className="text-lg">
              {profile.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-heading text-2xl">@{profile.username}</h1>
            {profile.full_name && <p className="text-sm text-muted-foreground">{profile.full_name}</p>}
            <div className="mt-1 flex gap-3 text-sm text-muted-foreground">
              <Link href={`/u/${profile.username}/followers`} className="hover:underline">
                <strong className="text-foreground">{followerCount ?? 0}</strong> followers
              </Link>
              <Link href={`/u/${profile.username}/following`} className="hover:underline">
                <strong className="text-foreground">{followingCount ?? 0}</strong> following
              </Link>
            </div>
          </div>
        </div>
        {!isOwnProfile && viewer && (
          <FollowButton targetUserId={profile.id} initialIsFollowing={!!followingRow.data} />
        )}
      </div>

      {profile.bio && <p className="mt-4 text-sm">{profile.bio}</p>}

      <div className="mt-8 space-y-3">
        {!links || links.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {isOwnProfile ? "You haven't" : "This person hasn't"} saved anything yet.
          </p>
        ) : (
          links.map((link) => (
            <LinkCard key={link.id} link={link} tags={link.link_tags.map((lt) => lt.tag)} />
          ))
        )}
      </div>
    </div>
  );
}
