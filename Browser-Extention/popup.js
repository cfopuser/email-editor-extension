// ─── popup.js ─────────────────────────────────────────────────────────────

let currentMessages = [];
let editingMsgId = null;
let currentLang = 'he';

// Temporary holder for setup info
let setupInfo = {
  pat: '',
  username: '',
  publicRepo: '',
  privateRepo: ''
};

// ─── Translations Dictionary ──────────────────────────────────────────────
const translations = {
  he: {
    "app-title": "עורך אימייל",
    "theme-toggle-title": "החלף מצב תצוגה",
    "welcome-title": "ברוכים הבאים",
    "welcome-desc": 'ברוכים הבאים ל "עורך מייל" באמצעות תוסף זת תוכלו לערוך או למחוק מיילים גם לאחר שליחתם',
    "welcome-links-title": "קישורים שימושיים:",
    "welcome-link-forum": "דיון בפורום מתמחים טופ",
    "welcome-link-github": "מאגר ה-GitHub של הפרויקט",
    "welcome-btn-start": "להתחלת ההגדרה",
    "wizard-s1-title": "אימות GitHub",
    "wizard-s1-desc": "הזן את הPAT שלך מ-GitHub כדי לאמת את החשבון.",
    "wizard-s1-pat-label": "GitHub Personal Access Token (PAT)",
    "wizard-s1-pat-placeholder": "ghp_xxxxxxxxxxxxxxxxxxxx",
    "wizard-s1-btn": "אמת והמשך",
    "wizard-s1-help": "יצירת Token חדש ב-GitHub (סמן את \"repo\")",
    "wizard-s2-choice-title": "בחירת סוג הגדרה",
    "wizard-s2-choice-desc": "בחר כיצד ברצונך להגדיר את המאגרים ב-GitHub.",
    "wizard-s2-btn-default": "הגדרות ברירת מחדל (מומלץ)",
    "wizard-s2-btn-custom": "הגדרות מותאמות אישית",
    "wizard-s2-title": "הגדרת מאגרים ושרת",
    "wizard-s2-desc": "באפשרותך להתאים אישית את שמות המאגרים ב-GitHub ואת כתובת השרת.",
    "wizard-s2-pub-label": "שם מאגר תמונות ציבורי",
    "wizard-s2-pub-placeholder": "email-control-images",
    "wizard-s2-priv-label": "שם מאגר אינדקס פרטי",
    "wizard-s2-priv-placeholder": "email-control-index",
    "wizard-s2-cf-label": "Cloudflare Worker URL",
    "wizard-s2-cf-placeholder": "https://...",
    "wizard-s2-btn-back": "חזור",
    "wizard-s2-btn-init": "הגדר והפעל",
    "wizard-s3-title": "מאתחל את המערכת...",
    "wizard-s3-step1": "חיבור ל-GitHub ואימות פרטים",
    "wizard-s3-step2": "הגדרת מאגר תמונות ציבורי",
    "wizard-s3-step3": "הגדרת מאגר אינדקס פרטי",
    "wizard-s3-step4": "סנכרון ראשוני והפעלת התוסף",
    "wizard-s3-btn-retry": "חזור ונסה שנית",
    "nav-messages": "ההודעות שלי",
    "nav-settings": "הגדרות",
    "settings-pat-label": "GitHub PAT",
    "settings-pat-placeholder": "ghp_...",
    "settings-pub-label": "שם מאגר תמונות ציבורי",
    "settings-priv-label": "שם מאגר אינדקס פרטי",
    "settings-cf-label": "כתובת ה-Cloudflare Worker",
    "settings-btn-update": "עדכן הגדרות",
    "settings-info-label": "מחובר כ- ...",
    "edit-panel-title": "עריכת תוכן (השינוי יתעדכן אצל הנמען)",
    "edit-panel-save": "שמור שינויים",
    "edit-panel-cancel": "ביטול",

    // Dynamic terms
    "loading": "טוען...",
    "error-loading": "שגיאה בטעינת הודעות",
    "empty-state-title": "אין הודעות במעקב",
    "empty-state-desc": "פתח את Gmail ולחץ על כפתור השליחה של התוסף שליד כפתור השליחה הרגיל.",
    "to": "אל: {recipient}",
    "no-subject": "ללא נושא",
    "deleted-msg": "ההודעה נמחקה",
    "btn-edit": "ערוך",
    "btn-delete": "למחוק",
    "btn-remove": "הסר",
    "toast-setup-success": "ההגדרה הושלמה בהצלחה!",
    "toast-enter-pat": "נא להזין Token תקין",
    "toast-pat-invalid": "שגיאה באימות ה-Token",
    "toast-fill-fields": "נא למלא את כל השדות",
    "toast-pub-invalid": "שם מאגר תמונות אינו תקין (רק אותיות, מספרים, מקפים, נקודות וקווים תחתונים)",
    "toast-priv-invalid": "שם מאגר אינדקס אינו תקין (רק אותיות, מספרים, מקפים, נקודות וקווים תחתונים)",
    "toast-cf-invalid": "כתובת ה-Cloudflare Worker חייבת להתחיל ב-http:// או https://",
    "toast-settings-success": "ההגדרות עודכנו בהצלחה",
    "toast-empty-content": "התוכן לא יכול להיות ריק",
    "toast-edit-success": "ההודעה עודכנה בהצלחה",
    "toast-delete-success": "ההודעה נמחקה",
    "toast-remove-success": "ההודעה הוסרה",
    "system-msg-deleted": "ההודעה נמחקה על ידי השולח",
    "unknown": "לא ידוע",

    "checking": "בודק...",
    "saving-cf": "שומר ב-GitHub...",
    "deleting": "מוחק...",
    "saving": "שומר...",
    "connected-as": "מחובר כ- @{owner}",
    "init-failed": "האתחול נכשל",
    "init-success": "האתחול הושלם בהצלחה!",
    "init-status": "מאתחל את המערכת...",
    "error-saving-settings": "שגיאה בשמירת הגדרות",
    "error-unknown-init": "שגיאה לא ידועה באתחול המאגרים",
    "nav-info": "מידע",
    "info-app-name": "עורך אימייל",
    "info-version": "גרסא 1.0.0",
    "info-forum-title": "פורום מתמחים טופ",
    "info-forum-desc": "נושא ראשי לתוסף במתמחים טופ",
    "info-github-title": "פרוייקט GitHub",
    "info-github-desc": "קוד מקור ודיווח על באגים",
    "update-available": "עדכון זמין!",
    "update-desc": "גרסה {latest} זמינה — אצלך מותקנת {current}",
    "update-btn": "הורד",
    "update-dismiss": "אחר כך"
  },
  en: {
    "app-title": "Email Editor",
    "theme-toggle-title": "Toggle Theme",
    "welcome-title": "Welcome",
    "welcome-desc": "Welcome to \"Email Editor\" — with this extension you can edit or delete emails even after they have been sent.",
    "welcome-links-title": "Useful Links:",
    "welcome-link-forum": "Mitmachim Top Forum Discussion",
    "welcome-link-github": "Project GitHub Repository",
    "welcome-btn-start": "Start Setup",
    "wizard-s1-title": "GitHub Verification",
    "wizard-s1-desc": "Enter your GitHub PAT to verify your account.",
    "wizard-s1-pat-label": "GitHub Personal Access Token (PAT)",
    "wizard-s1-pat-placeholder": "ghp_xxxxxxxxxxxxxxxxxxxx",
    "wizard-s1-btn": "Verify & Continue",
    "wizard-s1-help": "Create new Token on GitHub (check \"repo\")",
    "wizard-s2-choice-title": "Choose Setup Type",
    "wizard-s2-choice-desc": "Choose how you want to configure your GitHub repositories.",
    "wizard-s2-btn-default": "Default Settings (Recommended)",
    "wizard-s2-btn-custom": "Custom Settings",
    "wizard-s2-title": "Repository & Server Setup",
    "wizard-s2-desc": "You can customize your GitHub repository names and server address.",
    "wizard-s2-pub-label": "Public Image Repository Name",
    "wizard-s2-pub-placeholder": "email-control-images",
    "wizard-s2-priv-label": "Private Index Repository Name",
    "wizard-s2-priv-placeholder": "email-control-index",
    "wizard-s2-cf-label": "Cloudflare Worker URL",
    "wizard-s2-cf-placeholder": "https://...",
    "wizard-s2-btn-back": "Back",
    "wizard-s2-btn-init": "Configure & Activate",
    "wizard-s3-title": "Initializing the system...",
    "wizard-s3-step1": "Connecting to GitHub & verifying details",
    "wizard-s3-step2": "Setting up public image repository",
    "wizard-s3-step3": "Setting up private index repository",
    "wizard-s3-step4": "Initial sync & activating the extension",
    "wizard-s3-btn-retry": "Go back and try again",
    "nav-messages": "My Messages",
    "nav-settings": "Settings",
    "settings-pat-label": "GitHub PAT",
    "settings-pat-placeholder": "ghp_...",
    "settings-pub-label": "Public Image Repository Name",
    "settings-priv-label": "Private Index Repository Name",
    "settings-cf-label": "Cloudflare Worker URL",
    "settings-btn-update": "Update Settings",
    "settings-info-label": "Connected as ...",
    "edit-panel-title": "Edit Content (The change will update at the recipient)",
    "edit-panel-save": "Save Changes",
    "edit-panel-cancel": "Cancel",

    // Dynamic terms
    "loading": "Loading...",
    "error-loading": "Error loading messages",
    "empty-state-title": "No tracked messages",
    "empty-state-desc": "Open Gmail and click the extension's send button next to the regular send button.",
    "to": "To: {recipient}",
    "no-subject": "No Subject",
    "deleted-msg": "Message deleted",
    "btn-edit": "Edit",
    "btn-delete": "Delete",
    "btn-remove": "Remove",
    "toast-setup-success": "Setup completed successfully!",
    "toast-enter-pat": "Please enter a valid Token",
    "toast-pat-invalid": "Error verifying Token",
    "toast-fill-fields": "Please fill all fields",
    "toast-pub-invalid": "Invalid image repository name (letters, numbers, dashes, dots and underscores only)",
    "toast-priv-invalid": "Invalid index repository name (letters, numbers, dashes, dots and underscores only)",
    "toast-cf-invalid": "Cloudflare Worker URL must start with http:// or https://",
    "toast-settings-success": "Settings updated successfully",
    "toast-empty-content": "Content cannot be empty",
    "toast-edit-success": "Message updated successfully",
    "toast-delete-success": "Message deleted successfully",
    "toast-remove-success": "Message removed",
    "system-msg-deleted": "The message was deleted by the sender",
    "unknown": "Unknown",

    "checking": "Checking...",
    "saving-cf": "Saving to GitHub...",
    "deleting": "Deleting...",
    "saving": "Saving...",
    "connected-as": "Connected as @{owner}",
    "init-failed": "Initialization failed",
    "init-success": "Initialization completed successfully!",
    "init-status": "Initializing the system...",
    "error-saving-settings": "Error saving settings",
    "error-unknown-init": "Unknown error during repository initialization",
    "nav-info": "Info",
    "info-app-name": "Email Editor",
    "info-version": "Version 1.0.0",
    "info-forum-title": "Mitmachim Top Forum",
    "info-forum-desc": "Main thread for the extension on Mitmachim Top",
    "info-github-title": "GitHub Project",
    "info-github-desc": "Source code and bug reporting",
    "update-available": "Update Available!",
    "update-desc": "v{latest} is ready — you have v{current}",
    "update-btn": "Download",
    "update-dismiss": "Later"
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  setupNavigation();
  setupSettingsHandlers();
  setupThemeToggle();
  setupLanguage();
  setupUpdateCheck();

  // Listen for background updates
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === 'INDEX_SYNCD') {
      currentMessages = msg.messages || [];
      renderMessagesList();
    }
  });

  const status = await bg({ action: 'GET_STATUS' }) || {};
  if (status && status.signedIn) {
    showScreen('screen-main');
    await loadSettingsToForm();
    await loadMessages();
  } else {
    showScreen('screen-welcome');
  }
});

