
(async function () {
    if (!window.location.href.includes("netaccess.iitm.ac.in/account/login") &&
        !window.location.href.includes("netaccess.iitm.ac.in/account/index") &&
        !window.location.href.includes("netaccess.iitm.ac.in/account/approve")) {
        return;
    }

    console.log("🚀 NetAccess Auto Login Script Running...");

    async function getDecryptedCredentials() {
        return new Promise((resolve, reject) => {
            chrome.storage.local.get(["netAccessUsername", "netAccessPassword", "encryptionKey", "approvalCompleted"], async (data) => {
                if (!data.netAccessUsername || !data.netAccessPassword || !data.encryptionKey) {
                    console.error("⚠️ No stored credentials found. Please enter them in the extension popup.");
                    reject("No stored credentials");
                    return;
                }

                try {
                    const key = new Uint8Array(data.encryptionKey);
                    const [username, password] = await Promise.all([
                        decryptData(data.netAccessUsername, key),
                        decryptData(data.netAccessPassword, key),
                    ]);
                    resolve({ username, password, approvalCompleted: data.approvalCompleted || false });
                } catch (error) {
                    console.error("❌ Error decrypting credentials:", error);
                    reject(error);
                }
            });
        });
    }

    async function decryptData(encryptedData, key) {
        const cryptoKey = await crypto.subtle.importKey("raw", key, { name: "AES-GCM" }, false, ["decrypt"]);
        return new TextDecoder().decode(
            await crypto.subtle.decrypt({ name: "AES-GCM", iv: new Uint8Array(encryptedData.iv) }, cryptoKey, new Uint8Array(encryptedData.data))
        );
    }

    async function attemptLogin() {
        try {
            console.log("🔑 Attempting login...");
            const { username, password } = await getDecryptedCredentials();

            let usernameField = document.getElementById("username");
            let passwordField = document.getElementById("password");
            let submitBtn = document.getElementById("submit");

            if (usernameField && passwordField && submitBtn) {
                usernameField.value = username;
                passwordField.value = password;
                submitBtn.click();
                console.log("✅ Logging in...");
            } else {
                console.error("❌ Login form elements not found!");
            }
        } catch (error) {
            console.error("⚠️ Login attempt failed:", error);
        }
    }

    function approveSession() {
        let approveButton = document.querySelector(".btn.btn-info.btn-md");
        if (approveButton) {
            console.log("✅ Clicking Approve Button...");
            approveButton.click();
        } else {
            console.log("⚠️ Approve button not found.");
        }
    }

    function authorizeSession() {
        let durationOption = document.querySelector("input#radios-1");
        if (durationOption) {
            console.log("📅 Selecting 1-Day Duration...");
            durationOption.click();
        }

        let authorizeButton = document.getElementById("approveBtn");
        if (authorizeButton) {
            console.log("🔄 Clicking Authorize Button...");
            authorizeButton.click();
        } else {
            console.log("⚠️ Authorize button not found.");
        }
    }

    if (window.location.href.includes("netaccess.iitm.ac.in/account/login")) {
        chrome.storage.local.set({ approvalCompleted: false }, () => {
            console.log("Resetting approvalCompleted flag...");
        });
        await attemptLogin();
    } else if (window.location.href.includes("netaccess.iitm.ac.in/account/index")) {
        chrome.storage.local.get("approvalCompleted", (data) => {
            if (data.approvalCompleted) {
                console.log("✅ Successfully logged in and approved. Stopping execution.");
                chrome.storage.local.set({ approvalCompleted: false }, () => {});
            } else {
                console.log("🚀 Redirecting to approval...");
                chrome.storage.local.set({ approvalCompleted: true }, () => {
                    window.location.href = "https://netaccess.iitm.ac.in/account/approve";
                });
            }
        });
    } else if (window.location.href.includes("netaccess.iitm.ac.in/account/approve")) {
        authorizeSession();
    }
})();
