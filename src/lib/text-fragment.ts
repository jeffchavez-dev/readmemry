// Builds a browser-native Text Fragment URL (#:~:text=...) so the browser
// itself can scroll to and highlight the exact quoted passage when the link
// is opened later — same approach as the Chrome extension's content script.
export function buildTextFragmentUrl(pageUrl: string, text: string): string {
  const clean = text.trim().replace(/\s+/g, " ");
  const encoded = encodeURIComponent(clean).replace(/-/g, "%2D");
  const base = pageUrl.split("#")[0];
  return `${base}#:~:text=${encoded}`;
}
