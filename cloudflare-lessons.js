// =========================================================================
// Cloudflare Worker Unified API Client
// Endpoint: https://parwarda-api.hussein-zebary-chemistry96.workers.dev
// =========================================================================

(function (global) {
    'use strict';

    const API_BASE_URL = 'https://parwarda-api.hussein-zebary-chemistry96.workers.dev';
    const CLOUDFLARE_WORKER_URL = API_BASE_URL;
    global.API_BASE_URL = API_BASE_URL;
    const CF_USER_STORAGE_KEY = 'parwarda_cf_user';
    const ADMIN_USERNAME = 'hussein23';
    const ADMIN_PASSWORD = 'hussein1996';

    function isAdminCredentials(username, password) {
        return String(username || '').trim().toLowerCase() === ADMIN_USERNAME && String(password || '') === ADMIN_PASSWORD;
    }

    let cachedLessons = [];
    let isLoadingLessons = false;
    let lastFetchError = null;

    function escapeHtml(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function safeParseMeta(rawMeta) {
        if (!rawMeta) return {};
        if (typeof rawMeta === 'object' && !Array.isArray(rawMeta)) {
            return rawMeta;
        }
        if (typeof rawMeta === 'string') {
            try {
                const parsed = JSON.parse(rawMeta);
                return parsed && typeof parsed === 'object' ? parsed : {};
            } catch (e) {
                return {};
            }
        }
        return {};
    }

    function showCfToast(message, type) {
        const container = document.getElementById('app-toast-container');
        if (container) {
            const toast = document.createElement('div');
            toast.className = `app-toast ${type || 'info'}`;
            const iconClass = type === 'success' ? 'fa-check-circle' : (type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle');
            const color = type === 'success' ? '#28a745' : (type === 'error' ? '#dc3545' : '#2563eb');
            toast.innerHTML = `<i class="fas ${iconClass}" style="font-size:1.2rem; color:${color}; flex-shrink:0;"></i><span>${escapeHtml(message)}</span>`;
            container.appendChild(toast);
            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateY(14px)';
                toast.style.transition = 'all 0.25s ease';
                setTimeout(() => toast.remove(), 260);
            }, 3800);
            return;
        }

        let fbToast = document.getElementById('cf-floating-toast');
        if (!fbToast) {
            fbToast = document.createElement('div');
            fbToast.id = 'cf-floating-toast';
            fbToast.style.cssText = 'position:fixed; bottom:22px; left:50%; transform:translateX(-50%); z-index:9999999; padding:12px 20px; border-radius:12px; font-family:inherit; font-size:0.9rem; font-weight:600; color:#fff; box-shadow:0 10px 30px rgba(0,0,0,0.3); display:flex; align-items:center; gap:10px; max-width:90%; transition:opacity 0.25s ease;';
            document.body.appendChild(fbToast);
        }
        fbToast.style.background = type === 'error' ? '#b91c1c' : (type === 'success' ? '#15803d' : '#1e40af');
        fbToast.innerHTML = `<i class="fas ${type === 'error' ? 'fa-exclamation-circle' : (type === 'success' ? 'fa-check-circle' : 'fa-info-circle')}"></i><span>${escapeHtml(message)}</span>`;
        fbToast.style.opacity = '1';
        clearTimeout(fbToast._timer);
        fbToast._timer = setTimeout(() => {
            fbToast.style.opacity = '0';
        }, 3800);
    }

    // =========================================================================
    // 1. USER SESSION & SETTINGS SYNC (/register, /login, /settings)
    // =========================================================================
    function normalizeUser(rawPayload, fallback) {
        const fb = fallback || {};
        const root = rawPayload && typeof rawPayload === 'object' ? rawPayload : {};
        const src = (root.user && typeof root.user === 'object')
            ? root.user
            : ((root.data && typeof root.data === 'object' && !Array.isArray(root.data)) ? root.data : root);

        const rawSettings = safeParseMeta(src.settings || root.settings);
        const bookmarks = Array.isArray(rawSettings.bookmarks) ? rawSettings.bookmarks.map(String) : [];
        const idVal = src.id ?? src.user_id ?? src.uid ?? fb.id ?? '';
        const usernameVal = String(src.username || fb.username || '').trim();
        const rawRole = (src.role === 'teacher' || src.role === 'student' || src.role === 'admin')
            ? src.role
            : ((fb.role === 'teacher' || fb.role === 'student' || fb.role === 'admin') ? fb.role : 'student');
        const isOfficialAdminUser = usernameVal.toLowerCase() === ADMIN_USERNAME && (rawRole === 'admin' || localStorage.getItem('parwarda_admin_unlocked') === 'true');
        const roleVal = isOfficialAdminUser ? 'admin' : rawRole;
        const fullNameVal = src.full_name || src.fullName || src.name || fb.full_name || usernameVal || 'بەکارهێنەر';

        const normalizedSettings = Object.assign({}, rawSettings, {
            bookmarks: bookmarks
        });

        return {
            id: idVal !== undefined && idVal !== null ? String(idVal) : '',
            full_name: String(fullNameVal),
            username: usernameVal,
            role: roleVal,
            settings: normalizedSettings
        };
    }

    function getCurrentUser() {
        try {
            const raw = localStorage.getItem(CF_USER_STORAGE_KEY);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            if (!parsed || typeof parsed !== 'object' || !parsed.id) return null;
            return normalizeUser(parsed);
        } catch (e) {
            return null;
        }
    }

    function syncUserToAppMirrors(user) {
        if (!user || !user.id) {
            localStorage.removeItem('app_logged_in_user');
            localStorage.removeItem('app_user_profile');
            localStorage.removeItem('app_learn_current_teacher');
            localStorage.removeItem('is_admin_mode_active');
            localStorage.removeItem('parwarda_admin_unlocked');
            return;
        }

        const isAdminRole = user.role === 'admin';
        let existingProfile = null;
        try {
            existingProfile = JSON.parse(localStorage.getItem('app_user_profile') || 'null');
        } catch (e) {}

        localStorage.setItem('app_logged_in_user', JSON.stringify({
            uid: user.id,
            id: user.id,
            displayName: user.full_name,
            full_name: user.full_name,
            username: user.username,
            email: isAdminRole ? 'Hussein.zebary.chemistry96@gmail.com' : '',
            role: user.role,
            isAdmin: isAdminRole,
            cfAuth: true
        }));

        localStorage.setItem('app_user_profile', JSON.stringify({
            name: user.full_name,
            username: user.username,
            role: user.role,
            avatar: (existingProfile && existingProfile.avatar) || '',
            bio: (existingProfile && existingProfile.bio) || (isAdminRole ? 'ئەدمینێ گشتی' : (user.role === 'teacher' ? 'مامۆستا' : 'قوتابی')),
            teacherId: isAdminRole ? 't_hussein' : (user.role === 'teacher' ? user.id : ''),
            teacherStatus: (isAdminRole || user.role === 'teacher') ? 'approved' : '',
            isProfileComplete: true,
            isGuest: false,
            cfAuth: true,
            updatedAt: Date.now()
        }));

        localStorage.setItem('app_learn_user_role', isAdminRole ? 'super_admin' : user.role);
        if (isAdminRole) {
            localStorage.setItem('parwarda_admin_unlocked', 'true');
            localStorage.setItem('is_admin_mode_active', 'true');
        } else if (localStorage.getItem('parwarda_admin_unlocked') !== 'true') {
            if (!(global.EducationalData && typeof global.EducationalData.isCurrentUserSuperAdmin === 'function' && global.EducationalData.isCurrentUserSuperAdmin())) {
                localStorage.removeItem('is_admin_mode_active');
            }
        }

        if (user.role === 'teacher' || isAdminRole) {
            const teacherObj = {
                id: isAdminRole ? 't_hussein' : user.id,
                name: user.full_name,
                username: user.username,
                subject: 'کیمیا (Chemistry)',
                grades: (user.settings && Array.isArray(user.settings.grades) && user.settings.grades.length)
                    ? user.settings.grades
                    : ['10', '11', '12', 'univ'],
                lang: (user.settings && user.settings.lang) || 'ku_ba',
                status: 'approved',
                viewsCount: isAdminRole ? 4250 : 0
            };
            if (global.EducationalData && typeof global.EducationalData.setCurrentTeacher === 'function') {
                global.EducationalData.setCurrentTeacher(teacherObj);
            } else {
                localStorage.setItem('app_learn_current_teacher', JSON.stringify(teacherObj));
            }
        }
    }

    function setCurrentUser(user) {
        if (!user) {
            localStorage.removeItem(CF_USER_STORAGE_KEY);
            syncUserToAppMirrors(null);
            global.dispatchEvent(new CustomEvent('parwardaAuthChanged', { detail: null }));
            return null;
        }
        const normalized = normalizeUser(user);
        localStorage.setItem(CF_USER_STORAGE_KEY, JSON.stringify(normalized));
        syncUserToAppMirrors(normalized);
        global.dispatchEvent(new CustomEvent('parwardaAuthChanged', { detail: normalized }));
        return normalized;
    }

    function logoutUser() {
        localStorage.removeItem('parwarda_admin_unlocked');
        localStorage.removeItem('is_admin_mode_active');
        return setCurrentUser(null);
    }

    function isAdminUser() {
        if (localStorage.getItem('is_admin_mode_active') === 'true') return true;
        if (localStorage.getItem('parwarda_admin_unlocked') === 'true') return true;
        if (global.EducationalData && typeof global.EducationalData.isCurrentUserSuperAdmin === 'function') {
            if (global.EducationalData.isCurrentUserSuperAdmin()) return true;
        }
        const cfUser = getCurrentUser();
        if (cfUser && cfUser.role === 'admin') return true;
        return false;
    }

    function canManageOrDownload() {
        if (isAdminUser()) return true;
        const cfUser = getCurrentUser();
        if (cfUser) {
            return cfUser.role === 'teacher' || cfUser.role === 'admin';
        }
        if (global.EducationalData && typeof global.EducationalData.getUserRole === 'function') {
            const localRole = global.EducationalData.getUserRole();
            if (localRole === 'super_admin') return true;
            if (localRole === 'teacher') {
                const t = global.EducationalData.getCurrentTeacher ? global.EducationalData.getCurrentTeacher() : null;
                if (t && t.status === 'approved') return true;
            }
        }
        return false;
    }

    function applyUserSettings(settings) {
        if (!settings || typeof settings !== 'object') return;

        if (settings.theme === 'dark' || settings.theme === 'light') {
            document.documentElement.setAttribute('data-theme', settings.theme);
            localStorage.setItem('userTheme', settings.theme);
            localStorage.setItem('theme', settings.theme);
            const themeBtn = document.getElementById('theme-toggle-btn');
            if (themeBtn) {
                themeBtn.innerHTML = settings.theme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
            }
        }

        if (settings.lang && ['ku_ba', 'ku_so', 'ar', 'en'].includes(settings.lang)) {
            localStorage.setItem('userLanguage', settings.lang);
            if (global.EducationalData && typeof global.EducationalData.setActiveLanguage === 'function') {
                global.EducationalData.setActiveLanguage(settings.lang);
            } else {
                localStorage.setItem('app_active_language', settings.lang);
                global.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: settings.lang } }));
            }
        }

        if (Array.isArray(settings.grades) && settings.grades.length > 0) {
            const cleanedGrades = settings.grades.map(String);
            if (global.EducationalData && typeof global.EducationalData.setStudentGrades === 'function') {
                global.EducationalData.setStudentGrades(cleanedGrades);
            } else {
                localStorage.setItem('student_followed_grades', JSON.stringify(cleanedGrades));
            }
        }

        global.dispatchEvent(new CustomEvent('parwardaSettingsApplied', { detail: settings }));
    }

    async function saveUserSettingsToServer(partialSettings) {
        const user = getCurrentUser();
        if (!user) return { ok: false, skipped: true };

        const currentSettings = user.settings || {};
        const nextSettings = Object.assign({}, currentSettings, partialSettings || {});
        if (Array.isArray(nextSettings.bookmarks)) {
            nextSettings.bookmarks = Array.from(new Set(nextSettings.bookmarks.map(String)));
        } else {
            nextSettings.bookmarks = [];
        }

        user.settings = nextSettings;
        localStorage.setItem(CF_USER_STORAGE_KEY, JSON.stringify(user));

        try {
            const res = await fetch(`${CLOUDFLARE_WORKER_URL}/settings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    user_id: user.id,
                    settings: nextSettings
                })
            });

            if (!res.ok) {
                return { ok: false, status: res.status, settings: nextSettings };
            }
            global.dispatchEvent(new CustomEvent('parwardaSettingsSaved', { detail: nextSettings }));
            return { ok: true, settings: nextSettings };
        } catch (err) {
            console.warn('Settings sync note:', err);
            return { ok: false, error: err.message, settings: nextSettings };
        }
    }

    function getBookmarkedIds() {
        const user = getCurrentUser();
        if (!user || !user.settings || !Array.isArray(user.settings.bookmarks)) return [];
        return user.settings.bookmarks.map(String);
    }

    function isBookmarked(postId) {
        if (!postId) return false;
        return getBookmarkedIds().includes(String(postId));
    }

    async function toggleBookmark(postId) {
        const user = getCurrentUser();
        if (!user) {
            openAuthModal('login', 'بۆ نیشانکرنا وانەیان (Bookmarks)، تکایە سەرەتا بچۆ ژوور یان هەژمارەکێ دروست بکە.');
            return { ok: false, requiresAuth: true };
        }

        const targetId = String(postId);
        const existing = getBookmarkedIds();
        const already = existing.includes(targetId);
        const nextBookmarks = already
            ? existing.filter(id => id !== targetId)
            : [targetId, ...existing];

        const result = await saveUserSettingsToServer({ bookmarks: nextBookmarks });
        showCfToast(
            already ? 'ژ لیستا نیشانکرییان هاتە لادان.' : 'د ناڤ لیستا نیشانکرییان (Bookmarks) دا هاتە پاراستن! 🔖',
            already ? 'info' : 'success'
        );
        global.dispatchEvent(new CustomEvent('cloudflareLessonsUpdated', { detail: cachedLessons }));
        return Object.assign({}, result, { bookmarked: !already });
    }

    async function registerAccount(payload) {
        const opts = payload || {};
        const full_name = String(opts.full_name || '').trim();
        const username = String(opts.username || '').trim();
        const password = String(opts.password || '');
        const role = opts.role === 'teacher' ? 'teacher' : 'student';
        const teacher_code = String(opts.teacher_code || '').trim();

        if (!full_name || !username || !password) {
            throw new Error('تکایە ناڤێ تەمام، یوزەرنەیم و پاسوۆردی بنڤیسە.');
        }
        if (role === 'teacher' && !teacher_code) {
            throw new Error('بۆ هەژمارا مامۆستایان، تکایە «کۆدێ نهێنی یێ مامۆستایان» بنڤیسە.');
        }

        const bodyObj = {
            full_name: full_name,
            username: username,
            password: password,
            role: role
        };
        if (role === 'teacher') {
            bodyObj.teacher_code = teacher_code;
        }

        const res = await fetch(`${CLOUDFLARE_WORKER_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(bodyObj)
        });

        const text = await res.text();
        let data = null;
        try {
            data = text ? JSON.parse(text) : null;
        } catch (e) {
            data = { message: text };
        }

        if (!res.ok) {
            const rawErr = data && (data.error || data.message);
            if (res.status === 401 || res.status === 403) {
                throw new Error(rawErr || 'کۆدێ نهێنی یێ مامۆستایان خەلەتە!');
            }
            if (res.status === 409) {
                throw new Error(rawErr || 'ئەڤ یوزەرنەیمە بەری نها هاتیە بکارئینان، یوزەرنەیمەکێ دی هەلبژێرە.');
            }
            throw new Error(rawErr || `دروستکرنا هەژمارێ سەرنەگرت (HTTP ${res.status})`);
        }

        const user = setCurrentUser(normalizeUser(data, { full_name, username, role }));
        if (user && user.settings) {
            applyUserSettings(user.settings);
        }
        return user;
    }

    async function loginAccount(payload) {
        const opts = payload || {};
        const username = String(opts.username || '').trim();
        const password = String(opts.password || '');

        if (!username || !password) {
            throw new Error('تکایە یوزەرنەیم و پاسوۆردی بنڤیسە.');
        }

        if (username.toLowerCase() === ADMIN_USERNAME) {
            if (!isAdminCredentials(username, password)) {
                throw new Error('یوزەرنەیم یان پاسوۆرد خەلەتە.');
            }

            localStorage.setItem('parwarda_admin_unlocked', 'true');
            localStorage.setItem('is_admin_mode_active', 'true');

            let serverUserPayload = null;
            try {
                const res = await fetch(`${CLOUDFLARE_WORKER_URL}/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        username: ADMIN_USERNAME,
                        password: password
                    })
                });
                if (res.ok) {
                    const txt = await res.text();
                    serverUserPayload = txt ? JSON.parse(txt) : null;
                }
            } catch (e) {}

            const prevUser = getCurrentUser();
            const fallbackSettings = (prevUser && prevUser.username && prevUser.username.toLowerCase() === ADMIN_USERNAME && prevUser.settings)
                ? prevUser.settings
                : { bookmarks: [] };

            const adminUser = normalizeUser(serverUserPayload || {
                id: 'admin_hussein23',
                full_name: 'م. حسێن ئەکرەم زێباری (ئەدمین)',
                username: ADMIN_USERNAME,
                role: 'admin',
                settings: fallbackSettings
            }, {
                id: 'admin_hussein23',
                full_name: 'م. حسێن ئەکرەم زێباری (ئەدمین)',
                username: ADMIN_USERNAME,
                role: 'admin'
            });
            adminUser.role = 'admin';

            const savedUser = setCurrentUser(adminUser);
            if (savedUser && savedUser.settings) {
                applyUserSettings(savedUser.settings);
            }
            return savedUser;
        }

        localStorage.removeItem('parwarda_admin_unlocked');
        localStorage.removeItem('is_admin_mode_active');

        const res = await fetch(`${CLOUDFLARE_WORKER_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });

        const text = await res.text();
        let data = null;
        try {
            data = text ? JSON.parse(text) : null;
        } catch (e) {
            data = { message: text };
        }

        if (!res.ok) {
            const rawErr = data && (data.error || data.message);
            if (res.status === 401 || res.status === 403 || res.status === 404) {
                throw new Error(rawErr || 'یوزەرنەیم یان پاسوۆرد خەلەتە.');
            }
            throw new Error(rawErr || `چوونەژوور سەرنەگرت (HTTP ${res.status})`);
        }

        const user = setCurrentUser(normalizeUser(data, { username }));
        if (user && user.settings) {
            applyUserSettings(user.settings);
        }
        return user;
    }

    // =========================================================================
    // 2. LESSONS & POSTS CRUD (GET /, POST /, PUT /, DELETE /)
    // =========================================================================
    function detectFileType(fileTypeHint, fileName, contentType, url) {
        const hasUrl = Boolean(url && String(url).trim() && String(url).trim() !== '#');
        const hint = String(fileTypeHint || '').toLowerCase().trim();
        if (['pdf', 'pptx', 'html', 'image'].includes(hint)) return hint;
        if (hint === 'ppt') return 'pptx';
        if (hint === 'htm') return 'html';
        if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(hint)) return 'image';

        const mime = String(contentType || '').toLowerCase();
        if (mime.includes('pdf')) return 'pdf';
        if (mime.startsWith('image/')) return 'image';
        if (mime.includes('html')) return 'html';
        if (mime.includes('presentation') || mime.includes('powerpoint')) return 'pptx';

        const cleanName = String(fileName || '').toLowerCase().split('?')[0].split('#')[0];
        const cleanUrl = String(url || '').toLowerCase().split('?')[0].split('#')[0];
        const candidates = [cleanName, cleanUrl];
        for (const target of candidates) {
            if (!target) continue;
            if (target.endsWith('.pdf')) return 'pdf';
            if (target.endsWith('.pptx') || target.endsWith('.ppt')) return 'pptx';
            if (target.endsWith('.html') || target.endsWith('.htm')) return 'html';
            if (/\.(png|jpe?g|webp|gif|svg|bmp)$/.test(target)) return 'image';
        }

        if (hint === 'post' && !hasUrl) return 'post';
        return hasUrl ? 'other' : 'post';
    }

    function resolveFileUrl(item, meta) {
        const direct = item.file_url || item.url || item.fileUrl || item.download_url || item.downloadUrl || item.r2_url || item.r2Url || item.href
            || meta.file_url || meta.url || meta.fileUrl || meta.download_url || meta.downloadUrl;
        if (direct && typeof direct === 'string' && direct.trim()) {
            const trimmed = direct.trim();
            if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
                return trimmed;
            }
            const cleaned = trimmed.replace(/^\/+/, '');
            return `${CLOUDFLARE_WORKER_URL}/${cleaned}`;
        }

        const key = item.key || item.file_key || item.fileKey || item.object_key || item.objectKey || item.path || meta.file_key || meta.fileKey || meta.key;
        if (key && typeof key === 'string' && key.trim()) {
            const cleanedKey = key.trim().replace(/^\/+/, '');
            return `${CLOUDFLARE_WORKER_URL}/${encodeURIComponent(cleanedKey).replace(/%2F/g, '/')}`;
        }
        return '';
    }

    function formatFileSize(bytesOrStr) {
        if (!bytesOrStr) return '';
        if (typeof bytesOrStr === 'string' && /[a-zA-Z]/.test(bytesOrStr)) {
            return bytesOrStr;
        }
        const num = Number(bytesOrStr);
        if (!Number.isFinite(num) || num <= 0) return '';
        if (num >= 1024 * 1024) return `${(num / (1024 * 1024)).toFixed(1)} MB`;
        if (num >= 1024) return `${Math.round(num / 1024)} KB`;
        return `${num} B`;
    }

    function getGradeDisplayName(gradeId) {
        if (!gradeId || String(gradeId) === 'all') return 'گشتی';
        const grades = global.GRADES_CONFIG || [];
        const match = grades.find(g => String(g.id) === String(gradeId));
        if (match) return match.shortName || match.name;
        if (String(gradeId) === 'univ') return 'زانکۆ و پەیمانگە';
        if (String(gradeId) === 'kg') return 'باخچەی ساوایان';
        return `پۆلا ${gradeId}`;
    }

    function normalizeLesson(rawItem, index) {
        const item = rawItem && typeof rawItem === 'object' ? rawItem : {};
        const meta = safeParseMeta(item.meta || item.metadata);

        const fileUrl = resolveFileUrl(item, meta);
        let urlBaseName = '';
        if (fileUrl && !fileUrl.startsWith('data:') && !fileUrl.startsWith('blob:')) {
            try {
                urlBaseName = decodeURIComponent(fileUrl.split('?')[0].split('/').pop() || '');
            } catch (e) {
                urlBaseName = fileUrl.split('?')[0].split('/').pop() || '';
            }
        }

        const title = item.title || meta.title || meta.name || item.name || item.file_name || item.fileName || urlBaseName || `وانە #${index + 1}`;
        const content = item.content !== undefined ? item.content
            : (meta.content !== undefined ? meta.content
                : (meta.description || item.description || meta.desc || item.desc || ''));
        const fileName = meta.fileName || meta.file_name || item.fileName || item.file_name || item.filename || item.originalName || item.key || urlBaseName || (fileUrl ? title : '');
        const contentType = item.contentType || item.content_type || item.mimeType || item.mime_type || meta.contentType || meta.content_type || meta.mimeType || '';
        const fileType = detectFileType(meta.fileType || meta.file_type || item.fileType || item.file_type || meta.format || item.format, fileName, contentType, fileUrl);

        const rawUserId = item.user_id !== undefined && item.user_id !== null && item.user_id !== ''
            ? item.user_id
            : (meta.user_id !== undefined && meta.user_id !== null && meta.user_id !== ''
                ? meta.user_id
                : (item.teacherId || meta.teacherId || ''));

        const role = item.role || meta.role || 'teacher';
        const authorName = item.author_name || meta.author_name || meta.teacherName || item.teacherName || meta.author || item.author || (role === 'student' ? 'قوتابی' : 'مامۆستا');

        const rawId = item.id !== undefined && item.id !== null ? item.id
            : (meta.id !== undefined && meta.id !== null ? meta.id
                : (item.key || `cf_${index}_${Date.now()}`));

        return {
            id: String(rawId),
            user_id: rawUserId !== '' ? String(rawUserId) : '',
            author_name: String(authorName),
            teacherName: String(authorName),
            role: role === 'student' ? 'student' : 'teacher',
            key: item.key || item.file_key || item.fileKey || '',
            title: String(title),
            content: String(content || ''),
            description: String(content || ''),
            grade: item.grade !== undefined && item.grade !== null && item.grade !== ''
                ? String(item.grade)
                : (meta.grade !== undefined && meta.grade !== null ? String(meta.grade) : ''),
            subject: meta.subject || item.subject || '',
            chapter: meta.chapter || item.chapter || '',
            lang: meta.lang || item.lang || '',
            fileName: String(fileName),
            fileSize: formatFileSize(meta.fileSize || meta.file_size || item.fileSize || item.file_size || item.size || meta.size),
            fileType: fileType,
            contentType: contentType,
            fileUrl: fileUrl,
            createdAt: item.created_at || item.createdAt || meta.createdAt || item.uploadedAt || item.uploaded || '',
            raw: item
        };
    }

    function extractArrayFromPayload(payload) {
        if (Array.isArray(payload)) return payload;
        if (payload && typeof payload === 'object') {
            const candidate = payload.lessons || payload.posts || payload.files || payload.items || payload.data || payload.objects || payload.results;
            if (Array.isArray(candidate)) return candidate;
        }
        return [];
    }

    async function fetchLessons() {
        isLoadingLessons = true;
        lastFetchError = null;
        try {
            const res = await fetch(CLOUDFLARE_WORKER_URL, {
                method: 'GET',
                cache: 'no-store',
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!res.ok) {
                throw new Error(`HTTP ${res.status}: نەشیا لیستا وانەیان ژ سێرڤەری بینیت.`);
            }

            const text = await res.text();
            let parsed = [];
            if (text && text.trim()) {
                try {
                    parsed = JSON.parse(text);
                } catch (parseErr) {
                    throw new Error('بەرسڤا سێرڤەری JSON یێ دروست نەبوو.');
                }
            }

            const arr = extractArrayFromPayload(parsed);
            cachedLessons = arr.map((item, idx) => normalizeLesson(item, idx));
            cachedLessons.sort((a, b) => {
                const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return (Number.isFinite(db) ? db : 0) - (Number.isFinite(da) ? da : 0);
            });

            global.dispatchEvent(new CustomEvent('cloudflareLessonsUpdated', { detail: cachedLessons }));
            return cachedLessons;
        } catch (err) {
            lastFetchError = err;
            throw err;
        } finally {
            isLoadingLessons = false;
        }
    }

    function uploadLesson(options) {
        const opts = options || {};
        const file = opts.file || null;
        const incomingMeta = opts.meta || {};
        const password = typeof opts.password === 'string' ? opts.password.trim() : '';
        const onProgress = typeof opts.onProgress === 'function' ? opts.onProgress : null;
        const currentUser = getCurrentUser();

        return new Promise((resolve, reject) => {
            const finalMeta = Object.assign({}, incomingMeta);

            if (currentUser) {
                if (finalMeta.user_id === undefined || finalMeta.user_id === '') {
                    finalMeta.user_id = currentUser.id;
                }
                if (!finalMeta.author_name) {
                    finalMeta.author_name = currentUser.full_name;
                }
                if (!finalMeta.teacherName) {
                    finalMeta.teacherName = currentUser.full_name;
                }
                if (!finalMeta.role) {
                    finalMeta.role = currentUser.role;
                }
            }

            if (finalMeta.content === undefined && finalMeta.description !== undefined) {
                finalMeta.content = finalMeta.description;
            }
            if (finalMeta.description === undefined && finalMeta.content !== undefined) {
                finalMeta.description = finalMeta.content;
            }

            if (currentUser && currentUser.role === 'student' && !isAdminUser() && !password) {
                const err = new Error('قوتابی نەشێت وانە یان فایلان بەلاڤ بکەت. بۆ نڤیسینا پۆستان بچۆ بەشێ پۆستێن گشتی.');
                err.code = 'FORBIDDEN_STUDENT';
                reject(err);
                return;
            }

            if (!canManageOrDownload() && !password) {
                const err = new Error('تەنێ مامۆستا و ئەدمین دشێن وانە و فایلان بار بکەن.');
                err.code = 'MISSING_AUTH';
                reject(err);
                return;
            }

            if (!file && !finalMeta.title && !finalMeta.content) {
                const err = new Error('تکایە ناڤونیشان، ناوەڕۆک یان فایلەکی بنڤیسە بۆ بەلاڤکرنێ.');
                err.code = 'MISSING_CONTENT';
                reject(err);
                return;
            }

            const formData = new FormData();
            if (file) {
                formData.append('file', file);
            }
            formData.append('meta', JSON.stringify(finalMeta));

            const xhr = new XMLHttpRequest();
            xhr.open('POST', CLOUDFLARE_WORKER_URL, true);
            if (password) {
                xhr.setRequestHeader('Authorization', 'Bearer ' + password);
            }

            if (xhr.upload && onProgress) {
                xhr.upload.onprogress = function (ev) {
                    if (ev.lengthComputable && ev.total > 0) {
                        const percent = Math.min(100, Math.round((ev.loaded / ev.total) * 100));
                        onProgress(percent, ev.loaded, ev.total);
                    }
                };
            }

            xhr.onload = async function () {
                const status = xhr.status;
                let respData = null;
                try {
                    respData = xhr.responseText ? JSON.parse(xhr.responseText) : null;
                } catch (e) {
                    respData = xhr.responseText || null;
                }

                if (status === 401) {
                    const err = new Error('پاسوۆرد یان دەسەڵات خەلەتە! (401 Unauthorized)');
                    err.status = 401;
                    err.code = 'UNAUTHORIZED';
                    err.response = respData;
                    reject(err);
                    return;
                }

                if (status < 200 || status >= 300) {
                    const serverMsg = (respData && (respData.error || respData.message)) || `HTTP ${status}`;
                    const err = new Error(`کێشە ل بارکرنێ دا چێبوو (${serverMsg})`);
                    err.status = status;
                    err.response = respData;
                    reject(err);
                    return;
                }

                if (onProgress) {
                    const sz = (file && file.size) || 1;
                    onProgress(100, sz, sz);
                }

                let refreshed = cachedLessons;
                try {
                    refreshed = await fetchLessons();
                } catch (refreshErr) {
                    console.warn('Cloudflare refresh after upload note:', refreshErr);
                }

                resolve({
                    ok: true,
                    status: status,
                    data: respData,
                    lessons: refreshed
                });
            };

            xhr.onerror = function () {
                const err = new Error('پەیوەندی ب سێرڤەرێ Cloudflare نەهاتە گرێدان. تکایە ئینتەرنێتێ خۆ بپشکنە.');
                err.code = 'NETWORK_ERROR';
                reject(err);
            };

            xhr.send(formData);
        });
    }

    async function updateLesson(payload) {
        const opts = payload || {};
        const user = getCurrentUser();
        const id = opts.id;
        const user_id = opts.user_id || (user && user.id);

        if (!id || !user_id) {
            throw new Error('ناسنامەیا بابەتی یان بەکارهێنەری دیار نینە.');
        }

        const body = {
            id: id,
            user_id: user_id,
            title: String(opts.title || '').trim(),
            content: String(opts.content || '').trim(),
            grade: opts.grade !== undefined ? String(opts.grade) : 'all'
        };

        const res = await fetch(CLOUDFLARE_WORKER_URL, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(body)
        });

        const text = await res.text();
        let data = null;
        try {
            data = text ? JSON.parse(text) : null;
        } catch (e) {
            data = { message: text };
        }

        if (!res.ok) {
            const msg = (data && (data.error || data.message)) || `HTTP ${res.status}`;
            throw new Error(`نەشیا تەعدیل بکەت (${msg})`);
        }

        await fetchLessons();
        return data;
    }

    async function deleteLesson(payload) {
        const opts = payload || {};
        const user = getCurrentUser();
        const id = opts.id;
        const user_id = opts.user_id || (user && user.id);

        if (!id || !user_id) {
            throw new Error('ناسنامەیا بابەتی یان بەکارهێنەری دیار نینە.');
        }

        const res = await fetch(CLOUDFLARE_WORKER_URL, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                id: id,
                user_id: user_id
            })
        });

        const text = await res.text();
        let data = null;
        try {
            data = text ? JSON.parse(text) : null;
        } catch (e) {
            data = { message: text };
        }

        if (!res.ok) {
            const msg = (data && (data.error || data.message)) || `HTTP ${res.status}`;
            throw new Error(`نەشیا ژێببەت (${msg})`);
        }

        await fetchLessons();
        return data;
    }

    // =========================================================================
    // 3. FORMAT HELPERS & IN-APP MODALS (PREVIEW, EDIT, DELETE, AUTH)
    // =========================================================================
    function getFormatVisuals(fileType, role) {
        switch (fileType) {
            case 'pdf':
                return { icon: 'fa-file-pdf', color: '#dc2626', bg: 'rgba(220,38,38,0.12)', label: 'PDF' };
            case 'image':
                return { icon: 'fa-file-image', color: '#7c3aed', bg: 'rgba(124,58,237,0.12)', label: 'وێنە' };
            case 'pptx':
                return { icon: 'fa-file-powerpoint', color: '#d83b01', bg: 'rgba(216,59,1,0.12)', label: 'PPTX' };
            case 'html':
                return { icon: 'fa-file-code', color: '#0284c7', bg: 'rgba(2,132,199,0.12)', label: 'HTML' };
            case 'post':
                return role === 'student'
                    ? { icon: 'fa-comment-dots', color: '#059669', bg: 'rgba(5,150,105,0.12)', label: 'پۆست / پرسیار' }
                    : { icon: 'fa-align-right', color: '#2563eb', bg: 'rgba(37,99,235,0.12)', label: 'تێبینی / وانە' };
            default:
                return { icon: 'fa-file-alt', color: '#2563eb', bg: 'rgba(37,99,235,0.12)', label: 'فایل' };
        }
    }

    function ensurePreviewModal() {
        let modal = document.getElementById('cf-universal-preview-modal');
        if (modal) return modal;

        modal = document.createElement('div');
        modal.id = 'cf-universal-preview-modal';
        modal.style.cssText = 'display:none; position:fixed; inset:0; z-index:999998; background:rgba(15,23,42,0.82); backdrop-filter:blur(4px); align-items:center; justify-content:center; padding:14px; box-sizing:border-box;';
        modal.innerHTML = `
            <div style="width:100%; max-width:960px; max-height:92vh; background:var(--surface-color, #ffffff); color:var(--primary-text, #111827); border-radius:18px; border:1px solid var(--border-color, #e5e7eb); box-shadow:0 24px 70px rgba(0,0,0,0.45); display:flex; flex-direction:column; overflow:hidden;">
                <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; padding:14px 18px; border-bottom:1px solid var(--border-color, #e5e7eb); flex-wrap:wrap;">
                    <div style="display:flex; align-items:center; gap:10px; text-align:right;">
                        <span id="cf-modal-badge" style="padding:4px 10px; border-radius:8px; font-size:0.78rem; font-weight:700;">PDF</span>
                        <div>
                            <h4 id="cf-modal-title" style="margin:0; font-size:1.05rem;">ناڤونیشانێ وانێ</h4>
                            <div id="cf-modal-meta" style="font-size:0.8rem; color:var(--secondary-text, #6b7280); margin-top:2px;"></div>
                        </div>
                    </div>
                    <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                        <a id="cf-modal-open-tab" href="#" target="_blank" rel="noopener noreferrer" style="padding:7px 13px; border-radius:9px; font-size:0.82rem; font-weight:600; text-decoration:none; border:1px solid var(--border-color, #d1d5db); color:var(--primary-text, #111827); display:inline-flex; align-items:center; gap:6px;">
                            <i class="fas fa-external-link-alt"></i> ڤەکرن ل پەڕێ نوو
                        </a>
                        <a id="cf-modal-download" href="#" download target="_blank" rel="noopener noreferrer" style="padding:7px 14px; border-radius:9px; font-size:0.82rem; font-weight:700; text-decoration:none; background:#2563eb; color:#ffffff; display:inline-flex; align-items:center; gap:6px;">
                            <i class="fas fa-download"></i> داگرتن
                        </a>
                        <button type="button" id="cf-modal-close" style="background:rgba(220,38,38,0.1); color:#dc2626; border:none; width:34px; height:34px; border-radius:50%; font-size:1.2rem; cursor:pointer; display:inline-flex; align-items:center; justify-content:center;" title="داخستن">
                            &times;
                        </button>
                    </div>
                </div>
                <div id="cf-modal-viewport" style="flex:1; min-height:360px; max-height:76vh; overflow:auto; background:#111827; display:flex; align-items:center; justify-content:center; padding:14px;"></div>
            </div>
        `;

        document.body.appendChild(modal);

        const closeBtn = modal.querySelector('#cf-modal-close');
        const viewport = modal.querySelector('#cf-modal-viewport');
        function closeModal() {
            modal.style.display = 'none';
            if (viewport) viewport.innerHTML = '';
        }
        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        return modal;
    }

    let serverProxyStatusPromise = null;
    let serverProxyReady = false;

    async function checkServerGeminiProxy() {
        if (serverProxyStatusPromise) return serverProxyStatusPromise;
        serverProxyStatusPromise = (async () => {
            try {
                const res = await fetch('/api/gemini/status', {
                    method: 'GET',
                    headers: { 'Accept': 'application/json' },
                    cache: 'no-store'
                });
                const ct = res.headers.get('content-type') || '';
                if (!res.ok || !ct.includes('application/json')) {
                    serverProxyReady = false;
                    return false;
                }
                const data = await res.json();
                serverProxyReady = Boolean(data && data.ready === true);
                return serverProxyReady;
            } catch (e) {
                serverProxyReady = false;
                return false;
            }
        })();
        return serverProxyStatusPromise;
    }

    function getActiveUserOrProxyToken() {
      return localStorage.getItem('user_gemini_api_key') || localStorage.getItem('gk') || 'server-proxy';
    }

    function emitProxyTokenPostMessage(targetWin) {
      if (!targetWin || typeof targetWin.postMessage !== 'function') return;
      var activeToken = getActiveUserOrProxyToken();
      var payload = { type: 'SET_API_KEY', apiKey: activeToken };
      try {
        targetWin.postMessage(payload, window.location.origin);
      } catch (e) {
        try {
          targetWin.postMessage(payload, '*');
        } catch (err) {}
      }
    }

    function attachProxyLoadBridge(iframeEl) {
      if (!iframeEl || iframeEl.dataset.parwardaProxyLoadBound === '1') return;
      iframeEl.dataset.parwardaProxyLoadBound = '1';
      iframeEl.addEventListener('load', async function () {
        const hasUserKey = Boolean(localStorage.getItem('user_gemini_api_key') || localStorage.getItem('gk'));
        const proxyOk = hasUserKey || serverProxyReady || await checkServerGeminiProxy();
        if (!proxyOk) return;
        emitProxyTokenPostMessage(iframeEl.contentWindow);
      });
    }

    function buildHtmlProxyBridgeScript(originUrl) {
        const safeOrigin = JSON.stringify(String(originUrl || window.location.origin));
        const wsOrigin = JSON.stringify(String(originUrl || window.location.origin).replace(/^http:/i, 'ws:').replace(/^https:/i, 'wss:'));
        const userKeyVal = localStorage.getItem('user_gemini_api_key') || localStorage.getItem('gk') || '';
        const safeToken = JSON.stringify(userKeyVal || 'server-proxy');
        const useDirectUserKey = Boolean(userKeyVal && !serverProxyReady);
        return `<script data-parwarda-gemini-bridge="1">
(function(){
  try {
    var ORIGIN = ${safeOrigin};
    var WS_ORIGIN = ${wsOrigin};
    var PROXY_TOKEN = ${safeToken};
    var USE_DIRECT = ${useDirectUserKey ? 'true' : 'false'};
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
      if (!val && (key === 'gk' || key === 'gk2' || key === 'user_gemini_api_key')) return PROXY_TOKEN;
      return val;
    };
    var origFetch = window.fetch;
    if (typeof origFetch === 'function' && !USE_DIRECT) {
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
    if (typeof OrigWS === 'function' && !USE_DIRECT) {
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
    document.addEventListener('DOMContentLoaded', function() {
      ['ak', 'cbk'].forEach(function(id) {
        var el = document.getElementById(id);
        if (el && !el.value) el.value = PROXY_TOKEN;
      });
      dispatchProxyToken();
    });
    window.addEventListener('load', dispatchProxyToken);
  } catch (e) {}
})();
</script>`;
    }

    function prepareHtmlForPreview(rawHtml, sourceUrl) {
        if (!rawHtml || typeof rawHtml !== 'string') return rawHtml;
        const hasUserKey = Boolean(localStorage.getItem('user_gemini_api_key') || localStorage.getItem('gk'));
        if (!serverProxyReady && !hasUserKey) return rawHtml;
        if (rawHtml.indexOf('data-parwarda-gemini-bridge') !== -1) return rawHtml;

        const baseTag = (sourceUrl && /^https?:\/\//i.test(sourceUrl) && !/<base\b/i.test(rawHtml))
            ? `<base href="${escapeHtml(sourceUrl)}">`
            : '';
        const injection = baseTag + buildHtmlProxyBridgeScript(window.location.origin);

        if (/<head[^>]*>/i.test(rawHtml)) {
            return rawHtml.replace(/<head[^>]*>/i, (m) => `${m}\n${injection}`);
        }
        if (/<html[^>]*>/i.test(rawHtml)) {
            return rawHtml.replace(/<html[^>]*>/i, (m) => `${m}\n<head>${injection}</head>`);
        }
        return `${injection}\n${rawHtml}`;
    }

    function openLessonPreview(lesson) {
        if (!lesson) return;
        const modal = ensurePreviewModal();
        const badgeEl = modal.querySelector('#cf-modal-badge');
        const titleEl = modal.querySelector('#cf-modal-title');
        const metaEl = modal.querySelector('#cf-modal-meta');
        const openTabEl = modal.querySelector('#cf-modal-open-tab');
        const downloadEl = modal.querySelector('#cf-modal-download');
        const viewportEl = modal.querySelector('#cf-modal-viewport');

        const vis = getFormatVisuals(lesson.fileType, lesson.role);
        if (badgeEl) {
            badgeEl.textContent = vis.label;
            badgeEl.style.background = vis.bg;
            badgeEl.style.color = vis.color;
        }
        if (titleEl) titleEl.textContent = lesson.title;
        if (metaEl) {
            const roleLabel = lesson.role === 'student' ? 'قوتابی' : 'مامۆستا';
            const parts = [
                getGradeDisplayName(lesson.grade),
                lesson.subject || null,
                `${lesson.author_name} (${roleLabel})`,
                lesson.fileSize || null
            ].filter(Boolean);
            metaEl.textContent = parts.join(' • ');
        }

        const hasFileUrl = Boolean(lesson.fileUrl && lesson.fileUrl !== '#');
        const safeUrl = lesson.fileUrl || '#';
        const canDownload = canManageOrDownload();

        if (openTabEl) {
            openTabEl.href = canDownload ? safeUrl : '#';
            openTabEl.style.display = (hasFileUrl && canDownload) ? 'inline-flex' : 'none';
        }
        if (downloadEl) {
            downloadEl.href = canDownload ? safeUrl : '#';
            downloadEl.download = lesson.fileName || lesson.title || 'lesson';
            downloadEl.style.display = (hasFileUrl && canDownload) ? 'inline-flex' : 'none';
        }

        if (viewportEl) {
            if (!canDownload) {
                viewportEl.oncontextmenu = function () { return false; };
                viewportEl.style.userSelect = 'none';
                viewportEl.style.webkitUserSelect = 'none';
            } else {
                viewportEl.oncontextmenu = null;
                viewportEl.style.userSelect = '';
                viewportEl.style.webkitUserSelect = '';
            }

            if (!hasFileUrl) {
                viewportEl.style.background = 'var(--surface-color, #ffffff)';
                viewportEl.innerHTML = `
                    <div style="width:100%; max-width:680px; padding:24px; text-align:right; color:var(--primary-text, #111827); line-height:1.8;">
                        <div style="display:inline-flex; align-items:center; gap:8px; padding:6px 12px; border-radius:10px; background:${vis.bg}; color:${vis.color}; font-weight:700; font-size:0.85rem; margin-bottom:14px;">
                            <i class="fas ${vis.icon}"></i> ${escapeHtml(lesson.author_name)} • ${lesson.role === 'student' ? 'قوتابی' : 'مامۆستا'}
                        </div>
                        <h3 style="margin:0 0 12px; font-size:1.25rem;">${escapeHtml(lesson.title)}</h3>
                        <p style="margin:0; white-space:pre-wrap; font-size:0.98rem; color:var(--primary-text, #111827); background:rgba(0,0,0,0.03); padding:16px; border-radius:12px; border:1px solid var(--border-color, #e5e7eb);">${escapeHtml(lesson.content || 'چ تێبینییێن زێدە نینن.')}</p>
                    </div>
                `;
            } else {
                viewportEl.style.background = '#111827';
                viewportEl.style.padding = (lesson.fileType === 'html' || lesson.fileType === 'pdf' || lesson.fileType === 'pptx') ? '0' : '14px';
                if (lesson.fileType === 'image') {
                    viewportEl.innerHTML = `<img src="${escapeHtml(safeUrl)}" alt="${escapeHtml(lesson.title)}" ${!canDownload ? 'draggable="false" oncontextmenu="return false;"' : ''} style="max-width:100%; max-height:74vh; object-fit:contain; border-radius:10px; box-shadow:0 8px 30px rgba(0,0,0,0.45); ${!canDownload ? 'pointer-events:none; user-select:none;' : ''}">`;
                } else if (lesson.fileType === 'html') {
                    viewportEl.innerHTML = `<iframe id="cf-html-preview-iframe" src="${escapeHtml(safeUrl)}" ${!canDownload ? 'sandbox="allow-scripts allow-same-origin allow-forms"' : ''} style="width:100%; height:74vh; min-height:420px; border:none; background:#ffffff; display:block;" allowfullscreen allow="fullscreen; autoplay; microphone; clipboard-write; encrypted-media"></iframe>`;
                    const initialFrame = viewportEl.querySelector('#cf-html-preview-iframe');
                    if (initialFrame) attachProxyLoadBridge(initialFrame);
                    (async function () {
                        const hasUserKey = Boolean(localStorage.getItem('user_gemini_api_key') || localStorage.getItem('gk'));
                        const proxyOk = hasUserKey || await checkServerGeminiProxy();
                        if (!proxyOk || !/^https?:\/\//i.test(safeUrl)) return;
                        try {
                            const htmlResp = await fetch(safeUrl, { mode: 'cors' });
                            if (!htmlResp.ok) return;
                            const rawHtml = await htmlResp.text();
                            if (!rawHtml || modal.style.display === 'none') return;
                            const frame = viewportEl.querySelector('#cf-html-preview-iframe');
                            if (frame) {
                                attachProxyLoadBridge(frame);
                                frame.removeAttribute('src');
                                frame.srcdoc = prepareHtmlForPreview(rawHtml, safeUrl);
                            }
                        } catch (e) {}
                    })();
                } else if (lesson.fileType === 'pdf') {
                    const gviewUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(safeUrl)}`;
                    const pdfEmbedParams = canDownload ? '#toolbar=1' : '#toolbar=0&navpanes=0&scrollbar=1';
                    viewportEl.innerHTML = `
                        <div style="width:100%; height:74vh; min-height:420px; display:flex; flex-direction:column; background:#1f2937;">
                            <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; padding:8px 12px; background:#0f172a; color:#e5e7eb; font-size:0.8rem; flex-wrap:wrap;">
                                <span><i class="fas fa-file-pdf" style="color:#f87171;"></i> پێشبینینا PDF ${!canDownload ? '• تەنێ بۆ تەماشەکرنێ' : ''}</span>
                                <div style="display:flex; gap:6px;">
                                    <button type="button" id="cf-pdf-fallback-btn" style="padding:4px 10px; border-radius:7px; border:1px solid #475569; background:#1e293b; color:#fff; cursor:pointer; font-family:inherit; font-size:0.78rem;">
                                        <i class="fas fa-sync-alt"></i> شێوازێ پێشبینینێ بگۆهۆڕە
                                    </button>
                                    ${canDownload ? `
                                    <a href="${escapeHtml(safeUrl)}" target="_blank" rel="noopener noreferrer" style="padding:4px 10px; border-radius:7px; background:#2563eb; color:#fff; text-decoration:none; font-weight:700; font-size:0.78rem;">
                                        <i class="fas fa-external-link-alt"></i> ڤەکرنا ڕاستەوخۆ
                                    </a>
                                    ` : ''}
                                </div>
                            </div>
                            <iframe id="cf-pdf-iframe" src="${escapeHtml(safeUrl)}${pdfEmbedParams}" style="flex:1; width:100%; border:none; background:#ffffff;"></iframe>
                        </div>
                    `;
                    const toggleBtn = viewportEl.querySelector('#cf-pdf-fallback-btn');
                    const pdfFrame = viewportEl.querySelector('#cf-pdf-iframe');
                    if (toggleBtn && pdfFrame) {
                        let usingGview = false;
                        toggleBtn.addEventListener('click', () => {
                            usingGview = !usingGview;
                            pdfFrame.src = usingGview ? gviewUrl : `${safeUrl}${pdfEmbedParams}`;
                        });
                    }
                } else if (lesson.fileType === 'pptx') {
                    const officeEmbedUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(safeUrl)}`;
                    const officeUrl = `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(safeUrl)}`;
                    if (!canDownload) {
                        viewportEl.innerHTML = `
                            <div style="width:100%; height:74vh; min-height:420px; display:flex; flex-direction:column; background:#1f2937;">
                                <div style="display:flex; align-items:center; justify-content:space-between; padding:8px 12px; background:#0f172a; color:#e5e7eb; font-size:0.8rem;">
                                    <span><i class="fas fa-file-powerpoint" style="color:#fb923c;"></i> تەماشاکرنا سلایدان (View Only)</span>
                                </div>
                                <iframe src="${escapeHtml(officeEmbedUrl)}" style="flex:1; width:100%; border:none; background:#ffffff;" allowfullscreen></iframe>
                            </div>
                        `;
                    } else {
                        viewportEl.innerHTML = `
                            <div style="text-align:center; padding:30px; color:#f9fafb; max-width:520px; margin:auto;">
                                <i class="fas fa-file-powerpoint" style="font-size:3.5rem; color:#d83b01; margin-bottom:14px;"></i>
                                <h3 style="margin:0 0 10px;">فایلێ پاوەرپۆینت (${escapeHtml(lesson.fileName)})</h3>
                                <p style="margin:0 0 18px; color:#d1d5db; font-size:0.9rem;">دشێی فایلێ دابگری یان ب ڕێکا Microsoft Office Viewer ڤەکەی.</p>
                                <div style="display:flex; justify-content:center; gap:10px; flex-wrap:wrap;">
                                    <a href="${escapeHtml(safeUrl)}" download target="_blank" rel="noopener noreferrer" style="padding:10px 18px; border-radius:10px; background:#d83b01; color:#fff; text-decoration:none; font-weight:700;">
                                        <i class="fas fa-download"></i> داگرتنا PPTX
                                    </a>
                                    <a href="${escapeHtml(officeUrl)}" target="_blank" rel="noopener noreferrer" style="padding:10px 18px; border-radius:10px; border:1px solid #6b7280; color:#fff; text-decoration:none; font-weight:600;">
                                        <i class="fas fa-external-link-alt"></i> ڤەکرن ل Office Viewer
                                    </a>
                                </div>
                            </div>
                        `;
                    }
                } else {
                    if (!canDownload) {
                        viewportEl.innerHTML = `<iframe src="${escapeHtml(safeUrl)}" style="width:100%; height:74vh; min-height:420px; border:none; background:#ffffff; display:block;" allowfullscreen></iframe>`;
                    } else {
                        viewportEl.innerHTML = `
                            <div style="text-align:center; padding:30px; color:#f9fafb; max-width:480px;">
                                <i class="fas fa-file-alt" style="font-size:3.5rem; color:#60a5fa; margin-bottom:14px;"></i>
                                <h3 style="margin:0 0 10px;">${escapeHtml(lesson.title)}</h3>
                                <p style="margin:0 0 18px; color:#d1d5db; font-size:0.9rem;">${escapeHtml(lesson.content || 'فایل ئامادەیە بۆ داگرتن یان ڤەکرن.')}</p>
                                <div style="display:flex; justify-content:center; gap:10px; flex-wrap:wrap;">
                                    <a href="${escapeHtml(safeUrl)}" target="_blank" rel="noopener noreferrer" style="padding:10px 20px; border-radius:10px; background:#059669; color:#fff; text-decoration:none; font-weight:700; display:inline-flex; align-items:center; gap:8px;">
                                        <i class="fas fa-external-link-alt"></i> ڤەکرنا فایلێ
                                    </a>
                                    <a href="${escapeHtml(safeUrl)}" download target="_blank" rel="noopener noreferrer" style="padding:10px 20px; border-radius:10px; background:#2563eb; color:#fff; text-decoration:none; font-weight:700; display:inline-flex; align-items:center; gap:8px;">
                                        <i class="fas fa-download"></i> داگرتنا فایلێ
                                    </a>
                                </div>
                            </div>
                        `;
                    }
                }
            }
        }

        modal.style.display = 'flex';
    }

    function buildGradeOptionsHtml(selectedVal) {
        const grades = (global.GRADES_CONFIG && global.GRADES_CONFIG.length)
            ? global.GRADES_CONFIG
            : [
                { id: '12', name: 'پۆلا ١٢ (دوازدێ)' },
                { id: '11', name: 'پۆلا ١١ (یازدێ)' },
                { id: '10', name: 'پۆلا ١٠ (دەهێ)' },
                { id: 'univ', name: 'زانکۆ و پەیمانگەکان' }
            ];
        return `<option value="all" ${!selectedVal || selectedVal === 'all' ? 'selected' : ''}>گشتی (هەمی پۆل)</option>` +
            grades.map(g => `<option value="${escapeHtml(g.id)}" ${String(selectedVal) === String(g.id) ? 'selected' : ''}>${escapeHtml(g.name)}</option>`).join('');
    }

    function openEditModal(lesson) {
        if (!lesson) return;
        let modal = document.getElementById('cf-edit-post-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'cf-edit-post-modal';
            modal.style.cssText = 'display:none; position:fixed; inset:0; z-index:999999; background:rgba(15,23,42,0.78); backdrop-filter:blur(4px); align-items:center; justify-content:center; padding:14px; box-sizing:border-box;';
            modal.innerHTML = `
                <div style="width:100%; max-width:500px; background:var(--surface-color, #ffffff); color:var(--primary-text, #111827); border-radius:20px; border:1px solid var(--border-color, #e5e7eb); box-shadow:0 24px 65px rgba(0,0,0,0.4); padding:24px; text-align:right; direction:rtl;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; border-bottom:1px solid var(--border-color, #e5e7eb); padding-bottom:10px;">
                        <h3 style="margin:0; font-size:1.18rem; display:flex; align-items:center; gap:8px;">
                            <i class="fas fa-edit" style="color:var(--blue-accent, #2563eb);"></i> تەعدیلکرنا بابەتی (Edit)
                        </h3>
                        <button type="button" id="cf-edit-close-btn" style="background:none; border:none; font-size:1.4rem; color:var(--secondary-text, #6b7280); cursor:pointer;">&times;</button>
                    </div>
                    <form id="cf-edit-post-form">
                        <input type="hidden" id="cf-edit-id">
                        <div class="form-group" style="margin-bottom:12px;">
                            <label style="display:block; font-weight:700; margin-bottom:5px; font-size:0.88rem;">ناڤونیشان:</label>
                            <input type="text" id="cf-edit-title" required style="width:100%; padding:10px 12px; border-radius:10px; border:1px solid var(--border-color, #d1d5db); background:var(--surface-color, #fff); color:var(--primary-text, #111827); font-family:inherit; box-sizing:border-box;">
                        </div>
                        <div class="form-group" style="margin-bottom:12px;">
                            <label style="display:block; font-weight:700; margin-bottom:5px; font-size:0.88rem;">پۆل / قۆناغ:</label>
                            <select id="cf-edit-grade" style="width:100%; padding:10px 12px; border-radius:10px; border:1px solid var(--border-color, #d1d5db); background:var(--surface-color, #fff); color:var(--primary-text, #111827); font-family:inherit; box-sizing:border-box;"></select>
                        </div>
                        <div class="form-group" style="margin-bottom:14px;">
                            <label style="display:block; font-weight:700; margin-bottom:5px; font-size:0.88rem;">ناوەڕۆک / وەسف:</label>
                            <textarea id="cf-edit-content" rows="4" style="width:100%; padding:10px 12px; border-radius:10px; border:1px solid var(--border-color, #d1d5db); background:var(--surface-color, #fff); color:var(--primary-text, #111827); font-family:inherit; box-sizing:border-box;"></textarea>
                        </div>
                        <div id="cf-edit-error" style="display:none; color:#dc2626; font-size:0.86rem; font-weight:700; margin-bottom:12px; padding:8px 12px; background:rgba(220,38,38,0.08); border-radius:8px;"></div>
                        <div style="display:flex; gap:10px; justify-content:flex-end;">
                            <button type="button" id="cf-edit-cancel-btn" class="btn-cancel" style="padding:10px 18px; border-radius:10px; cursor:pointer;">داخستن</button>
                            <button type="submit" id="cf-edit-save-btn" class="btn-save" style="padding:10px 22px; border-radius:10px; background:#2563eb; color:#fff; cursor:pointer;">
                                <i class="fas fa-save"></i> پاشکەفتنا گوهۆڕینان
                            </button>
                        </div>
                    </form>
                </div>
            `;
            document.body.appendChild(modal);

            const closeEdit = () => { modal.style.display = 'none'; };
            modal.querySelector('#cf-edit-close-btn').addEventListener('click', closeEdit);
            modal.querySelector('#cf-edit-cancel-btn').addEventListener('click', closeEdit);
            modal.addEventListener('click', (e) => { if (e.target === modal) closeEdit(); });

            modal.querySelector('#cf-edit-post-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                const id = modal.querySelector('#cf-edit-id').value;
                const title = modal.querySelector('#cf-edit-title').value.trim();
                const grade = modal.querySelector('#cf-edit-grade').value;
                const content = modal.querySelector('#cf-edit-content').value.trim();
                const errEl = modal.querySelector('#cf-edit-error');
                const saveBtn = modal.querySelector('#cf-edit-save-btn');
                const user = getCurrentUser();

                if (!title) {
                    errEl.textContent = 'تکایە ناڤونیشانی بنڤیسە.';
                    errEl.style.display = 'block';
                    return;
                }

                errEl.style.display = 'none';
                saveBtn.disabled = true;
                saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> پاشکەفتکرن...';
                try {
                    await updateLesson({
                        id: id,
                        user_id: user ? user.id : '',
                        title: title,
                        content: content,
                        grade: grade
                    });
                    modal.style.display = 'none';
                    showCfToast('بابەت ب سەرکەفتوویی هاتە تەعدیلکرن! ✅', 'success');
                } catch (err) {
                    errEl.textContent = err.message || 'تەعدیلکرن سەرنەگرت.';
                    errEl.style.display = 'block';
                } finally {
                    saveBtn.disabled = false;
                    saveBtn.innerHTML = '<i class="fas fa-save"></i> پاشکەفتنا گوهۆڕینان';
                }
            });
        }

        modal.querySelector('#cf-edit-id').value = lesson.id;
        modal.querySelector('#cf-edit-title').value = lesson.title || '';
        modal.querySelector('#cf-edit-grade').innerHTML = buildGradeOptionsHtml(lesson.grade);
        modal.querySelector('#cf-edit-content').value = lesson.content || lesson.description || '';
        modal.querySelector('#cf-edit-error').style.display = 'none';
        modal.style.display = 'flex';
    }

    function openDeleteConfirmModal(lesson) {
        if (!lesson) return;
        let modal = document.getElementById('cf-delete-confirm-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'cf-delete-confirm-modal';
            modal.style.cssText = 'display:none; position:fixed; inset:0; z-index:999999; background:rgba(15,23,42,0.78); backdrop-filter:blur(4px); align-items:center; justify-content:center; padding:14px; box-sizing:border-box;';
            modal.innerHTML = `
                <div style="width:100%; max-width:420px; background:var(--surface-color, #ffffff); color:var(--primary-text, #111827); border-radius:20px; border:1px solid rgba(220,38,38,0.35); box-shadow:0 24px 65px rgba(0,0,0,0.4); padding:24px; text-align:center; direction:rtl;">
                    <div style="width:58px; height:58px; border-radius:50%; background:rgba(220,38,38,0.12); color:#dc2626; display:inline-flex; align-items:center; justify-content:center; font-size:1.6rem; margin-bottom:12px;">
                        <i class="fas fa-trash-alt"></i>
                    </div>
                    <h3 style="margin:0 0 8px; font-size:1.15rem;">پشتراستکرنا ژێبرنێ (Delete)</h3>
                    <p id="cf-del-msg" style="margin:0 0 14px; font-size:0.9rem; color:var(--secondary-text, #6b7280); line-height:1.5;"></p>
                    <div id="cf-del-error" style="display:none; color:#dc2626; font-size:0.84rem; font-weight:700; margin-bottom:12px;"></div>
                    <div style="display:flex; gap:10px; justify-content:center;">
                        <button type="button" id="cf-del-cancel-btn" class="btn-cancel" style="flex:1; padding:10px; border-radius:10px; cursor:pointer;">پەشیمانبوون</button>
                        <button type="button" id="cf-del-confirm-btn" class="btn-save" style="flex:1; padding:10px; border-radius:10px; background:#dc2626; color:#fff; cursor:pointer;">
                            <i class="fas fa-trash"></i> بەلێ، ژێببە
                        </button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            modal.querySelector('#cf-del-cancel-btn').addEventListener('click', () => {
                modal.style.display = 'none';
            });
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.style.display = 'none';
            });
        }

        const msgEl = modal.querySelector('#cf-del-msg');
        const errEl = modal.querySelector('#cf-del-error');
        const confirmBtn = modal.querySelector('#cf-del-confirm-btn');

        msgEl.innerHTML = `تۆ پشتراستی دڤێت «<strong>${escapeHtml(lesson.title)}</strong>» ژ سێرڤەری ژێببەی؟`;
        errEl.style.display = 'none';

        const freshConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(freshConfirmBtn, confirmBtn);

        freshConfirmBtn.addEventListener('click', async () => {
            const user = getCurrentUser();
            freshConfirmBtn.disabled = true;
            freshConfirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ژێبرن...';
            errEl.style.display = 'none';
            try {
                await deleteLesson({
                    id: lesson.id,
                    user_id: user ? user.id : lesson.user_id
                });
                modal.style.display = 'none';
                showCfToast('بابەت ب سەرکەفتوویی هاتە ژێبرن.', 'info');
            } catch (err) {
                errEl.textContent = err.message || 'ژێبرن سەرنەگرت.';
                errEl.style.display = 'block';
            } finally {
                freshConfirmBtn.disabled = false;
                freshConfirmBtn.innerHTML = '<i class="fas fa-trash"></i> بەلێ، ژێببە';
            }
        });

        modal.style.display = 'flex';
    }

    function openAuthModal(initialMode, customNotice) {
        let modal = document.getElementById('cf-auth-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'cf-auth-modal';
            modal.style.cssText = 'display:none; position:fixed; inset:0; z-index:999999; background:rgba(15,23,42,0.8); backdrop-filter:blur(5px); align-items:center; justify-content:center; padding:14px; box-sizing:border-box; overflow-y:auto;';
            modal.innerHTML = `
                <div style="width:100%; max-width:480px; background:var(--surface-color, #ffffff); color:var(--primary-text, #111827); border-radius:22px; border:1px solid var(--border-color, #e5e7eb); box-shadow:0 25px 70px rgba(0,0,0,0.45); padding:26px 22px; text-align:right; direction:rtl; position:relative; margin:auto;">
                    <button type="button" id="cf-auth-close-btn" style="position:absolute; top:14px; left:14px; background:rgba(0,0,0,0.06); border:none; width:34px; height:34px; border-radius:50%; font-size:1.25rem; color:var(--secondary-text, #6b7280); cursor:pointer; display:flex; align-items:center; justify-content:center;">&times;</button>

                    <div style="text-align:center; margin-bottom:18px;">
                        <div style="width:58px; height:58px; border-radius:16px; background:linear-gradient(135deg, rgba(37,99,235,0.14), rgba(5,150,105,0.14)); color:var(--blue-accent, #2563eb); display:inline-flex; align-items:center; justify-content:center; font-size:1.6rem; margin-bottom:10px;">
                            <i class="fas fa-user-shield"></i>
                        </div>
                        <h3 style="margin:0 0 4px; font-size:1.3rem; font-weight:800;">سیستەمێ هەژماران (Cloudflare)</h3>
                        <p id="cf-auth-notice" style="margin:0; font-size:0.84rem; color:var(--secondary-text, #6b7280);">هەموو پۆست و ڕێکخستنێن تە لسەر هەر ئامێرەکێ دێ پاراستی بن</p>
                    </div>

                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; background:rgba(100,116,139,0.08); padding:5px; border-radius:12px; margin-bottom:18px;">
                        <button type="button" id="cf-tab-login-btn" style="padding:10px; border:none; border-radius:9px; font-family:inherit; font-weight:700; font-size:0.9rem; cursor:pointer; transition:all 0.2s;">
                            <i class="fas fa-sign-in-alt"></i> چوونەژوور (Login)
                        </button>
                        <button type="button" id="cf-tab-register-btn" style="padding:10px; border:none; border-radius:9px; font-family:inherit; font-weight:700; font-size:0.9rem; cursor:pointer; transition:all 0.2s;">
                            <i class="fas fa-user-plus"></i> دروستکرنا هەژمارێ
                        </button>
                    </div>

                    <!-- LOGIN FORM -->
                    <form id="cf-modal-login-form">
                        <div class="form-group" style="margin-bottom:12px;">
                            <label style="display:block; font-weight:700; font-size:0.86rem; margin-bottom:5px;">یوزەرنەیم (Username)</label>
                            <input type="text" id="cf-login-username" required placeholder="بۆ نموونە: ahmed_99" style="width:100%; padding:10px 12px; border-radius:10px; border:1px solid var(--border-color, #d1d5db); background:var(--surface-color, #fff); color:var(--primary-text, #111827); font-family:inherit; box-sizing:border-box;">
                        </div>
                        <div class="form-group" style="margin-bottom:14px;">
                            <label style="display:block; font-weight:700; font-size:0.86rem; margin-bottom:5px;">پاسوۆرد (Password)</label>
                            <input type="password" id="cf-login-password" required placeholder="••••••••" style="width:100%; padding:10px 12px; border-radius:10px; border:1px solid var(--border-color, #d1d5db); background:var(--surface-color, #fff); color:var(--primary-text, #111827); font-family:inherit; box-sizing:border-box;">
                        </div>
                        <div id="cf-login-err" style="display:none; color:#dc2626; font-size:0.85rem; font-weight:700; margin-bottom:12px; padding:8px 12px; background:rgba(220,38,38,0.08); border-radius:8px;"></div>
                        <button type="submit" id="cf-login-submit-btn" class="btn-save" style="width:100%; padding:12px; border-radius:12px; font-size:0.98rem; font-weight:700; background:linear-gradient(135deg, #2563eb, #1d4ed8); color:#fff; justify-content:center; cursor:pointer;">
                            <i class="fas fa-sign-in-alt"></i> چوونەژوور (Login)
                        </button>
                    </form>

                    <!-- REGISTER FORM -->
                    <form id="cf-modal-register-form" style="display:none;">
                        <div class="form-group" style="margin-bottom:10px;">
                            <label style="display:block; font-weight:700; font-size:0.86rem; margin-bottom:5px;">ناڤێ تەمام (Full Name)</label>
                            <input type="text" id="cf-reg-fullname" required placeholder="بۆ نموونە: ئەحمەد حسێن عەلی" style="width:100%; padding:10px 12px; border-radius:10px; border:1px solid var(--border-color, #d1d5db); background:var(--surface-color, #fff); color:var(--primary-text, #111827); font-family:inherit; box-sizing:border-box;">
                        </div>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:10px;">
                            <div class="form-group" style="margin:0;">
                                <label style="display:block; font-weight:700; font-size:0.86rem; margin-bottom:5px;">یوزەرنەیم (Username)</label>
                                <input type="text" id="cf-reg-username" required placeholder="ahmed_99" style="width:100%; padding:10px 12px; border-radius:10px; border:1px solid var(--border-color, #d1d5db); background:var(--surface-color, #fff); color:var(--primary-text, #111827); font-family:inherit; box-sizing:border-box; direction:ltr; text-align:right;">
                            </div>
                            <div class="form-group" style="margin:0;">
                                <label style="display:block; font-weight:700; font-size:0.86rem; margin-bottom:5px;">پاسوۆرد (Password)</label>
                                <input type="password" id="cf-reg-password" required placeholder="••••••••" style="width:100%; padding:10px 12px; border-radius:10px; border:1px solid var(--border-color, #d1d5db); background:var(--surface-color, #fff); color:var(--primary-text, #111827); font-family:inherit; box-sizing:border-box;">
                            </div>
                        </div>

                        <div style="margin-bottom:12px;">
                            <label style="display:block; font-weight:700; font-size:0.86rem; margin-bottom:6px;">جۆرێ هەژمارێ:</label>
                            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                                <label id="cf-role-card-student" style="display:flex; align-items:center; justify-content:center; gap:8px; padding:10px; border-radius:10px; border:2px solid #16a34a; background:rgba(22,163,74,0.1); cursor:pointer; font-weight:700; font-size:0.9rem;">
                                    <input type="radio" name="cf_reg_role" value="student" checked style="display:none;">
                                    <i class="fas fa-user-graduate" style="color:#16a34a;"></i> قوتابی
                                </label>
                                <label id="cf-role-card-teacher" style="display:flex; align-items:center; justify-content:center; gap:8px; padding:10px; border-radius:10px; border:2px solid var(--border-color, #d1d5db); background:transparent; cursor:pointer; font-weight:700; font-size:0.9rem;">
                                    <input type="radio" name="cf_reg_role" value="teacher" style="display:none;">
                                    <i class="fas fa-chalkboard-teacher" style="color:#7c3aed;"></i> مامۆستا
                                </label>
                            </div>
                        </div>

                        <div id="cf-reg-teacher-code-wrap" style="display:none; background:rgba(124,58,237,0.08); border:1.5px solid rgba(124,58,237,0.3); border-radius:12px; padding:12px; margin-bottom:12px;">
                            <label style="display:block; font-weight:700; font-size:0.85rem; color:#6d28d9; margin-bottom:5px;">
                                <i class="fas fa-key"></i> کۆدێ نهێنی یێ مامۆستایان (teacher_code):
                            </label>
                            <input type="password" id="cf-reg-teacher-code" placeholder="کۆدێ نهێنی یێ مامۆستایان بنڤیسە..." style="width:100%; padding:9px 12px; border-radius:9px; border:1px solid rgba(124,58,237,0.35); background:var(--surface-color, #fff); color:var(--primary-text, #111827); font-family:inherit; box-sizing:border-box;">
                        </div>

                        <div id="cf-reg-err" style="display:none; color:#dc2626; font-size:0.85rem; font-weight:700; margin-bottom:12px; padding:8px 12px; background:rgba(220,38,38,0.08); border-radius:8px;"></div>

                        <button type="submit" id="cf-reg-submit-btn" class="btn-save" style="width:100%; padding:12px; border-radius:12px; font-size:0.98rem; font-weight:700; background:linear-gradient(135deg, #16a34a, #15803d); color:#fff; justify-content:center; cursor:pointer;">
                            <i class="fas fa-user-plus"></i> دروستکرنا هەژمارێ (Register)
                        </button>
                    </form>
                </div>
            `;
            document.body.appendChild(modal);

            const closeAuth = () => { modal.style.display = 'none'; };
            modal.querySelector('#cf-auth-close-btn').addEventListener('click', closeAuth);
            modal.addEventListener('click', (e) => { if (e.target === modal) closeAuth(); });

            const tabLoginBtn = modal.querySelector('#cf-tab-login-btn');
            const tabRegBtn = modal.querySelector('#cf-tab-register-btn');
            const loginForm = modal.querySelector('#cf-modal-login-form');
            const regForm = modal.querySelector('#cf-modal-register-form');

            function switchAuthMode(mode) {
                const isReg = mode === 'register';
                loginForm.style.display = isReg ? 'none' : 'block';
                regForm.style.display = isReg ? 'block' : 'none';
                tabLoginBtn.style.background = !isReg ? 'var(--surface-color, #ffffff)' : 'transparent';
                tabLoginBtn.style.color = !isReg ? 'var(--blue-accent, #2563eb)' : 'var(--secondary-text, #6b7280)';
                tabLoginBtn.style.boxShadow = !isReg ? '0 2px 8px rgba(0,0,0,0.08)' : 'none';

                tabRegBtn.style.background = isReg ? 'var(--surface-color, #ffffff)' : 'transparent';
                tabRegBtn.style.color = isReg ? '#16a34a' : 'var(--secondary-text, #6b7280)';
                tabRegBtn.style.boxShadow = isReg ? '0 2px 8px rgba(0,0,0,0.08)' : 'none';
            }
            modal._switchAuthMode = switchAuthMode;

            tabLoginBtn.addEventListener('click', () => switchAuthMode('login'));
            tabRegBtn.addEventListener('click', () => switchAuthMode('register'));

            const roleCardStudent = modal.querySelector('#cf-role-card-student');
            const roleCardTeacher = modal.querySelector('#cf-role-card-teacher');
            const teacherCodeWrap = modal.querySelector('#cf-reg-teacher-code-wrap');
            const teacherCodeInput = modal.querySelector('#cf-reg-teacher-code');

            function updateRoleSelection(role) {
                const isTeacher = role === 'teacher';
                regForm.querySelector(`input[name="cf_reg_role"][value="${role}"]`).checked = true;
                roleCardStudent.style.borderColor = !isTeacher ? '#16a34a' : 'var(--border-color, #d1d5db)';
                roleCardStudent.style.background = !isTeacher ? 'rgba(22,163,74,0.1)' : 'transparent';
                roleCardTeacher.style.borderColor = isTeacher ? '#7c3aed' : 'var(--border-color, #d1d5db)';
                roleCardTeacher.style.background = isTeacher ? 'rgba(124,58,237,0.1)' : 'transparent';
                teacherCodeWrap.style.display = isTeacher ? 'block' : 'none';
                teacherCodeInput.required = isTeacher;
            }
            roleCardStudent.addEventListener('click', () => updateRoleSelection('student'));
            roleCardTeacher.addEventListener('click', () => updateRoleSelection('teacher'));

            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const username = modal.querySelector('#cf-login-username').value.trim();
                const password = modal.querySelector('#cf-login-password').value;
                const errEl = modal.querySelector('#cf-login-err');
                const btn = modal.querySelector('#cf-login-submit-btn');

                errEl.style.display = 'none';
                btn.disabled = true;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> چاڤەڕێ بە...';
                try {
                    const user = await loginAccount({ username, password });
                    modal.style.display = 'none';
                    showCfToast(`بەخێربێیت ${user.full_name}! هەمی زانیاری و ڕێکخستنێن تە هاتنە ڤەگەڕاندن.`, 'success');
                    fetchLessons().catch(() => {});
                } catch (err) {
                    errEl.textContent = err.message || 'چوونەژوور سەرنەگرت.';
                    errEl.style.display = 'block';
                } finally {
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> چوونەژوور (Login)';
                }
            });

            regForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const full_name = modal.querySelector('#cf-reg-fullname').value.trim();
                const username = modal.querySelector('#cf-reg-username').value.trim();
                const password = modal.querySelector('#cf-reg-password').value;
                const roleChecked = regForm.querySelector('input[name="cf_reg_role"]:checked');
                const role = roleChecked ? roleChecked.value : 'student';
                const teacher_code = teacherCodeInput.value.trim();
                const errEl = modal.querySelector('#cf-reg-err');
                const btn = modal.querySelector('#cf-reg-submit-btn');

                errEl.style.display = 'none';
                btn.disabled = true;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> تۆمارکرن...';
                try {
                    const user = await registerAccount({ full_name, username, password, role, teacher_code });
                    modal.style.display = 'none';
                    showCfToast(`هەژمارا تە (${user.full_name}) ب سەرکەفتوویی هاتە دروستکرن! 🎉`, 'success');
                    fetchLessons().catch(() => {});
                } catch (err) {
                    errEl.textContent = err.message || 'دروستکرنا هەژمارێ سەرنەگرت.';
                    errEl.style.display = 'block';
                } finally {
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fas fa-user-plus"></i> دروستکرنا هەژمارێ (Register)';
                }
            });
        }

        const noticeEl = modal.querySelector('#cf-auth-notice');
        if (noticeEl) {
            noticeEl.textContent = customNotice || 'هەموو پۆست و ڕێکخستنێن تە لسەر هەر ئامێرەکێ دێ پاراستی بن';
        }
        modal._switchAuthMode(initialMode === 'register' ? 'register' : 'login');
        modal.style.display = 'flex';
    }

    // =========================================================================
    // 4. RENDER LESSONS & POSTS GRID (With Author, Bookmarks, Edit & Delete)
    // =========================================================================
    function renderLessonsGrid(containerEl, lessons, options) {
        if (!containerEl) return;
        const opts = options || {};
        const emptyText = opts.emptyText || 'هێشتا چ وانە و فایل ل سێرڤەری نەهاتینە بارکرن.';
        const onPreview = typeof opts.onPreview === 'function' ? opts.onPreview : openLessonPreview;
        const currentUser = getCurrentUser();
        const bookmarks = getBookmarkedIds();
        const canDownload = canManageOrDownload();

        if (!Array.isArray(lessons) || lessons.length === 0) {
            containerEl.innerHTML = `
                <div style="grid-column:1 / -1; text-align:center; padding:32px 18px; background:var(--surface-color); border:1px dashed var(--border-color); border-radius:14px; color:var(--secondary-text);">
                    <i class="fas fa-folder-open" style="font-size:2.2rem; opacity:0.45; margin-bottom:10px; display:block;"></i>
                    <p style="margin:0; font-size:0.92rem;">${escapeHtml(emptyText)}</p>
                </div>
            `;
            return;
        }

        containerEl.innerHTML = lessons.map((lesson, idx) => {
            const vis = getFormatVisuals(lesson.fileType, lesson.role);
            const gradeLabel = getGradeDisplayName(lesson.grade);
            const dateStr = lesson.createdAt
                ? new Date(lesson.createdAt).toLocaleDateString('ku-IQ')
                : '';
            const isOwner = Boolean(currentUser && lesson.user_id && String(lesson.user_id) === String(currentUser.id));
            const canEditOrDel = canDownload && (isOwner || isAdminUser());
            const bookmarked = bookmarks.includes(String(lesson.id));
            const isStudentPost = lesson.role === 'student';

            return `
                <article class="cf-lesson-card" data-cf-idx="${idx}" style="background:var(--surface-color); border:1px solid var(--border-color); border-top:4px solid ${vis.color}; border-radius:14px; padding:16px; display:flex; flex-direction:column; justify-content:space-between; gap:12px; text-align:right; box-shadow:0 4px 14px var(--shadow-color); transition:transform 0.2s ease;">
                    <div>
                        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:6px; margin-bottom:10px; flex-wrap:wrap;">
                            <span style="display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:8px; font-size:0.74rem; font-weight:700; background:${vis.bg}; color:${vis.color};">
                                <i class="fas ${vis.icon}"></i> ${vis.label}
                            </span>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <span style="display:inline-flex; align-items:center; gap:4px; padding:3px 9px; border-radius:8px; font-size:0.74rem; font-weight:600; background:rgba(37,99,235,0.1); color:var(--blue-accent);">
                                    <i class="fas fa-graduation-cap"></i> ${escapeHtml(gradeLabel)}
                                </span>
                                <button type="button" class="cf-bookmark-btn" data-cf-idx="${idx}" title="${bookmarked ? 'لادان ژ نیشانکرییان' : 'نیشانکرن (Bookmark)'}" style="width:30px; height:30px; border-radius:8px; border:1px solid ${bookmarked ? '#f59e0b' : 'var(--border-color)'}; background:${bookmarked ? 'rgba(245,158,11,0.15)' : 'transparent'}; color:${bookmarked ? '#d97706' : 'var(--secondary-text)'}; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; font-size:0.88rem;">
                                    <i class="${bookmarked ? 'fas' : 'far'} fa-bookmark"></i>
                                </button>
                            </div>
                        </div>

                        <h4 style="margin:0 0 6px; font-size:1.02rem; color:var(--primary-text); line-height:1.4;">${escapeHtml(lesson.title)}</h4>

                        ${lesson.chapter || lesson.subject ? `
                            <div style="font-size:0.8rem; color:var(--blue-accent); font-weight:600; margin-bottom:6px;">
                                ${escapeHtml([lesson.subject, lesson.chapter].filter(Boolean).join(' • '))}
                            </div>
                        ` : ''}

                        ${lesson.content ? `
                            <p style="margin:0 0 10px; font-size:0.84rem; color:var(--secondary-text); line-height:1.55; white-space:pre-line;">${escapeHtml(lesson.content)}</p>
                        ` : ''}

                        <div style="display:flex; flex-wrap:wrap; align-items:center; gap:8px; font-size:0.76rem; color:var(--secondary-text);">
                            <span style="display:inline-flex; align-items:center; gap:5px; padding:3px 8px; border-radius:7px; background:${isStudentPost ? 'rgba(5,150,105,0.1)' : 'rgba(124,58,237,0.1)'}; color:${isStudentPost ? '#059669' : '#7c3aed'}; font-weight:700;">
                                <i class="fas ${isStudentPost ? 'fa-user-graduate' : 'fa-chalkboard-teacher'}"></i>
                                ${escapeHtml(lesson.author_name)} (${isStudentPost ? 'قوتابی' : 'مامۆستا'})
                            </span>
                            ${lesson.fileSize ? `<span><i class="fas fa-weight-hanging"></i> ${escapeHtml(lesson.fileSize)}</span>` : ''}
                            ${dateStr ? `<span><i class="fas fa-calendar-alt"></i> ${escapeHtml(dateStr)}</span>` : ''}
                        </div>
                    </div>

                    <div style="display:flex; flex-direction:column; gap:8px; border-top:1px solid var(--border-color); padding-top:10px;">
                        <div style="display:flex; gap:8px;">
                            <button type="button" class="btn-save cf-preview-btn" data-cf-idx="${idx}" style="flex:1; padding:8px 10px; font-size:0.83rem; border-radius:9px; justify-content:center; cursor:pointer; display:inline-flex; align-items:center; gap:6px;">
                                <i class="fas fa-eye"></i> ${canDownload ? (lesson.fileUrl ? 'ڤەکرن / پێشبینین' : 'خواندنا بابەتی') : 'تەماشاکرن'}
                            </button>
                            ${(lesson.fileUrl && canDownload) ? `
                                <a href="${escapeHtml(lesson.fileUrl)}" download="${escapeHtml(lesson.fileName || lesson.title)}" target="_blank" rel="noopener noreferrer" class="btn-cancel" style="padding:8px 12px; font-size:0.83rem; border-radius:9px; text-decoration:none; display:inline-flex; align-items:center; gap:5px;" title="داگرتنا فایلێ">
                                    <i class="fas fa-download"></i>
                                </a>
                            ` : ''}
                        </div>

                        ${canEditOrDel ? `
                            <div style="display:flex; gap:8px;">
                                <button type="button" class="cf-edit-btn" data-cf-idx="${idx}" style="flex:1; padding:6px 10px; border-radius:8px; border:1px solid rgba(37,99,235,0.35); background:rgba(37,99,235,0.08); color:#2563eb; font-family:inherit; font-size:0.8rem; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; gap:5px;">
                                    <i class="fas fa-edit"></i> تەعدیلکرن
                                </button>
                                <button type="button" class="cf-delete-btn" data-cf-idx="${idx}" style="flex:1; padding:6px 10px; border-radius:8px; border:1px solid rgba(220,38,38,0.35); background:rgba(220,38,38,0.08); color:#dc2626; font-family:inherit; font-size:0.8rem; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; gap:5px;">
                                    <i class="fas fa-trash-alt"></i> ژێبرن
                                </button>
                            </div>
                        ` : ''}
                    </div>
                </article>
            `;
        }).join('');

        containerEl.querySelectorAll('.cf-preview-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = Number(btn.getAttribute('data-cf-idx'));
                if (lessons[idx]) onPreview(lessons[idx]);
            });
        });

        containerEl.querySelectorAll('.cf-bookmark-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = Number(btn.getAttribute('data-cf-idx'));
                if (lessons[idx]) toggleBookmark(lessons[idx].id);
            });
        });

        containerEl.querySelectorAll('.cf-edit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = Number(btn.getAttribute('data-cf-idx'));
                if (lessons[idx]) openEditModal(lessons[idx]);
            });
        });

        containerEl.querySelectorAll('.cf-delete-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = Number(btn.getAttribute('data-cf-idx'));
                if (lessons[idx]) openDeleteConfirmModal(lessons[idx]);
            });
        });
    }

    const bootUser = getCurrentUser();
    if (bootUser) {
        syncUserToAppMirrors(bootUser);
        if (bootUser.settings) {
            applyUserSettings(bootUser.settings);
        }
    }
    checkServerGeminiProxy().catch(() => {});

    global.CloudflareLessons = {
        API_URL: CLOUDFLARE_WORKER_URL,
        API_BASE_URL: API_BASE_URL,
        getCurrentUser: getCurrentUser,
        setCurrentUser: setCurrentUser,
        logoutUser: logoutUser,
        isAdminUser: isAdminUser,
        isAdminCredentials: isAdminCredentials,
        canManageOrDownload: canManageOrDownload,
        registerAccount: registerAccount,
        loginAccount: loginAccount,
        applyUserSettings: applyUserSettings,
        saveUserSettingsToServer: saveUserSettingsToServer,
        getBookmarkedIds: getBookmarkedIds,
        isBookmarked: isBookmarked,
        toggleBookmark: toggleBookmark,
        openAuthModal: openAuthModal,
        fetchLessons: fetchLessons,
        uploadLesson: uploadLesson,
        createPost: uploadLesson,
        updateLesson: updateLesson,
        deleteLesson: deleteLesson,
        getCachedLessons: function () { return cachedLessons.slice(); },
        isLoading: function () { return isLoadingLessons; },
        getLastError: function () { return lastFetchError; },
        checkServerGeminiProxy: checkServerGeminiProxy,
        prepareHtmlForPreview: prepareHtmlForPreview,
        attachProxyLoadBridge: attachProxyLoadBridge,
        renderLessonsGrid: renderLessonsGrid,
        openPreviewModal: openLessonPreview,
        openEditModal: openEditModal,
        openDeleteConfirmModal: openDeleteConfirmModal,
        getGradeDisplayName: getGradeDisplayName,
        showToast: showCfToast
    };
})(window);
setInterval(() => {
  const userKey = localStorage.getItem('user_gemini_api_key') || localStorage.getItem('gk');
  if (!userKey) return;

  document.querySelectorAll('iframe').forEach((iframe) => {
    try {
      if (iframe.contentWindow) {
        iframe.contentWindow.postMessage({ type: 'SET_API_KEY', apiKey: userKey }, '*');
      }
      const doc = iframe.contentDocument || (iframe.contentWindow && iframe.contentWindow.document);
      if (doc) {
        ['ak', 'cbk', 'gk', 'gk2'].forEach((id) => {
          const el = doc.getElementById(id);
          if (el && !el.value) {
            el.value = userKey;
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
          }
        });
        doc.querySelectorAll('input').forEach((inp) => {
          if (inp.placeholder && inp.placeholder.includes('AIza') && !inp.value) {
            inp.value = userKey;
            inp.dispatchEvent(new Event('input', { bubbles: true }));
            inp.dispatchEvent(new Event('change', { bubbles: true }));
          }
        });
      }
    } catch (e) {}
  });
}, 500);
