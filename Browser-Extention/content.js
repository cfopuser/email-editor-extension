const ICON_URL      = chrome.runtime.getURL('icons/icon32.png');
const INJECTED_ATTR = 'data-shilita-injected';

setInterval(() => {
  const wins = document.querySelectorAll('.aDh, div[role="dialog"] .aB.gQ.pE');
  wins.forEach(win => {
    const toolbar = win.querySelector('.btC, .IZ, .aDj .J-J5-Ji');
    if (!toolbar || toolbar.querySelector(`[${INJECTED_ATTR}]`)) return;
    injectButton(toolbar, win);
  });
}, 500);

function injectButton(toolbar, composeWin) {
  const btn = document.createElement('button');
  btn.setAttribute(INJECTED_ATTR, 'true');
  btn.setAttribute('aria-label', 'שלח עם Email Editor');
  btn.title     = 'שלח עם Email Editor — תוכל לערוך או למחוק אחרי השליחה';
  btn.className = 'shilita-send-btn';
  btn.innerHTML = `
    <span class="shilita-btn-inner">
      <img src="${ICON_URL}" class="shilita-icon" alt="" />
      <svg class="shilita-arrow" viewBox="0 0 24 24" fill="none">
        <path d="M3 12L21 12M21 12L14 5M21 12L14 19"
          stroke="currentColor" stroke-width="2.2"
          stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </span>`;
  btn.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    handleSend(composeWin, btn);
  });
  const sendBtn = toolbar.querySelector('[data-tooltip*="Send"], [data-tooltip*="שלח"]');
  sendBtn ? toolbar.insertBefore(btn, sendBtn) : toolbar.appendChild(btn);
}

