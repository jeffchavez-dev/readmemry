import { SaveForm } from "@/components/links/save-form";

const URL_PATTERN = /https?:\/\/[^\s]+/i;

// iOS Safari and Android Chrome share sheets are inconsistent about which
// share_target field actually carries the link — sometimes it's `url`,
// sometimes the link is appended to `text` instead. Fall back to extracting
// a URL out of `text` (or `title`) when `url` itself is empty.
function extractUrl(rawUrl?: string, text?: string, title?: string): string {
  if (rawUrl) return rawUrl;
  const fromText = text?.match(URL_PATTERN)?.[0];
  if (fromText) return fromText;
  const fromTitle = title?.match(URL_PATTERN)?.[0];
  return fromTitle ?? "";
}

export default async function SavePage({
  searchParams,
}: {
  searchParams: Promise<{ url?: string; title?: string; text?: string }>;
}) {
  const params = await searchParams;
  const url = extractUrl(params.url, params.text, params.title);

  return (
    <div className="mx-auto max-w-md">
      <h1 className="font-heading text-2xl">Save a link</h1>
      <p className="mt-1 text-sm text-muted-foreground">Add it to your library.</p>
      <div className="mt-6">
        <SaveForm initial={{ url, title: params.title }} source={url ? "pwa_share" : "web"} />
      </div>
    </div>
  );
}
