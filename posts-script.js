// =========================================================================
// Community Posts Controller (Kurdish Badini)
// Rules:
// - Students can publish text-only posts (no images); posts enter Admin review ("چاوەروان بە ⏳")
// - Only Admin OR one Admin-authorized user can attach images (+ optional link)
// - Admin approves/rejects/deletes posts & grants/revokes image permission
// - Open comments on approved posts
// - External app sharing (Web Share API + WhatsApp / Telegram / Facebook / Copy)
// - Authors can delete their own posts via custom confirmation modal
// =========================================================================

document.addEventListener('DOMContentLoaded', () => {
    const postsContainer = document.getElementById('posts-container');
    const postsUserChip = document.getElementById('posts-user-chip');
    const postsUserChipLabel = document.getElementById('posts-user-chip-label');
    const postsAdminUnlockBtn = document.getElementById('posts-admin-unlock-btn');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');

    // Admin Toolbar Elements
    const adminToolbar = document.getElementById('posts-admin-toolbar');
    const adminPendingSummary = document.getElementById('admin-pending-summary');
    const adminLockBtn = document.getElementById('admin-lock-btn');
    const grantImageForm = document.getElementById('admin-grant-image-form');
    const grantUsernameInput = document.getElementById('grant-username-input');
    const grantSingleOnly = document.getElementById('grant-single-only');
    const adminAuthorizedList = document.getElementById('admin-authorized-list');
    const adminPendingQueue = document.getElementById('admin-pending-queue');

    // Composer Elements
    const composerGuestNotice = document.getElementById('composer-guest-notice');
    const composerLoginBtn = document.getElementById('composer-login-btn');
    const composerRegisterBtn = document.getElementById('composer-register-btn');
    const postForm = document.getElementById('community-post-form');
    const composerHeadingText = document.getElementById('composer-heading-text');
    const composerRuleHint = document.getElementById('composer-rule-hint');
    const composerRoleBadge = document.getElementById('composer-role-badge');
    const cpTitleInput = document.getElementById('cp-title');
    const cpContentInput = document.getElementById('cp-content');
    const cpMediaControls = document.getElementById('cp-media-controls');
    const cpImageInput = document.getElementById('cp-image-input');
    const cpImageFilename = document.getElementById('cp-image-filename');
    const cpClearImageBtn = document.getElementById('cp-clear-image-btn');
    const cpImagePreview = document.getElementById('cp-image-preview');
    const cpLinkInput = document.getElementById('cp-link-input');
    const cpFormError = document.getElementById('cp-form-error');
    const cpApprovalNote = document.getElementById('cp-approval-note');
    const cpSubmitBtn = document.getElementById('cp-submit-btn');

    // Filter Elements
    const filterButtons = document.querySelectorAll('.p-filter-btn');
    const filterMineBtn = document.getElementById('filter-mine-btn');
    const countAllPosts = document.getElementById('count-all-posts');
    const countMyPosts = document.getElementById('count-my-posts');
    const postsRefreshBtn = document.getElementById('posts-refresh-btn');

    // Modals
    const imageViewerModal = document.getElementById('image-viewer-modal');
    const fullImage = document.getElementById('full-image');
    const closeImageViewer = document.getElementById('close-image-viewer');

    const shareModal = document.getElementById('share-post-modal');
    const closeShareModalBtn = document.getElementById('close-share-modal-btn');
    const sharePostPreviewTitle = document.getElementById('share-post-preview-title');
    const shareWhatsappLink = document.getElementById('share-whatsapp-link');
    const shareTelegramLink = document.getElementById('share-telegram-link');
    const shareFacebookLink = document.getElementById('share-facebook-link');
    const shareCopyBtn = document.getElementById('share-copy-btn');

    const deletePostModal = document.getElementById('delete-post-modal');
    const deletePostConfirmMsg = document.getElementById('delete-post-confirm-msg');
    const cancelDeletePostBtn = document.getElementById('cancel-delete-post-btn');
    const confirmDeletePostBtn = document.getElementById('confirm-delete-post-btn');

    const adminUnlockModal = document.getElementById('admin-unlock-modal');
    const closeAdminUnlockBtn = document.getElementById('close-admin-unlock-btn');
    const adminUnlockForm = document.getElementById('admin-unlock-form');
    const adminUsernameInput = document.getElementById('admin-username-input');
    const adminPassInput = document.getElementById('admin-pass-input');
    const adminUnlockError = document.getElementById('admin-unlock-error');
    const adminLoginTrigger = document.getElementById('admin-login-trigger');

    let postsCache = [];
    let authorizedImageUsers = [];
    let canCurrentUserPostImages = false;
    let activeFilter = 'all';
    let selectedImageData = '';
    let openCommentsSet = new Set();
    let pendingDeletePostId = null;
    let pendingShareText = '';
    let pendingShareUrl = '';
    const highlightedPostId = new URLSearchParams(window.location.search).get('post') || '';

    function escapeHtml(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function notify(msg, type) {
        if (window.CloudflareLessons && typeof window.CloudflareLessons.showToast === 'function') {
            window.CloudflareLessons.showToast(msg, type || 'info');
        }
    }

    // Theme Setup
    if (themeToggleBtn) {
        const savedTheme = localStorage.getItem('userTheme') || localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        themeToggleBtn.innerHTML = savedTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        themeToggleBtn.addEventListener('click', () => {
            const cur = document.documentElement.getAttribute('data-theme');
            const next = cur === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('userTheme', next);
            localStorage.setItem('theme', next);
            themeToggleBtn.innerHTML = next === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
            if (window.CloudflareLessons) {
                window.CloudflareLessons.saveUserSettingsToServer({ theme: next });
            }
        });
    }

    function getActor() {
        const cfUser = window.CloudflareLessons ? window.CloudflareLessons.getCurrentUser() : null;
        const isAdmin = Boolean(window.CloudflareLessons && window.CloudflareLessons.isAdminUser());
        if (cfUser) {
            return {
                loggedIn: true,
                id: String(cfUser.id),
                name: cfUser.full_name || cfUser.username || 'بەکارهێنەر',
                username: cfUser.username || '',
                role: isAdmin ? 'admin' : cfUser.role,
                isAdmin: isAdmin
            };
        }

        let stored = null;
        let profile = null;
        try {
            stored = JSON.parse(localStorage.getItem('app_logged_in_user') || 'null');
            profile = JSON.parse(localStorage.getItem('app_user_profile') || 'null');
        } catch (e) {}

        if (isAdmin) {
            return {
                loggedIn: true,
                id: (stored && (stored.uid || stored.id)) || 'admin_hussein23',
                name: (profile && profile.name) || (stored && stored.displayName) || 'م. حسێن ئەکرەم زێباری (ئەدمین)',
                username: (profile && profile.username) || 'hussein23',
                role: 'admin',
                isAdmin: true
            };
        }

        if (stored && (stored.uid || stored.id)) {
            return {
                loggedIn: true,
                id: String(stored.uid || stored.id),
                name: (profile && profile.name) || stored.displayName || 'بەکارهێنەر',
                username: (profile && profile.username) || '',
                role: (profile && profile.role) || 'student',
                isAdmin: false
            };
        }

        if (profile && profile.isProfileComplete && profile.role !== 'guest') {
            return {
                loggedIn: true,
                id: 'local_' + (profile.name || 'user').replace(/\s+/g, '_'),
                name: profile.name || 'قوتابی',
                username: profile.username || '',
                role: profile.role || 'student',
                isAdmin: false
            };
        }

        return {
            loggedIn: false,
            id: '',
            name: 'مێڤان',
            username: '',
            role: 'guest',
            isAdmin: false
        };
    }

    function updateIdentityAndComposerUI() {
        const actor = getActor();

        if (postsUserChipLabel) {
            if (actor.isAdmin) {
                postsUserChipLabel.textContent = `${actor.name} (ئەدمین)`;
            } else if (actor.loggedIn) {
                postsUserChipLabel.textContent = actor.name;
            } else {
                postsUserChipLabel.textContent = 'چوونەژوور';
            }
        }

        if (adminToolbar) {
            adminToolbar.style.display = actor.isAdmin ? 'block' : 'none';
        }
        if (filterMineBtn) {
            filterMineBtn.style.display = actor.loggedIn ? 'inline-flex' : 'none';
        }

        if (!actor.loggedIn) {
            if (composerGuestNotice) composerGuestNotice.style.display = 'flex';
            if (postForm) postForm.style.display = 'none';
        } else {
            if (composerGuestNotice) composerGuestNotice.style.display = 'none';
            if (postForm) postForm.style.display = 'block';

            const canMedia = actor.isAdmin || canCurrentUserPostImages;
            if (cpMediaControls) {
                cpMediaControls.style.display = canMedia ? 'flex' : 'none';
            }
            if (composerRoleBadge) {
                if (actor.isAdmin) {
                    composerRoleBadge.textContent = 'ئەدمین • نڤیسین و وێنە ڤەکرینە';
                    composerRoleBadge.style.background = 'rgba(220,38,38,0.12)';
                    composerRoleBadge.style.color = '#dc2626';
                } else if (canCurrentUserPostImages) {
                    composerRoleBadge.textContent = 'ڕێکپێدایێ وێنەی ✅';
                    composerRoleBadge.style.background = 'rgba(124,58,237,0.12)';
                    composerRoleBadge.style.color = '#7c3aed';
                } else {
                    composerRoleBadge.textContent = actor.role === 'teacher' ? 'مامۆستا • تەنێ نڤیسین' : 'قوتابی • تەنێ نڤیسین (بێ وێنە)';
                    composerRoleBadge.style.background = 'rgba(37,99,235,0.1)';
                    composerRoleBadge.style.color = 'var(--blue-accent)';
                }
            }
            if (composerRuleHint) {
                composerRuleHint.textContent = canMedia
                    ? 'دشێی پۆستا نڤیسین یان ب وێنە و لینک ڤە بەلاڤ بکەی.'
                    : 'تۆ دشێی پۆستێ نڤیسینێ (بێ وێنە) بنڤیسی؛ هەتا ئەدمین وەرنەگریت دێ ل چاڤەڕێیێ بیت.';
            }
            if (cpApprovalNote) {
                cpApprovalNote.textContent = actor.isAdmin
                    ? 'پۆستێن ئەدمینی ڕاستەوخۆ دێ بەلاڤ بن.'
                    : '⏳ پۆستێ تە دێ چیتە چاڤەڕێیا وەرگرتنا ئەدمینی.';
            }
        }
    }

    if (postsUserChip) {
        postsUserChip.addEventListener('click', () => {
            if (window.CloudflareLessons) {
                window.CloudflareLessons.openAuthModal('login');
            }
        });
    }
    if (composerLoginBtn) {
        composerLoginBtn.addEventListener('click', () => {
            if (window.CloudflareLessons) window.CloudflareLessons.openAuthModal('login');
        });
    }
    if (composerRegisterBtn) {
        composerRegisterBtn.addEventListener('click', () => {
            if (window.CloudflareLessons) window.CloudflareLessons.openAuthModal('register');
        });
    }

    // Admin Unlock / Lock Handlers
    function openAdminUnlock() {
        if (adminUnlockError) adminUnlockError.style.display = 'none';
        if (adminUsernameInput) adminUsernameInput.value = '';
        if (adminPassInput) adminPassInput.value = '';
        if (adminUnlockModal) adminUnlockModal.style.display = 'flex';
    }
    if (postsAdminUnlockBtn) postsAdminUnlockBtn.addEventListener('click', openAdminUnlock);
    if (adminLoginTrigger) adminLoginTrigger.addEventListener('dblclick', openAdminUnlock);
    if (closeAdminUnlockBtn) closeAdminUnlockBtn.addEventListener('click', () => { adminUnlockModal.style.display = 'none'; });
    if (adminUnlockModal) {
        adminUnlockModal.addEventListener('click', (e) => {
            if (e.target === adminUnlockModal) adminUnlockModal.style.display = 'none';
        });
    }

    if (adminUnlockForm) {
        adminUnlockForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = (adminUsernameInput ? adminUsernameInput.value : '').trim();
            const pass = adminPassInput ? adminPassInput.value : '';
            const isValid = window.CloudflareLessons && typeof window.CloudflareLessons.isAdminCredentials === 'function'
                ? window.CloudflareLessons.isAdminCredentials(username, pass)
                : (username.toLowerCase() === 'hussein23' && pass === 'hussein1996');

            if (isValid) {
                if (window.CloudflareLessons && typeof window.CloudflareLessons.loginAccount === 'function') {
                    try {
                        await window.CloudflareLessons.loginAccount({ username, password: pass });
                    } catch (err) {}
                }
                localStorage.setItem('parwarda_admin_unlocked', 'true');
                localStorage.setItem('is_admin_mode_active', 'true');
                adminUnlockModal.style.display = 'none';
                notify('دەسەڵاتا ئەدمینی چالاک بوو! ✅', 'success');
                fetchPosts();
            } else {
                if (adminUnlockError) {
                    adminUnlockError.textContent = 'یوزەرنەیم یان پاسوۆردێ ئەدمینی خەلەتە!';
                    adminUnlockError.style.display = 'block';
                }
            }
        });
    }

    if (adminLockBtn) {
        adminLockBtn.addEventListener('click', () => {
            localStorage.removeItem('parwarda_admin_unlocked');
            localStorage.removeItem('is_admin_mode_active');
            if (window.CloudflareLessons && typeof window.CloudflareLessons.getCurrentUser === 'function') {
                const cur = window.CloudflareLessons.getCurrentUser();
                if (cur && cur.role === 'admin') {
                    window.CloudflareLessons.logoutUser();
                }
            }
            notify('مۆدا ئەدمینی هاتە گرتن.', 'info');
            fetchPosts();
        });
    }

    // Image Upload Preview inside Composer
    if (cpImageInput) {
        cpImageInput.addEventListener('change', () => {
            const file = cpImageInput.files && cpImageInput.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                selectedImageData = ev.target && ev.target.result ? String(ev.target.result) : '';
                if (cpImagePreview && selectedImageData) {
                    cpImagePreview.src = selectedImageData;
                    cpImagePreview.style.display = 'block';
                }
                if (cpImageFilename) cpImageFilename.textContent = file.name;
                if (cpClearImageBtn) cpClearImageBtn.style.display = 'inline-flex';
            };
            reader.readAsDataURL(file);
        });
    }

    if (cpClearImageBtn) {
        cpClearImageBtn.addEventListener('click', () => {
            selectedImageData = '';
            if (cpImageInput) cpImageInput.value = '';
            if (cpImagePreview) {
                cpImagePreview.src = '';
                cpImagePreview.style.display = 'none';
            }
            if (cpImageFilename) cpImageFilename.textContent = 'هەڵبژارتنا وێنەکی (تەنێ ئەدمین / ڕێکپێدایی)';
            cpClearImageBtn.style.display = 'none';
        });
    }

    // Fetch & Render Posts
    async function fetchPosts() {
        const actor = getActor();
        const params = new URLSearchParams();
        if (actor.id) params.set('userId', actor.id);
        if (actor.username) params.set('username', actor.username);
        if (actor.isAdmin) params.set('isAdmin', 'true');

        try {
            const res = await fetch(`/api/community-posts?${params.toString()}`, { cache: 'no-store' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'نەشیا پۆستان بینیت.');

            postsCache = Array.isArray(data.posts) ? data.posts : [];
            authorizedImageUsers = Array.isArray(data.authorizedImageUsers) ? data.authorizedImageUsers : [];
            canCurrentUserPostImages = Boolean(data.canCurrentUserPostImages);

            updateIdentityAndComposerUI();
            renderAdminControls();
            renderFeed();

            if (highlightedPostId) {
                const targetEl = document.querySelector(`.post-card[data-id="${highlightedPostId}"]`);
                if (targetEl) {
                    targetEl.classList.add('highlighted-post');
                    targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        } catch (err) {
            console.error(err);
            if (postsContainer) {
                postsContainer.innerHTML = `<p class="loading-text" style="color:#dc2626;">${escapeHtml(err.message || 'کێشە د بارکرنێ دا چێبوو.')}</p>`;
            }
        }
    }

    function renderAdminControls() {
        const actor = getActor();
        if (!actor.isAdmin) return;

        // Authorized image users chips
        if (adminAuthorizedList) {
            if (authorizedImageUsers.length === 0) {
                adminAuthorizedList.innerHTML = `<span style="font-size:0.78rem; color:var(--secondary-text);">نوکە چ کەسێن دی بۆ وێنە بەلاڤکرنێ نەهاتینە هەلبژارتن (تەنێ ئەدمینە).</span>`;
            } else {
                adminAuthorizedList.innerHTML = authorizedImageUsers.map(u => `
                    <span class="auth-user-chip">
                        <i class="fas fa-user-check"></i> @${escapeHtml(u.username || u.id)}
                        <button type="button" class="btn-revoke-img-perm" data-username="${escapeHtml(u.username || '')}" data-id="${escapeHtml(u.id || '')}">لادان</button>
                    </span>
                `).join('');
            }
        }

        // Pending Review Queue
        const pendingPosts = postsCache.filter(p => p.status === 'pending');
        if (adminPendingSummary) {
            adminPendingSummary.textContent = pendingPosts.length > 0
                ? `${pendingPosts.length} پۆست ل چاڤەڕێی پێداچوون و وەرگرتنا تەنە ⏳`
                : 'چ پۆست ل چاڤەڕێی پێداچوونێ نینن ✅';
        }
        if (adminPendingQueue) {
            if (pendingPosts.length === 0) {
                adminPendingQueue.innerHTML = '';
            } else {
                adminPendingQueue.innerHTML = pendingPosts.map(p => `
                    <div class="pending-review-item" data-id="${escapeHtml(p.id)}">
                        <div style="flex:1; min-width:210px;">
                            <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:4px;">
                                <strong>${escapeHtml(p.title)}</strong>
                                <span style="font-size:0.76rem; color:var(--secondary-text);">• ${escapeHtml(p.author_name)} (${p.author_username ? '@' + escapeHtml(p.author_username) : 'قوتابی'})</span>
                            </div>
                            <p style="margin:0; font-size:0.84rem; color:var(--secondary-text); white-space:pre-wrap;">${escapeHtml(p.content)}</p>
                        </div>
                        <div class="pending-review-actions">
                            <button type="button" class="btn-approve-sm btn-moderate-post" data-id="${escapeHtml(p.id)}" data-action="approved">
                                <i class="fas fa-check"></i> وەرگرتن و بەلاڤکرن
                            </button>
                            <button type="button" class="btn-reject-sm btn-moderate-post" data-id="${escapeHtml(p.id)}" data-action="rejected">
                                <i class="fas fa-ban"></i> ڕەتکرن
                            </button>
                            <button type="button" class="posts-btn-danger-outline btn-admin-del-pending" data-id="${escapeHtml(p.id)}" style="padding:6px 10px; font-size:0.78rem;">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `).join('');
            }
        }
    }

    function renderFeed() {
        const actor = getActor();
        const approvedPosts = postsCache.filter(p => p.status === 'approved');
        const myPosts = actor.loggedIn ? postsCache.filter(p => String(p.author_id) === String(actor.id)) : [];

        if (countAllPosts) countAllPosts.textContent = String(approvedPosts.length);
        if (countMyPosts) countMyPosts.textContent = String(myPosts.length);

        let displayPosts = [];
        if (activeFilter === 'mine') {
            displayPosts = myPosts;
        } else {
            // In "all" view: show approved posts, plus author's own pending posts so student sees "چاوەروان بە ⏳" immediately!
            displayPosts = postsCache.filter(p =>
                p.status === 'approved' || (actor.loggedIn && String(p.author_id) === String(actor.id))
            );
        }

        if (displayPosts.length === 0) {
            postsContainer.innerHTML = `<p class="loading-text">${activeFilter === 'mine' ? 'هێشتا تە چ پۆست نەهەنە.' : 'هێشتا چ پۆست نەهاتینە بەلاڤکرن.'}</p>`;
            return;
        }

        postsContainer.innerHTML = displayPosts.map(post => {
            const isOwner = actor.loggedIn && String(post.author_id) === String(actor.id);
            const canDelete = isOwner || actor.isAdmin;
            const dateStr = post.createdAt ? new Date(post.createdAt).toLocaleDateString('ku-IQ') : '';
            const roleClass = post.author_role === 'admin' ? 'role-admin' : (post.author_role === 'teacher' ? 'role-teacher' : '');
            const roleLabel = post.author_role === 'admin' ? 'ئەدمین' : (post.author_role === 'teacher' ? 'مامۆستا' : 'قوتابی');
            const isPending = post.status === 'pending';
            const isRejected = post.status === 'rejected';
            const isApproved = post.status === 'approved';
            const comments = Array.isArray(post.comments) ? post.comments : [];
            const commentsOpen = openCommentsSet.has(post.id) || post.id === highlightedPostId;

            return `
                <article class="post-card ${isPending ? 'pending-card' : (isRejected ? 'rejected-card' : '')}" data-id="${escapeHtml(post.id)}">
                    <div class="post-card-top">
                        <div class="post-author-meta">
                            <span class="post-author-pill ${roleClass}">
                                <i class="fas ${post.author_role === 'admin' ? 'fa-shield-alt' : (post.author_role === 'teacher' ? 'fa-chalkboard-teacher' : 'fa-user-graduate')}"></i>
                                ${escapeHtml(post.author_name)} (${roleLabel})
                            </span>
                            ${isPending ? `<span class="post-status-badge pending"><i class="fas fa-hourglass-half"></i> چاوەروان بە — ل چاڤەڕێی پێداچوونا ئەدمینی یە</span>` : ''}
                            ${isRejected ? `<span class="post-status-badge rejected"><i class="fas fa-times-circle"></i> هاتە ڕەتکرن</span>` : ''}
                        </div>
                        <span style="font-size:0.78rem; color:var(--secondary-text);"><i class="far fa-calendar-alt"></i> ${escapeHtml(dateStr)}</span>
                    </div>

                    ${post.title ? `<h3>${escapeHtml(post.title)}</h3>` : ''}
                    ${post.content ? `<p class="post-description">${escapeHtml(post.content)}</p>` : ''}
                    ${post.imageUrl ? `<img src="${escapeHtml(post.imageUrl)}" alt="${escapeHtml(post.title || 'وێنە')}" class="post-image">` : ''}
                    ${post.link ? `<a href="${escapeHtml(post.link)}" target="_blank" rel="noopener noreferrer" class="post-link-box"><i class="fas fa-external-link-alt"></i> ${escapeHtml(post.link)}</a>` : ''}

                    <div class="post-actions-bar">
                        <div class="post-actions-left">
                            ${isApproved ? `
                                <button type="button" class="post-action-btn btn-toggle-comments" data-id="${escapeHtml(post.id)}">
                                    <i class="far fa-comment-dots" style="color:var(--blue-accent);"></i> کۆمێنت (${comments.length})
                                </button>
                                <button type="button" class="post-action-btn btn-share-post" data-id="${escapeHtml(post.id)}">
                                    <i class="fas fa-share-alt" style="color:#16a34a;"></i> شێرکرن
                                </button>
                            ` : `<span style="font-size:0.8rem; color:var(--secondary-text);">پشتی وەرگرتنا ئەدمینی، کۆمێنت و شێرکرن دێ چالاک بن.</span>`}
                        </div>
                        ${canDelete ? `
                            <button type="button" class="post-action-btn delete-post-btn" data-id="${escapeHtml(post.id)}">
                                <i class="fas fa-trash-alt"></i> ژێبرنا پۆستی
                            </button>
                        ` : ''}
                    </div>

                    ${isApproved ? `
                        <div class="post-comments-panel" id="comments-panel-${escapeHtml(post.id)}" style="display:${commentsOpen ? 'block' : 'none'};">
                            <div class="comments-list">
                                ${comments.length === 0 ? `<p style="margin:0; font-size:0.82rem; color:var(--secondary-text);">هێشتا چ کۆمێنت نینن. تۆ ئێکەم کەس بە کۆمێنتێ بنڤیسە!</p>` : comments.map(c => {
                                    const canDelComment = actor.isAdmin || (actor.loggedIn && String(c.author_id) === String(actor.id));
                                    return `
                                        <div class="comment-item">
                                            <div class="comment-item-top">
                                                <span class="comment-item-author">
                                                    ${escapeHtml(c.author_name)}
                                                    <span style="font-weight:500; color:var(--secondary-text); font-size:0.74rem;">(${c.author_role === 'admin' ? 'ئەدمین' : (c.author_role === 'teacher' ? 'مامۆستا' : 'قوتابی')})</span>
                                                </span>
                                                <div style="display:flex; align-items:center; gap:6px;">
                                                    <span style="color:var(--secondary-text); font-size:0.72rem;">${c.createdAt ? new Date(c.createdAt).toLocaleDateString('ku-IQ') : ''}</span>
                                                    ${canDelComment ? `<button type="button" class="comment-del-btn" data-post-id="${escapeHtml(post.id)}" data-comment-id="${escapeHtml(c.id)}" title="ژێبرنا کۆمێنتێ"><i class="fas fa-trash"></i></button>` : ''}
                                                </div>
                                            </div>
                                            <p class="comment-item-text">${escapeHtml(c.text)}</p>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                            <form class="comment-form" data-post-id="${escapeHtml(post.id)}">
                                <input type="text" class="comment-input" placeholder="کۆمێنتا خۆ بنڤیسە..." required maxlength="1000">
                                <button type="submit" class="posts-btn-primary" style="padding:8px 14px; font-size:0.82rem;">
                                    <i class="fas fa-paper-plane"></i> ناردن
                                </button>
                            </form>
                        </div>
                    ` : ''}
                </article>
            `;
        }).join('');
    }

    // Create New Post Submit
    if (postForm) {
        postForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const actor = getActor();
            if (!actor.loggedIn) {
                if (window.CloudflareLessons) window.CloudflareLessons.openAuthModal('login');
                return;
            }

            const title = cpTitleInput ? cpTitleInput.value.trim() : '';
            const content = cpContentInput ? cpContentInput.value.trim() : '';
            const canMedia = actor.isAdmin || canCurrentUserPostImages;
            const link = (canMedia && cpLinkInput) ? cpLinkInput.value.trim() : '';
            const imageData = canMedia ? selectedImageData : '';

            if (!title && !content) {
                if (cpFormError) {
                    cpFormError.textContent = 'تکایە ناڤونیشان یان دەقێ پۆستێ بنڤیسە.';
                    cpFormError.style.display = 'block';
                }
                return;
            }

            if (cpFormError) cpFormError.style.display = 'none';
            const origHtml = cpSubmitBtn ? cpSubmitBtn.innerHTML : '';
            if (cpSubmitBtn) {
                cpSubmitBtn.disabled = true;
                cpSubmitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> هنارتن...';
            }

            try {
                const res = await fetch('/api/community-posts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user_id: actor.id,
                        author_name: actor.name,
                        author_username: actor.username,
                        author_role: actor.role,
                        isAdmin: actor.isAdmin,
                        title,
                        content,
                        imageData,
                        link
                    })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'بەلاڤکرن سەرنەگرت.');

                postForm.reset();
                selectedImageData = '';
                if (cpImagePreview) {
                    cpImagePreview.src = '';
                    cpImagePreview.style.display = 'none';
                }
                if (cpClearImageBtn) cpClearImageBtn.style.display = 'none';
                if (cpImageFilename) cpImageFilename.textContent = 'هەڵبژارتنا وێنەکی (تەنێ ئەدمین / ڕێکپێدایی)';

                if (data.pendingReview) {
                    notify('پۆستێ تە هاتە وەرگرتن — چاوەروان بە هەتا ئەدمین پێداچوونێ دکەت ⏳', 'info');
                } else {
                    notify('پۆست ب سەرکەفتوویی هاتە بەلاڤکرن! ✅', 'success');
                }
                await fetchPosts();
            } catch (err) {
                if (cpFormError) {
                    cpFormError.textContent = err.message || 'کێشە چێبوو.';
                    cpFormError.style.display = 'block';
                }
            } finally {
                if (cpSubmitBtn) {
                    cpSubmitBtn.disabled = false;
                    cpSubmitBtn.innerHTML = origHtml;
                }
            }
        });
    }

    // Grant Image Permission Form (Admin)
    if (grantImageForm) {
        grantImageForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const actor = getActor();
            if (!actor.isAdmin) return;
            const username = grantUsernameInput ? grantUsernameInput.value.trim() : '';
            if (!username) return;
            const singleOnly = grantSingleOnly ? grantSingleOnly.checked : true;

            try {
                const res = await fetch('/api/community-posts/permissions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        isAdmin: true,
                        action: 'grant',
                        username,
                        singleOnly
                    })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'نەشیا دەسەڵاتێ بدەت.');
                if (grantUsernameInput) grantUsernameInput.value = '';
                notify(`دەسەڵاتا بەلاڤکرنا وێنەی بۆ @${username} هاتە دان! ✅`, 'success');
                await fetchPosts();
            } catch (err) {
                notify(err.message || 'کێشە چێبوو.', 'error');
            }
        });
    }

    // Admin Queue + Revoke Permissions Click Delegation
    if (adminToolbar) {
        adminToolbar.addEventListener('click', async (e) => {
            const actor = getActor();
            if (!actor.isAdmin) return;

            const revokeBtn = e.target.closest('.btn-revoke-img-perm');
            if (revokeBtn) {
                const username = revokeBtn.getAttribute('data-username');
                const user_id = revokeBtn.getAttribute('data-id');
                try {
                    const res = await fetch('/api/community-posts/permissions', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ isAdmin: true, action: 'revoke', username, user_id })
                    });
                    if (res.ok) {
                        notify('ڕێکپێدانا وێنەی هاتە وەرگرتنەوە.', 'info');
                        await fetchPosts();
                    }
                } catch (err) {}
                return;
            }

            const modBtn = e.target.closest('.btn-moderate-post');
            if (modBtn) {
                const postId = modBtn.getAttribute('data-id');
                const status = modBtn.getAttribute('data-action');
                modBtn.disabled = true;
                try {
                    const res = await fetch(`/api/community-posts/${encodeURIComponent(postId)}/moderate`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ isAdmin: true, status })
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || 'نەشیا جێبەجێ بکەت.');
                    notify(status === 'approved' ? 'پۆست هاتە پەسەندکرن و بەلاڤ بوو! ✅' : 'پۆست هاتە ڕەتکرن.', status === 'approved' ? 'success' : 'info');
                    await fetchPosts();
                } catch (err) {
                    notify(err.message, 'error');
                    modBtn.disabled = false;
                }
                return;
            }

            const delPendingBtn = e.target.closest('.btn-admin-del-pending');
            if (delPendingBtn) {
                const postId = delPendingBtn.getAttribute('data-id');
                openDeleteModal(postId);
            }
        });
    }

    // Feed Delegation (Comments Toggle, Share, Delete, Delete Comment, Image Enlarge)
    if (postsContainer) {
        postsContainer.addEventListener('click', async (e) => {
            const toggleCommentsBtn = e.target.closest('.btn-toggle-comments');
            if (toggleCommentsBtn) {
                const postId = toggleCommentsBtn.getAttribute('data-id');
                const panel = document.getElementById(`comments-panel-${postId}`);
                if (panel) {
                    const nextVisible = panel.style.display === 'none';
                    panel.style.display = nextVisible ? 'block' : 'none';
                    if (nextVisible) openCommentsSet.add(postId);
                    else openCommentsSet.delete(postId);
                }
                return;
            }

            const shareBtn = e.target.closest('.btn-share-post');
            if (shareBtn) {
                const postId = shareBtn.getAttribute('data-id');
                const post = postsCache.find(p => p.id === postId);
                if (post) handleSharePost(post);
                return;
            }

            const deletePostBtn = e.target.closest('.delete-post-btn');
            if (deletePostBtn) {
                const postId = deletePostBtn.getAttribute('data-id');
                openDeleteModal(postId);
                return;
            }

            const delCommentBtn = e.target.closest('.comment-del-btn');
            if (delCommentBtn) {
                const postId = delCommentBtn.getAttribute('data-post-id');
                const commentId = delCommentBtn.getAttribute('data-comment-id');
                const actor = getActor();
                try {
                    const res = await fetch(`/api/community-posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}`, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ user_id: actor.id, isAdmin: actor.isAdmin })
                    });
                    if (!res.ok) {
                        const d = await res.json();
                        throw new Error(d.error || 'نەشیا کۆمێنتێ ژێببەت.');
                    }
                    notify('کۆمێنت هاتە ژێبرن.', 'info');
                    await fetchPosts();
                } catch (err) {
                    notify(err.message, 'error');
                }
                return;
            }

            if (e.target.classList.contains('post-image')) {
                if (fullImage && imageViewerModal) {
                    fullImage.src = e.target.src;
                    imageViewerModal.style.display = 'flex';
                }
            }
        });

        postsContainer.addEventListener('submit', async (e) => {
            const commentForm = e.target.closest('.comment-form');
            if (!commentForm) return;
            e.preventDefault();

            const actor = getActor();
            if (!actor.loggedIn) {
                if (window.CloudflareLessons) {
                    window.CloudflareLessons.openAuthModal('login', 'بۆ نڤیسینا کۆمێنتێ، سەرەتا بچۆ ژوور.');
                }
                return;
            }

            const postId = commentForm.getAttribute('data-post-id');
            const input = commentForm.querySelector('.comment-input');
            const text = input ? input.value.trim() : '';
            if (!text) return;

            const submitBtn = commentForm.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.disabled = true;

            try {
                const res = await fetch(`/api/community-posts/${encodeURIComponent(postId)}/comments`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user_id: actor.id,
                        author_name: actor.name,
                        author_role: actor.role,
                        text
                    })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'نەشیا کۆمێنتێ بنێریت.');
                openCommentsSet.add(postId);
                await fetchPosts();
            } catch (err) {
                notify(err.message || 'نەشیا کۆمێنتێ بنێریت.', 'error');
            } finally {
                if (submitBtn) submitBtn.disabled = false;
            }
        });
    }

    // Share Handler (Native Web Share + Multi-App Modal)
    async function handleSharePost(post) {
        const shareUrl = `${window.location.origin}/posts.html?post=${encodeURIComponent(post.id)}`;
        const textLines = [
            post.title ? `📌 ${post.title}` : null,
            post.content || null,
            `✍️ ${post.author_name}`,
            `🔗 ${shareUrl}`
        ].filter(Boolean);
        pendingShareText = textLines.join('\n\n');
        pendingShareUrl = shareUrl;

        const encodedFull = encodeURIComponent(pendingShareText);
        const encodedUrl = encodeURIComponent(shareUrl);

        if (sharePostPreviewTitle) sharePostPreviewTitle.textContent = post.title || 'شێرکرنا پۆستی';
        if (shareWhatsappLink) shareWhatsappLink.href = `https://wa.me/?text=${encodedFull}`;
        if (shareTelegramLink) shareTelegramLink.href = `https://t.me/share/url?url=${encodedUrl}&text=${encodeURIComponent(post.title || post.content || '')}`;
        if (shareFacebookLink) shareFacebookLink.href = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: post.title || 'پۆست ژ پلاتفۆرما کیمیایێ',
                    text: `${post.title || ''}\n${post.content || ''}`.trim(),
                    url: shareUrl
                });
                return;
            } catch (err) {
                if (err && err.name === 'AbortError') return;
            }
        }

        if (shareModal) shareModal.style.display = 'flex';
    }

    if (closeShareModalBtn) closeShareModalBtn.addEventListener('click', () => { shareModal.style.display = 'none'; });
    if (shareModal) {
        shareModal.addEventListener('click', (e) => {
            if (e.target === shareModal) shareModal.style.display = 'none';
        });
    }
    if (shareCopyBtn) {
        shareCopyBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(pendingShareText || pendingShareUrl);
                notify('دەق و لینکێ پۆستێ هاتنە کۆپیکرن! 📋', 'success');
                shareModal.style.display = 'none';
            } catch (err) {
                notify('نەشیا کۆپی بکەت.', 'error');
            }
        });
    }

    // Delete Modal Handlers
    function openDeleteModal(postId) {
        const post = postsCache.find(p => p.id === postId);
        if (!post) return;
        pendingDeletePostId = postId;
        if (deletePostConfirmMsg) {
            deletePostConfirmMsg.innerHTML = `تۆ پشتراستی دڤێت پۆستێ «<strong>${escapeHtml(post.title || 'بێ ناڤونیشان')}</strong>» ب تەمامی ژێببەی؟`;
        }
        if (deletePostModal) deletePostModal.style.display = 'flex';
    }

    if (cancelDeletePostBtn) {
        cancelDeletePostBtn.addEventListener('click', () => {
            pendingDeletePostId = null;
            deletePostModal.style.display = 'none';
        });
    }
    if (deletePostModal) {
        deletePostModal.addEventListener('click', (e) => {
            if (e.target === deletePostModal) {
                pendingDeletePostId = null;
                deletePostModal.style.display = 'none';
            }
        });
    }
    if (confirmDeletePostBtn) {
        confirmDeletePostBtn.addEventListener('click', async () => {
            if (!pendingDeletePostId) return;
            const actor = getActor();
            confirmDeletePostBtn.disabled = true;
            try {
                const res = await fetch(`/api/community-posts/${encodeURIComponent(pendingDeletePostId)}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: actor.id, isAdmin: actor.isAdmin })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'ژێبرن سەرنەگرت.');
                deletePostModal.style.display = 'none';
                pendingDeletePostId = null;
                notify('پۆست ب سەرکەفتوویی هاتە ژێبرن.', 'info');
                await fetchPosts();
            } catch (err) {
                notify(err.message || 'کێشە د ژێبرنێ دا چێبوو.', 'error');
            } finally {
                confirmDeletePostBtn.disabled = false;
            }
        });
    }

    // Image Viewer Modal Close
    if (closeImageViewer) closeImageViewer.addEventListener('click', () => { imageViewerModal.style.display = 'none'; });
    if (imageViewerModal) {
        imageViewerModal.addEventListener('click', (e) => {
            if (e.target === imageViewerModal) imageViewerModal.style.display = 'none';
        });
    }

    // Filter & Refresh Handlers
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeFilter = btn.getAttribute('data-filter') || 'all';
            renderFeed();
        });
    });
    if (postsRefreshBtn) postsRefreshBtn.addEventListener('click', fetchPosts);

    window.addEventListener('parwardaAuthChanged', fetchPosts);
    if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().onAuthStateChanged(() => {
            fetchPosts();
        });
    }

    fetchPosts();
});
