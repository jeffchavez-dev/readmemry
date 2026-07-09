"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { LinkComment, Profile } from "@/lib/types";

type CommentWithProfile = LinkComment & { profiles: Profile };

export function CommentThread({
  linkId,
  initialComments,
  canComment,
}: {
  linkId: string;
  initialComments: CommentWithProfile[];
  canComment: boolean;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;

    setLoading(true);
    setError(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { error: insertError } = await supabase
      .from("comments")
      .insert({ link_id: linkId, user_id: user.id, body: body.trim() });

    setLoading(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setBody("");
    router.refresh();
  }

  return (
    <div className="mt-8">
      <h2 className="font-heading text-lg">
        {initialComments.length > 0 ? `${initialComments.length} comments` : "Comments"}
      </h2>

      <div className="mt-3 space-y-4">
        {initialComments.map((comment) => (
          <div key={comment.id} className="flex gap-2.5">
            <Link href={`/u/${comment.profiles.username}`}>
              <Avatar className="size-8">
                <AvatarImage
                  src={comment.profiles.avatar_url ?? undefined}
                  alt={comment.profiles.username}
                />
                <AvatarFallback className="text-xs">
                  {comment.profiles.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div className="min-w-0 flex-1 rounded-lg bg-muted px-3 py-2">
              <div className="flex items-baseline gap-2">
                <Link
                  href={`/u/${comment.profiles.username}`}
                  className="text-sm font-medium hover:underline"
                >
                  @{comment.profiles.username}
                </Link>
                <span className="text-xs text-muted-foreground">
                  {new Date(comment.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="mt-0.5 text-sm whitespace-pre-wrap">{comment.body}</p>
            </div>
          </div>
        ))}
      </div>

      {canComment ? (
        <form onSubmit={handleSubmit} className="mt-4 space-y-2">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Add a comment…"
            rows={2}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" size="sm" disabled={loading || !body.trim()}>
            {loading ? "Posting…" : "Post comment"}
          </Button>
        </form>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          <Link href="/login" className="font-medium text-primary underline">
            Sign in
          </Link>{" "}
          to join the discussion.
        </p>
      )}
    </div>
  );
}
