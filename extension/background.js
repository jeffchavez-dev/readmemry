const MENU_ID = "save-to-reading-room";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: MENU_ID,
    title: "Save to readmemry",
    contexts: ["page", "link"],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== MENU_ID) return;
  const url = info.linkUrl || info.pageUrl;
  const title = info.linkUrl ? info.linkUrl : (tab?.title ?? "");
  quickSave(url, title);
});

async function quickSave(url, title) {
  const { apiBaseUrl, accessToken } = await chrome.storage.sync.get(["apiBaseUrl", "accessToken"]);

  if (!apiBaseUrl || !accessToken) {
    notify("readmemry", "Set up the extension in Options first.");
    chrome.runtime.openOptionsPage();
    return;
  }

  try {
    const res = await fetch(`${apiBaseUrl}/api/links`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ url, title, source: "extension" }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      notify("Couldn't save", body.error || `Request failed (${res.status})`);
      return;
    }

    notify("Saved to readmemry", title || url);
  } catch (err) {
    notify("Couldn't save", String(err));
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "SAVE_HIGHLIGHT") {
    saveHighlight(message.payload).then(sendResponse);
    return true; // keep the message channel open for the async response
  }
});

async function saveHighlight(payload) {
  const { apiBaseUrl, accessToken } = await chrome.storage.sync.get(["apiBaseUrl", "accessToken"]);

  if (!apiBaseUrl || !accessToken) {
    return { ok: false, error: "Set up the extension in Options first" };
  }

  try {
    const res = await fetch(`${apiBaseUrl}/api/highlights`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ ...payload, source: "extension" }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { ok: false, error: body.error || `Request failed (${res.status})` };
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

function notify(title, message) {
  chrome.notifications.create({
    type: "basic",
    iconUrl: "icons/icon-128.png",
    title,
    message,
  });
}
