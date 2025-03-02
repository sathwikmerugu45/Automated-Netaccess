document.getElementById("save").addEventListener("click", async () => {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  if (!username || !password) {
      document.getElementById("status").textContent = "Please enter both fields.";
      return;
  }

  const encryptionKey = crypto.getRandomValues(new Uint8Array(16));
  const encryptedUsername = await encryptData(username, encryptionKey);
  const encryptedPassword = await encryptData(password, encryptionKey);

  chrome.storage.local.set({
      netAccessUsername: encryptedUsername,
      netAccessPassword: encryptedPassword,
      encryptionKey: Array.from(encryptionKey)
  }, () => {
      document.getElementById("status").textContent = "Credentials saved!";
  });
});

async function encryptData(data, key) {
  const encoded = new TextEncoder().encode(data);
  const cryptoKey = await crypto.subtle.importKey("raw", key, { name: "AES-GCM" }, false, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, cryptoKey, encoded);
  return { iv: Array.from(iv), data: Array.from(new Uint8Array(encrypted)) };
}