import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCachedUser } from "@/lib/auth/get-cached-user";
import { LibraryBrowser, type LibraryLink } from "@/components/links/library-browser";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SavedLink } from "@/lib/types";

type LinkRow = SavedLink & {
  link_tags: { tag: { id: string; name: string } }[];
};

export default async function LibraryPage() {
  const user = await getCachedUser();
  if (!user) redirect("/login");

  const supabase = await createClient();

  const { data: links } = await supabase
    .from("links")
    .select("*, link_tags(tag:tags(id, name))")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .returns<LinkRow[]>();

  const linkIds = links?.map((link) => link.id) ?? [];
  const { data: highlights } =
    linkIds.length > 0
      ? await supabase.from("highlights").select("id, link_id, quote, note").in("link_id", linkIds)
      : { data: [] };

  const libraryLinks: LibraryLink[] = (links ?? []).map((link) => ({
    ...link,
    tags: link.link_tags.map((lt) => lt.tag),
    highlights: (highlights ?? []).filter((h) => h.link_id === link.id),
  }));

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl">Your library</h1>
        <Link href="/save" className={buttonVariants({ size: "sm" })}>
          Save a link
        </Link>
      </div>

      {libraryLinks.length === 0 ? (
        <div className="mt-10 rounded-lg border border-dashed border-border py-16 text-center">
          <p className="text-sm text-muted-foreground">Nothing saved yet.</p>
          <Link href="/save" className={cn(buttonVariants({ size: "sm" }), "mt-4")}>
            Save your first link
          </Link>
        </div>
      ) : (
        <LibraryBrowser links={libraryLinks} />
      )}
    </div>
  );
}
