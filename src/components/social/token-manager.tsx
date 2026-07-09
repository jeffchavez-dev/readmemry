"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type TokenRow = {
  id: string;
  name: string;
  created_at: string;
  last_used_at: string | null;
};

function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

export function TokenManager({ initialTokens }: { initialTokens: TokenRow[] }) {
  const router = useRouter();
  const [name, setName] = useState("Chrome extension");
  const [newToken, setNewToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You need to be signed in.");
      setLoading(false);
      return;
    }

    const token = randomToken();
    const tokenHash = await sha256Hex(token);

    const { error: insertError } = await supabase
      .from("access_tokens")
      .insert({ user_id: user.id, token_hash: tokenHash, name: name || "Chrome extension" });

    setLoading(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setNewToken(token);
    router.refresh();
  }

  async function handleRevoke(id: string) {
    const supabase = createClient();
    await supabase.from("access_tokens").delete().eq("id", id);
    router.refresh();
  }

  return (
    <div className="mt-10 max-w-md">
      <h2 className="font-heading text-lg">Chrome extension access</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Generate a token, then paste it into the extension&apos;s options page to connect it to
        your account.
      </p>

      {newToken && (
        <div className="mt-4 rounded-md border border-primary/40 bg-primary/5 p-3">
          <p className="text-xs font-medium text-muted-foreground">
            Copy this now — you won&apos;t be able to see it again.
          </p>
          <code className="mt-1 block break-all rounded bg-background px-2 py-1.5 text-xs">
            {newToken}
          </code>
        </div>
      )}

      <form onSubmit={handleGenerate} className="mt-4 flex items-end gap-2">
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="token-name">Token name</Label>
          <Input id="token-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? "Generating…" : "Generate token"}
        </Button>
      </form>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}

      <div className="mt-6 space-y-2">
        {initialTokens.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tokens yet.</p>
        ) : (
          initialTokens.map((token) => (
            <div
              key={token.id}
              className="flex items-center justify-between rounded-md border border-border/80 px-3 py-2 text-sm"
            >
              <div>
                <p className="font-medium">{token.name}</p>
                <p className="text-xs text-muted-foreground">
                  Created {new Date(token.created_at).toLocaleDateString()}
                  {token.last_used_at &&
                    ` · Last used ${new Date(token.last_used_at).toLocaleDateString()}`}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => handleRevoke(token.id)}>
                Revoke
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
