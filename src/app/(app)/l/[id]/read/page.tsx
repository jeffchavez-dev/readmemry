import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { extractArticle } from "@/lib/extract-article";
import { ReaderSelection } from "@/components/links/reader-selection";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function ReaderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: link } = await supabase
    .from("links")
    .select("id, url, title")
    .eq("id", id)
    .single();

  if (!link) notFound();

  const article = await extractArticle(link.url);

  return (
    <article className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <Link href={`/l/${link.id}`} className="hover:underline">
          ← Back
        </Link>
        <a href={link.url} target="_blank" rel="noreferrer" className="hover:underline">
          Open original ↗
        </a>
      </div>

      {article ? (
        <>
          <h1 className="mt-4 font-heading text-3xl leading-tight break-words">
            {article.title || link.title || link.url}
          </h1>
          <p className="mt-4 text-sm text-muted-foreground">
            Select any text to save it as a highlight.
          </p>
          <div className="mt-6">
            <ReaderSelection
              pageUrl={link.url}
              pageTitle={article.title || link.title || link.url}
              contentHtml={article.contentHtml}
            />
          </div>
        </>
      ) : (
        <div className="mt-10 rounded-lg border border-dashed border-border py-16 text-center">
          <p className="text-sm text-muted-foreground">
            Couldn&apos;t load a clean reading view for this page — it may block scraping or
            need JavaScript to render.
          </p>
          <a
            href={link.url}
            target="_blank"
            rel="noreferrer"
            className={cn(buttonVariants(), "mt-4")}
          >
            Open the original page
          </a>
        </div>
      )}
    </article>
  );
}
