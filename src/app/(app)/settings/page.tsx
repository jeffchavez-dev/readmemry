import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/social/profile-form";
import { TokenManager } from "@/components/social/token-manager";
import type { Profile } from "@/lib/types";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  if (!profile) redirect("/login");

  const { data: tokens } = await supabase
    .from("access_tokens")
    .select("id, name, created_at, last_used_at")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="font-heading text-2xl">Settings</h1>
      <p className="mt-1 text-sm text-muted-foreground">Signed in as {user.email}</p>
      <ProfileForm profile={profile} />
      <TokenManager initialTokens={tokens ?? []} />
    </div>
  );
}
