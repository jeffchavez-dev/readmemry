import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCachedUser } from "@/lib/auth/get-cached-user";
import { ProfileForm } from "@/components/social/profile-form";
import { TokenManager } from "@/components/social/token-manager";
import type { Profile } from "@/lib/types";

export default async function SettingsPage() {
  const user = await getCachedUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const [{ data: profile }, { data: tokens }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single<Profile>(),
    supabase
      .from("access_tokens")
      .select("id, name, created_at, last_used_at")
      .order("created_at", { ascending: false }),
  ]);

  if (!profile) redirect("/login");

  return (
    <div>
      <h1 className="font-heading text-2xl">Settings</h1>
      <p className="mt-1 text-sm text-muted-foreground">Signed in as {user.email}</p>
      <ProfileForm profile={profile} />
      <TokenManager initialTokens={tokens ?? []} />
    </div>
  );
}
