"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { GoogleIcon } from "@/components/icons/google-icon";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const USERNAME_PATTERN = /^[a-z0-9_-]{3,20}$/;

export default function SignupPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!USERNAME_PATTERN.test(username)) {
      setError("Username must be 3-20 characters: lowercase letters, numbers, - or _.");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });

    setLoading(false);

    if (error) {
      if (error.message.toLowerCase().includes("duplicate") || error.message.includes("profiles_username_key")) {
        setError("That username is already taken.");
      } else {
        setError(error.message);
      }
      return;
    }

    // Email confirmation is on by default for new Supabase projects — if there's
    // no session yet, the user needs to confirm their email before signing in.
    if (!data.session) {
      setCheckEmail(true);
      return;
    }

    router.push("/");
    router.refresh();
  }

  async function handleGoogleSignIn() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="font-heading text-3xl italic tracking-tight text-primary">
            readmemry
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Save what you&apos;re reading, from anywhere.
          </p>
        </div>
        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-xl">Create your account</CardTitle>
            <CardDescription>Your library, synced across every device.</CardDescription>
          </CardHeader>
          <CardContent>
            {checkEmail ? (
              <p className="rounded-md bg-secondary px-3 py-2 text-sm text-secondary-foreground">
                Check <strong>{email}</strong> for a confirmation link to finish signing up.
              </p>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleGoogleSignIn}
                >
                  <GoogleIcon className="size-4" />
                  Continue with Google
                </Button>

                <div className="my-4 flex items-center gap-3">
                  <Separator className="flex-1" />
                  <span className="text-xs text-muted-foreground">or</span>
                  <Separator className="flex-1" />
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase())}
                      required
                      autoComplete="username"
                      placeholder="jane-reads"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      autoComplete="new-password"
                    />
                  </div>
                  {error && (
                    <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
                      {error}
                    </p>
                  )}
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Creating account…" : "Create account"}
                  </Button>
                </form>
              </>
            )}
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-primary underline underline-offset-4">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
