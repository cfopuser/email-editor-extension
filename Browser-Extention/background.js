// ─── background.js ───────────────────────────────────────────────────────────

// Helper to get settings from storage
async function getSettings() {
  const data = await chrome.storage.local.get(['settings']);
  return data.settings || {};
}

// Helper to get cached messages from local storage
async function getCachedMessages() {
  const data = await chrome.storage.local.get(['cached_messages']);
  return data.cached_messages || [];
}

// Helper to save cached messages to local storage
async function saveCachedMessages(messages) {
  await chrome.storage.local.set({ cached_messages: messages });
}

// ─── Helpers for Crypto ──────────────────────────────────────────

async function encryptImage(base64Data, existingKeyHex = null) {
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  let key;
  let keyHex;
  
  if (existingKeyHex) {
    keyHex = existingKeyHex;
    const keyBytes = new Uint8Array(keyHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    key = await crypto.subtle.importKey(
      "raw",
      keyBytes,
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt"]
    );
  } else {
    key = await crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt"]
    );
    
    const exportedKey = await crypto.subtle.exportKey("raw", key);
    keyHex = Array.from(new Uint8Array(exportedKey))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
  
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    bytes
  );
  
  const result = new Uint8Array(iv.length + encrypted.byteLength);
  result.set(iv, 0);
  result.set(new Uint8Array(encrypted), iv.length);
  
  let resultBinaryString = "";
  for (let i = 0; i < result.byteLength; i++) {
    resultBinaryString += String.fromCharCode(result[i]);
  }
  const encryptedBase64 = btoa(resultBinaryString);
  
  return { encryptedBase64, keyHex };
}

// ─── GitHub API Helpers ──────────────────────────────────────────

// Base64 encoding for Unicode strings (GitHub API needs this)
function utob(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

// Base64 decoding for Unicode strings
function btou(str) {
  return decodeURIComponent(escape(atob(str)));
}

async function checkOrCreateRepo(pat, owner, repoName, isPrivate) {
  const checkUrl = `https://api.github.com/repos/${owner}/${repoName}`;
  let response;
  try {
    response = await fetch(checkUrl, {
      headers: {
        'Authorization': `Bearer ${pat}`,
        'Accept': 'application/vnd.github+json'
      }
    });
  } catch (netErr) {
    throw new Error('שגיאת חיבור לרשת בבדיקת המאגר. בדוק את החיבור לאינטרנט.');
  }

  if (response.ok) return true; // Repo exists
  if (response.status !== 404) {
    let errMsg = `שגיאה בבדיקת מאגר ${repoName}: ${response.status} ${response.statusText}`;
    try {
      const errText = await response.text();
      const parsed = JSON.parse(errText);
      if (parsed.message) errMsg = `שגיאת GitHub: ${parsed.message}`;
    } catch(e) {}
    throw new Error(errMsg);
  }

  // Create repo since it doesn't exist
  const createUrl = 'https://api.github.com/user/repos';
  let createRes;
  try {
    createRes = await fetch(createUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${pat}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: repoName,
        private: isPrivate,
        auto_init: true,
        description: isPrivate ? 'Email index database' : 'Email secure encrypted images'
      })
    });
  } catch (netErr) {
    throw new Error('שגיאת חיבור לרשת ביצירת המאגר. בדוק את החיבור לאינטרנט.');
  }

  if (!createRes.ok) {
    let errMsg = `שגיאה ביצירת מאגר ${repoName}: ${createRes.status} ${createRes.statusText}`;
    try {
      const errText = await createRes.text();
      const parsed = JSON.parse(errText);
      if (parsed.message) errMsg = `שגיאת GitHub: ${parsed.message}`;
    } catch(e) {}
    throw new Error(errMsg);
  }
  return true;
}

async function uploadImageToPublicRepo(filename, base64Content, existingSha = null) {
  const { githubPat, githubOwner, githubRepo } = await getSettings();
  if (!githubPat || !githubOwner || !githubRepo) throw new Error("חסרים פרטי GitHub בהגדרות");

  const url = `https://api.github.com/repos/${githubOwner}/${githubRepo}/contents/images/${filename}`;
  
  const body = {
    message: `Upload ${filename}`,
    content: base64Content
  };
  if (existingSha) body.sha = existingSha;

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${githubPat}`,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  
  if (!response.ok) {
    throw new Error(`GitHub API error (Public Repo): ${await response.text()}`);
  }
  
  const data = await response.json();
  return {
    rawUrl: `https://raw.githubusercontent.com/${githubOwner}/${githubRepo}/main/images/${filename}`,
    sha: data.content.sha
  };
}