// ── צייר טקסט כ-PNG באמצעות Canvas של הדפדפן ─────────────────────────────
function textToPngDataUrl(text) {
  const fontSize = 14;
  const lineH    = 22;
  const padV     = 12;
  const padH     = 10;
  const width    = 600;
  const maxW     = width - padH * 2;

  // מדידת רוחב מילים לפני שקובעים גובה
  const measure = document.createElement('canvas').getContext('2d');
  measure.font  = fontSize + 'px Arial, Helvetica, sans-serif';

  const wrappedLines = [];
  for (const para of (text || '').split('\n')) {
    if (!para.trim()) { wrappedLines.push(''); continue; }
    let line = '';
    for (const word of para.split(' ')) {
      const test = line ? line + ' ' + word : word;
      if (measure.measureText(test).width > maxW && line) {
        wrappedLines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) wrappedLines.push(line);
  }
  if (!wrappedLines.length) wrappedLines.push('');

  const canvas  = document.createElement('canvas');
  canvas.width  = width;
  canvas.height = padV * 2 + wrappedLines.length * lineH;
  const ctx     = canvas.getContext('2d');

  // רקע לבן
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Detect language and adjust drawing direction
  ctx.font      = fontSize + 'px Arial, Helvetica, sans-serif';
  ctx.fillStyle = '#1a1a1a';
  const hasHebrew = /[\u0590-\u05FF]/.test(text || '');
  ctx.direction = hasHebrew ? 'rtl' : 'ltr';
  ctx.textAlign = hasHebrew ? 'right' : 'left';

  wrappedLines.forEach((line, i) => {
    const y = padV + (i + 1) * lineH;
    const x = hasHebrew ? (width - padH) : padH;
    ctx.fillText(line || ' ', x, y);
  });

  return canvas.toDataURL('image/png');
}

// המר dataURL ל-Blob
function dataUrlToBlob(dataUrl) {
  const [header, data] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)[1];
  const bin  = atob(data);
  const arr  = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

// ── מודאל חיפוש משתמש ב-GitHub ──────────────────────────────────────────

function getAppLang() {
  return new Promise(resolve => {
    chrome.storage.local.get(['appLang'], (res) => {
      resolve(res.appLang || 'he');
    });
  });
}

const contentTranslations = {
  he: {
    modalTitle: "אימות נמען ב-GitHub",
    searching: 'מחפש משתמשים תואמים עבור "{recipient}"...',
    btnCancel: "ביטול שליחה",
    btnProceed: "המשך",
    cancelled: "בוטל על ידי המשתמש",
    searchError: "שגיאה בחיפוש משתמש",
    noUserFound: 'לא נמצא משתמש GitHub מתאים עבור: "{recipient}"',
    noUserDesc: "לא הצלחנו לאתר פרופיל GitHub תואם. האם ברצונך להמשיך בשליחה מאובטחת בכל זאת?",
    proceedAnyway: "המשך בכל זאת",
    selectUser: "נמצאו המשתמשים הבאים ב-GitHub. אנא בחר את המשתמש המתאים:",
    profileLink: "פרופיל",
    proceedSelected: "המשך עם המשתמש הנבחר",
    mustSignIn: "יש להתחבר תחילה — לחץ על אייקון התוסף",
    emptyMsg: "ההודעה ריקה",
    sentSuccess: "נשלח! תוכל לערוך או למחוק מהתוסף",
    refreshPage: "יש לרענן את הדף (F5)",
    imageAlt: "הודעה"
  },
  en: {
    modalTitle: "Recipient Verification on GitHub",
    searching: 'Searching for matching users for "{recipient}"...',
    btnCancel: "Cancel Sending",
    btnProceed: "Proceed",
    cancelled: "Cancelled by user",
    searchError: "Error searching user",
    noUserFound: 'No matching GitHub user found for: "{recipient}"',
    noUserDesc: "We couldn't locate a matching GitHub profile. Do you want to proceed with secure sending anyway?",
    proceedAnyway: "Proceed anyway",
    selectUser: "The following users were found on GitHub. Please select the correct user:",
    profileLink: "Profile",
    proceedSelected: "Proceed with selected user",
    mustSignIn: "Please sign in first — click the extension icon",
    emptyMsg: "Message is empty",
    sentSuccess: "Sent! You can edit or delete this message from the extension",
    refreshPage: "Please refresh the page (F5)",
    imageAlt: "Message"
  }
};
// ─── Handle Sending ──────────────────────────────────────────────────────

async function handleSend(composeWin, btn) {
  const lang = await getAppLang();
  const t = contentTranslations[lang];

  const status = await bg({ action: 'GET_STATUS' }, 3, lang);
  if (!status.ok) {
    // The bg helper function already displayed the connection error / refresh page toast.
    return;
  }
  if (!status.signedIn) {
    console.warn("GET_STATUS returned signedIn: false. Settings keys present:", status.settingsKeys);
    showToast(t.mustSignIn, 'error', lang);
    return;
  }

  const bodyEl = composeWin.querySelector('[contenteditable="true"]')
              || composeWin.querySelector('.Am.Al.editable')
              || Array.from(document.querySelectorAll('[contenteditable="true"]')).find(el => el.offsetHeight > 50)
              || document.querySelector('.Am.Al.editable');
  const subjEl = composeWin.querySelector('[name="subjectbox"], .aoT');

  const content = (bodyEl?.innerText || '').trim();

  // שלוף שם הנמען — עדיפות לשם איש הקשר כפי שמופיע ב-chip
  let recipient = '';

  // נסיון 1 — שם מ-chips (.vT הוא הטקסט הנראה לעין בתוך ה-chip)
  const composeRoot = composeWin.closest('.aDh') || composeWin;
  const nameChips = Array.from(composeRoot.querySelectorAll('.vT'));
  if (nameChips.length) {
    recipient = nameChips.map(el => el.innerText.trim()).filter(Boolean).join(', ');
  }

  // נסיון 2 — data-name attribute
  if (!recipient) {
    const named = Array.from(document.querySelectorAll('[data-name]'))
      .map(el => el.getAttribute('data-name') || '').filter(Boolean);
    if (named.length) recipient = [...new Set(named)].join(', ');
  }

  // נסיון 3 — fallback לאימייל אם לא נמצא שם
  if (!recipient) {
    for (const attr of ['email', 'data-hovercard-id']) {
      const emails = Array.from(document.querySelectorAll('[' + attr + ']'))
        .map(el => el.getAttribute(attr) || '')
        .filter(e => /^[\w.+-]+@[\w.-]+\.[a-z]{2,}$/i.test(e));
      if (emails.length) { recipient = [...new Set(emails)].join(', '); break; }
    }
  }
  const subject   = (subjEl?.value       || subjEl?.innerText || '').trim();

  if (!content) { showToast(t.emptyMsg, 'error', lang); return; }

  btn.classList.add('loading');
  btn.disabled = true;

  try {
    // 2. צייר PNG בדפדפן
    const dataUrl = textToPngDataUrl(content);
    const blob    = dataUrlToBlob(dataUrl);

    // 3. שלח לbackground לשמירה
    const result = await bg({
      action:    'SAVE_MESSAGE',
      content,
      subject,
      recipient,
      pngBase64: dataUrl.split(',')[1]
    }, 3, lang);

    if (!result.ok) throw new Error(result.error);

    // 4. החלף תוכן המייל בתמונה
    if (bodyEl) {
      bodyEl.innerHTML = '';
      const img = document.createElement('img');
      img.src           = result.imageUrl;
      img.alt           = t.imageAlt;
      img.style.cssText = 'max-width:100%;display:block;border:none;outline:none;';
      img.setAttribute('data-shilita-id', result.msgId);
      bodyEl.appendChild(img);
    }

    await sleep(300);
    const gmailSend = composeWin.querySelector(
      '[data-tooltip*="Send"] .T-I, [data-tooltip*="שלח"] .T-I, .aoO.T-I-atl'
    );
    gmailSend?.click();

    showToast(t.sentSuccess, 'success', lang);
  } catch (e) {
    if (e.message === t.cancelled) {
      showToast(lang === 'he' ? 'השליחה בוטלה' : 'Send cancelled', 'success', lang);
    } else {
      showToast((lang === 'he' ? 'שגיאה: ' : 'Error: ') + translateError(e.message, lang), 'error', lang);
    }
  } finally {
    btn.classList.remove('loading');
    btn.disabled = false;
  }
}

async function bg(msg, retries, lang = 'he') {
  const t = contentTranslations[lang] || contentTranslations.he;
  retries = retries === undefined ? 3 : retries;
  for (var i = 0; i <= retries; i++) {
    try {
      if (!chrome.runtime?.id) {
        if (i < retries) { await sleep(400); continue; }
        showToast(t.refreshPage, 'error', lang);
        return { ok: false, error: 'context invalidated' };
      }
      var result = await new Promise(function(r) {
        try {
          chrome.runtime.sendMessage(msg, function(res) {
            if (chrome.runtime.lastError) {
              console.warn("content.js bg warning:", chrome.runtime.lastError.message);
            }
            r(res);
          });
        } catch (e) {
          console.warn("chrome.runtime.sendMessage exception:", e.message);
          r(undefined);
        }
      });
      if (result !== undefined && result !== null) return result;
      if (i < retries) await sleep(400);
    } catch (e) {
      if (i < retries) { await sleep(400); continue; }
      showToast(t.refreshPage, 'error', lang);
      return { ok: false, error: e.message };
    }
  }
  showToast(t.refreshPage, 'error', lang);
  return { ok: false, error: 'no response' };
}
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function showToast(text, type = 'success', lang = 'he') {
  document.querySelector('.shilita-toast')?.remove();
  const t = document.createElement('div');
  t.className   = `shilita-toast shilita-toast--${type}`;
  t.textContent = text;
  if (lang === 'en') {
    t.style.direction = 'ltr';
  } else {
    t.style.direction = 'rtl';
  }
  document.body.appendChild(t);
  setTimeout(() => t.classList.add('shilita-toast--visible'), 50);
  setTimeout(() => { t.classList.remove('shilita-toast--visible'); setTimeout(() => t.remove(), 400); }, 3500);
}

function translateError(errMsg, lang = 'he') {
  if (!errMsg) return '';
  if (lang === 'he') return errMsg;
  
  if (errMsg.includes('שגיאת חיבור לרשת בבדיקת המאגר')) {
    return 'Network connection error while checking repository. Please check your internet connection.';
  }
  if (errMsg.includes('שגיאה בבדיקת מאגר')) {
    return errMsg.replace('שגיאה בבדיקת מאגר', 'Error checking repository');
  }
  if (errMsg.includes('שגיאת GitHub')) {
    return errMsg.replace('שגיאת GitHub', 'GitHub Error');
  }
  if (errMsg.includes('שגיאת חיבור לרשת ביצירת המאגר')) {
    return 'Network connection error while creating repository. Please check your internet connection.';
  }
  if (errMsg.includes('שגיאה ביצירת מאגר')) {
    return errMsg.replace('שגיאה ביצירת מאגר', 'Error creating repository');
  }
  if (errMsg.includes('חסרים פרטי GitHub בהגדרות')) {
    return 'Missing GitHub details in settings';
  }
  if (errMsg.includes('שגיאה בטעינת אינדקס מ-GitHub')) {
    return errMsg.replace('שגיאה בטעינת אינדקס מ-GitHub', 'Error loading index from GitHub');
  }
  if (errMsg.includes('שגיאה בכתיבת אינדקס ל-GitHub')) {
    return errMsg.replace('שגיאה בכתיבת אינדקס ל-GitHub', 'Error writing index to GitHub');
  }
  if (errMsg.includes('נא להזין Token')) {
    return 'Please enter a Token';
  }
  if (errMsg.includes('שגיאת חיבור לרשת באימות ה-Token')) {
    return 'Network connection error during Token verification. Please check your internet connection.';
  }
  if (errMsg.includes('ה-Token שהוזן אינו תקין או פג תוקף')) {
    return 'The entered Token is invalid or expired';
  }
  if (errMsg.includes('ה-Token שגוי או פג תוקף')) {
    return 'The Token is incorrect or expired (Unauthorized)';
  }
  if (errMsg.includes('GitHub PAT חסר')) {
    return 'GitHub PAT is missing';
  }
  if (errMsg.includes('GitHub username חסר')) {
    return 'GitHub username is missing';
  }
  if (errMsg.includes('שם מאגר התמונות אינו תקין')) {
    return 'Public image repository name is invalid';
  }
  if (errMsg.includes('שם מאגר האינדקס אינו תקין')) {
    return 'Private index repository name is invalid';
  }
  if (errMsg.includes('כתובת ה-Cloudflare Worker חייבת להתחיל ב-http')) {
    return 'Cloudflare Worker URL must start with http:// or https://';
  }
  if (errMsg.includes('לא הוגדר GitHub PAT')) {
    return 'GitHub PAT is not configured';
  }
  if (errMsg.includes('שגיאה בחיפוש משתמש ב-GitHub')) {
    return errMsg.replace('שגיאה בחיפוש משתמש ב-GitHub', 'Error searching user on GitHub');
  }
  if (errMsg.includes('לא הוגדר URL של הפונקציה')) {
    return 'Worker function URL is not configured';
  }
  if (errMsg.includes('ההודעה לא נמצאה באינדקס')) {
    return 'Message not found in index';
  }
  
  return errMsg;
}
