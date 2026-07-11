import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCachedUser } from "@/lib/auth/get-cached-user";
import { SaveForm } from "@/components/links/save-form";
import type { SavedLink } from "@/lib/types";

type LinkWithTags = SavedLink & {
  link_tags: { tag: { id: string; name: string } }[];
};

export default async function EditLinkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCachedUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: link } = await supabase
    .from("links")
    .select("*, link_tags(tag:tags(id, name))")
    .eq("id", id)
    .single<LinkWithTags>();

  if (!link) notFound();
  // Editing is owner-only; send everyone else back to the (publicly
  // viewable) link instead of a bare 404, since the link does exist.
  if (link.user_id !== user.id) redirect(`/l/${id}`);

  return (
    <div className="mx-auto max-w-md">
      <h1 className="font-heading text-2xl">Edit link</h1>
      <p className="mt-1 text-sm text-muted-foreground">Update the details for this save.</p>
      <div className="mt-6">
        <SaveForm
          linkId={link.id}
          initial={{
            url: link.url,
            title: link.title ?? "",
            description: link.description ?? "",
            imageUrl: link.image_url ?? "",
            faviconUrl: link.favicon_url ?? "",
            note: link.note ?? "",
            tags: link.link_tags.map((lt) => lt.tag.name).join(", "),
          }}
        />
      </div>
    </div>
  );
}