async function deleteImageFromPublicRepo(filename, sha) {
  const { githubPat, githubOwner, githubRepo } = await getSettings();
  if (!githubPat || !githubOwner || !githubRepo) throw new Error("חסרים פרטי GitHub בהגדרות");

  const url = `https://api.github.com/repos/${githubOwner}/${githubRepo}/contents/images/${filename}`;
  
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${githubPat}`,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: `Delete ${filename}`,
      sha: sha
    })
  });
  
  if (!response.ok) {
    throw new Error(`GitHub API error (Delete Image): ${await response.text()}`);
  }
  return true;
}

// ─── Private Index Repository Helpers ─────────────────────────────

async function fetchIndexFromGitHub() {
  const { githubPat, githubOwner, githubIndexRepo } = await getSettings();
  if (!githubPat || !githubOwner || !githubIndexRepo) return { messages: [], sha: null };

  const url = `https://api.github.com/repos/${githubOwner}/${githubIndexRepo}/contents/index.json`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${githubPat}`,
      'Accept': 'application/vnd.github+json'
    }
  });

  if (response.status === 404) {
    return { messages: [], sha: null };
  }

  if (!response.ok) {
    throw new Error(`שגיאה בטעינת אינדקס מ-GitHub: ${await response.text()}`);
  }

  const data = await response.json();
  const content = btou(data.content);
  return {
    messages: JSON.parse(content),
    sha: data.sha
  };
}

