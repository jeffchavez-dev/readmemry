const form = document.getElementById("options-form");
const apiBaseUrlInput = document.getElementById("apiBaseUrl");
const accessTokenInput = document.getElementById("accessToken");
const statusEl = document.getElementById("status");

async function init() {
  const { apiBaseUrl, accessToken } = await chrome.storage.sync.get(["apiBaseUrl", "accessToken"]);
  if (apiBaseUrl) apiBaseUrlInput.value = apiBaseUrl;
  if (accessToken) accessTokenInput.value = accessToken;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const apiBaseUrl = apiBaseUrlInput.value.replace(/\/+$/, "");
  const accessToken = accessTokenInput.value.trim();

  await chrome.storage.sync.set({ apiBaseUrl, accessToken });

  statusEl.textContent = "Saved.";
  statusEl.className = "success";
  setTimeout(() => {
    statusEl.textContent = "";
    statusEl.className = "";
  }, 2000);
});

init();
