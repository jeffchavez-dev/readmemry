const setupNotice = document.getElementById("setup");
const content = document.getElementById("content");
const searchInput = document.getElementById("search");
const linksList = document.getElementById("links-list");
const highlightsList = document.getElementById("highlights-list");

let allLinks = [];
let allHighlights = [];

function hostname(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function renderLinks(links) {
  linksList.innerHTML = "";
  if (links.length === 0) {
    linksList.innerHTML = '<p class="empty">Nothing here yet.</p>';
    return;
  }
  for (const link of links) {
    const a = document.createElement("a");
    a.className = "item";
    a.href = link.url;
    a.innerHTML = `<div class="item-title">${escapeHtml(link.title || link.url)}</div><div class="item-quote">${escapeHtml(hostname(link.url))}</div>`;
    linksList.appendChild(a);
  }
}

function renderHighlights(highlights) {
  highlightsList.innerHTML = "";
  if (highlights.length === 0) {
    highlightsList.innerHTML = '<p class="empty">Nothing here yet.</p>';
    return;
  }
  for (const highlight of highlights) {
    const a = document.createElement("a");
    a.className = "item";
    a.href = highlight.text_fragment_url || highlight.links?.url || "#";
    a.innerHTML = `<div class="item-title">${escapeHtml(highlight.links?.title || highlight.links?.url || "")}</div><div class="item-quote">"${escapeHtml(truncate(highlight.quote, 120))}"</div>`;
    highlightsList.appendChild(a);
  }
}

function truncate(text, max) {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function applyFilter(query) {
  const q = query.trim().toLowerCase();
  if (!q) {
    renderLinks(allLinks);
    renderHighlights(allHighlights);
    return;
  }

  renderLinks(
    allLinks.filter(
      (link) => link.title?.toLowerCase().includes(q) || link.url.toLowerCase().includes(q),
    ),
  );
  renderHighlights(
    allHighlights.filter(
      (h) =>
        h.quote.toLowerCase().includes(q) ||
        h.links?.title?.toLowerCase().includes(q) ||
        h.links?.url?.toLowerCase().includes(q),
    ),
  );
}

searchInput.addEventListener("input", (e) => applyFilter(e.target.value));

document.getElementById("open-options").addEventListener("click", (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

async function init() {
  const { apiBaseUrl, accessToken } = await chrome.storage.sync.get(["apiBaseUrl", "accessToken"]);

  if (!apiBaseUrl || !accessToken) {
    setupNotice.style.display = "block";
    return;
  }

  content.style.display = "block";

  const accountNav = document.getElementById("account-nav");
  accountNav.style.display = "flex";
  document.getElementById("app-link").href = apiBaseUrl;
  document.getElementById("feed-link").href = apiBaseUrl;
  document.getElementById("library-link").href = `${apiBaseUrl}/library`;
  document.getElementById("settings-link").href = `${apiBaseUrl}/settings`;

  const authHeaders = { Authorization: `Bearer ${accessToken}` };

  const [linksRes, highlightsRes] = await Promise.all([
    fetch(`${apiBaseUrl}/api/links?limit=30`, { headers: authHeaders }).catch(() => null),
    fetch(`${apiBaseUrl}/api/highlights?limit=30`, { headers: authHeaders }).catch(() => null),
  ]);

  if (linksRes?.ok) {
    const data = await linksRes.json();
    allLinks = data.links ?? [];
  }
  if (highlightsRes?.ok) {
    const data = await highlightsRes.json();
    allHighlights = data.highlights ?? [];
  }

  renderLinks(allLinks);
  renderHighlights(allHighlights);
}

init();
