// Private Local-Only App-to-AI-Studio Connector
// Stores all connected links and local HTML apps strictly inside the user's device
// (localStorage + IndexedDB). Never uploads or publishes any user link to any server.

(function () {
    'use strict';

    const VAULT_STORAGE_KEY = 'parwarda_private_aistudio_vault_v1';
    const PIN_META_KEY = 'parwarda_private_aistudio_pin_v1';
    const IDB_NAME = 'ParwardaPrivateAiAppsDB';
    const IDB_STORE = 'htmlApps';

    const CATEGORY_META = {
        aistudio: { label: 'پرۆژێ AI Studio', icon: 'fa-cubes' },
        study: { label: 'وانە و فێربوون', icon: 'fa-graduation-cap' },
        tool: { label: 'ئامراز و حاسیبە', icon: 'fa-tools' },
        personal: { label: 'بەرنامێ تایبەت', icon: 'fa-shield-alt' }
    };

    // State
    let currentMode = 'url'; // 'url' | 'html'
    let selectedHtmlContent = '';
    let selectedHtmlFileName = '';
    let vaultItems = []; // In-memory decrypted list when unlocked
    let activeCryptoKey = null; // CryptoKey when PIN lock is enabled and unlocked
    let globalRevealUrls = false;
    const revealedItemIds = new Set();

    // DOM references
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const lockScreen = document.getElementById('vault-lock-screen');
    const mainContent = document.getElementById('vault-main-content');
    const unlockForm = document.getElementById('vault-unlock-form');
    const unlockPinInput = document.getElementById('vault-unlock-pin');
    const unlockErrorBox = document.getElementById('unlock-error-box');

    const modeTabs = document.querySelectorAll('.ai-mode-tab');
    const modeUrlFields = document.getElementById('mode-url-fields');
    const modeHtmlFields = document.getElementById('mode-html-fields');
    const connectForm = document.getElementById('ai-connect-form');
    const appNameInput = document.getElementById('connect-app-name');
    const appUrlInput = document.getElementById('connect-app-url');
    const pasteUrlBtn = document.getElementById('btn-paste-url');
    const htmlFileInput = document.getElementById('connect-html-file');
    const htmlFilenameLabel = document.getElementById('connect-html-filename');
    const appCategorySelect = document.getElementById('connect-app-category');
    const connectAlertBox = document.getElementById('connect-alert-box');

    const vaultGrid = document.getElementById('vault-items-grid');
    const vaultCountLabel = document.getElementById('vault-count-label');
    const toggleAllMasksBtn = document.getElementById('btn-toggle-all-masks');

    const pinStatusText = document.getElementById('pin-status-text');
    const setupPinBtn = document.getElementById('btn-setup-pin');
    const setupPinLabel = document.getElementById('btn-setup-pin-label');
    const lockNowBtn = document.getElementById('btn-lock-now');
    const removePinBtn = document.getElementById('btn-remove-pin');
    const exportBackupBtn = document.getElementById('btn-export-local-backup');
    const importBackupInput = document.getElementById('import-local-backup-input');
    const wipeVaultBtn = document.getElementById('btn-wipe-vault');

    // Modals
    const pinModal = document.getElementById('pin-setup-modal');
    const closePinModalBtn = document.getElementById('close-pin-modal-btn');
    const pinSetupForm = document.getElementById('pin-setup-form');
    const newPinInput = document.getElementById('new-pin-input');
    const confirmPinInput = document.getElementById('confirm-pin-input');
    const pinModalError = document.getElementById('pin-modal-error');

    const editConnModal = document.getElementById('edit-connection-modal');
    const closeEditConnModalBtn = document.getElementById('close-edit-conn-modal-btn');
    const editConnForm = document.getElementById('edit-connection-form');
    const editConnIdInput = document.getElementById('edit-conn-id');
    const editConnNameInput = document.getElementById('edit-conn-name');
    const editConnUrlWrap = document.getElementById('edit-conn-url-wrap');
    const editConnUrlInput = document.getElementById('edit-conn-url');
    const editConnCategorySelect = document.getElementById('edit-conn-category');

    const confirmWipeModal = document.getElementById('confirm-wipe-modal');
    const confirmWipeYesBtn = document.getElementById('confirm-wipe-yes-btn');
    const confirmWipeNoBtn = document.getElementById('confirm-wipe-no-btn');

    const localViewerModal = document.getElementById('local-html-viewer-modal');
    const localViewerTitle = document.getElementById('local-viewer-title');
    const localViewerIframe = document.getElementById('local-viewer-iframe');
    const closeLocalViewerBtn = document.getElementById('close-local-viewer-btn');

    // Quick Masked Link & Test Card Refs
    const quickSecretInput = document.getElementById('quick-secret-link-input');
    const quickToggleEyeBtn = document.getElementById('quick-toggle-eye-btn');
    const quickClearBtn = document.getElementById('quick-clear-btn');
    const quickTestSaveBtn = document.getElementById('quick-test-save-btn');
    const quickTestResult = document.getElementById('quick-test-result');
    const quickLaunchSavedLink = document.getElementById('quick-launch-saved-link');
    const quickCardStatus = document.getElementById('quick-card-status');

    // =========================================================================
    // 1. THEME INITIALIZATION
    // =========================================================================
    function applyTheme(theme) {
        const next = theme === 'dark' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', next);
        if (themeToggleBtn) {
            themeToggleBtn.innerHTML = next === 'dark'
                ? '<i class="fas fa-sun"></i>'
                : '<i class="fas fa-moon"></i>';
        }
    }

    const savedTheme = localStorage.getItem('userTheme');
    if (savedTheme) {
        applyTheme(savedTheme);
    } else {
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        applyTheme(prefersDark ? 'dark' : 'light');
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const cur = document.documentElement.getAttribute('data-theme') || 'light';
            const next = cur === 'dark' ? 'light' : 'dark';
            localStorage.setItem('userTheme', next);
            applyTheme(next);
        });
    }

    // =========================================================================
    // 2. TOAST & INLINE ALERTS
    // =========================================================================
    function showToast(message, type) {
        const container = document.getElementById('app-toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = `app-toast ${type || 'info'}`;
        const icon = type === 'success' ? 'fa-check-circle' : (type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle');
        const color = type === 'success' ? '#10b981' : (type === 'error' ? '#ef4444' : '#2563eb');
        toast.innerHTML = `<i class="fas ${icon}" style="font-size:1.2rem; color:${color}; flex-shrink:0;"></i><span></span>`;
        toast.querySelector('span').textContent = message;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(12px)';
            toast.style.transition = 'all 0.25s ease';
            setTimeout(() => toast.remove(), 260);
        }, 3500);
    }

    function showAlert(el, message, type) {
        if (!el) return;
        if (!message) {
            el.style.display = 'none';
            el.textContent = '';
            return;
        }
        el.className = `ai-inline-alert ${type || 'error'}`;
        el.textContent = message;
        el.style.display = 'flex';
    }

    // =========================================================================
    // 3. URL VALIDATION & MASKING
    // =========================================================================
    function normalizeAndValidateUrl(raw) {
        let val = String(raw || '').trim();
        if (!val) return '';
        if (!/^https?:\/\//i.test(val)) {
            if (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(val)) {
                val = 'https://' + val;
            } else {
                return '';
            }
        }
        try {
            const parsed = new URL(val);
            if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
                return '';
            }
            return parsed.href;
        } catch (e) {
            return '';
        }
    }

    function maskUrlDisplay(url) {
        try {
            const parsed = new URL(url);
            return `${parsed.protocol}//${parsed.hostname}/••••••••••••`;
        } catch (e) {
            return '••••••••••••••••••••••••';
        }
    }

    function formatDateKu(ts) {
        try {
            const d = new Date(ts || Date.now());
            return d.toLocaleDateString('en-GB');
        } catch (e) {
            return '';
        }
    }

    // =========================================================================
    // 4. INDEXEDDB STORAGE FOR LOCAL HTML APPS (DEVICE-ONLY)
    // =========================================================================
    function openAppDb() {
        return new Promise((resolve, reject) => {
            if (!window.indexedDB) {
                reject(new Error('IndexedDB unavailable'));
                return;
            }
            const req = window.indexedDB.open(IDB_NAME, 1);
            req.onupgradeneeded = (ev) => {
                const db = ev.target.result;
                if (!db.objectStoreNames.contains(IDB_STORE)) {
                    db.createObjectStore(IDB_STORE, { keyPath: 'id' });
                }
            };
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error || new Error('Failed to open local DB'));
        });
    }

    async function saveLocalHtmlApp(id, html) {
        const db = await openAppDb();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(IDB_STORE, 'readwrite');
            tx.objectStore(IDB_STORE).put({ id, html, updatedAt: Date.now() });
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => reject(tx.error);
        });
    }

    async function getLocalHtmlApp(id) {
        const db = await openAppDb();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(IDB_STORE, 'readonly');
            const req = tx.objectStore(IDB_STORE).get(id);
            req.onsuccess = () => resolve(req.result ? req.result.html : '');
            req.onerror = () => reject(req.error);
        });
    }

    async function deleteLocalHtmlApp(id) {
        try {
            const db = await openAppDb();
            return new Promise((resolve) => {
                const tx = db.transaction(IDB_STORE, 'readwrite');
                tx.objectStore(IDB_STORE).delete(id);
                tx.oncomplete = () => resolve(true);
                tx.onerror = () => resolve(false);
            });
        } catch (e) {
            return false;
        }
    }

    async function clearAllLocalHtmlApps() {
        try {
            const db = await openAppDb();
            return new Promise((resolve) => {
                const tx = db.transaction(IDB_STORE, 'readwrite');
                tx.objectStore(IDB_STORE).clear();
                tx.oncomplete = () => resolve(true);
                tx.onerror = () => resolve(false);
            });
        } catch (e) {
            return false;
        }
    }

    // =========================================================================
    // 5. WEB CRYPTO AES-GCM ENCRYPTION & PIN LOCK (DEVICE-ONLY)
    // =========================================================================
    function bytesToBase64(bytes) {
        let bin = '';
        for (let i = 0; i < bytes.length; i++) {
            bin += String.fromCharCode(bytes[i]);
        }
        return btoa(bin);
    }

    function base64ToBytes(b64) {
        const bin = atob(b64);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) {
            bytes[i] = bin.charCodeAt(i);
        }
        return bytes;
    }

    function getPinMeta() {
        try {
            const raw = localStorage.getItem(PIN_META_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    async function sha256Hex(text) {
        const enc = new TextEncoder().encode(text);
        const digest = await window.crypto.subtle.digest('SHA-256', enc);
        return Array.from(new Uint8Array(digest))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    async function deriveAesKey(pin, saltB64) {
        const keyMaterial = await window.crypto.subtle.importKey(
            'raw',
            new TextEncoder().encode(pin),
            { name: 'PBKDF2' },
            false,
            ['deriveKey']
        );
        return window.crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: base64ToBytes(saltB64),
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        );
    }

    async function encryptVaultPayload(items, key) {
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const plaintext = new TextEncoder().encode(JSON.stringify(items));
        const ciphertext = await window.crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            key,
            plaintext
        );
        return {
            encrypted: true,
            iv: bytesToBase64(iv),
            data: bytesToBase64(new Uint8Array(ciphertext))
        };
    }

    async function decryptVaultPayload(envelope, key) {
        const iv = base64ToBytes(envelope.iv);
        const data = base64ToBytes(envelope.data);
        const decrypted = await window.crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            key,
            data
        );
        const json = new TextDecoder().decode(decrypted);
        const parsed = JSON.parse(json);
        return Array.isArray(parsed) ? parsed : [];
    }

    async function persistVault() {
        const pinMeta = getPinMeta();
        if (pinMeta && pinMeta.enabled && activeCryptoKey && window.crypto && window.crypto.subtle) {
            const envelope = await encryptVaultPayload(vaultItems, activeCryptoKey);
            localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(envelope));
        } else {
            localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify({ encrypted: false, items: vaultItems }));
        }
    }

    function readRawVaultEnvelope() {
        try {
            const raw = localStorage.getItem(VAULT_STORAGE_KEY);
            if (!raw) return { encrypted: false, items: [] };
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) return { encrypted: false, items: parsed };
            return parsed;
        } catch (e) {
            return { encrypted: false, items: [] };
        }
    }

    // =========================================================================
    // 6. SAFE GEMINI BRIDGE FOR LOCAL AI STUDIO HTML APPS
    // =========================================================================
    async function prepareLocalHtmlWithSafeBridge(rawHtml) {
        if (!rawHtml || typeof rawHtml !== 'string') return '';
        let proxyReady = false;
        try {
            const res = await fetch('/api/gemini/status', { method: 'GET', cache: 'no-store' });
            const data = await res.json().catch(() => null);
            proxyReady = Boolean(res.ok && data && data.ready === true);
        } catch (e) {
            proxyReady = false;
        }
        if (!proxyReady || rawHtml.indexOf('data-parwarda-gemini-bridge') !== -1) {
            return rawHtml;
        }
        const safeOrigin = JSON.stringify(window.location.origin);
        const wsOrigin = JSON.stringify(window.location.origin.replace(/^http:/i, 'ws:').replace(/^https:/i, 'wss:'));
        const bridge = `<script data-parwarda-gemini-bridge="1">
(function(){
  try {
    var ORIGIN = ${safeOrigin};
    var WS_ORIGIN = ${wsOrigin};
    var PROXY_TOKEN = 'server-proxy';
    function dispatchProxyToken() {
      try {
        var targetOrigin = (window.location.origin && window.location.origin !== 'null') ? window.location.origin : '*';
        window.postMessage({ type: 'SET_API_KEY', apiKey: PROXY_TOKEN }, targetOrigin);
      } catch (e) {
        try {
          window.postMessage({ type: 'SET_API_KEY', apiKey: PROXY_TOKEN }, '*');
        } catch (err) {}
      }
    }
    var origGetItem = Storage.prototype.getItem;
    Storage.prototype.getItem = function(key) {
      var val = origGetItem.call(this, key);
      if (!val && (key === 'gk' || key === 'gk2')) return PROXY_TOKEN;
      return val;
    };
    var origFetch = window.fetch;
    if (typeof origFetch === 'function') {
      window.fetch = function(input, init) {
        var urlStr = typeof input === 'string' ? input : (input && input.url ? input.url : '');
        if (/^https:\\/\\/generativelanguage\\.googleapis\\.com\\/v1beta\\/models\\//i.test(urlStr)) {
          var rest = urlStr.replace(/^https:\\/\\/generativelanguage\\.googleapis\\.com\\/v1beta\\//i, '');
          var nextUrl = ORIGIN + '/api/gemini/v1beta/' + rest;
          var nextInit = Object.assign({}, init || {});
          if (nextInit.headers) {
            var cleaned = {};
            if (typeof Headers !== 'undefined' && nextInit.headers instanceof Headers) {
              nextInit.headers.forEach(function(v, k){ if (k.toLowerCase() !== 'x-goog-api-key') cleaned[k] = v; });
            } else {
              Object.keys(nextInit.headers).forEach(function(k){ if (k.toLowerCase() !== 'x-goog-api-key') cleaned[k] = nextInit.headers[k]; });
            }
            nextInit.headers = cleaned;
          }
          return origFetch.call(window, nextUrl, nextInit);
        }
        return origFetch.apply(window, arguments);
      };
    }
    var OrigWS = window.WebSocket;
    if (typeof OrigWS === 'function') {
      var WrappedWS = function(url, protocols) {
        var urlStr = String(url || '');
        if (/^wss:\\/\\/generativelanguage\\.googleapis\\.com\\/ws\\//i.test(urlStr)) {
          var proxiedWsUrl = WS_ORIGIN + '/api/gemini/live';
          return protocols ? new OrigWS(proxiedWsUrl, protocols) : new OrigWS(proxiedWsUrl);
        }
        return protocols ? new OrigWS(url, protocols) : new OrigWS(url);
      };
      WrappedWS.prototype = OrigWS.prototype;
      WrappedWS.CONNECTING = OrigWS.CONNECTING;
      WrappedWS.OPEN = OrigWS.OPEN;
      WrappedWS.CLOSING = OrigWS.CLOSING;
      WrappedWS.CLOSED = OrigWS.CLOSED;
      window.WebSocket = WrappedWS;
    }
    document.addEventListener('DOMContentLoaded', dispatchProxyToken);
    window.addEventListener('load', dispatchProxyToken);
  } catch (e) {}
})();
</script>`;

        if (/<head[^>]*>/i.test(rawHtml)) {
            return rawHtml.replace(/<head[^>]*>/i, (m) => `${m}\n${bridge}`);
        }
        return `${bridge}\n${rawHtml}`;
    }

    // =========================================================================
    // 7. RENDER VAULT ITEMS & SECURITY STATUS
    // =========================================================================
    function updatePinControlsUI() {
        const pinMeta = getPinMeta();
        const hasPin = Boolean(pinMeta && pinMeta.enabled);

        if (setupPinLabel) {
            setupPinLabel.textContent = hasPin ? 'گوهۆرینا قوفلێ PIN' : 'دانانا قوفلێ PIN';
        }
        if (lockNowBtn) {
            lockNowBtn.style.display = hasPin ? 'inline-flex' : 'none';
        }
        if (removePinBtn) {
            removePinBtn.style.display = hasPin ? 'inline-flex' : 'none';
        }
        if (pinStatusText) {
            pinStatusText.textContent = hasPin
                ? 'قوفلێ PIN چالاکە: هەمی لینکێن تە ب AES-256 دناڤ موبائیلێ تە دا شفرەکرینە و پاراستینە.'
                : 'دشێی کۆدێ نهێنی (PIN) لسەر ڤی لاپەڕی دانی داکو لینکێن تە ب AES-256 دناڤ موبائیلێ دا بهێنە قوفلکرن.';
        }
    }

    function syncQuickCardFromVault() {
        const primary = vaultItems.find(x => x.id === 'primary_quick_link') || vaultItems.find(x => x.type === 'url');
        if (quickSecretInput) {
            quickSecretInput.value = primary ? primary.url : '';
            quickSecretInput.type = 'password';
        }
        if (quickToggleEyeBtn) {
            quickToggleEyeBtn.innerHTML = '<i class="fas fa-eye"></i>';
        }
        if (quickLaunchSavedLink) {
            if (primary && primary.url) {
                quickLaunchSavedLink.href = primary.url;
                quickLaunchSavedLink.style.display = 'inline-flex';
            } else {
                quickLaunchSavedLink.href = '#';
                quickLaunchSavedLink.style.display = 'none';
            }
        }
        if (quickCardStatus) {
            quickCardStatus.innerHTML = primary
                ? '<i class="fas fa-shield-alt"></i><span>لینکێ تە دناڤ موبائیلێ دا پاراستی یە</span>'
                : '<i class="fas fa-shield-alt"></i><span>خەزنکرنا تایبەت دناڤ موبائیلێ دا چالاکە</span>';
        }
    }

    function renderVaultItems() {
        syncQuickCardFromVault();
        if (!vaultGrid || !vaultCountLabel) return;

        vaultCountLabel.textContent = `${vaultItems.length} بەرنامە خەزنکرینە`;

        if (vaultItems.length === 0) {
            vaultGrid.innerHTML = `
                <div style="grid-column:1 / -1; text-align:center; padding:32px 16px; background:var(--background-color); border:1px dashed var(--border-color); border-radius:14px; color:var(--secondary-text);">
                    <i class="fas fa-shield-alt" style="font-size:2rem; color:var(--blue-accent); margin-bottom:10px; display:block;"></i>
                    <strong style="display:block; color:var(--primary-text); margin-bottom:6px;">هێشتا چ بەرنامە نەهاتینە گرێدان</strong>
                    <span style="font-size:0.86rem;">ل سەری لینکێ بەرنامێ خۆ یێ AI Studio بنڤیسە یان فایلێ HTML هەلبژێرە دا تنێ دناڤ موبائیلێ تە دا خەزن ببیتن.</span>
                </div>
            `;
            return;
        }

        vaultGrid.innerHTML = vaultItems.map(item => {
            const cat = CATEGORY_META[item.category] || CATEGORY_META.aistudio;
            const isHtml = item.type === 'html';
            const isRevealed = globalRevealUrls || revealedItemIds.has(item.id);
            const urlPreview = isHtml
                ? `فایلێ پاراستی د موبائیلێ دا (${item.fileName || 'app.html'})`
                : (isRevealed ? item.url : maskUrlDisplay(item.url));
            const dateStr = formatDateKu(item.createdAt);

            return `
                <article class="ai-vault-card" data-item-id="${escapeAttr(item.id)}">
                    <div class="ai-vault-card-top">
                        <div style="display:flex; align-items:center; gap:12px; min-width:0;">
                            <div class="ai-vault-icon">
                                <i class="fas ${isHtml ? 'fa-file-code' : cat.icon}"></i>
                            </div>
                            <div style="min-width:0;">
                                <h3 style="margin:0 0 3px; font-size:1rem; color:var(--primary-text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                                    ${escapeHtml(item.name)}
                                </h3>
                                <div style="font-size:0.78rem; color:var(--secondary-text);">
                                    <span>${escapeHtml(cat.label)}</span>
                                    <span aria-hidden="true"> · </span>
                                    <span>تایبەت د موبائیلێ دا</span>
                                    ${dateStr ? `<span aria-hidden="true"> · </span><span>${escapeHtml(dateStr)}</span>` : ''}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="ai-vault-url-box" title="${isHtml ? 'فایلێ پاراستی' : (isRevealed ? escapeAttr(item.url) : 'لینک یێ پاراستی یە')}">
                        ${escapeHtml(urlPreview)}
                    </div>

                    <div class="ai-vault-actions">
                        ${isHtml ? `
                            <button type="button" class="ai-primary-cta" data-action="launch-html" data-id="${escapeAttr(item.id)}" style="flex:1;">
                                <i class="fas fa-play"></i>
                                <span>ڤەکرنا بەرنامەی</span>
                            </button>
                        ` : `
                            <a href="${escapeAttr(item.url)}" target="_blank" rel="noopener noreferrer" class="ai-primary-cta" style="flex:1;">
                                <i class="fas fa-external-link-alt"></i>
                                <span>ڤەکرنا بەرنامەی</span>
                            </a>
                            <button type="button" class="ai-secondary-btn" data-action="toggle-mask" data-id="${escapeAttr(item.id)}" title="نیشاندان / ڤەشارتن">
                                <i class="fas ${isRevealed ? 'fa-eye-slash' : 'fa-eye'}"></i>
                            </button>
                            <button type="button" class="ai-secondary-btn" data-action="copy-url" data-id="${escapeAttr(item.id)}" title="کۆپیکرنا لینکێ">
                                <i class="fas fa-copy"></i>
                            </button>
                        `}
                        <button type="button" class="ai-secondary-btn" data-action="edit" data-id="${escapeAttr(item.id)}" title="دەستکاری">
                            <i class="fas fa-pen"></i>
                        </button>
                        <button type="button" class="ai-danger-btn" data-action="delete" data-id="${escapeAttr(item.id)}" title="ژێبرن">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </article>
            `;
        }).join('');
    }

    function escapeHtml(str) {
        return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function escapeAttr(str) {
        return escapeHtml(str);
    }

    // =========================================================================
    // 8. INITIALIZATION & PIN LOCK GATE
    // =========================================================================
    async function initVault() {
        updatePinControlsUI();
        const pinMeta = getPinMeta();
        const envelope = readRawVaultEnvelope();

        if (pinMeta && pinMeta.enabled && window.crypto && window.crypto.subtle) {
            if (lockScreen) lockScreen.style.display = 'block';
            if (mainContent) mainContent.style.display = 'none';
        } else {
            vaultItems = Array.isArray(envelope.items) ? envelope.items : [];
            if (lockScreen) lockScreen.style.display = 'none';
            if (mainContent) mainContent.style.display = 'block';
            renderVaultItems();
        }
    }

    if (unlockForm) {
        unlockForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            showAlert(unlockErrorBox, '', 'error');
            const pin = unlockPinInput ? unlockPinInput.value.trim() : '';
            const pinMeta = getPinMeta();
            if (!pin || !pinMeta) return;

            try {
                const candidateHash = await sha256Hex(`${pinMeta.salt}:${pin}`);
                if (candidateHash !== pinMeta.verifier) {
                    showAlert(unlockErrorBox, 'کۆدێ PIN خەلەتە، دووبارە هەول بدە.', 'error');
                    return;
                }
                activeCryptoKey = await deriveAesKey(pin, pinMeta.salt);
                const envelope = readRawVaultEnvelope();
                if (envelope && envelope.encrypted && envelope.iv && envelope.data) {
                    vaultItems = await decryptVaultPayload(envelope, activeCryptoKey);
                } else {
                    vaultItems = Array.isArray(envelope.items) ? envelope.items : [];
                    await persistVault();
                }

                if (unlockPinInput) unlockPinInput.value = '';
                if (lockScreen) lockScreen.style.display = 'none';
                if (mainContent) mainContent.style.display = 'block';
                renderVaultItems();
                updatePinControlsUI();
            } catch (err) {
                showAlert(unlockErrorBox, 'نەشیا قوفلی ڤەکەت، کۆدێ PIN ب دروستی بنڤیسە.', 'error');
            }
        });
    }

    // =========================================================================
    // 9. MODE TABS, PASTE, FILE PICKER & SAVE CONNECTION
    // =========================================================================
    modeTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const nextMode = tab.getAttribute('data-connect-mode') || 'url';
            currentMode = nextMode;
            modeTabs.forEach(t => {
                const active = t === tab;
                t.classList.toggle('active', active);
                t.setAttribute('aria-selected', active ? 'true' : 'false');
            });
            if (modeUrlFields) modeUrlFields.style.display = nextMode === 'url' ? 'block' : 'none';
            if (modeHtmlFields) modeHtmlFields.style.display = nextMode === 'html' ? 'block' : 'none';
            showAlert(connectAlertBox, '', 'error');
        });
    });

    if (pasteUrlBtn && appUrlInput) {
        pasteUrlBtn.addEventListener('click', async () => {
            try {
                if (!navigator.clipboard || !navigator.clipboard.readText) {
                    showToast('ل ڤێرە کلیک بکە و پەیست بکە (Paste).', 'info');
                    appUrlInput.focus();
                    return;
                }
                const text = await navigator.clipboard.readText();
                if (text && text.trim()) {
                    appUrlInput.value = text.trim();
                    showToast('لینک ب سەرکەفتوویی هاتە پەیستکرن.', 'success');
                } else {
                    showToast('چ لینکەک د کلیپبۆردێ دا نەبوو.', 'info');
                }
            } catch (e) {
                appUrlInput.focus();
                showToast('تکایە لینکێ د خانەیا سەری دا پەیست بکە.', 'info');
            }
        });
    }

    if (htmlFileInput) {
        htmlFileInput.addEventListener('change', (e) => {
            const file = e.target.files && e.target.files[0];
            if (!file) return;
            selectedHtmlFileName = file.name;
            if (htmlFilenameLabel) htmlFilenameLabel.textContent = `هاتە هەلبژارتن: ${file.name}`;
            if (appNameInput && !appNameInput.value.trim()) {
                appNameInput.value = file.name.replace(/\.(html|htm)$/i, '');
            }
            const reader = new FileReader();
            reader.onload = (ev) => {
                selectedHtmlContent = String(ev.target.result || '');
            };
            reader.readAsText(file);
        });
    }

    if (connectForm) {
        connectForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            showAlert(connectAlertBox, '', 'error');

            const name = appNameInput ? appNameInput.value.trim() : '';
            const category = appCategorySelect ? appCategorySelect.value : 'aistudio';

            if (!name) {
                showAlert(connectAlertBox, 'تکایە ناڤێ بەرنامێ خۆ بنڤیسە.', 'error');
                return;
            }

            const newId = 'ai_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);

            if (currentMode === 'url') {
                const rawUrl = appUrlInput ? appUrlInput.value : '';
                const cleanUrl = normalizeAndValidateUrl(rawUrl);
                if (!cleanUrl) {
                    showAlert(connectAlertBox, 'تکایە لینکەکێ دروست بنڤیسە (وەک https://aistudio.google.com/...).', 'error');
                    return;
                }

                vaultItems.unshift({
                    id: newId,
                    type: 'url',
                    name,
                    url: cleanUrl,
                    category,
                    createdAt: Date.now()
                });

                await persistVault();
                if (appNameInput) appNameInput.value = '';
                if (appUrlInput) appUrlInput.value = '';
                renderVaultItems();
                showAlert(connectAlertBox, 'بەرنامێ تە ب سەرکەفتوویی دناڤ موبائیلێ تە دا هاتە رەبتکرن و پاراستن.', 'success');
                showToast('ب سەرکەفتوویی د موبائیلێ دا خەزن بوو (ناهێتە بەلاڤکرن).', 'success');
            } else {
                if (!selectedHtmlContent) {
                    showAlert(connectAlertBox, 'تکایە فایلێ HTML ژ موبائیلێ هەلبژێرە.', 'error');
                    return;
                }
                try {
                    await saveLocalHtmlApp(newId, selectedHtmlContent);
                    vaultItems.unshift({
                        id: newId,
                        type: 'html',
                        name,
                        fileName: selectedHtmlFileName || 'app.html',
                        category,
                        createdAt: Date.now()
                    });
                    await persistVault();

                    selectedHtmlContent = '';
                    selectedHtmlFileName = '';
                    if (appNameInput) appNameInput.value = '';
                    if (htmlFileInput) htmlFileInput.value = '';
                    if (htmlFilenameLabel) htmlFilenameLabel.textContent = 'کلیک بکە بۆ هەلبژارتنا فایلێ (.html)';
                    renderVaultItems();
                    showAlert(connectAlertBox, 'فایلێ بەرنامێ تە تنێ دناڤ موبائیلێ دا هاتە خەزنکرن و پاراستن.', 'success');
                    showToast('فایل ب شێوەیەکێ تایبەت د موبائیلێ دا خەزن بوو.', 'success');
                } catch (err) {
                    showAlert(connectAlertBox, 'نەشیا فایلی دناڤ موبائیلێ دا خەزن بکەت.', 'error');
                }
            }
        });
    }

    // =========================================================================
    // 10. VAULT CARD ACTIONS (MASK, COPY, LAUNCH HTML, EDIT, DELETE)
    // =========================================================================
    if (toggleAllMasksBtn) {
        toggleAllMasksBtn.addEventListener('click', () => {
            globalRevealUrls = !globalRevealUrls;
            if (!globalRevealUrls) revealedItemIds.clear();
            renderVaultItems();
        });
    }

    if (vaultGrid) {
        vaultGrid.addEventListener('click', async (e) => {
            const btn = e.target.closest('button[data-action]');
            if (!btn) return;
            const action = btn.getAttribute('data-action');
            const id = btn.getAttribute('data-id');
            const item = vaultItems.find(x => x.id === id);
            if (!item) return;

            if (action === 'toggle-mask') {
                if (revealedItemIds.has(id)) {
                    revealedItemIds.delete(id);
                } else {
                    revealedItemIds.add(id);
                }
                renderVaultItems();
            } else if (action === 'copy-url') {
                try {
                    await navigator.clipboard.writeText(item.url);
                    showToast('لینک هاتە کۆپیکرن.', 'success');
                } catch (err) {
                    showToast('نەشیا کۆپی بکەت، کلیک لسەر نیشاندان بکە.', 'info');
                }
            } else if (action === 'launch-html') {
                try {
                    const html = await getLocalHtmlApp(id);
                    if (!html) {
                        showToast('فایلێ بەرنامەی د موبائیلێ دا نەهاتە دیتن.', 'error');
                        return;
                    }
                    const prepared = await prepareLocalHtmlWithSafeBridge(html);
                    if (localViewerTitle) localViewerTitle.textContent = item.name;
                    if (localViewerIframe) {
                        if (localViewerIframe.dataset.parwardaProxyLoadBound !== '1') {
                            localViewerIframe.dataset.parwardaProxyLoadBound = '1';
                            localViewerIframe.addEventListener('load', () => {
                                try {
                                    if (localViewerIframe.contentWindow) {
                                        localViewerIframe.contentWindow.postMessage({ type: 'SET_API_KEY', apiKey: 'server-proxy' }, '*');
                                    }
                                } catch (err) {}
                            });
                        }
                        localViewerIframe.srcdoc = prepared;
                    }
                    if (localViewerModal) localViewerModal.style.display = 'flex';
                } catch (err) {
                    showToast('نەشیا بەرنامەی ڤەکەت.', 'error');
                }
            } else if (action === 'edit') {
                if (editConnIdInput) editConnIdInput.value = item.id;
                if (editConnNameInput) editConnNameInput.value = item.name;
                if (editConnCategorySelect) editConnCategorySelect.value = item.category || 'aistudio';
                if (editConnUrlWrap && editConnUrlInput) {
                    if (item.type === 'url') {
                        editConnUrlWrap.style.display = 'block';
                        editConnUrlInput.value = item.url || '';
                        editConnUrlInput.required = true;
                    } else {
                        editConnUrlWrap.style.display = 'none';
                        editConnUrlInput.value = '';
                        editConnUrlInput.required = false;
                    }
                }
                if (editConnModal) editConnModal.style.display = 'flex';
            } else if (action === 'delete') {
                vaultItems = vaultItems.filter(x => x.id !== id);
                if (item.type === 'html') {
                    await deleteLocalHtmlApp(id);
                }
                await persistVault();
                renderVaultItems();
                showToast('بەرنامە ژ موبائیلێ هاتە ژێبرن.', 'info');
            }
        });
    }

    if (closeLocalViewerBtn) {
        closeLocalViewerBtn.addEventListener('click', () => {
            if (localViewerModal) localViewerModal.style.display = 'none';
            if (localViewerIframe) localViewerIframe.srcdoc = '';
        });
    }

    if (closeEditConnModalBtn) {
        closeEditConnModalBtn.addEventListener('click', () => {
            if (editConnModal) editConnModal.style.display = 'none';
        });
    }

    if (editConnForm) {
        editConnForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = editConnIdInput ? editConnIdInput.value : '';
            const item = vaultItems.find(x => x.id === id);
            if (!item) return;

            const nextName = editConnNameInput ? editConnNameInput.value.trim() : '';
            if (!nextName) return;

            if (item.type === 'url') {
                const cleanUrl = normalizeAndValidateUrl(editConnUrlInput ? editConnUrlInput.value : '');
                if (!cleanUrl) {
                    showToast('تکایە لینکەکێ دروست بنڤیسە.', 'error');
                    return;
                }
                item.url = cleanUrl;
            }
            item.name = nextName;
            item.category = editConnCategorySelect ? editConnCategorySelect.value : item.category;
            await persistVault();
            if (editConnModal) editConnModal.style.display = 'none';
            renderVaultItems();
            showToast('گوهۆرین دناڤ موبائیلێ دا هاتنە پاشکەفتن.', 'success');
        });
    }

    // =========================================================================
    // 11. PIN SETUP, LOCK, REMOVE, BACKUP & WIPE
    // =========================================================================
    if (setupPinBtn) {
        setupPinBtn.addEventListener('click', () => {
            showAlert(pinModalError, '', 'error');
            if (newPinInput) newPinInput.value = '';
            if (confirmPinInput) confirmPinInput.value = '';
            if (pinModal) pinModal.style.display = 'flex';
        });
    }

    if (closePinModalBtn) {
        closePinModalBtn.addEventListener('click', () => {
            if (pinModal) pinModal.style.display = 'none';
        });
    }

    if (pinSetupForm) {
        pinSetupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            showAlert(pinModalError, '', 'error');

            if (!window.crypto || !window.crypto.subtle) {
                showAlert(pinModalError, 'ڤی وێبگەڕی پشتەڤانیا شفرەکرنا Web Crypto ناکەت.', 'error');
                return;
            }

            const p1 = newPinInput ? newPinInput.value.trim() : '';
            const p2 = confirmPinInput ? confirmPinInput.value.trim() : '';
            if (p1.length < 4 || p1.length > 8) {
                showAlert(pinModalError, 'کۆدێ PIN دڤێت دناڤبەرا ٤ تا ٨ ژمارەیان دا بیت.', 'error');
                return;
            }
            if (p1 !== p2) {
                showAlert(pinModalError, 'هەردوو کۆدێن PIN وەک ئێک نینن.', 'error');
                return;
            }

            const saltBytes = window.crypto.getRandomValues(new Uint8Array(16));
            const saltB64 = bytesToBase64(saltBytes);
            const verifier = await sha256Hex(`${saltB64}:${p1}`);
            activeCryptoKey = await deriveAesKey(p1, saltB64);

            localStorage.setItem(PIN_META_KEY, JSON.stringify({
                enabled: true,
                salt: saltB64,
                verifier
            }));

            await persistVault();
            if (pinModal) pinModal.style.display = 'none';
            updatePinControlsUI();
            showToast('قوفلێ پاراستنێ PIN چالاک بوو و لینک شفرەکران.', 'success');
        });
    }

    if (lockNowBtn) {
        lockNowBtn.addEventListener('click', () => {
            activeCryptoKey = null;
            vaultItems = [];
            revealedItemIds.clear();
            globalRevealUrls = false;
            syncQuickCardFromVault();
            if (quickTestResult) quickTestResult.style.display = 'none';
            if (mainContent) mainContent.style.display = 'none';
            if (lockScreen) lockScreen.style.display = 'block';
            if (unlockPinInput) unlockPinInput.value = '';
        });
    }

    if (removePinBtn) {
        removePinBtn.addEventListener('click', async () => {
            activeCryptoKey = null;
            localStorage.removeItem(PIN_META_KEY);
            await persistVault();
            updatePinControlsUI();
            showToast('قوفلێ PIN هاتە لادان.', 'info');
        });
    }

    if (exportBackupBtn) {
        exportBackupBtn.addEventListener('click', () => {
            if (vaultItems.length === 0) {
                showToast('چ لینک نینن بۆ پاشکەفتکرنێ.', 'info');
                return;
            }
            const payload = {
                app: 'ParwardaPrivateAIStudioVault',
                exportedAt: new Date().toISOString(),
                items: vaultItems.filter(i => i.type === 'url')
            };
            const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `my-private-aistudio-links-${Date.now()}.json`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            showToast('کۆپیا پاراستنێ د موبائیلێ تە دا هاتە دابەزاندن.', 'success');
        });
    }

    if (importBackupInput) {
        importBackupInput.addEventListener('change', (e) => {
            const file = e.target.files && e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = async (ev) => {
                try {
                    const parsed = JSON.parse(String(ev.target.result || '{}'));
                    const incoming = Array.isArray(parsed.items) ? parsed.items : [];
                    let added = 0;
                    for (const item of incoming) {
                        const cleanUrl = normalizeAndValidateUrl(item && item.url);
                        if (cleanUrl && item.name) {
                            vaultItems.unshift({
                                id: 'ai_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
                                type: 'url',
                                name: String(item.name).slice(0, 120),
                                url: cleanUrl,
                                category: CATEGORY_META[item.category] ? item.category : 'aistudio',
                                createdAt: item.createdAt || Date.now()
                            });
                            added++;
                        }
                    }
                    await persistVault();
                    renderVaultItems();
                    showToast(`${added} لینک ب سەرکەفتوویی هاتنە زڤراندن.`, 'success');
                } catch (err) {
                    showToast('فایلێ کۆپیا پاراستنێ دروست نینە.', 'error');
                }
                importBackupInput.value = '';
            };
            reader.readAsText(file);
        });
    }

    if (wipeVaultBtn) {
        wipeVaultBtn.addEventListener('click', () => {
            if (confirmWipeModal) confirmWipeModal.style.display = 'flex';
        });
    }

    if (confirmWipeNoBtn) {
        confirmWipeNoBtn.addEventListener('click', () => {
            if (confirmWipeModal) confirmWipeModal.style.display = 'none';
        });
    }

    if (confirmWipeYesBtn) {
        confirmWipeYesBtn.addEventListener('click', async () => {
            vaultItems = [];
            activeCryptoKey = null;
            revealedItemIds.clear();
            localStorage.removeItem(VAULT_STORAGE_KEY);
            localStorage.removeItem(PIN_META_KEY);
            await clearAllLocalHtmlApps();
            if (confirmWipeModal) confirmWipeModal.style.display = 'none';
            if (quickTestResult) quickTestResult.style.display = 'none';
            updatePinControlsUI();
            renderVaultItems();
            showToast('هەمی لینک و داتایێن تایبەت ژ موبائیلێ هاتنە ژێبرن.', 'info');
        });
    }

    // Quick Masked Link & Server Proxy Test Handlers
    if (quickToggleEyeBtn && quickSecretInput) {
        quickToggleEyeBtn.addEventListener('click', () => {
            const isHidden = quickSecretInput.type === 'password';
            quickSecretInput.type = isHidden ? 'text' : 'password';
            quickToggleEyeBtn.innerHTML = isHidden
                ? '<i class="fas fa-eye-slash"></i>'
                : '<i class="fas fa-eye"></i>';
        });
    }

    if (quickClearBtn) {
        quickClearBtn.addEventListener('click', async () => {
            if (quickSecretInput) {
                quickSecretInput.value = '';
                quickSecretInput.type = 'password';
            }
            if (quickTestResult) quickTestResult.style.display = 'none';
            const beforeLen = vaultItems.length;
            vaultItems = vaultItems.filter(x => x.id !== 'primary_quick_link');
            if (vaultItems.length !== beforeLen) {
                await persistVault();
            }
            renderVaultItems();
            showToast('لینک ژ موبائیلێ هاتە پاقژکرن.', 'info');
        });
    }

    if (quickTestSaveBtn) {
        quickTestSaveBtn.addEventListener('click', async () => {
            const rawVal = quickSecretInput ? quickSecretInput.value.trim() : '';
            let savedLocal = false;

            if (rawVal) {
                const cleanUrl = normalizeAndValidateUrl(rawVal);
                if (!cleanUrl) {
                    if (quickTestResult) {
                        quickTestResult.style.display = 'block';
                        quickTestResult.style.background = 'rgba(239, 68, 68, 0.16)';
                        quickTestResult.style.border = '1px solid rgba(239, 68, 68, 0.4)';
                        quickTestResult.style.color = '#fecaca';
                        quickTestResult.textContent = 'تکایە لینکەکێ دروست بنڤیسە (وەک https://aistudio.google.com/...).';
                    }
                    return;
                }
                const existingIdx = vaultItems.findIndex(x => x.id === 'primary_quick_link');
                const entry = {
                    id: 'primary_quick_link',
                    type: 'url',
                    name: 'بەرنامێ من یێ سەرەکی ل AI Studio',
                    url: cleanUrl,
                    category: 'aistudio',
                    createdAt: Date.now()
                };
                if (existingIdx >= 0) {
                    vaultItems[existingIdx] = entry;
                } else {
                    vaultItems.unshift(entry);
                }
                await persistVault();
                renderVaultItems();
                savedLocal = true;
            }

            if (quickTestResult) {
                quickTestResult.style.display = 'block';
                quickTestResult.style.background = 'rgba(250, 204, 21, 0.14)';
                quickTestResult.style.border = '1px solid rgba(250, 204, 21, 0.35)';
                quickTestResult.style.color = '#fef08a';
                quickTestResult.textContent = 'ل حالەتێ پشکنینا گرێدانا AI Studio ل سەر سێرڤەرێ پاراستی...';
            }

            try {
                const res = await fetch('/api/gemini/status?probe=1', { method: 'GET', cache: 'no-store' });
                const data = await res.json().catch(() => ({}));
                if (quickTestResult) {
                    if (res.ok && data && data.ready) {
                        quickTestResult.style.background = 'rgba(16, 185, 129, 0.16)';
                        quickTestResult.style.border = '1px solid rgba(16, 185, 129, 0.4)';
                        quickTestResult.style.color = '#a7f3d0';
                        quickTestResult.textContent = savedLocal
                            ? 'گرێدانا AI Studio سەرکەفتی بوو و لینک تنێ دناڤ موبائیلێ تە دا خەزن بوو.'
                            : 'گرێدانا AI Studio ل سەر سێرڤەرێ پاراستی چالاک و ئامادەیە.';
                    } else {
                        quickTestResult.style.background = 'rgba(250, 204, 21, 0.14)';
                        quickTestResult.style.border = '1px solid rgba(250, 204, 21, 0.35)';
                        quickTestResult.style.color = '#fef08a';
                        quickTestResult.textContent = savedLocal
                            ? 'لینک دناڤ موبائیلێ تە دا هاتە خەزنکرن (تنێ ل ڤێ موبائیلێ پاراستی یە).'
                            : 'خزمەتگوزاریا AI یا سێرڤەری نوکە چالاک نینە، بەلێ لینکێن تە دناڤ موبائیلێ دا پاراستینە.';
                    }
                }
                if (savedLocal) {
                    showToast('لینک دناڤ موبائیلێ تە دا هاتە خەزنکرن.', 'success');
                }
            } catch (err) {
                if (quickTestResult) {
                    quickTestResult.style.background = savedLocal ? 'rgba(16, 185, 129, 0.16)' : 'rgba(239, 68, 68, 0.16)';
                    quickTestResult.style.border = savedLocal ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)';
                    quickTestResult.style.color = savedLocal ? '#a7f3d0' : '#fecaca';
                    quickTestResult.textContent = savedLocal
                        ? 'لینک دناڤ موبائیلێ تە دا هاتە خەزنکرن و پاراستن.'
                        : 'نەشیا پشکنینا گرێدانێ بکەت.';
                }
            }
        });
    }

    initVault();
})();
