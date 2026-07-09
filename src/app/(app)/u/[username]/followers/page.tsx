import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Profile } from "@/lib/types";

export default async function FollowersPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username")
    .eq("username", username)
    .single();

  if (!profile) notFound();

  const { data: rows } = await supabase
    .from("follows")
    .select("follower:profiles!follows_follower_id_fkey(*)")
    .eq("following_id", profile.id)
    .returns<{ follower: Profile }[]>();

  return (
    <div>
      <h1 className="font-heading text-2xl">@{profile.username}&apos;s followers</h1>
      <div className="mt-6 space-y-1">
        {!rows || rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No followers yet.</p>
        ) : (
          rows.map(({ follower }) => (
            <Link
              key={follower.id}
              href={`/u/${follower.username}`}
              className="flex items-center gap-3 rounded-md p-2 hover:bg-muted"
            >
              <Avatar className="size-9">
                <AvatarImage src={follower.avatar_url ?? undefined} alt={follower.username} />
                <AvatarFallback className="text-xs">
                  {follower.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">@{follower.username}</span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