// ─── UI Helpers ─────────────────────────────────────────────────────────

function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
}

function showToast(msg, type = '') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = `toast show ${type}`;
  setTimeout(() => toast.classList.remove('show'), 3500);
}

function bg(msg) {
  return new Promise(resolve => {
    try {
      chrome.runtime.sendMessage(msg, response => {
        if (chrome.runtime.lastError) {
          console.warn("bg call warning:", chrome.runtime.lastError.message);
          resolve({ ok: false, error: chrome.runtime.lastError.message });
        } else {
          resolve(response || { ok: false, error: "No response from background" });
        }
      });
    } catch (err) {
      console.error("bg send failed:", err);
      resolve({ ok: false, error: err.message });
    }
  });
}

// ─── Theme Toggle ────────────────────────────────────────────────────────

function setupThemeToggle() {
  const setTheme = (theme) => {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
      document.getElementById('theme-icon-sun').style.display = 'none';
      document.getElementById('theme-icon-moon').style.display = 'block';
    } else {
      document.body.classList.remove('light-theme');
      document.getElementById('theme-icon-sun').style.display = 'block';
      document.getElementById('theme-icon-moon').style.display = 'none';
    }
  };

  chrome.storage.local.get(['appTheme'], (res) => {
    const theme = res.appTheme || 'dark';
    setTheme(theme);
  });

  document.getElementById('theme-toggle').addEventListener('click', () => {
    const isLight = document.body.classList.contains('light-theme');
    const newTheme = isLight ? 'dark' : 'light';
    setTheme(newTheme);
    chrome.storage.local.set({ appTheme: newTheme });
  });
}

