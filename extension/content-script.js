// Shows a small "Save highlight" button near any text the user selects on a
// page, and saves it (via background.js, which holds the auth token) when
// clicked. Runs on every page — see manifest.json's broad host_permissions,
// which is what this feature specifically requires.

let button = null;

function buildTextFragmentUrl(pageUrl, text) {
  const clean = text.trim().replace(/\s+/g, " ");
  const encoded = encodeURIComponent(clean).replace(/-/g, "%2D");
  const base = pageUrl.split("#")[0];
  return `${base}#:~:text=${encoded}`;
}

function removeButton() {
  if (button) {
    button.remove();
    button = null;
  }
}

function showButtonForSelection(selection) {
  removeButton();

  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return;

  button = document.createElement("button");
  button.textContent = "Save highlight — readmemry";
  button.className = "readmemry-highlight-button";
  button.style.top = `${window.scrollY + rect.top - 40}px`;
  button.style.left = `${window.scrollX + rect.left}px`;

  button.addEventListener("mousedown", (e) => {
    // Prevent the browser from clearing the text selection before click fires.
    e.preventDefault();
  });

  button.addEventListener("click", () => {
    const quote = selection.toString();
    const textFragmentUrl = buildTextFragmentUrl(window.location.href, quote);

    button.textContent = "Saving…";
    button.disabled = true;

    chrome.runtime.sendMessage(
      {
        type: "SAVE_HIGHLIGHT",
        payload: {
          url: window.location.href,
          title: document.title,
          quote,
          textFragmentUrl,
        },
      },
      (response) => {
        if (response?.ok) {
          button.textContent = "Saved!";
        } else {
          button.textContent = response?.error || "Failed to save";
        }
        setTimeout(removeButton, 1200);
      },
    );
  });

  document.body.appendChild(button);
}

document.addEventListener("mouseup", (e) => {
  // Clicking the button itself would otherwise be caught here too — since
  // its own mousedown already preventDefault()'d to preserve the selection,
  // this handler would rebuild (remove + recreate) the button out from under
  // the in-flight click, before the button's "click" listener ever fires.
  if (button && e.target === button) return;

  const selection = window.getSelection();
  const text = selection?.toString().trim();

  if (!text || selection.isCollapsed) {
    removeButton();
    return;
  }

  showButtonForSelection(selection);
});

document.addEventListener("mousedown", (e) => {
  if (button && e.target !== button) removeButton();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") removeButton();
});
