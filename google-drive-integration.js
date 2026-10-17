/**
 * Google Drive Integration Service
 * Powered by Firebase Auth with Google OAuth provider
 * In-memory token management, Drive API v3 operations, and UI modal
 */

(function (window) {
    'use strict';

    // Scopes configured in applet
    const DRIVE_SCOPES = [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/drive.file'
    ];

    // IN-MEMORY TOKEN STORAGE ONLY (MANDATORY: Never store in localStorage or sessionStorage)
    let cachedAccessToken = null;
    let currentUser = null;
    let isSigningIn = false;

    // Listeners for auth changes
    const authListeners = [];

    function notifyAuthListeners() {
        authListeners.forEach(fn => {
            try { fn({ user: currentUser, token: cachedAccessToken }); } catch (e) { console.error(e); }
        });
    }

    // Initialize Firebase Auth listener
    function initAuth() {
        if (typeof firebase === 'undefined' || !firebase.auth) {
            console.warn('Firebase Auth SDK not found yet.');
            return;
        }

        const auth = firebase.auth();
        auth.onAuthStateChanged(async (user) => {
            currentUser = user;
            if (!user) {
                cachedAccessToken = null;
                notifyAuthListeners();
            } else {
                // If user is present but token expired/not cached, trigger silent refresh if available
                if (!cachedAccessToken && !isSigningIn) {
                    notifyAuthListeners();
                }
            }
        });
    }

    // Google Sign-In with popup requesting Drive scopes
    async function signInWithGoogle() {
        if (typeof firebase === 'undefined' || !firebase.auth) {
            throw new Error('Firebase Auth not available');
        }

        try {
            isSigningIn = true;
            const provider = new firebase.auth.GoogleAuthProvider();
            DRIVE_SCOPES.forEach(scope => provider.addScope(scope));
            
            // Set prompt to select account if needed
            provider.setCustomParameters({ prompt: 'select_account' });

            const result = await firebase.auth().signInWithPopup(provider);
            const credential = result.credential;

            if (credential && credential.accessToken) {
                cachedAccessToken = credential.accessToken;
            } else if (result.user && result.credential?.accessToken) {
                cachedAccessToken = result.credential.accessToken;
            } else {
                // Firebase Web SDK v8 populates credential.accessToken
                cachedAccessToken = credential ? credential.accessToken : null;
            }

            currentUser = result.user;
            notifyAuthListeners();
            return { user: currentUser, accessToken: cachedAccessToken };
        } catch (error) {
            console.error('Google Drive sign-in error:', error);
            throw error;
        } finally {
            isSigningIn = false;
        }
    }

    // Sign out
    async function signOut() {
        if (typeof firebase !== 'undefined' && firebase.auth) {
            await firebase.auth().signOut();
        }
        cachedAccessToken = null;
        currentUser = null;
        notifyAuthListeners();
    }

    function getAccessToken() {
        return cachedAccessToken;
    }

    function getCurrentUser() {
        return currentUser;
    }

    function onAuthStateChanged(callback) {
        authListeners.push(callback);
        // Call immediately with current state
        callback({ user: currentUser, token: cachedAccessToken });
        return () => {
            const idx = authListeners.indexOf(callback);
            if (idx > -1) authListeners.splice(idx, 1);
        };
    }

    // ==========================================
    // GOOGLE DRIVE API OPERATIONS
    // ==========================================

    /**
     * List files from user's Google Drive
     * @param {Object} options
     * @param {string} options.q Query string
     * @param {number} options.pageSize Number of files
     * @param {string} options.filterType 'all'|'pdf'|'slide'|'doc'|'image'
     * @param {string} options.search Keyword search
     */
    async function listFiles(options = {}) {
        const token = cachedAccessToken;
        if (!token) throw new Error('NOT_AUTHENTICATED');

        let queryParts = ['trashed = false'];

        if (options.search && options.search.trim()) {
            const escaped = options.search.replace(/'/g, "\\'");
            queryParts.push(`name contains '${escaped}'`);
        }

        if (options.filterType && options.filterType !== 'all') {
            switch (options.filterType) {
                case 'pdf':
                    queryParts.push("mimeType = 'application/pdf'");
                    break;
                case 'slide':
                    queryParts.push("(mimeType contains 'presentation' or mimeType contains 'powerpoint')");
                    break;
                case 'doc':
                    queryParts.push("(mimeType contains 'document' or mimeType contains 'word' or mimeType = 'text/plain')");
                    break;
                case 'image':
                    queryParts.push("mimeType contains 'image/'");
                    break;
            }
        }

        const q = queryParts.join(' and ');
        const fields = 'nextPageToken, files(id, name, mimeType, size, modifiedTime, thumbnailLink, webViewLink, webContentLink, iconLink)';
        const pageSize = options.pageSize || 30;

        const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=${encodeURIComponent(fields)}&pageSize=${pageSize}&orderBy=modifiedTime desc`;

        const res = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            if (res.status === 401) {
                cachedAccessToken = null;
                notifyAuthListeners();
            }
            throw new Error(err.error?.message || `Drive API error: ${res.status}`);
        }

        return await res.json();
    }

    /**
     * Download or read file content (Blob, text, or arrayBuffer)
     * For Google Docs/Slides/Sheets, exports to PDF or plain text
     */
    async function getFileContent(fileId, mimeType) {
        const token = cachedAccessToken;
        if (!token) throw new Error('NOT_AUTHENTICATED');

        let url;
        if (mimeType && mimeType.includes('vnd.google-apps.presentation')) {
            url = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=application/pdf`;
        } else if (mimeType && mimeType.includes('vnd.google-apps.document')) {
            url = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`;
        } else {
            url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
        }

        const res = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
            throw new Error(`Failed to fetch file content (${res.status})`);
        }

        const blob = await res.blob();
        return blob;
    }

    /**
     * Upload a new file (e.g., HTML presentation, PDF, Malzama, notes) to Google Drive
     * Uses multipart/related to upload metadata + file data
     */
    async function uploadFile({ name, content, mimeType = 'text/html', folderId = null, description = '' }) {
        const token = cachedAccessToken;
        if (!token) throw new Error('NOT_AUTHENTICATED');

        const metadata = {
            name: name,
            mimeType: mimeType,
            description: description || 'کەرەستەی پەروەردەیی لە پلاتفۆرمی پۆلا 10-11-12'
        };

        if (folderId) {
            metadata.parents = [folderId];
        }

        const boundary = '-------314159265358979323846';
        const delimiter = "\r\n--" + boundary + "\r\n";
        const close_delim = "\r\n--" + boundary + "--";

        // Handle string content or Blob/ArrayBuffer
        let fileData = content;
        let isBlob = content instanceof Blob;

        let multipartRequestBody;
        if (typeof content === 'string') {
            multipartRequestBody =
                delimiter +
                'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
                JSON.stringify(metadata) +
                delimiter +
                `Content-Type: ${mimeType}\r\n\r\n` +
                content +
                close_delim;
        } else {
            // For binary/blob content
            const metadataBlob = new Blob([
                delimiter +
                'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
                JSON.stringify(metadata) +
                delimiter +
                `Content-Type: ${mimeType}\r\n\r\n`
            ], { type: 'text/plain' });

            const closeBlob = new Blob([close_delim], { type: 'text/plain' });
            multipartRequestBody = new Blob([metadataBlob, content, closeBlob]);
        }

        const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': `multipart/related; boundary=${boundary}`
            },
            body: multipartRequestBody
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error?.message || `Upload failed: ${res.status}`);
        }

        return await res.json();
    }

    /**
     * Delete file from Google Drive
     * MANDATORY: Must only be called after explicit user confirmation dialog
     */
    async function deleteFile(fileId) {
        const token = cachedAccessToken;
        if (!token) throw new Error('NOT_AUTHENTICATED');

        const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok && res.status !== 204) {
            throw new Error(`Failed to delete file: ${res.status}`);
        }

        return true;
    }

    /**
     * Explicit User Confirmation Modal for Destructive Operations (MANDATORY)
     * Meets the security constitution requirements
     */
    function showDestructiveConfirmDialog({ title, message, itemName, onConfirm, onCancel }) {
        let existing = document.getElementById('gdrive-confirm-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'gdrive-confirm-modal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.75); backdrop-filter: blur(4px);
            display: flex; align-items: center; justify-content: center;
            z-index: 99999; direction: rtl; font-family: inherit; padding: 15px;
        `;

        modal.innerHTML = `
            <div style="background: var(--surface-color, #1e293b); color: var(--primary-text, #f8fafc); border: 1px solid var(--border-color, #334155); border-radius: 16px; max-width: 440px; width: 100%; padding: 24px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); text-align: right;">
                <div style="width: 50px; height: 50px; border-radius: 50%; background: rgba(239, 68, 68, 0.15); color: #ef4444; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; margin-bottom: 16px;">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h3 style="margin: 0 0 10px; font-size: 1.25rem; font-weight: 700; color: #ef4444;">
                    ${title || 'پشتڕاستکردنەوەی سڕینەوە لە Google Drive'}
                </h3>
                <p style="margin: 0 0 14px; color: var(--secondary-text, #94a3b8); font-size: 0.95rem; line-height: 1.6;">
                    ${message || 'ئایا دڵنیایت دەتەوێت ئەم فایلە لە Google Drive بسڕیتەوە؟ ئەم کردارە ناگەڕێتەوە.'}
                </p>
                ${itemName ? `<div style="background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.08); padding: 10px 14px; border-radius: 8px; margin-bottom: 20px; font-size: 0.88rem; color: #38bdf8; word-break: break-all;"><i class="fas fa-file"></i> ${itemName}</div>` : ''}
                <div style="display: flex; gap: 12px; justify-content: flex-end;">
                    <button id="gdrive-confirm-cancel-btn" style="padding: 10px 18px; border-radius: 10px; border: 1px solid var(--border-color, #475569); background: transparent; color: var(--primary-text, #f8fafc); cursor: pointer; font-family: inherit; font-size: 0.9rem;">
                        پاشگەزبوونەوە (Cancel)
                    </button>
                    <button id="gdrive-confirm-delete-btn" style="padding: 10px 20px; border-radius: 10px; border: none; background: #dc2626; color: #ffffff; cursor: pointer; font-weight: 600; font-family: inherit; font-size: 0.9rem; display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-trash-alt"></i> بەڵێ، بسڕەوە (Confirm Delete)
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const cancelBtn = modal.querySelector('#gdrive-confirm-cancel-btn');
        const deleteBtn = modal.querySelector('#gdrive-confirm-delete-btn');

        cancelBtn.addEventListener('click', () => {
            modal.remove();
            if (onCancel) onCancel();
        });

        deleteBtn.addEventListener('click', async () => {
            deleteBtn.disabled = true;
            deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> دەسڕێتەوە...';
            try {
                if (onConfirm) await onConfirm();
            } finally {
                modal.remove();
            }
        });
    }

    /**
     * Get or create dedicated app backup folder in user's Google Drive
     */
    let cachedFolderId = null;
    const APP_BACKUP_FOLDER_NAME = 'پلاتفۆرمی کیمیا و فێرکاری - کۆگای پاشەکەوت (Educational Platform Backups)';

    async function getOrCreateAppFolder() {
        const token = cachedAccessToken;
        if (!token) throw new Error('NOT_AUTHENTICATED');
        if (cachedFolderId) return cachedFolderId;

        try {
            // Check if folder exists
            const q = `mimeType = 'application/vnd.google-apps.folder' and name = '${APP_BACKUP_FOLDER_NAME.replace(/'/g, "\\'")}' and trashed = false`;
            const checkUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name)`;
            const checkRes = await fetch(checkUrl, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (checkRes.ok) {
                const data = await checkRes.json();
                if (data.files && data.files.length > 0) {
                    cachedFolderId = data.files[0].id;
                    return cachedFolderId;
                }
            }

            // Create folder if not found
            const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: APP_BACKUP_FOLDER_NAME,
                    mimeType: 'application/vnd.google-apps.folder',
                    description: 'فۆڵدەری پارێزراوی پاشەکەوتی فەرمی یێ وانەکان، مەلزەمە، ڤیدیۆ و پرسیاران لە پلاتفۆرمی فێرکاری'
                })
            });

            if (createRes.ok) {
                const newFolder = await createRes.json();
                cachedFolderId = newFolder.id;
                return cachedFolderId;
            }
        } catch (e) {
            console.warn('Could not create dedicated app folder, using root Drive:', e);
        }
        return null;
    }

    /**
     * Convert DataURL to Blob
     */
    function dataURLtoBlob(dataurl) {
        if (!dataurl || typeof dataurl !== 'string' || !dataurl.includes(',')) return null;
        try {
            const arr = dataurl.split(',');
            const mime = arr[0].match(/:(.*?);/)[1];
            const bstr = atob(arr[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while (n--) {
                u8arr[n] = bstr.charCodeAt(n);
            }
            return new Blob([u8arr], { type: mime });
        } catch (e) {
            console.warn('Error converting dataURL to Blob:', e);
            return null;
        }
    }

    /**
     * Backup Educational Content (Malzama, Video, Quiz, Post) directly to Google Drive
     * & register in Firestore drive_backups collection
     */
    async function backupEducationalItem(item, rawFileBlobOrData = null) {
        const token = cachedAccessToken;
        if (!token) {
            console.warn('Google Drive not signed in, backup skipped for item:', item.id);
            return null;
        }

        try {
            const folderId = await getOrCreateAppFolder();
            const typeLabel = item.type ? item.type.toUpperCase() : 'MALZAMA';
            const gradeName = item.grade ? `پۆلا ${item.grade}` : 'گشتی';
            const cleanTitle = (item.title || item.name || 'وانە').replace(/[\\/:*?"<>|]/g, '-');
            const fileName = `[${typeLabel}] [${gradeName}] ${cleanTitle}.json`;

            // Prepare complete structured backup payload
            const backupPayload = {
                version: '2.0',
                app: 'chemistry-educational-platform',
                backupAt: new Date().toISOString(),
                item: {
                    ...item,
                    backedUpBy: currentUser ? currentUser.email : 'user'
                }
            };

            const contentStr = JSON.stringify(backupPayload, null, 2);
            const driveFile = await uploadFile({
                name: fileName,
                content: contentStr,
                mimeType: 'application/json',
                folderId: folderId,
                description: `پاشەکەوتی دڵنیایی: ${item.title || item.name} | بابەتی: ${item.subject || 'کیمیا'} | ${gradeName}`
            });

            // Also upload companion raw binary file if provided (PDF, PPTX, Image)
            let companionFileId = null;
            if (rawFileBlobOrData || (item.fileData && item.fileData.startsWith('data:'))) {
                try {
                    const blob = rawFileBlobOrData instanceof Blob ? rawFileBlobOrData : dataURLtoBlob(item.fileData);
                    if (blob) {
                        const rawExt = item.fileType || 'pdf';
                        const rawFileName = `[FILE] [${gradeName}] ${cleanTitle}.${rawExt}`;
                        const rawUpload = await uploadFile({
                            name: rawFileName,
                            content: blob,
                            mimeType: blob.type || 'application/octet-stream',
                            folderId: folderId,
                            description: `فایلی ئەسڵی مەلزەمە / پەڕاو بۆ: ${item.title}`
                        });
                        companionFileId = rawUpload.id;
                    }
                } catch (rawErr) {
                    console.warn('Companion raw file upload error:', rawErr);
                }
            }

            // Sync with Firestore collection 'drive_backups'
            if (typeof firebase !== 'undefined' && firebase.firestore) {
                try {
                    const db = firebase.firestore();
                    const backupDoc = {
                        itemId: String(item.id),
                        driveFileId: driveFile.id,
                        companionFileId: companionFileId || null,
                        itemType: item.type || 'malzama',
                        title: item.title || item.name || 'وانە',
                        grade: String(item.grade || '12'),
                        subject: item.subject || 'کیمیا',
                        chapter: item.chapter || '',
                        webViewLink: driveFile.webViewLink || `https://drive.google.com/file/d/${driveFile.id}/view`,
                        userEmail: currentUser ? currentUser.email : '',
                        backupAt: new Date().toISOString()
                    };

                    await db.collection('drive_backups').doc(String(item.id)).set(backupDoc, { merge: true });

                    // Also mark drive backup reference directly on the content document
                    await db.collection('educational_content').doc(String(item.id)).set({
                        driveBackup: {
                            synced: true,
                            fileId: driveFile.id,
                            webViewLink: driveFile.webViewLink || `https://drive.google.com/file/d/${driveFile.id}/view`,
                            backupAt: new Date().toISOString()
                        }
                    }, { merge: true });
                } catch (dbErr) {
                    console.warn('Firestore drive_backups sync warning:', dbErr.message);
                }
            }

            // Save to local backup cache
            try {
                const localBackups = JSON.parse(localStorage.getItem('app_gdrive_backups_index') || '[]');
                const idx = localBackups.findIndex(b => b.itemId === item.id);
                const record = {
                    itemId: item.id,
                    driveFileId: driveFile.id,
                    title: item.title,
                    type: item.type,
                    grade: item.grade,
                    subject: item.subject,
                    webViewLink: driveFile.webViewLink,
                    backupAt: new Date().toISOString()
                };
                if (idx >= 0) localBackups[idx] = record;
                else localBackups.unshift(record);
                localStorage.setItem('app_gdrive_backups_index', JSON.stringify(localBackups));
            } catch(e) {}

            return driveFile;
        } catch (error) {
            console.error('Failed to backup to Google Drive:', error);
            throw error;
        }
    }

    /**
     * List all educational backups in Google Drive
     */
    async function listAppBackups() {
        const token = cachedAccessToken;
        if (!token) return [];

        try {
            const folderId = await getOrCreateAppFolder();
            let query = "trashed = false and (name contains '[MALZAMA]' or name contains '[VIDEO]' or name contains '[QUIZ]' or name contains '[FILE]')";
            if (folderId) {
                query = `'${folderId}' in parents and trashed = false`;
            }

            const fields = 'files(id, name, mimeType, size, modifiedTime, webViewLink, webContentLink, description)';
            const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=${encodeURIComponent(fields)}&pageSize=100&orderBy=modifiedTime desc`;

            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) throw new Error(`Drive list error: ${res.status}`);
            const data = await res.json();
            return data.files || [];
        } catch (err) {
            console.error('Error listing app backups from Google Drive:', err);
            // Fallback to Firestore index if available
            if (typeof firebase !== 'undefined' && firebase.firestore) {
                try {
                    const snap = await firebase.firestore().collection('drive_backups').orderBy('backupAt', 'desc').limit(50).get();
                    if (!snap.empty) {
                        return snap.docs.map(d => ({ id: d.data().driveFileId, name: d.data().title, ...d.data() }));
                    }
                } catch(e) {}
            }
            return JSON.parse(localStorage.getItem('app_gdrive_backups_index') || '[]');
        }
    }

    /**
     * Restore single item from Google Drive back to Firebase and local storage
     * (داکو ئەگەر مسح بوو بشێین بساناهی زڤریننەڤە)
     */
    async function restoreItemFromDrive(driveFileId) {
        const token = cachedAccessToken;
        if (!token) throw new Error('NOT_AUTHENTICATED');

        try {
            // Fetch file content
            const url = `https://www.googleapis.com/drive/v3/files/${driveFileId}?alt=media`;
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) throw new Error(`Failed to download backup file (${res.status})`);
            const text = await res.text();
            let parsed = null;
            try {
                parsed = JSON.parse(text);
            } catch (e) {
                throw new Error('فایلی پشتیوانی شێوازی JSON نییە یان تێکچووە');
            }

            const item = parsed.item || parsed;
            if (!item || !item.id) {
                throw new Error('داتای وانە لەم فایلەدا نەدۆزرایەوە');
            }

            // Restore directly to EducationalData engine
            if (window.EducationalData) {
                const store = window.EducationalData;
                if (item.type === 'video' || item.youtubeUrl) {
                    store.saveVideo({ ...item, status: 'approved' });
                } else if (item.type === 'quiz' || item.options) {
                    store.saveQuiz({ ...item, status: 'approved' });
                } else {
                    store.saveMalzama({ ...item, status: 'approved' });
                }
            }

            // Restore directly to Firestore educational_content
            if (typeof firebase !== 'undefined' && firebase.firestore) {
                const db = firebase.firestore();
                await db.collection('educational_content').doc(String(item.id)).set({
                    ...item,
                    status: 'approved',
                    restoredFromDriveAt: new Date().toISOString()
                }, { merge: true });
            }

            // Dispatch global event for instant UI update across pages
            window.dispatchEvent(new CustomEvent('educationalItemRestored', { detail: { item } }));

            return item;
        } catch (error) {
            console.error('Restore error:', error);
            throw error;
        }
    }

    /**
     * Restore all deleted items found in Google Drive that are missing from current active list
     */
    async function restoreAllDeletedItems() {
        const files = await listAppBackups();
        if (!files || files.length === 0) return 0;

        const store = window.EducationalData;
        const currentVids = store ? store.getAllVideos(false, null, true) : [];
        const currentQzs = store ? store.getAllQuizzes(false, null, true) : [];
        const currentMlzs = store ? store.getAllMalzamas(false, null, true) : [];
        const activeIds = new Set([
            ...currentVids.map(v => v.id),
            ...currentQzs.map(q => q.id),
            ...currentMlzs.map(m => m.id)
        ]);

        let restoredCount = 0;
        for (const f of files) {
            // Only examine json backup files
            if (f.name && f.name.endsWith('.json')) {
                try {
                    const restoredItem = await restoreItemFromDrive(f.id);
                    if (!activeIds.has(restoredItem.id)) {
                        restoredCount++;
                    }
                } catch(e) {
                    console.warn('Skipped non-restorable file:', f.name);
                }
            }
        }
        return restoredCount;
    }

    // Auto-init on script load
    if (typeof window !== 'undefined') {
        window.addEventListener('DOMContentLoaded', () => {
            initAuth();
        });
    }

    // Export service to global window
    window.GoogleDriveService = {
        initAuth,
        signInWithGoogle,
        signOut,
        getAccessToken,
        getCurrentUser,
        onAuthStateChanged,
        listFiles,
        getFileContent,
        uploadFile,
        deleteFile,
        showDestructiveConfirmDialog,
        getOrCreateAppFolder,
        backupEducationalItem,
        listAppBackups,
        restoreItemFromDrive,
        restoreAllDeletedItems,
        APP_BACKUP_FOLDER_NAME
    };

})(window);
