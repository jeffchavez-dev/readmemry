import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Profile } from "@/lib/types";

export default async function FollowingPage({
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
    .select("following:profiles!follows_following_id_fkey(*)")
    .eq("follower_id", profile.id)
    .returns<{ following: Profile }[]>();

  return (
    <div>
      <h1 className="font-heading text-2xl">@{profile.username} follows</h1>
      <div className="mt-6 space-y-1">
        {!rows || rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Not following anyone yet.</p>
        ) : (
          rows.map(({ following }) => (
            <Link
              key={following.id}
              href={`/u/${following.username}`}
              className="flex items-center gap-3 rounded-md p-2 hover:bg-muted"
            >
              <Avatar className="size-9">
                <AvatarImage src={following.avatar_url ?? undefined} alt={following.username} />
                <AvatarFallback className="text-xs">
                  {following.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">@{following.username}</span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