// ─── Update Check ─────────────────────────────────────────────────────────

function setupUpdateCheck() {
  const banner     = document.getElementById('update-banner');
  const bannerDesc = document.getElementById('update-banner-desc');
  const btnUpdate  = document.getElementById('btn-do-update');
  const btnDismiss = document.getElementById('btn-dismiss-update');

  // Wire dismiss button
  btnDismiss.addEventListener('click', () => {
    banner.classList.remove('visible');
    // Remember dismissal for this version so we don't re-show on every open
    chrome.storage.local.get(['dismissedUpdateVersion'], (res) => {
      // We'll store the version in the check below; just hide for now
    });
    banner.dataset.dismissed = 'true';
  });

  // Async check — runs in background so popup opens instantly
  (async () => {
    try {
      const res = await bg({ action: 'CHECK_UPDATE' });
      if (!res || !res.ok || !res.updateAvailable) return;

      const { currentVersion, latestVersion, releaseUrl } = res;

      // Check if user already dismissed this version
      chrome.storage.local.get(['dismissedUpdateVersion'], (stored) => {
        if (stored.dismissedUpdateVersion === latestVersion) return;

        // Populate and show the banner
        const descTpl = translations[currentLang]['update-desc'] || 'v{latest} is available — you have v{current}';
        bannerDesc.textContent = descTpl
          .replace('{latest}', latestVersion)
          .replace('{current}', currentVersion);

        btnUpdate.href = releaseUrl;
        btnUpdate.textContent = translations[currentLang]['update-btn'] || 'Download';

        // Re-wire dismiss to persist the version
        btnDismiss.onclick = () => {
          banner.classList.remove('visible');
          chrome.storage.local.set({ dismissedUpdateVersion: latestVersion });
        };

        banner.classList.add('visible');
      });
    } catch (e) {
      // Silently fail — update check is non-critical
      console.warn('Update check failed:', e);
    }
  })();
}

