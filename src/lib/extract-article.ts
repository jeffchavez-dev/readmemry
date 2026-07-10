import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import createDOMPurify from "dompurify";

export type ExtractedArticle = {
  title: string;
  contentHtml: string;
};

// Server-only: fetches the original page and pulls out just the article
// content, the same way Firefox's Reader View does. Readability extracts
// but does not sanitize — the source is an arbitrary third-party site, so
// its output is run through DOMPurify before it's ever rendered.
export async function extractArticle(url: string): Promise<ExtractedArticle | null> {
  let html: string;
  try {
    const res = await fetch(url, {
      headers: { "user-agent": "Mozilla/5.0 (compatible; readmemry-reader/1.0)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    html = await res.text();
  } catch {
    return null;
  }

  try {
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article?.content || (article.textContent ?? "").trim().length < 200) {
      // Too little extracted to be a real article — likely a JS-rendered
      // SPA whose content never appears in the raw server-fetched HTML, or
      // a paywall. Let the caller fall back rather than show a near-empty page.
      return null;
    }

    const purify = createDOMPurify(dom.window as unknown as Window & typeof globalThis);
    const contentHtml = purify.sanitize(article.content);

    return { title: article.title || "", contentHtml };
  } catch {
    return null;
  }
}
