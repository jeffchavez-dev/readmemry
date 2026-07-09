const form = document.getElementById("save-form");
const setupNotice = document.getElementById("setup");
const statusEl = document.getElementById("status");
const submitBtn = document.getElementById("submit");
const urlInput = document.getElementById("url");
const titleInput = document.getElementById("title");
const tagsInput = document.getElementById("tags");
const noteInput = document.getElementById("note");

document.getElementById("open-options").addEventListener("click", (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

function setStatus(message, kind) {
  statusEl.textContent = message;
  statusEl.className = kind || "";
}

async function init() {
  const { apiBaseUrl, accessToken } = await chrome.storage.sync.get(["apiBaseUrl", "accessToken"]);

  if (!apiBaseUrl || !accessToken) {
    setupNotice.style.display = "block";
    form.style.display = "none";
    return;
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  urlInput.value = tab?.url ?? "";
  titleInput.value = tab?.title ?? "";

  if (tab?.url) {
    try {
      const res = await fetch(`${apiBaseUrl}/api/metadata?url=${encodeURIComponent(tab.url)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.description) noteInput.placeholder = data.description;
      }
    } catch {
      // Metadata fetch is best-effort only — never block the save form.
    }
  }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  setStatus("", "");
  submitBtn.disabled = true;
  submitBtn.textContent = "Saving…";

  const { apiBaseUrl, accessToken } = await chrome.storage.sync.get(["apiBaseUrl", "accessToken"]);

  try {
    const res = await fetch(`${apiBaseUrl}/api/links`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        url: urlInput.value,
        title: titleInput.value,
        tags: tagsInput.value,
        note: noteInput.value,
        source: "extension",
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setStatus(body.error || `Failed to save (${res.status})`, "error");
      submitBtn.disabled = false;
      submitBtn.textContent = "Save";
      return;
    }

    setStatus("Saved!", "success");
    submitBtn.textContent = "Saved";
    setTimeout(() => window.close(), 900);
  } catch (err) {
    setStatus(String(err), "error");
    submitBtn.disabled = false;
    submitBtn.textContent = "Save";
  }
});

init();