// ─── Language Support (i18n) ──────────────────────────────────────────────

function setupLanguage() {
  const langBtn = document.getElementById('lang-toggle');
  langBtn.addEventListener('click', () => {
    const nextLang = currentLang === 'he' ? 'en' : 'he';
    setLanguage(nextLang);
  });

  chrome.storage.local.get(['appLang'], (res) => {
    const lang = res.appLang || 'he';
    setLanguage(lang);
  });
}

function setLanguage(lang) {
  currentLang = lang;
  chrome.storage.local.set({ appLang: lang });

  // Update layout direction
  const htmlNode = document.documentElement;
  htmlNode.setAttribute('lang', lang);
  const langBtn = document.getElementById('lang-toggle');
  if (lang === 'he') {
    htmlNode.setAttribute('dir', 'rtl');
    langBtn.textContent = 'EN';
    langBtn.setAttribute('title', 'Change language to English');
  } else {
    htmlNode.setAttribute('dir', 'ltr');
    langBtn.textContent = 'עב';
    langBtn.setAttribute('title', 'שנה שפה לעברית');
  }

  // Update DOM translation attributes
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[lang] && translations[lang][key]) {
      el.textContent = translations[lang][key];
    }
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (translations[lang] && translations[lang][key]) {
      el.setAttribute('placeholder', translations[lang][key]);
    }
  });

  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    if (translations[lang] && translations[lang][key]) {
      el.setAttribute('title', translations[lang][key]);
    }
  });

  // Re-run dynamic text logic if setup panel or main screens are active
  if (document.getElementById('screen-main').classList.contains('active')) {
    loadSettingsToForm();
    renderMessagesList();
  }
}

// ─── Setup Wizard Steps ──────────────────────────────────────────────────

function showWizardStep(index) {
  const slides = document.querySelectorAll('.wizard-slide');
  slides.forEach((slide, i) => {
    if (i === index) {
      slide.classList.add('active');
    } else {
      slide.classList.remove('active');
    }
  });
}

// Progress Checklist execution
async function runInitialization(pat, username, publicRepo, privateRepo, cfUrl) {
  const steps = [
    document.getElementById('p-step-1'),
    document.getElementById('p-step-2'),
    document.getElementById('p-step-3'),
    document.getElementById('p-step-4')
  ];

  const resetSteps = () => {
    steps.forEach(step => {
      step.className = 'progress-step';
      step.querySelector('.step-icon').innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="step-icon-svg step-icon-pending"><circle cx="12" cy="12" r="10" stroke-dasharray="4 4"></circle></svg>';
    });
    document.getElementById('init-error-container').style.display = 'none';
    document.getElementById('init-spinner').style.display = 'block';
    document.getElementById('verify-status-title').textContent = translations[currentLang]["init-status"];
  };

  const setStepState = (index, state) => {
    const step = steps[index];
    if (state === 'active') {
      step.className = 'progress-step active';
      step.querySelector('.step-icon').innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="step-icon-svg spinner-mini"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>';
    } else if (state === 'completed') {
      step.className = 'progress-step completed';
      step.querySelector('.step-icon').innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="step-icon-svg" style="color:var(--success-color);"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    } else if (state === 'failed') {
      step.className = 'progress-step failed';
      step.querySelector('.step-icon').innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="step-icon-svg" style="color:var(--danger-color);"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
    }
  };

  resetSteps();
  showWizardStep(2); // Move to slide 3

  // Step 1: connection check and PAT authentication
  setStepState(0, 'active');
  await new Promise(r => setTimeout(r, 600));
  setStepState(0, 'completed');

  // Steps 2 & 3: Run the initialization via background
  setStepState(1, 'active');

  try {
    const res = await bg({
      action: 'INITIALIZE_REPOS',
      pat,
      username,
      publicRepo,
      privateRepo,
      cloudFunctionUrl: cfUrl
    });

    if (res.ok) {
      setStepState(1, 'completed');

      setStepState(2, 'active');
      await new Promise(r => setTimeout(r, 500));
      setStepState(2, 'completed');

      setStepState(3, 'active');
      await new Promise(r => setTimeout(r, 500));
      setStepState(3, 'completed');

      document.getElementById('verify-status-title').textContent = translations[currentLang]["init-success"];
      showToast(translations[currentLang]["toast-setup-success"]);

      setTimeout(async () => {
        showScreen('screen-main');
        await loadSettingsToForm();
        await loadMessages();
      }, 1200);

    } else {
      const err = res.error || '';
      if (err.includes('תמונות') || err.includes('public')) {
        setStepState(1, 'failed');
      } else if (err.includes('אינדקס') || err.includes('private')) {
        setStepState(1, 'completed');
        setStepState(2, 'failed');
      } else {
        setStepState(0, 'failed');
      }
      throw new Error(err || translations[currentLang]["error-unknown-init"]);
    }
  } catch (e) {
    document.getElementById('init-spinner').style.display = 'none';
    document.getElementById('verify-status-title').textContent = translations[currentLang]["init-failed"];
    const errContainer = document.getElementById('init-error-container');
    const errText = document.getElementById('init-error-text');
    errText.textContent = translateError(e.message, currentLang);
    errContainer.style.display = 'block';
  }
}