async function writeIndexToGitHub(messages, sha) {
  const { githubPat, githubOwner, githubIndexRepo } = await getSettings();
  if (!githubPat || !githubOwner || !githubIndexRepo) throw new Error("חסרים פרטי GitHub בהגדרות");

  const url = `https://api.github.com/repos/${githubOwner}/${githubIndexRepo}/contents/index.json`;
  const contentBase64 = utob(JSON.stringify(messages, null, 2));

  const body = {
    message: "Update index.json",
    content: contentBase64
  };
  if (sha) body.sha = sha;

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${githubPat}`,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`שגיאה בכתיבת אינדקס ל-GitHub: ${await response.text()}`);
  }
}

// Perform a background sync and notify popup if changed
async function syncIndexBackground() {
  try {
    const { messages, sha } = await fetchIndexFromGitHub();
    await saveCachedMessages(messages);
    
    // Notify popup that fresh data is ready
    chrome.runtime.sendMessage({ action: 'INDEX_SYNCD', messages });
  } catch (e) {
    console.error("Background sync failed:", e);
  }
}


// ─── Message Listener ────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
  const handledActions = [
    'GET_STATUS',
    'VALIDATE_PAT',
    'INITIALIZE_REPOS',
    'SAVE_SETTINGS',
    'GET_SETTINGS',
    'SAVE_MESSAGE',
    'EDIT_MESSAGE',
    'DELETE_MESSAGE',
    'LOAD_MESSAGES',
    'PERMANENT_DELETE'
  ];

  if (!msg || !handledActions.includes(msg.action)) {
    return false; // Let other listeners handle this message, do not intercept
  }

  (async function() {
    try {
      const settings = await getSettings();


      if (msg.action === 'GET_STATUS') {
        const hasSettings = !!(settings.githubPat && settings.githubOwner && settings.githubRepo && settings.githubIndexRepo && settings.cloudFunctionUrl);
        sendResponse({ ok: true, signedIn: hasSettings, settingsKeys: Object.keys(settings) });

      } else if (msg.action === 'VALIDATE_PAT') {
        const pat = (msg.pat || '').trim();
        if (!pat) throw new Error('נא להזין Token');

        let userRes;
        try {
          userRes = await fetch('https://api.github.com/user', {
            headers: {
              'Authorization': `Bearer ${pat}`,
              'Accept': 'application/vnd.github+json'
            }
          });
        } catch (netErr) {
          throw new Error('שגיאת חיבור לרשת באימות ה-Token. בדוק את החיבור לאינטרנט.');
        }

        if (!userRes.ok) {
          let errMsg = 'ה-Token שהוזן אינו תקין או פג תוקף';
          if (userRes.status === 401) {
            errMsg = 'ה-Token שגוי או פג תוקף (Unauthorized)';
          }
          throw new Error(errMsg);
        }
        const userData = await userRes.json();
        const username = userData.login;

        sendResponse({ 
          ok: true, 
          username, 
          defaultPublicRepo: 'email-control-images', 
          defaultPrivateRepo: 'email-control-index' 
        });

      } else if (msg.action === 'INITIALIZE_REPOS') {
        const { pat, username, publicRepo, privateRepo, cloudFunctionUrl } = msg;

        if (!pat) throw new Error('GitHub PAT חסר');
        if (!username) throw new Error('GitHub username חסר');

        const repoNameRegex = /^[a-zA-Z0-9_.-]+$/;
        if (!publicRepo || !repoNameRegex.test(publicRepo)) {
          throw new Error('שם מאגר התמונות אינו תקין (רק אותיות, מספרים, מקפים, נקודות וקווים תחתונים)');
        }
        if (!privateRepo || !repoNameRegex.test(privateRepo)) {
          throw new Error('שם מאגר האינדקס אינו תקין (רק אותיות, מספרים, מקפים, נקודות וקווים תחתונים)');
        }

        let cfUrl = (cloudFunctionUrl || '').trim();
        if (!cfUrl.startsWith('http://') && !cfUrl.startsWith('https://')) {
          throw new Error('כתובת ה-Cloudflare Worker חייבת להתחיל ב-http:// או https://');
        }
        if (cfUrl.endsWith('/')) cfUrl = cfUrl.slice(0, -1);

        // Check/create both repositories
        await checkOrCreateRepo(pat, username, publicRepo, false);
        await checkOrCreateRepo(pat, username, privateRepo, true);

        // Save Settings
        const settings = {
          githubPat: pat,
          githubOwner: username,
          githubRepo: publicRepo,
          githubIndexRepo: privateRepo,
          cloudFunctionUrl: cfUrl
        };
        await chrome.storage.local.set({ settings });

        // Trigger sync
        await syncIndexBackground();
        sendResponse({ ok: true });

      } else if (msg.action === 'SAVE_SETTINGS') {
        const { githubPat, githubOwner, githubRepo, githubIndexRepo, cloudFunctionUrl } = msg.settings;
        if (!githubPat) throw new Error('GitHub PAT חסר');
        if (!githubOwner) throw new Error('GitHub Owner חסר');

        const repoNameRegex = /^[a-zA-Z0-9_.-]+$/;
        if (!githubRepo || !repoNameRegex.test(githubRepo)) {
          throw new Error('שם מאגר התמונות אינו תקין');
        }
        if (!githubIndexRepo || !repoNameRegex.test(githubIndexRepo)) {
          throw new Error('שם מאגר האינדקס אינו תקין');
        }

        let cfUrl = (cloudFunctionUrl || '').trim();
        if (!cfUrl.startsWith('http://') && !cfUrl.startsWith('https://')) {
          throw new Error('כתובת ה-Cloudflare Worker חייבת להתחיל ב-http:// או https://');
        }
        if (cfUrl.endsWith('/')) cfUrl = cfUrl.slice(0, -1);

        const validatedSettings = {
          githubPat,
          githubOwner,
          githubRepo,
          githubIndexRepo,
          cloudFunctionUrl: cfUrl
        };

        await chrome.storage.local.set({ settings: validatedSettings });
        // Trigger sync immediately upon saving new settings
        await syncIndexBackground();
        sendResponse({ ok: true });

      } else if (msg.action === 'GET_SETTINGS') {
        sendResponse({ ok: true, settings });

      } else if (msg.action === 'SAVE_MESSAGE') {
        if (!settings.cloudFunctionUrl) throw new Error("לא הוגדר URL של הפונקציה");

        const msgId = 'msg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
        const filename = `${msgId}.enc`;
        
        // 1. Encrypt image
        const { encryptedBase64, keyHex } = await encryptImage(msg.pngBase64);
        
        // 2. Upload to public repo
        const { rawUrl, sha: imageSha } = await uploadImageToPublicRepo(filename, encryptedBase64);
        
        // 3. Generate Cloud Function URL for the image tag
        const imageUrl = `${settings.cloudFunctionUrl}?url=${encodeURIComponent(rawUrl)}&key=${keyHex}`;

        const newMsg = {
          id: msgId,
          content: msg.content || '',
          subject: msg.subject || '',
          recipient: msg.recipient || '',
          githubUrl: rawUrl,
          githubSha: imageSha,
          encryptionKey: keyHex,
          filename: filename,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          deleted: false
        };
        
        // 4. Fetch private index, update, and write back
        const { messages, sha: indexSha } = await fetchIndexFromGitHub();
        messages.unshift(newMsg);
        await writeIndexToGitHub(messages, indexSha);
        await saveCachedMessages(messages);
        
        sendResponse({ ok: true, msgId, imageUrl });

      } else if (msg.action === 'EDIT_MESSAGE') {
        // Fetch current index to ensure we don't overwrite concurrent changes
        const { messages, sha: indexSha } = await fetchIndexFromGitHub();
        
        const msgIndex = messages.findIndex(m => m.id === msg.msgId);
        if (msgIndex === -1) throw new Error("ההודעה לא נמצאה באינדקס");
        const existingMsg = messages[msgIndex];

        // 1. Encrypt new image (reusing original key)
        const { encryptedBase64, keyHex } = await encryptImage(msg.pngBase64, existingMsg.encryptionKey);
        
        // 2. Upload to public repo (overwriting)
        const { sha: newImageSha } = await uploadImageToPublicRepo(existingMsg.filename, encryptedBase64, existingMsg.githubSha);
        
        // Update data
        existingMsg.content = msg.content;
        existingMsg.githubSha = newImageSha;
        existingMsg.encryptionKey = keyHex;
        existingMsg.updatedAt = new Date().toISOString();
        
        // 3. Write index back
        await writeIndexToGitHub(messages, indexSha);
        await saveCachedMessages(messages);
        
        sendResponse({ ok: true });

      } else if (msg.action === 'DELETE_MESSAGE') {
        const { messages, sha: indexSha } = await fetchIndexFromGitHub();
        
        const msgIndex = messages.findIndex(m => m.id === msg.msgId);
        if (msgIndex === -1) throw new Error("ההודעה לא נמצאה באינדקס");
        const existingMsg = messages[msgIndex];
        
        if (msg.deletedPng) {
          // Overwrite with "deleted message" image in public repo (reusing original key)
          const { encryptedBase64, keyHex } = await encryptImage(msg.deletedPng, existingMsg.encryptionKey);
          const { sha: newImageSha } = await uploadImageToPublicRepo(existingMsg.filename, encryptedBase64, existingMsg.githubSha);
          existingMsg.githubSha = newImageSha;
          existingMsg.encryptionKey = keyHex;
        } else {
          // Physically delete from public repo
          await deleteImageFromPublicRepo(existingMsg.filename, existingMsg.githubSha);
          existingMsg.githubSha = null;
        }

        existingMsg.deleted = true;
        existingMsg.content = msg.deletedText || "This message was deleted by the sender";
        existingMsg.deletedAt = new Date().toISOString();
        existingMsg.updatedAt = new Date().toISOString();
        
        await writeIndexToGitHub(messages, indexSha);
        await saveCachedMessages(messages);
        
        sendResponse({ ok: true });

      } else if (msg.action === 'LOAD_MESSAGES') {
        // Stale-While-Revalidate: Return cached messages instantly, sync in the background
        const cached = await getCachedMessages();
        sendResponse({ ok: true, messages: cached });
        
        // Asynchronously sync
        syncIndexBackground();

      } else if (msg.action === 'PERMANENT_DELETE') {
        const { messages, sha: indexSha } = await fetchIndexFromGitHub();
        const filtered = messages.filter(m => m.id !== msg.msgId);
        
        await writeIndexToGitHub(filtered, indexSha);
        await saveCachedMessages(filtered);
        
        sendResponse({ ok: true });

      } else {
        sendResponse({ ok: false, error: 'unknown action' });
      }
    } catch (e) { 
      console.error(e);
      sendResponse({ ok: false, error: e.message }); 
    }
  })();
  return true;
});
