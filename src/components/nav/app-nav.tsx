"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/types";

export function AppNav({ profile }: { profile: Profile | null }) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-10 border-b border-border/80 bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
        <Link href="/" className="font-heading text-lg italic tracking-tight text-primary">
          readmemry
        </Link>

        {profile ? (
          <nav className="flex items-center gap-1">
            <Link href="/" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              Feed
            </Link>
            <Link href="/library" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              Library
            </Link>
            <Link href="/save" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              Add
            </Link>
            <Link
              href={`/u/${profile.username}`}
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "px-1.5")}
            >
              <Avatar className="size-7">
                <AvatarImage src={profile.avatar_url ?? undefined} alt={profile.username} />
                <AvatarFallback className="text-xs">
                  {profile.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>
            <Link href="/settings" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              Settings
            </Link>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              Sign out
            </Button>
          </nav>
        ) : (
          <nav className="flex items-center gap-2">
            <Link href="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              Sign in
            </Link>
            <Link href="/signup" className={buttonVariants({ size: "sm" })}>
              Create account
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