// ─── Navigation ─────────────────────────────────────────────────────────

function setupNavigation() {
  // Unified tab activation for both text-nav items and icon-nav items
  const allNavItems = () => document.querySelectorAll('.nav-item, .nav-item-icon');

  const activateTab = (targetId) => {
    allNavItems().forEach(n => n.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
    // Mark the nav item that targets this id
    allNavItems().forEach(n => {
      if (n.dataset.target === targetId) n.classList.add('active');
    });
    document.getElementById(targetId).style.display = 'block';
    closeEdit();
  };

  allNavItems().forEach(item => {
    item.addEventListener('click', () => activateTab(item.dataset.target));
  });

  // Welcome screen Start button
  document.getElementById('btn-start-setup').addEventListener('click', async () => {
    // Pre-fill setup inputs from storage if they exist
    const res = await bg({ action: 'GET_SETTINGS' });
    const s = res.settings || {};
    if (s.githubPat) {
      document.getElementById('input-pat').value = s.githubPat;
      setupInfo.pat = s.githubPat;
    }
    if (s.githubOwner) {
      setupInfo.username = s.githubOwner;
    }
    if (s.githubRepo) {
      document.getElementById('input-public-repo').value = s.githubRepo;
      setupInfo.publicRepo = s.githubRepo;
    }
    if (s.githubIndexRepo) {
      document.getElementById('input-private-repo').value = s.githubIndexRepo;
      setupInfo.privateRepo = s.githubIndexRepo;
    }
    if (s.cloudFunctionUrl) {
      document.getElementById('input-cf-url').value = s.cloudFunctionUrl;
    } else {
      document.getElementById('input-cf-url').value = 'https://encrypted-email-image-decoder.cfop33user.workers.dev';
    }

    showScreen('screen-startup');
    showWizardStep(0);
  });
}

// ─── Settings ───────────────────────────────────────────────────────────

function savePartialSettings() {
  const pat = document.getElementById('input-pat').value.trim();
  const publicRepo = document.getElementById('input-public-repo').value.trim();
  const privateRepo = document.getElementById('input-private-repo').value.trim();
  const cfUrl = document.getElementById('input-cf-url').value.trim();

  const settings = {
    githubPat: pat,
    githubOwner: setupInfo.username || '',
    githubRepo: publicRepo,
    githubIndexRepo: privateRepo,
    cloudFunctionUrl: cfUrl
  };
  chrome.storage.local.set({ settings });
}

function setupSettingsHandlers() {
  // Save settings incrementally on input
  document.getElementById('input-pat').addEventListener('input', savePartialSettings);
  document.getElementById('input-public-repo').addEventListener('input', savePartialSettings);
  document.getElementById('input-private-repo').addEventListener('input', savePartialSettings);
  document.getElementById('input-cf-url').addEventListener('input', savePartialSettings);

  // Wizard Slide 1 Next button
  document.getElementById('btn-next-step1').addEventListener('click', async () => {
    const patInput = document.getElementById('input-pat');
    const pat = patInput.value.trim();
    if (!pat) {
      showToast(translations[currentLang]["toast-enter-pat"], 'error');
      return;
    }

    const btn = document.getElementById('btn-next-step1');
    const originalText = btn.textContent;
    btn.textContent = translations[currentLang]["checking"];
    btn.disabled = true;

    try {
      const res = await bg({ action: 'VALIDATE_PAT', pat });
      if (res.ok) {
        setupInfo.pat = pat;
        setupInfo.username = res.username;
        setupInfo.publicRepo = res.defaultPublicRepo || 'email-control-images';
        setupInfo.privateRepo = res.defaultPrivateRepo || 'email-control-index';

        // Prepopulate next slide inputs
        document.getElementById('input-public-repo').value = setupInfo.publicRepo;
        document.getElementById('input-private-repo').value = setupInfo.privateRepo;
        document.getElementById('input-cf-url').value = 'https://encrypted-email-image-decoder.cfop33user.workers.dev';

        // Save to storage incrementally
        savePartialSettings();

        // Show choice container and hide custom container in Slide 2
        document.getElementById('setup-choice-container').style.display = 'flex';
        document.getElementById('setup-custom-container').style.display = 'none';

        // Move to slide 2
        showWizardStep(1);
      } else {
        throw new Error(res.error || translations[currentLang]["toast-pat-invalid"]);
      }
    } catch (e) {
      showToast(translateError(e.message, currentLang), 'error');
    } finally {
      btn.textContent = originalText;
      btn.disabled = false;
    }
  });

  // Wizard Slide 2 back button (from choice container)
  document.getElementById('btn-back-to-step1').addEventListener('click', () => {
    showWizardStep(0);
  });

  // Wizard Slide 2 Default setup button
  document.getElementById('btn-use-default-setup').addEventListener('click', async () => {
    const defaultPublicRepo = 'email-control-images';
    const defaultPrivateRepo = 'email-control-index';
    const defaultCfUrl = 'https://encrypted-email-image-decoder.cfop33user.workers.dev';

    document.getElementById('input-public-repo').value = defaultPublicRepo;
    document.getElementById('input-private-repo').value = defaultPrivateRepo;
    document.getElementById('input-cf-url').value = defaultCfUrl;
    
    // Save to storage
    savePartialSettings();

    await runInitialization(setupInfo.pat, setupInfo.username, defaultPublicRepo, defaultPrivateRepo, defaultCfUrl);
  });

  // Wizard Slide 2 Show Custom setup button
  document.getElementById('btn-show-custom-setup').addEventListener('click', () => {
    document.getElementById('setup-choice-container').style.display = 'none';
    document.getElementById('setup-custom-container').style.display = 'flex';
  });

  // Wizard Slide 2 Back to Choice button (from custom container)
  document.getElementById('btn-back-to-choice').addEventListener('click', () => {
    document.getElementById('setup-custom-container').style.display = 'none';
    document.getElementById('setup-choice-container').style.display = 'flex';
  });

  // Wizard Slide 2 Custom init button (from custom container)
  document.getElementById('btn-init-repos').addEventListener('click', async () => {
    const publicRepo = document.getElementById('input-public-repo').value.trim();
    const privateRepo = document.getElementById('input-private-repo').value.trim();
    const cfUrl = document.getElementById('input-cf-url').value.trim();

    if (!publicRepo || !privateRepo || !cfUrl) {
      showToast(translations[currentLang]["toast-fill-fields"], 'error');
      return;
    }

    const repoNameRegex = /^[a-zA-Z0-9_.-]+$/;
    if (!repoNameRegex.test(publicRepo)) {
      showToast(translations[currentLang]["toast-pub-invalid"], 'error');
      return;
    }
    if (!repoNameRegex.test(privateRepo)) {
      showToast(translations[currentLang]["toast-priv-invalid"], 'error');
      return;
    }

    if (!cfUrl.startsWith('http://') && !cfUrl.startsWith('https://')) {
      showToast(translations[currentLang]["toast-cf-invalid"], 'error');
      return;
    }

    // Save to storage
    savePartialSettings();

    await runInitialization(setupInfo.pat, setupInfo.username, publicRepo, privateRepo, cfUrl);
  });

  // Wizard Slide 3 error retry button
  document.getElementById('btn-retry-init').addEventListener('click', () => {
    showWizardStep(1);
  });

  // Edit / Update settings on Main Screen
  document.getElementById('btn-update-settings').addEventListener('click', async () => {
    const pat = document.getElementById('edit-pat').value.trim();
    const publicRepo = document.getElementById('edit-public-repo').value.trim();
    const privateRepo = document.getElementById('edit-private-repo').value.trim();
    let cloudFunctionUrl = document.getElementById('edit-cf').value.trim();

    if (!pat || !publicRepo || !privateRepo || !cloudFunctionUrl) {
      showToast(translations[currentLang]["toast-fill-fields"], 'error');
      return;
    }

    const repoNameRegex = /^[a-zA-Z0-9_.-]+$/;
    if (!repoNameRegex.test(publicRepo)) {
      showToast(translations[currentLang]["toast-pub-invalid"], 'error');
      return;
    }
    if (!repoNameRegex.test(privateRepo)) {
      showToast(translations[currentLang]["toast-priv-invalid"], 'error');
      return;
    }

    if (!cloudFunctionUrl.startsWith('http://') && !cloudFunctionUrl.startsWith('https://')) {
      showToast(translations[currentLang]["toast-cf-invalid"], 'error');
      return;
    }

    if (cloudFunctionUrl.endsWith('/')) cloudFunctionUrl = cloudFunctionUrl.slice(0, -1);

    const btn = document.getElementById('btn-update-settings');
    const originalText = btn.textContent;
    btn.textContent = translations[currentLang]["saving"];
    btn.disabled = true;

    try {
      const checkRes = await bg({ action: 'VALIDATE_PAT', pat });
      if (!checkRes.ok) throw new Error(checkRes.error || translations[currentLang]["toast-pat-invalid"]);

      const settings = {
        githubPat: pat,
        githubOwner: checkRes.username,
        githubRepo: publicRepo,
        githubIndexRepo: privateRepo,
        cloudFunctionUrl
      };

      const saveRes = await bg({ action: 'SAVE_SETTINGS', settings });
      if (!saveRes.ok) throw new Error(saveRes.error || translations[currentLang]["error-saving-settings"]);

      showToast(translations[currentLang]["toast-settings-success"]);
      await loadSettingsToForm();
    } catch (e) {
      showToast(translateError(e.message, currentLang), 'error');
    } finally {
      btn.textContent = originalText;
      btn.disabled = false;
    }
  });
}

async function loadSettingsToForm() {
  const res = await bg({ action: 'GET_SETTINGS' });
  const s = res.settings || {};
  document.getElementById('edit-pat').value = s.githubPat || '';
  document.getElementById('edit-public-repo').value = s.githubRepo || '';
  document.getElementById('edit-private-repo').value = s.githubIndexRepo || '';
  document.getElementById('edit-cf').value = s.cloudFunctionUrl || '';

  if (s.githubOwner) {
    document.getElementById('settings-info-label').textContent = translations[currentLang]["connected-as"].replace('{owner}', s.githubOwner);
  }
}

// ─── Messages ───────────────────────────────────────────────────────────

async function loadMessages() {
  const list = document.getElementById('msg-list');
  list.innerHTML = `<div class="empty-state">${translations[currentLang]["loading"]}</div>`;

  const res = await bg({ action: 'LOAD_MESSAGES' });
  if (res.ok) {
    currentMessages = res.messages || [];
    renderMessagesList();
  } else {
    list.innerHTML = `<div class="empty-state">${translations[currentLang]["error-loading"]}</div>`;
  }
}

function renderMessagesList() {
  const list = document.getElementById('msg-list');
  if (!currentMessages || !currentMessages.length) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:40px;height:40px;color:rgba(6,182,212,0.4);"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
        </div>
        <div style="font-weight:600;font-family:var(--font-title);color:var(--text-primary);font-size:13px;">${translations[currentLang]["empty-state-title"]}</div>
        <div style="font-size:11px;margin-top:2px;max-width:240px;line-height:1.4;">${translations[currentLang]["empty-state-desc"]}</div>
      </div>
    `;
    return;
  }

  list.innerHTML = currentMessages.map(renderMsg).join('');

  currentMessages.forEach(msg => {
    if (!msg.deleted) {
      document.getElementById(`edit-${msg.id}`)?.addEventListener('click', () => openEdit(msg));
      document.getElementById(`delete-${msg.id}`)?.addEventListener('click', () => confirmDelete(msg));
    }
    document.getElementById(`remove-${msg.id}`)?.addEventListener('click', () => permanentRemove(msg.id));
  });
}

function renderMsg(msg) {
  const locale = currentLang === 'he' ? 'he-IL' : 'en-US';
  const date = new Date(msg.createdAt).toLocaleDateString(locale, { hour: '2-digit', minute: '2-digit' });
  const isDeleted = msg.deleted;
  const preview = (msg.content || '').substring(0, 50) + ((msg.content || '').length > 50 ? '...' : '');

  const editIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z"></path></svg>`;
  const deleteIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;
  const removeIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;

  const toLabel = translations[currentLang]["to"].replace('{recipient}', escapeHtml(msg.recipient || translations[currentLang]["unknown"]));
  const subjectLabel = escapeHtml(msg.subject || translations[currentLang]["no-subject"]);
  const previewLabel = isDeleted ? `<em>${translations[currentLang]["deleted-msg"]}</em>` : escapeHtml(preview);

  return `
    <div class="msg-card ${isDeleted ? 'deleted' : ''}" id="card-${msg.id}">
      <div class="msg-header">
        <div class="msg-recipient">${toLabel}</div>
        <div class="msg-date">${date}</div>
      </div>
      <div class="msg-subject">${subjectLabel}</div>
      <div class="msg-preview">${previewLabel}</div>
      
      <div class="msg-actions">
        ${!isDeleted ? `
          <button class="btn btn-secondary btn-sm" id="edit-${msg.id}">${editIcon} ${translations[currentLang]["btn-edit"]}</button>
          <button class="btn btn-danger btn-sm" id="delete-${msg.id}">${deleteIcon} ${translations[currentLang]["btn-delete"]}</button>
        ` : ''}
          <button class="btn btn-secondary btn-sm" id="remove-${msg.id}" style="color:var(--text-secondary)">${removeIcon} ${translations[currentLang]["btn-remove"]}</button>
      </div>
    </div>
  `;
}

// ─── Edit & Delete ──────────────────────────────────────────────────────

function openEdit(msg) {
  editingMsgId = msg.id;
  const editPanel = document.getElementById('edit-panel');
  const textarea = document.getElementById('edit-textarea');
  textarea.value = msg.content || '';
  editPanel.style.display = 'block';
  textarea.focus();

  document.getElementById('btn-save-edit').onclick = saveEdit;
  document.getElementById('btn-cancel-edit').onclick = closeEdit;
}

function closeEdit() {
  editingMsgId = null;
  document.getElementById('edit-panel').style.display = 'none';
  document.getElementById('edit-textarea').value = '';
}

async function saveEdit() {
  const content = document.getElementById('edit-textarea').value.trim();
  if (!content) { showToast(translations[currentLang]["toast-empty-content"], 'error'); return; }

  const btn = document.getElementById('btn-save-edit');
  btn.disabled = true;
  btn.textContent = translations[currentLang]["saving-cf"];

  const pngBase64 = textToPngBase64(content);
  const res = await bg({ action: 'EDIT_MESSAGE', msgId: editingMsgId, content, pngBase64 });

  btn.disabled = false;
  btn.textContent = translations[currentLang]["edit-panel-save"];

  if (res.ok) {
    showToast(translations[currentLang]["toast-edit-success"]);
    closeEdit();
    loadMessages();
  } else {
    showToast((currentLang === 'he' ? 'שגיאה: ' : 'Error: ') + translateError(res.error, currentLang), 'error');
  }
}

async function confirmDelete(msg) {
  const promptText = currentLang === 'he'
    ? 'האם אתה בטוח שברצונך למחוק את תוכן ההודעה? פעולה זו תחליף את תוכן האימייל בתמונת מחיקה.'
    : 'Are you sure you want to delete this message content? This will replace the email content with a deletion notice.';

  if (!confirm(promptText)) return;

  const btn = document.getElementById(`delete-${msg.id}`);
  const originalText = btn.textContent;
  btn.textContent = translations[currentLang]["deleting"];
  btn.disabled = true;

  const deletedPng = textToPngBase64(translations[currentLang]["system-msg-deleted"], true);
  const deletedText = translations[currentLang]["system-msg-deleted"];
  const res = await bg({ action: 'DELETE_MESSAGE', msgId: msg.id, deletedPng, deletedText });

  if (res.ok) {
    showToast(translations[currentLang]["toast-delete-success"]);
    loadMessages();
  } else {
    btn.textContent = originalText;
    btn.disabled = false;
    showToast((currentLang === 'he' ? 'שגיאה: ' : 'Error: ') + translateError(res.error, currentLang), 'error');
  }
}

async function permanentRemove(msgId) {
  const promptText = currentLang === 'he'
    ? 'האם אתה בטוח שברצונך להסיר הודעה זו מרשימת המעקב? לא תוכל לערוך או למחוק אותה שוב בעתיד.'
    : 'Are you sure you want to remove this message from tracking? You will not be able to edit or delete it in the future.';

  if (!confirm(promptText)) return;

  const res = await bg({ action: 'PERMANENT_DELETE', msgId });
  if (res.ok) {
    document.getElementById(`card-${msgId}`).remove();
    showToast(translations[currentLang]["toast-remove-success"]);
  }
}

// ─── Utils ──────────────────────────────────────────────────────────────

function escapeHtml(str) {
  return str.replace(/[&<>'"]/g,
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

function textToPngBase64(text, isSystem = false) {
  const fontSize = 14;
  const lineH = 22;
  const padV = 16;
  const padH = 16;
  const width = 600;
  const maxW = width - padH * 2;

  const measure = document.createElement('canvas').getContext('2d');
  measure.font = fontSize + 'px Arial, Helvetica, sans-serif';

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

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = padV * 2 + wrappedLines.length * lineH;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.font = (isSystem ? 'italic ' : '') + fontSize + 'px Arial, Helvetica, sans-serif';
  ctx.fillStyle = isSystem ? '#757575' : '#1c1e21';

  // Detect language and adjust drawing direction
  const hasHebrew = /[\u0590-\u05FF]/.test(text || '');
  ctx.direction = hasHebrew ? 'rtl' : 'ltr';
  ctx.textAlign = hasHebrew ? 'right' : 'left';

  wrappedLines.forEach((line, i) => {
    const x = hasHebrew ? (width - padH) : padH;
    ctx.fillText(line || ' ', x, padV + (i + 1) * lineH - 5);
  });

  return canvas.toDataURL('image/png').split(',')[1];
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
