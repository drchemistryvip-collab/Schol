// =========================================================================
// Grade & Subject Focused 5-Section Controller
// 1. Opening a Grade shows Subjects (بابەتێن ڤێ پۆلێ).
// 2. Clicking a Subject opens a clean workspace containing ONLY 5 sections:
//    - بەشێ مامۆستایان (Teachers list immediately visible + Pin to top)
//    - مەلزەمە (Non-HTML PDF/PPTX/Image files)
//    - شەرحکرن ب AI (HTML interactive lesson/presentation files)
//    - بەشێ هەلبژارتن (Multiple-choice quizzes)
//    - بەشێ پرسیارکرن ژ AI (Subject-aware Gemini Q&A chat)
// =========================================================================

document.addEventListener('DOMContentLoaded', function () {
    const dataStore = window.EducationalData;
    const gradesConfig = window.GRADES_CONFIG || [];

    const urlParams = new URLSearchParams(window.location.search);
    const pola = urlParams.get('pola') || '12';
    const initialSubjectParam = urlParams.get('subject');
    const initialTeacherParam = urlParams.get('teacher');
    const initialTabParam = urlParams.get('tab');

    const currentGradeConfig = gradesConfig.find(g => g.id === String(pola)) || {
        id: pola,
        name: `پۆلا ${pola}`,
        shortName: `پۆلا ${pola}`,
        icon: 'fa-school',
        color: '#2563eb'
    };

    // State
    let currentLanguage = dataStore.getActiveLanguage();
    let currentSelectedSubject = (initialSubjectParam && initialSubjectParam !== 'all') ? initialSubjectParam : null;
    let currentActiveTab = initialTabParam || 'teachers';
    let showAllTeacherDialects = false;
    let selectedDetailTeacher = null;
    let malzamaTeacherFilter = 'all';
    let flashcardTeacherFilter = 'all';
    let flashcardIndex = 0;
    let flashcardFlipped = false;
    let flashcardHintShown = false;
    let flashcardGridMode = false;
    let flashcardShuffledIds = null;
    let flashcardKnownIds = new Set();
    let quizAnswersState = {};
    let askAiHistory = [];
    let isAskAiSending = false;
    let currentViewingDocItem = null;
    let currentViewingDocTeacher = null;

    // DOM References
    const gradeTitleEl = document.getElementById('grade-title');
    const gradeIconEl = document.getElementById('grade-icon');
    const gradeIconBubbleEl = document.getElementById('grade-icon-bubble');
    const roleLabelEl = document.getElementById('current-user-role-label');
    const teacherPanelLink = document.getElementById('teacher-panel-link');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const langPills = document.querySelectorAll('#grade-lang-pills .lang-pill');

    const subjectsView = document.getElementById('subjects-view');
    const subjectsGrid = document.getElementById('grade-subjects-grid');
    const workspaceView = document.getElementById('subject-workspace-view');
    const btnBackToSubjects = document.getElementById('btn-back-to-subjects');
    const activeSubjectIconBox = document.getElementById('active-subject-icon-box');
    const activeSubjectIcon = document.getElementById('active-subject-icon');
    const activeSubjectTitle = document.getElementById('active-subject-title');
    const activeSubjectSub = document.getElementById('active-subject-sub');

    const tabBtns = document.querySelectorAll('#subject-tabs-bar .subject-tab-btn');
    const countTeachersEl = document.getElementById('count-teachers');
    const countMalzamaEl = document.getElementById('count-malzama');
    const countAiExplainEl = document.getElementById('count-ai-explain');
    const countFlashcardsEl = document.getElementById('count-flashcards');
    const countQuizzesEl = document.getElementById('count-quizzes');

    const panelTeachers = document.getElementById('panel-teachers');
    const panelMalzama = document.getElementById('panel-malzama');
    const panelAiExplain = document.getElementById('panel-ai-explain');
    const panelFlashcards = document.getElementById('panel-flashcards');
    const panelQuizzes = document.getElementById('panel-quizzes');
    const panelAskAi = document.getElementById('panel-ask-ai');

    const teachersListView = document.getElementById('teachers-list-view');
    const teachersListContainer = document.getElementById('grade-teachers-list');
    const toggleAllLangsBtn = document.getElementById('toggle-all-langs-teachers-btn');
    const teacherDetailView = document.getElementById('teacher-detail-view');
    const detailTeacherAvatar = document.getElementById('detail-teacher-avatar');
    const detailTeacherName = document.getElementById('detail-teacher-name');
    const detailTeacherBio = document.getElementById('detail-teacher-bio');
    const detailTeacherPinBtn = document.getElementById('detail-teacher-pin-btn');
    const closeTeacherDetailBtn = document.getElementById('close-teacher-detail-btn');
    const teacherDetailSections = document.getElementById('teacher-detail-sections');

    const malzamaTeacherFilterEl = document.getElementById('malzama-teacher-filter');
    const malzamaContainer = document.getElementById('malzama-container');

    const aiExplainContainer = document.getElementById('ai-explain-container');
    const cfHtmlUploadDetails = document.getElementById('cf-html-upload-details');
    const cfHtmlUploadForm = document.getElementById('cf-html-upload-form');

    const flashcardProgressText = document.getElementById('flashcard-progress-text');
    const flashcardProgressFill = document.getElementById('flashcard-progress-fill');
    const flashcardTeacherFilterEl = document.getElementById('flashcard-teacher-filter');
    const flashcardShuffleBtn = document.getElementById('flashcard-shuffle-btn');
    const flashcardViewToggleBtn = document.getElementById('flashcard-view-toggle-btn');
    const flashcardResetBtn = document.getElementById('flashcard-reset-btn');
    const flashcardStudioLink = document.getElementById('flashcard-studio-link');
    const flashcardStageWrap = document.getElementById('flashcard-stage-wrap');
    const flashcardGridView = document.getElementById('flashcard-grid-view');

    const quizScoreSummary = document.getElementById('quiz-score-summary');
    const resetQuizzesBtn = document.getElementById('reset-quizzes-btn');
    const quizzesContainer = document.getElementById('quizzes-container');

    const askAiContextLabel = document.getElementById('ask-ai-context-label');
    const askAiStarterChips = document.getElementById('ask-ai-starter-chips');
    const askAiMessagesEl = document.getElementById('ask-ai-messages');
    const askAiForm = document.getElementById('ask-ai-form');
    const askAiInput = document.getElementById('ask-ai-input');
    const askAiSendBtn = document.getElementById('ask-ai-send-btn');
    const askAiClearBtn = document.getElementById('ask-ai-clear-btn');

    // Modals
    const videoModal = document.getElementById('video-modal');
    const closePlayerBtn = document.getElementById('close-player-btn');
    const youtubeIframe = document.getElementById('youtube-iframe');
    const modalVideoTitle = document.getElementById('modal-video-title');
    const modalVideoChapter = document.getElementById('modal-video-chapter');

    const docModal = document.getElementById('doc-viewer-modal');
    const closeDocBtn = document.getElementById('close-doc-btn');
    const docViewport = document.getElementById('doc-viewer-viewport');
    const docModalTitle = document.getElementById('doc-modal-title');
    const docModalBadge = document.getElementById('doc-modal-format-badge');
    const docModalDownload = document.getElementById('doc-modal-download-btn');
    const docModalFullscreenBtn = document.getElementById('doc-modal-fullscreen-btn');
    const docModalGdriveSave = document.getElementById('doc-modal-gdrive-save-btn');
    const docModalTeacher = document.getElementById('doc-modal-teacher-info');
    const docModalSize = document.getElementById('doc-modal-size-info');

    // ==========================================
    // HELPERS
    // ==========================================
    function escapeHtml(str) {
        return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function notifyUser(msg, type) {
        if (window.CloudflareLessons && typeof window.CloudflareLessons.showToast === 'function') {
            window.CloudflareLessons.showToast(msg, type || 'info');
        }
    }

    function canManageOrDownload() {
        if (window.CloudflareLessons && typeof window.CloudflareLessons.canManageOrDownload === 'function') {
            return Boolean(window.CloudflareLessons.canManageOrDownload());
        }
        return Boolean(dataStore && dataStore.isCurrentUserSuperAdmin());
    }

    function getFallbackAvatar() {
        return 'data:image/svg+xml;utf8,' + encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="#2563eb"/><circle cx="50" cy="38" r="16" fill="#ffffff"/><path d="M22 86c0-16 12-26 28-26s28 10 28 26" fill="#ffffff"/></svg>'
        );
    }

    function isHtmlLesson(item) {
        if (!item) return false;
        const ft = String(item.fileType || '').toLowerCase().trim();
        if (ft === 'html' || ft === 'htm') return true;
        const fn = String(item.fileName || '').toLowerCase();
        const fu = String(item.fileUrl || '').toLowerCase().split('?')[0];
        if (fn.endsWith('.html') || fn.endsWith('.htm') || fu.endsWith('.html') || fu.endsWith('.htm')) return true;
        if (item.htmlContent && String(item.htmlContent).trim().length > 0) return true;
        return false;
    }

    function lessonMatchesGradeAndSubject(item, subjectId) {
        const gradeMatch = !item.grade || String(item.grade) === 'all' || String(item.grade) === String(pola);
        if (!gradeMatch) return false;
        if (!subjectId) return true;
        if (item.subject && String(item.subject).trim()) {
            return dataStore.matchesSubject(item.subject, subjectId);
        }
        // Check title/description/fileName keywords for untagged Cloudflare uploads
        const subObj = dataStore.getSubjectById(subjectId);
        if (!subObj) return true;
        const hay = `${item.title || ''} ${item.description || ''} ${item.content || ''} ${item.fileName || ''}`.toLowerCase();
        if ((subObj.keywords || []).some(kw => hay.includes(kw.toLowerCase()))) return true;
        return false;
    }

    function getSubjectTeachers() {
        if (!currentSelectedSubject) return [];
        let list = [];
        if (showAllTeacherDialects) {
            const allApproved = dataStore.getAllTeachers().filter(t => t.status !== 'pending' && t.status !== 'rejected');
            list = allApproved.filter(t => {
                const gradeOk = !t.grades || t.grades.length === 0 || t.grades.includes(String(pola)) || t.grades.includes('all');
                return gradeOk && dataStore.matchesSubject(t.subject, currentSelectedSubject);
            });
            if (list.length === 0) {
                list = allApproved.filter(t => dataStore.matchesSubject(t.subject, currentSelectedSubject));
            }
            list = dataStore.sortTeachersWithPins(list);
        } else {
            list = dataStore.getTeachersForGrade(pola, currentLanguage, currentSelectedSubject);
        }
        return list;
    }

    function getSubjectMalzamas() {
        if (!currentSelectedSubject) return { nonHtml: [], htmlItems: [] };
        const pinnedIds = dataStore.getPinnedTeacherIds();

        // 1. Local / Firestore EducationalData items
        const localAll = dataStore.getAllMalzamas(true, null, false, currentLanguage)
            .filter(m => (!m.grade || String(m.grade) === String(pola)) && dataStore.matchesSubject(m.subject, currentSelectedSubject))
            .map(m => ({ ...m, source: 'local' }));

        // 2. Cloudflare Server items
        const cfAll = (window.CloudflareLessons ? window.CloudflareLessons.getCachedLessons() : [])
            .filter(item => {
                const isStudyFile = Boolean(item.fileUrl || item.htmlContent || (item.fileType && item.fileType !== 'post'));
                if (!isStudyFile) return false;
                if (lessonMatchesGradeAndSubject(item, currentSelectedSubject)) return true;
                // Include untagged grade HTML files inside AI Explanations so uploaded HTML files are never lost
                if (isHtmlLesson(item) && (!item.subject || !String(item.subject).trim()) && (!item.grade || String(item.grade) === String(pola) || String(item.grade) === 'all')) {
                    return true;
                }
                return false;
            })
            .map(item => ({
                id: item.id,
                teacherId: item.user_id || '',
                teacherName: item.author_name || item.teacherName || 'مامۆستا',
                grade: item.grade || pola,
                subject: item.subject || '',
                chapter: item.chapter || '',
                title: item.title,
                fileType: isHtmlLesson(item) ? 'html' : (item.fileType || 'pdf'),
                fileUrl: item.fileUrl || '',
                fileName: item.fileName || '',
                fileSize: item.fileSize || '',
                htmlContent: item.htmlContent || (item.raw && item.raw.htmlContent) || '',
                description: item.description || item.content || '',
                views: item.views || 0,
                source: 'cloudflare'
            }));

        const combined = [...localAll, ...cfAll].sort((a, b) => {
            const aPin = pinnedIds.includes(String(a.teacherId));
            const bPin = pinnedIds.includes(String(b.teacherId));
            if (aPin && !bPin) return -1;
            if (!aPin && bPin) return 1;
            return (b.views || 0) - (a.views || 0);
        });

        const htmlItems = combined.filter(isHtmlLesson);
        const nonHtml = combined.filter(item => !isHtmlLesson(item));
        return { nonHtml, htmlItems };
    }

    function getSubjectQuizzes() {
        if (!currentSelectedSubject) return [];
        const pinnedIds = dataStore.getPinnedTeacherIds();
        const all = dataStore.getAllQuizzes(true, null, false, currentLanguage)
            .filter(q => (!q.grade || String(q.grade) === String(pola)) && dataStore.matchesSubject(q.subject, currentSelectedSubject));
        return all.sort((a, b) => {
            const aPin = pinnedIds.includes(String(a.teacherId));
            const bPin = pinnedIds.includes(String(b.teacherId));
            if (aPin && !bPin) return -1;
            if (!aPin && bPin) return 1;
            return (b.createdAt || 0) - (a.createdAt || 0);
        });
    }

    function getSubjectFlashcards() {
        if (!currentSelectedSubject || typeof dataStore.getAllFlashcards !== 'function') return [];
        const pinnedIds = dataStore.getPinnedTeacherIds();
        const all = dataStore.getAllFlashcards(true, null, false, currentLanguage)
            .filter(fc => (!fc.grade || String(fc.grade) === String(pola)) && dataStore.matchesSubject(fc.subject, currentSelectedSubject));
        const sorted = all.sort((a, b) => {
            const aPin = pinnedIds.includes(String(a.teacherId));
            const bPin = pinnedIds.includes(String(b.teacherId));
            if (aPin && !bPin) return -1;
            if (!aPin && bPin) return 1;
            return (b.createdAt || 0) - (a.createdAt || 0);
        });
        if (Array.isArray(flashcardShuffledIds) && flashcardShuffledIds.length > 0) {
            const orderMap = new Map(flashcardShuffledIds.map((id, i) => [id, i]));
            return [...sorted].sort((a, b) => (orderMap.get(a.id) ?? 999999) - (orderMap.get(b.id) ?? 999999));
        }
        return sorted;
    }

    // ==========================================
    // INITIAL HEADER, THEME & AUTH SYNC
    // ==========================================
    document.title = `${currentGradeConfig.name} | بابەت، مامۆستا، مەلزەمە و AI`;
    if (gradeTitleEl) gradeTitleEl.textContent = currentGradeConfig.name;
    if (gradeIconEl) gradeIconEl.className = `fas ${currentGradeConfig.icon || 'fa-school'}`;
    if (gradeIconBubbleEl) {
        gradeIconBubbleEl.style.color = currentGradeConfig.color || '#2563eb';
        gradeIconBubbleEl.style.background = `${currentGradeConfig.color || '#2563eb'}18`;
    }

    const savedTheme = localStorage.getItem('userTheme') || localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    if (themeToggleBtn) {
        const icon = themeToggleBtn.querySelector('i');
        if (icon) icon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        themeToggleBtn.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme');
            const nextTheme = current === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', nextTheme);
            localStorage.setItem('userTheme', nextTheme);
            localStorage.setItem('theme', nextTheme);
            const ic = themeToggleBtn.querySelector('i');
            if (ic) ic.className = nextTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            if (window.CloudflareLessons) {
                window.CloudflareLessons.saveUserSettingsToServer({ theme: nextTheme });
            }
        });
    }

    function syncGradeAuthUI() {
        const cfUser = window.CloudflareLessons ? window.CloudflareLessons.getCurrentUser() : null;
        const userRole = cfUser ? cfUser.role : dataStore.getUserRole();
        if (cfUser) {
            const roleText = cfUser.role === 'teacher' ? 'مامۆستا' : (cfUser.role === 'admin' ? 'ئەدمین' : 'قوتابی');
            if (roleLabelEl) roleLabelEl.textContent = `${cfUser.full_name} (${roleText})`;
        } else if (userRole === 'teacher' || dataStore.isCurrentUserSuperAdmin()) {
            if (roleLabelEl) roleLabelEl.textContent = 'مامۆستا';
        } else {
            if (roleLabelEl) roleLabelEl.textContent = 'قوتابی';
        }
        const canManage = canManageOrDownload();
        if (teacherPanelLink) teacherPanelLink.style.display = canManage ? 'inline-flex' : 'none';
        if (cfHtmlUploadDetails) cfHtmlUploadDetails.style.display = canManage ? 'block' : 'none';
    }
    syncGradeAuthUI();

    // ==========================================
    // VIEW 1: SUBJECTS GRID
    // ==========================================
    function renderSubjectsGrid() {
        if (!subjectsGrid) return;
        const gradeSubjects = dataStore.getSubjectsForGrade(pola);

        subjectsGrid.innerHTML = gradeSubjects.map(sub => {
            const teacherCount = dataStore.getTeachersForGrade(pola, currentLanguage, sub.id).length;
            return `
                <button type="button" class="subject-card-box" data-subject-id="${sub.id}">
                    <div class="subject-icon-circle" style="background: ${sub.gradient || sub.color || '#2563eb'};">
                        <i class="fas ${sub.icon || 'fa-book'}"></i>
                    </div>
                    <h3 class="subject-card-name">${escapeHtml(sub.name)}</h3>
                    <span class="subject-card-meta">${teacherCount} مامۆستا</span>
                </button>
            `;
        }).join('');

        subjectsGrid.querySelectorAll('.subject-card-box').forEach(btn => {
            btn.addEventListener('click', () => {
                const subId = btn.getAttribute('data-subject-id');
                openSubjectWorkspace(subId, 'teachers');
            });
        });
    }

    function showSubjectsView() {
        currentSelectedSubject = null;
        selectedDetailTeacher = null;
        if (subjectsView) subjectsView.style.display = 'block';
        if (workspaceView) workspaceView.style.display = 'none';
        try {
            const nextUrl = new URL(window.location.href);
            nextUrl.searchParams.delete('subject');
            nextUrl.searchParams.delete('teacher');
            nextUrl.searchParams.delete('tab');
            window.history.replaceState({}, '', nextUrl);
        } catch (e) {}
        renderSubjectsGrid();
    }

    if (btnBackToSubjects) {
        btnBackToSubjects.addEventListener('click', showSubjectsView);
    }

    // ==========================================
    // VIEW 2: SUBJECT WORKSPACE (5 SECTIONS ONLY)
    // ==========================================
    function openSubjectWorkspace(subjectId, tabName) {
        const subObj = dataStore.getSubjectById(subjectId);
        if (!subObj) {
            showSubjectsView();
            return;
        }
        const subjectChanged = currentSelectedSubject !== subjectId;
        currentSelectedSubject = subjectId;
        if (subjectChanged) {
            selectedDetailTeacher = null;
            malzamaTeacherFilter = 'all';
            flashcardTeacherFilter = 'all';
            flashcardIndex = 0;
            flashcardFlipped = false;
            flashcardHintShown = false;
            flashcardGridMode = false;
            flashcardShuffledIds = null;
            quizAnswersState = {};
            askAiHistory = [];
        }

        if (subjectsView) subjectsView.style.display = 'none';
        if (workspaceView) workspaceView.style.display = 'block';

        if (activeSubjectTitle) activeSubjectTitle.textContent = subObj.name;
        if (activeSubjectSub) activeSubjectSub.textContent = `${currentGradeConfig.name} • ${dataStore.getLanguageLabel(currentLanguage)}`;
        if (activeSubjectIcon) activeSubjectIcon.className = `fas ${subObj.icon || 'fa-book'}`;
        if (activeSubjectIconBox) activeSubjectIconBox.style.background = subObj.gradient || subObj.color || '#2563eb';

        try {
            const nextUrl = new URL(window.location.href);
            nextUrl.searchParams.set('subject', subjectId);
            window.history.replaceState({}, '', nextUrl);
        } catch (e) {}

        refreshAllSubjectPanels();
        switchSubjectTab(tabName || currentActiveTab || 'teachers');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function switchSubjectTab(tabName) {
        const validTabs = ['teachers', 'malzama', 'ai-explain', 'flashcards', 'quizzes', 'ask-ai'];
        currentActiveTab = validTabs.includes(tabName) ? tabName : 'teachers';

        tabBtns.forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-tab') === currentActiveTab);
        });

        if (panelTeachers) panelTeachers.style.display = currentActiveTab === 'teachers' ? 'block' : 'none';
        if (panelMalzama) panelMalzama.style.display = currentActiveTab === 'malzama' ? 'block' : 'none';
        if (panelAiExplain) panelAiExplain.style.display = currentActiveTab === 'ai-explain' ? 'block' : 'none';
        if (panelFlashcards) panelFlashcards.style.display = currentActiveTab === 'flashcards' ? 'block' : 'none';
        if (panelQuizzes) panelQuizzes.style.display = currentActiveTab === 'quizzes' ? 'block' : 'none';
        if (panelAskAi) panelAskAi.style.display = currentActiveTab === 'ask-ai' ? 'block' : 'none';
    }

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-tab');
            if (target === 'teachers' && selectedDetailTeacher) {
                selectedDetailTeacher = null;
                renderTeachersSection();
            }
            switchSubjectTab(target);
        });
    });

    function refreshAllSubjectPanels() {
        if (!currentSelectedSubject) return;
        renderTeachersSection();
        renderMalzamaSection();
        renderAiExplainSection();
        renderFlashcardsSection();
        renderQuizzesSection();
        renderAskAiSection();
    }

    // ==========================================
    // SECTION 1: TEACHERS (Immediate List + Pinning)
    // ==========================================
    function renderTeachersSection() {
        const teachers = getSubjectTeachers();
        if (countTeachersEl) countTeachersEl.textContent = teachers.length;

        if (toggleAllLangsBtn) {
            toggleAllLangsBtn.innerHTML = showAllTeacherDialects
                ? `<i class="fas fa-filter"></i> تنێ (${dataStore.getLanguageLabel(currentLanguage)})`
                : `<i class="fas fa-globe"></i> نیشاندانا هەموو شێوەزاران`;
        }

        if (selectedDetailTeacher) {
            renderTeacherDetail(selectedDetailTeacher);
            return;
        }

        if (teachersListView) teachersListView.style.display = 'block';
        if (teacherDetailView) teacherDetailView.style.display = 'none';

        if (!teachersListContainer) return;

        if (teachers.length === 0) {
            const subObj = dataStore.getSubjectById(currentSelectedSubject);
            const subTitle = subObj ? subObj.name : '';
            teachersListContainer.innerHTML = `
                <div style="grid-column:1 / -1; text-align:center; padding:32px 18px; border:1px dashed var(--border-color); border-radius:14px; color:var(--secondary-text);">
                    <i class="fas fa-chalkboard-teacher" style="font-size:2.2rem; opacity:0.5; margin-bottom:10px;"></i>
                    <h3 style="margin:0 0 6px; color:var(--primary-text);">چ مامۆستا بۆ بابەتێ (${escapeHtml(subTitle)}) ب زمانێ (${dataStore.getLanguageLabel(currentLanguage)}) نەهاتنە دیتن</h3>
                    <p style="margin:0 0 14px; font-size:0.86rem;">دشێی مامۆستایێن شێوەزارێن دی ببینی یان پرسیاران ژ بەشێ AI بکەی.</p>
                    <button type="button" id="empty-show-all-dialects" class="btn-action-primary">
                        <i class="fas fa-globe"></i> نیشاندانا مامۆستایێن هەموو شێوەزاران
                    </button>
                </div>
            `;
            const btn = document.getElementById('empty-show-all-dialects');
            if (btn) {
                btn.addEventListener('click', () => {
                    showAllTeacherDialects = true;
                    renderTeachersSection();
                });
            }
            return;
        }

        teachersListContainer.innerHTML = teachers.map((teacher, idx) => {
            const isPinned = dataStore.isTeacherPinned(teacher.id);
            const vCount = dataStore.getAllVideos(true).filter(v => v.teacherId === teacher.id && (!v.grade || String(v.grade) === String(pola))).length;
            const mCount = dataStore.getAllMalzamas(true).filter(m => m.teacherId === teacher.id && (!m.grade || String(m.grade) === String(pola))).length;
            const qCount = dataStore.getAllQuizzes(true).filter(q => q.teacherId === teacher.id && (!q.grade || String(q.grade) === String(pola))).length;

            return `
                <div class="teacher-card-interactive ${isPinned ? 'pinned-card' : ''}" data-teacher-id="${escapeHtml(teacher.id)}">
                    <div>
                        <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:10px; margin-bottom:10px;">
                            <div style="display:flex; align-items:center; gap:12px; min-width:0;">
                                <img class="t-avatar" src="${escapeHtml(teacher.avatar || getFallbackAvatar())}" onerror="this.src='${getFallbackAvatar()}'" alt="${escapeHtml(teacher.name)}">
                                <div style="min-width:0;">
                                    <h3 style="margin:0 0 3px; font-size:1.03rem; color:var(--primary-text);">${escapeHtml(teacher.name)}</h3>
                                    <div style="font-size:0.82rem; color:var(--blue-accent); font-weight:600;">${escapeHtml(teacher.subject || '')}</div>
                                    <div style="font-size:0.76rem; color:var(--secondary-text); margin-top:2px;">
                                        #${idx + 1} • ${(teacher.viewsCount || 0).toLocaleString()} بینەر
                                    </div>
                                </div>
                            </div>
                            <button type="button" class="btn-pin-teacher ${isPinned ? 'pinned' : ''}" data-pin-teacher-id="${escapeHtml(teacher.id)}" title="${isPinned ? 'لادانا پینێ' : 'پین کرن بۆ ئەولی'}">
                                <i class="fas fa-thumbtack"></i>
                                <span>${isPinned ? 'پین کریە' : 'پین کرن'}</span>
                            </button>
                        </div>
                        <p style="margin:0; font-size:0.82rem; color:var(--secondary-text); line-height:1.5;">
                            ${escapeHtml(teacher.bio || 'مامۆستایێ تایبەتمەند یێ بابەتی')}
                        </p>
                    </div>
                    <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; padding-top:8px; border-top:1px solid var(--border-color); font-size:0.78rem; color:var(--secondary-text);">
                        <span>${vCount} ڤیدیۆ • ${mCount} مەلزەمە • ${qCount} پرسیار</span>
                        <span style="color:var(--blue-accent); font-weight:700;">ڤەکرن <i class="fas fa-chevron-left"></i></span>
                    </div>
                </div>
            `;
        }).join('');

        teachersListContainer.querySelectorAll('.btn-pin-teacher').forEach(pinBtn => {
            pinBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const tid = pinBtn.getAttribute('data-pin-teacher-id');
                const res = dataStore.togglePinTeacher(tid);
                notifyUser(res.pinned ? 'مامۆستا هاتە پین کرن و چوو ئەولی! 📌' : 'پین لسەر مامۆستایی هاتە لادان.', 'success');
                refreshAllSubjectPanels();
            });
        });

        teachersListContainer.querySelectorAll('.teacher-card-interactive').forEach(card => {
            card.addEventListener('click', () => {
                const tid = card.getAttribute('data-teacher-id');
                const t = dataStore.getTeacherById(tid);
                if (t) {
                    selectedDetailTeacher = t;
                    dataStore.incrementViews(t.id);
                    renderTeachersSection();
                }
            });
        });
    }

    function renderTeacherDetail(teacher) {
        if (!teacher) return;
        if (teachersListView) teachersListView.style.display = 'none';
        if (teacherDetailView) teacherDetailView.style.display = 'block';

        const isPinned = dataStore.isTeacherPinned(teacher.id);
        if (detailTeacherAvatar) detailTeacherAvatar.src = teacher.avatar || getFallbackAvatar();
        if (detailTeacherName) detailTeacherName.textContent = teacher.name;
        if (detailTeacherBio) detailTeacherBio.textContent = `${teacher.subject || ''} • ${(teacher.viewsCount || 0).toLocaleString()} بینەر`;
        if (detailTeacherPinBtn) {
            detailTeacherPinBtn.className = `btn-pin-teacher ${isPinned ? 'pinned' : ''}`;
            detailTeacherPinBtn.innerHTML = `<i class="fas fa-thumbtack"></i> <span>${isPinned ? 'پین کریە' : 'پین کرن'}</span>`;
        }

        const tVideos = dataStore.getAllVideos(true).filter(v => v.teacherId === teacher.id && (!v.grade || String(v.grade) === String(pola)));
        const tMalzamas = dataStore.getAllMalzamas(true).filter(m => m.teacherId === teacher.id && (!m.grade || String(m.grade) === String(pola)));
        const tHtmls = tMalzamas.filter(isHtmlLesson);
        const tDocs = tMalzamas.filter(m => !isHtmlLesson(m));
        const tQuizzes = dataStore.getAllQuizzes(true).filter(q => q.teacherId === teacher.id && (!q.grade || String(q.grade) === String(pola)));
        const tFlashcards = typeof dataStore.getAllFlashcards === 'function'
            ? dataStore.getAllFlashcards(true).filter(fc => fc.teacherId === teacher.id && (!fc.grade || String(fc.grade) === String(pola)))
            : [];

        if (!teacherDetailSections) return;

        let html = '';

        // Teacher Videos
        html += `
            <div>
                <h4 style="margin:0 0 10px; font-size:1.05rem;"><i class="fas fa-play-circle" style="color:#e63946;"></i> وانێن ڤیدیۆیی (${tVideos.length})</h4>
                ${tVideos.length === 0 ? `<p style="color:var(--secondary-text); font-size:0.85rem; margin:0;">چ ڤیدیۆ نینن.</p>` : `
                    <div class="portal-items-grid">
                        ${tVideos.map(v => {
                            const yId = dataStore.getYoutubeId(v.youtubeUrl);
                            const thumb = yId ? `https://img.youtube.com/vi/${yId}/hqdefault.jpg` : '';
                            return `
                                <div class="content-card-box">
                                    ${thumb ? `
                                        <div style="position:relative; width:100%; padding-bottom:56.25%; border-radius:10px; overflow:hidden; background:#000;">
                                            <img src="${thumb}" alt="${escapeHtml(v.title)}" style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover;">
                                            <button type="button" class="btn-play-video" data-video-id="${escapeHtml(v.id)}" style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:46px; height:46px; border-radius:50%; background:rgba(220,38,38,0.9); border:none; color:#fff; font-size:1.1rem; cursor:pointer;">
                                                <i class="fas fa-play"></i>
                                            </button>
                                        </div>
                                    ` : ''}
                                    <div>
                                        <h4 style="margin:0 0 4px; font-size:0.96rem;">${escapeHtml(v.title)}</h4>
                                        <p style="margin:0; font-size:0.78rem; color:var(--secondary-text);">${escapeHtml(v.chapter || '')}</p>
                                    </div>
                                    <button type="button" class="btn-action-primary btn-play-video" data-video-id="${escapeHtml(v.id)}" style="background:#dc2626;">
                                        <i class="fas fa-play"></i> تەماشاکرن
                                    </button>
                                </div>
                            `;
                        }).join('')}
                    </div>
                `}
            </div>
        `;

        // Teacher Malzamas
        html += `
            <div>
                <h4 style="margin:0 0 10px; font-size:1.05rem;"><i class="fas fa-file-alt" style="color:#059669;"></i> مەلزەمە (${tDocs.length})</h4>
                ${tDocs.length === 0 ? `<p style="color:var(--secondary-text); font-size:0.85rem; margin:0;">چ مەلزەمە نینن.</p>` : `
                    <div class="portal-items-grid">
                        ${tDocs.map(m => renderDocCardMarkup(m)).join('')}
                    </div>
                `}
            </div>
        `;

        // Teacher HTML AI Explanations
        html += `
            <div>
                <h4 style="margin:0 0 10px; font-size:1.05rem;"><i class="fas fa-code" style="color:#0284c7;"></i> شەرحکرن ب AI / فایلێن HTML (${tHtmls.length})</h4>
                ${tHtmls.length === 0 ? `<p style="color:var(--secondary-text); font-size:0.85rem; margin:0;">چ فایلێن HTML نینن.</p>` : `
                    <div class="portal-items-grid">
                        ${tHtmls.map(m => renderDocCardMarkup(m, true)).join('')}
                    </div>
                `}
            </div>
        `;

        // Teacher Flashcards
        html += `
            <div>
                <h4 style="margin:0 0 10px; font-size:1.05rem;"><i class="fas fa-clone" style="color:#0ea5e9;"></i> فلاش کارت (${tFlashcards.length})</h4>
                ${tFlashcards.length === 0 ? `<p style="color:var(--secondary-text); font-size:0.85rem; margin:0;">چ فلاش کارت نینن.</p>` : `
                    <button type="button" id="jump-teacher-flashcards-btn" class="btn-action-secondary">
                        <i class="fas fa-arrow-left"></i> چوون بۆ بەشێ فلاش کارتان (${tFlashcards.length} کارت)
                    </button>
                `}
            </div>
        `;

        // Teacher Quizzes
        html += `
            <div>
                <h4 style="margin:0 0 10px; font-size:1.05rem;"><i class="fas fa-check-double" style="color:#7c3aed;"></i> پرسیارێن هەلبژارتن (${tQuizzes.length})</h4>
                ${tQuizzes.length === 0 ? `<p style="color:var(--secondary-text); font-size:0.85rem; margin:0;">چ پرسیار نینن.</p>` : `
                    <button type="button" id="jump-teacher-quizzes-btn" class="btn-action-secondary">
                        <i class="fas fa-arrow-left"></i> چوون بۆ بەشێ هەلبژارتن (${tQuizzes.length} پرسیار)
                    </button>
                `}
            </div>
        `;

        teacherDetailSections.innerHTML = html;

        teacherDetailSections.querySelectorAll('.btn-play-video').forEach(btn => {
            btn.addEventListener('click', () => {
                const vid = tVideos.find(v => v.id === btn.getAttribute('data-video-id'));
                if (vid) openVideoModal(vid);
            });
        });

        teacherDetailSections.querySelectorAll('.btn-open-doc').forEach(btn => {
            btn.addEventListener('click', () => {
                const docId = btn.getAttribute('data-doc-id');
                const found = tMalzamas.find(m => m.id === docId);
                if (found) openDocumentModal(found, teacher);
            });
        });

        const jumpFc = document.getElementById('jump-teacher-flashcards-btn');
        if (jumpFc) jumpFc.addEventListener('click', () => {
            flashcardTeacherFilter = teacher.id;
            flashcardIndex = 0;
            renderFlashcardsSection();
            switchSubjectTab('flashcards');
        });

        const jumpQ = document.getElementById('jump-teacher-quizzes-btn');
        if (jumpQ) jumpQ.addEventListener('click', () => switchSubjectTab('quizzes'));
    }

    if (detailTeacherPinBtn) {
        detailTeacherPinBtn.addEventListener('click', () => {
            if (!selectedDetailTeacher) return;
            const res = dataStore.togglePinTeacher(selectedDetailTeacher.id);
            notifyUser(res.pinned ? 'مامۆستا هاتە پین کرن و چوو ئەولی! 📌' : 'پین لسەر مامۆستایی هاتە لادان.', 'success');
            refreshAllSubjectPanels();
        });
    }

    if (closeTeacherDetailBtn) {
        closeTeacherDetailBtn.addEventListener('click', () => {
            selectedDetailTeacher = null;
            renderTeachersSection();
        });
    }

    if (toggleAllLangsBtn) {
        toggleAllLangsBtn.addEventListener('click', () => {
            showAllTeacherDialects = !showAllTeacherDialects;
            renderTeachersSection();
        });
    }

    // ==========================================
    // SECTION 2 & 3: MALZAMA & AI EXPLANATIONS (HTML)
    // ==========================================
    function renderDocCardMarkup(item, isHtmlMode = false) {
        const ft = (item.fileType || (isHtmlMode ? 'html' : 'pdf')).toLowerCase();
        const typeIcon = {
            pptx: 'fa-file-powerpoint',
            html: 'fa-code',
            image: 'fa-file-image',
            pdf: 'fa-file-pdf'
        }[ft] || 'fa-file-alt';
        const canDl = canManageOrDownload();

        return `
            <div class="content-card-box">
                <div>
                    <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:8px;">
                        <span class="format-tag ${ft}"><i class="fas ${typeIcon}"></i> ${ft.toUpperCase()}</span>
                        <span style="font-size:0.75rem; color:var(--secondary-text);">${escapeHtml(item.fileSize || '')}</span>
                    </div>
                    <h4 style="margin:0 0 5px; font-size:1.02rem; color:var(--primary-text);">${escapeHtml(item.title)}</h4>
                    <div style="font-size:0.78rem; color:var(--blue-accent); font-weight:600; margin-bottom:6px;">
                        <i class="fas fa-chalkboard-teacher"></i> ${escapeHtml(item.teacherName || 'مامۆستا')}
                    </div>
                    <p style="margin:0; font-size:0.8rem; color:var(--secondary-text); line-height:1.45;">
                        ${escapeHtml(item.description || item.chapter || '')}
                    </p>
                </div>
                <div style="display:flex; gap:8px; margin-top:6px;">
                    <button type="button" class="btn-action-primary btn-open-doc" data-doc-id="${escapeHtml(item.id)}" style="flex:1;">
                        <i class="fas ${isHtmlMode ? 'fa-play-circle' : 'fa-eye'}"></i>
                        ${isHtmlMode ? 'ڤەکرنا شەرحا HTML' : 'تەماشاکرن'}
                    </button>
                    ${canDl && item.fileUrl ? `
                        <a href="${escapeHtml(item.fileUrl)}" download target="_blank" class="btn-action-secondary" title="داگرتن">
                            <i class="fas fa-download"></i>
                        </a>
                    ` : ''}
                </div>
            </div>
        `;
    }

    function renderMalzamaSection() {
        const { nonHtml } = getSubjectMalzamas();
        if (countMalzamaEl) countMalzamaEl.textContent = nonHtml.length;

        if (malzamaTeacherFilterEl) {
            const teachers = getSubjectTeachers();
            const currentVal = malzamaTeacherFilter;
            malzamaTeacherFilterEl.innerHTML = '<option value="all">هەموو مامۆستایان</option>' +
                teachers.map(t => `<option value="${escapeHtml(t.id)}">${dataStore.isTeacherPinned(t.id) ? '📌 ' : ''}${escapeHtml(t.name)}</option>`).join('');
            malzamaTeacherFilterEl.value = teachers.some(t => t.id === currentVal) ? currentVal : 'all';
        }

        const filtered = malzamaTeacherFilter === 'all'
            ? nonHtml
            : nonHtml.filter(m => String(m.teacherId) === String(malzamaTeacherFilter));

        if (!malzamaContainer) return;

        if (filtered.length === 0) {
            malzamaContainer.innerHTML = `
                <div style="grid-column:1 / -1; text-align:center; padding:32px 18px; color:var(--secondary-text); border:1px dashed var(--border-color); border-radius:14px;">
                    <i class="fas fa-folder-open" style="font-size:2.2rem; opacity:0.45; margin-bottom:8px;"></i>
                    <p style="margin:0;">نوکە چ مەلزەمە بۆ ڤی بابەتی نینن.</p>
                </div>
            `;
            return;
        }

        malzamaContainer.innerHTML = filtered.map(m => renderDocCardMarkup(m, false)).join('');
        malzamaContainer.querySelectorAll('.btn-open-doc').forEach(btn => {
            btn.addEventListener('click', () => {
                const docId = btn.getAttribute('data-doc-id');
                const found = filtered.find(item => String(item.id) === String(docId));
                if (found) openDocumentModal(found, { id: found.teacherId, name: found.teacherName || 'مامۆستا' });
            });
        });
    }

    if (malzamaTeacherFilterEl) {
        malzamaTeacherFilterEl.addEventListener('change', () => {
            malzamaTeacherFilter = malzamaTeacherFilterEl.value;
            renderMalzamaSection();
        });
    }

    function renderAiExplainSection() {
        const { htmlItems } = getSubjectMalzamas();
        if (countAiExplainEl) countAiExplainEl.textContent = htmlItems.length;
        if (!aiExplainContainer) return;

        if (htmlItems.length === 0) {
            aiExplainContainer.innerHTML = `
                <div style="grid-column:1 / -1; text-align:center; padding:32px 18px; color:var(--secondary-text); border:1px dashed var(--border-color); border-radius:14px;">
                    <i class="fas fa-code" style="font-size:2.2rem; opacity:0.45; margin-bottom:8px; color:#0284c7;"></i>
                    <p style="margin:0 0 10px;">هێشتا چ فایلێن HTML یێن شەرحکرنێ بۆ ڤی بابەتی نینن.</p>
                    <button type="button" id="ai-explain-jump-ask-btn" class="btn-action-primary">
                        <i class="fas fa-robot"></i> پرسیار ژ AI بکە
                    </button>
                </div>
            `;
            const jumpBtn = document.getElementById('ai-explain-jump-ask-btn');
            if (jumpBtn) jumpBtn.addEventListener('click', () => switchSubjectTab('ask-ai'));
            return;
        }

        aiExplainContainer.innerHTML = htmlItems.map(m => renderDocCardMarkup(m, true)).join('');
        aiExplainContainer.querySelectorAll('.btn-open-doc').forEach(btn => {
            btn.addEventListener('click', () => {
                const docId = btn.getAttribute('data-doc-id');
                const found = htmlItems.find(item => String(item.id) === String(docId));
                if (found) openDocumentModal(found, { id: found.teacherId, name: found.teacherName || 'مامۆستا' });
            });
        });
    }

    // Teacher/Admin direct HTML upload inside AI Explanation section
    if (cfHtmlUploadForm) {
        cfHtmlUploadForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!window.CloudflareLessons || !canManageOrDownload()) {
                notifyUser('تەنێ مامۆستا و ئەدمین دشێن فایلان بار بکەن.', 'error');
                return;
            }
            const user = window.CloudflareLessons.getCurrentUser();
            if (!user) {
                window.CloudflareLessons.openAuthModal('login');
                return;
            }
            const title = (document.getElementById('cf-html-title') || {}).value.trim();
            const fileInput = document.getElementById('cf-html-file');
            const file = fileInput && fileInput.files ? fileInput.files[0] : null;
            const subObj = dataStore.getSubjectById(currentSelectedSubject);
            if (!title || !file) return;

            const submitBtn = document.getElementById('cf-html-submit-btn');
            if (submitBtn) submitBtn.disabled = true;
            try {
                await window.CloudflareLessons.uploadLesson({
                    file,
                    meta: {
                        user_id: user.id,
                        author_name: user.full_name,
                        role: user.role,
                        title,
                        subject: subObj ? subObj.name : '',
                        grade: String(pola),
                        fileType: 'html',
                        fileName: file.name,
                        createdAt: new Date().toISOString()
                    }
                });
                cfHtmlUploadForm.reset();
                if (cfHtmlUploadDetails) cfHtmlUploadDetails.open = false;
                notifyUser('فایلێ HTML ب سەرکەفتوویی هاتە بەلاڤکرن! ✅', 'success');
                renderAiExplainSection();
            } catch (err) {
                notifyUser(err.message || 'نەشیا بار بکەت.', 'error');
            } finally {
                if (submitBtn) submitBtn.disabled = false;
            }
        });
    }

    // ==========================================
    // SECTION 4: FLASHCARDS (بەشێ فلاش کارتان)
    // ==========================================
    function renderFlashcardsSection() {
        const allCards = getSubjectFlashcards();
        if (countFlashcardsEl) countFlashcardsEl.textContent = allCards.length;

        // Show studio shortcut for Admin / Teacher
        if (flashcardStudioLink) {
            const role = dataStore.getCurrentUserRole();
            const isAdmin = dataStore.isCurrentUserSuperAdmin();
            if (isAdmin) {
                flashcardStudioLink.style.display = 'inline-flex';
                flashcardStudioLink.href = 'admin-panel.html';
            } else if (role === 'teacher') {
                flashcardStudioLink.style.display = 'inline-flex';
                flashcardStudioLink.href = 'teacher-dashboard.html';
            } else {
                flashcardStudioLink.style.display = 'none';
            }
        }

        if (flashcardTeacherFilterEl) {
            const seenTeachers = new Map();
            allCards.forEach(c => {
                if (c.teacherId && !seenTeachers.has(c.teacherId)) {
                    seenTeachers.set(c.teacherId, c.teacherName || 'مامۆستا');
                }
            });
            const prevVal = flashcardTeacherFilter;
            flashcardTeacherFilterEl.innerHTML = `<option value="all">هەموو مامۆستایان (${allCards.length})</option>` +
                Array.from(seenTeachers.entries()).map(([tid, tname]) => `<option value="${escapeHtml(tid)}">${escapeHtml(tname)}</option>`).join('');
            if (prevVal !== 'all' && seenTeachers.has(prevVal)) {
                flashcardTeacherFilterEl.value = prevVal;
            } else {
                flashcardTeacherFilter = 'all';
                flashcardTeacherFilterEl.value = 'all';
            }
        }

        const deck = flashcardTeacherFilter === 'all'
            ? allCards
            : allCards.filter(c => String(c.teacherId) === String(flashcardTeacherFilter));

        const total = deck.length;
        const knownCount = deck.filter(c => flashcardKnownIds.has(c.id)).length;
        if (flashcardProgressText) {
            flashcardProgressText.textContent = total === 0
                ? 'چ فلاش کارت بۆ ڤی بابەتی نینن'
                : `فلاش کارت: ${Math.min(flashcardIndex + 1, total)} / ${total} • زانراو: ${knownCount} ژ ${total}`;
        }
        if (flashcardProgressFill) {
            const pct = total > 0 ? Math.round((knownCount / total) * 100) : 0;
            flashcardProgressFill.style.width = `${pct}%`;
        }

        if (flashcardViewToggleBtn) {
            flashcardViewToggleBtn.innerHTML = flashcardGridMode
                ? '<i class="fas fa-clone"></i> شێوازێ کارتێ تاک'
                : '<i class="fas fa-th-large"></i> هەموو کارت';
        }

        if (!flashcardStageWrap || !flashcardGridView) return;

        if (total === 0) {
            flashcardStageWrap.style.display = 'block';
            flashcardGridView.style.display = 'none';
            flashcardStageWrap.innerHTML = `
                <div style="text-align:center; padding:34px 18px; color:var(--secondary-text); border:1px dashed var(--border-color); border-radius:16px;">
                    <i class="fas fa-clone" style="font-size:2.3rem; opacity:0.45; margin-bottom:10px;"></i>
                    <p style="margin:0 0 12px;">نوکە چ فلاش کارت بۆ ڤی بابەتی نینن.</p>
                    <button type="button" id="fc-empty-ask-ai-btn" class="btn-action-primary">
                        <i class="fas fa-robot"></i> پرسیار ژ AI بکە بۆ ڤی بابەتی
                    </button>
                </div>
            `;
            const emptyAiBtn = document.getElementById('fc-empty-ask-ai-btn');
            if (emptyAiBtn) emptyAiBtn.addEventListener('click', () => switchSubjectTab('ask-ai'));
            return;
        }

        if (flashcardIndex >= total) flashcardIndex = 0;
        if (flashcardIndex < 0) flashcardIndex = total - 1;

        if (flashcardGridMode) {
            flashcardStageWrap.style.display = 'none';
            flashcardGridView.style.display = 'grid';
            flashcardGridView.innerHTML = deck.map((card, idx) => {
                const isKnown = flashcardKnownIds.has(card.id);
                return `
                    <div class="content-card-box" style="${isKnown ? 'border-color:rgba(16,185,129,0.55);' : ''}">
                        <div>
                            <div style="display:flex; justify-content:space-between; align-items:center; gap:6px; margin-bottom:8px; font-size:0.75rem; color:var(--secondary-text);">
                                <span>#${idx + 1} • ${escapeHtml(card.chapter || 'فلاش کارت')}</span>
                                <span>${isKnown ? '✅ زانراو' : escapeHtml(card.teacherName || '')}</span>
                            </div>
                            <h4 style="margin:0 0 8px; font-size:0.98rem; line-height:1.5; color:var(--primary-text);">${escapeHtml(card.front)}</h4>
                            <div style="padding:10px 12px; border-radius:10px; background:rgba(37,99,235,0.08); border:1px solid rgba(37,99,235,0.2); font-size:0.86rem; line-height:1.55; color:var(--primary-text); white-space:pre-line;">
                                ${escapeHtml(card.back)}
                            </div>
                        </div>
                        <button type="button" class="btn-action-secondary btn-fc-open-idx" data-fc-idx="${idx}" style="min-height:36px; font-size:0.8rem;">
                            <i class="fas fa-clone"></i> ڤەکرن د کارتا ٣D دا
                        </button>
                    </div>
                `;
            }).join('');

            flashcardGridView.querySelectorAll('.btn-fc-open-idx').forEach(btn => {
                btn.addEventListener('click', () => {
                    flashcardIndex = parseInt(btn.getAttribute('data-fc-idx'), 10) || 0;
                    flashcardFlipped = false;
                    flashcardHintShown = false;
                    flashcardGridMode = false;
                    renderFlashcardsSection();
                });
            });
            return;
        }

        flashcardGridView.style.display = 'none';
        flashcardStageWrap.style.display = 'block';
        const card = deck[flashcardIndex];
        const isKnown = flashcardKnownIds.has(card.id);

        flashcardStageWrap.innerHTML = `
            <div class="flashcard-scene">
                <div id="flashcard-active-card" class="flashcard-card-3d ${flashcardFlipped ? 'is-flipped' : ''}">
                    <div class="flashcard-face flashcard-face-front">
                        <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; font-size:0.78rem; color:var(--secondary-text);">
                            <span style="padding:3px 10px; border-radius:999px; background:rgba(37,99,235,0.12); color:var(--blue-accent); font-weight:700;">
                                پرسیار / ڕووێ پێشێ
                            </span>
                            <span>${escapeHtml(card.chapter || card.subject || '')} • ${escapeHtml(card.teacherName || '')}</span>
                        </div>
                        <div style="text-align:center; padding:18px 8px; font-size:1.18rem; font-weight:800; line-height:1.65; color:var(--primary-text); white-space:pre-line;">
                            ${escapeHtml(card.front)}
                        </div>
                        <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap;">
                            ${card.hint ? `
                                <button type="button" id="fc-hint-btn" class="btn-action-secondary" style="min-height:32px; padding:4px 10px; font-size:0.78rem;">
                                    <i class="fas fa-lightbulb" style="color:#f59e0b;"></i> ${flashcardHintShown ? escapeHtml(card.hint) : 'نیشاندانا تێبینیێ (Hint)'}
                                </button>
                            ` : '<span></span>'}
                            <span style="font-size:0.78rem; color:var(--secondary-text);"><i class="fas fa-sync-alt"></i> کلیک بکە بۆ زڤراندنێ</span>
                        </div>
                    </div>

                    <div class="flashcard-face flashcard-face-back">
                        <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; font-size:0.78rem; color:var(--secondary-text);">
                            <span style="padding:3px 10px; border-radius:999px; background:rgba(16,185,129,0.16); color:#10b981; font-weight:700;">
                                بەرسڤ / ڕووێ پشتێ
                            </span>
                            <span>${isKnown ? '✅ هاتیە زانین' : escapeHtml(card.chapter || '')}</span>
                        </div>
                        <div style="text-align:center; padding:18px 8px; font-size:1.08rem; font-weight:700; line-height:1.7; color:var(--primary-text); white-space:pre-line;">
                            ${escapeHtml(card.back)}
                        </div>
                        <div style="text-align:center; font-size:0.78rem; color:var(--secondary-text);">
                            <i class="fas fa-sync-alt"></i> کلیک بکە دا بزڤریتە ڕووێ پێشێ
                        </div>
                    </div>
                </div>
            </div>

            <div style="display:flex; justify-content:center; align-items:center; gap:10px; flex-wrap:wrap; margin-top:8px;">
                <button type="button" id="fc-prev-btn" class="btn-action-secondary" style="min-height:42px; padding:8px 16px;">
                    <i class="fas fa-arrow-right"></i> یێ بەرێ
                </button>
                <button type="button" id="fc-flip-btn" class="btn-action-primary" style="min-height:42px; padding:8px 18px;">
                    <i class="fas fa-sync-alt"></i> زڤراندنا کارتێ
                </button>
                <button type="button" id="fc-know-btn" class="btn-action-secondary" style="min-height:42px; padding:8px 16px; ${isKnown ? 'background:rgba(16,185,129,0.16); border-color:#10b981; color:#10b981;' : ''}">
                    <i class="fas fa-check-circle"></i> ${isKnown ? 'من زانی ✓' : 'من ئەڤە زانی'}
                </button>
                <button type="button" id="fc-next-btn" class="btn-action-secondary" style="min-height:42px; padding:8px 16px;">
                    یێ دی <i class="fas fa-arrow-left"></i>
                </button>
            </div>
        `;

        const activeCardEl = document.getElementById('flashcard-active-card');
        if (activeCardEl) {
            activeCardEl.addEventListener('click', (e) => {
                if (e.target && e.target.closest && e.target.closest('#fc-hint-btn')) return;
                flashcardFlipped = !flashcardFlipped;
                activeCardEl.classList.toggle('is-flipped', flashcardFlipped);
            });
        }
        const hintBtn = document.getElementById('fc-hint-btn');
        if (hintBtn) {
            hintBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                flashcardHintShown = !flashcardHintShown;
                renderFlashcardsSection();
            });
        }
        const flipBtn = document.getElementById('fc-flip-btn');
        if (flipBtn) {
            flipBtn.addEventListener('click', () => {
                flashcardFlipped = !flashcardFlipped;
                if (activeCardEl) activeCardEl.classList.toggle('is-flipped', flashcardFlipped);
            });
        }
        const prevBtn = document.getElementById('fc-prev-btn');
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                flashcardIndex = (flashcardIndex - 1 + total) % total;
                flashcardFlipped = false;
                flashcardHintShown = false;
                renderFlashcardsSection();
            });
        }
        const nextBtn = document.getElementById('fc-next-btn');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                flashcardIndex = (flashcardIndex + 1) % total;
                flashcardFlipped = false;
                flashcardHintShown = false;
                renderFlashcardsSection();
            });
        }
        const knowBtn = document.getElementById('fc-know-btn');
        if (knowBtn) {
            knowBtn.addEventListener('click', () => {
                if (flashcardKnownIds.has(card.id)) {
                    flashcardKnownIds.delete(card.id);
                } else {
                    flashcardKnownIds.add(card.id);
                    if (total > 1) {
                        flashcardIndex = (flashcardIndex + 1) % total;
                        flashcardFlipped = false;
                        flashcardHintShown = false;
                    }
                }
                renderFlashcardsSection();
            });
        }
    }

    if (flashcardTeacherFilterEl) {
        flashcardTeacherFilterEl.addEventListener('change', () => {
            flashcardTeacherFilter = flashcardTeacherFilterEl.value;
            flashcardIndex = 0;
            flashcardFlipped = false;
            flashcardHintShown = false;
            renderFlashcardsSection();
        });
    }
    if (flashcardShuffleBtn) {
        flashcardShuffleBtn.addEventListener('click', () => {
            const list = getSubjectFlashcards().map(c => c.id);
            for (let i = list.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [list[i], list[j]] = [list[j], list[i]];
            }
            flashcardShuffledIds = list;
            flashcardIndex = 0;
            flashcardFlipped = false;
            flashcardHintShown = false;
            renderFlashcardsSection();
        });
    }
    if (flashcardViewToggleBtn) {
        flashcardViewToggleBtn.addEventListener('click', () => {
            flashcardGridMode = !flashcardGridMode;
            renderFlashcardsSection();
        });
    }
    if (flashcardResetBtn) {
        flashcardResetBtn.addEventListener('click', () => {
            flashcardKnownIds.clear();
            flashcardShuffledIds = null;
            flashcardIndex = 0;
            flashcardFlipped = false;
            flashcardHintShown = false;
            renderFlashcardsSection();
        });
    }

    // ==========================================
    // SECTION 5: QUIZZES (بەشێ هەلبژارتن)
    // ==========================================
    function updateQuizScoreUI(quizzes) {
        if (!quizScoreSummary) return;
        const total = quizzes.length;
        let answered = 0;
        let correct = 0;
        quizzes.forEach(q => {
            if (quizAnswersState[q.id] !== undefined) {
                answered++;
                if (quizAnswersState[q.id] === q.correctIndex) correct++;
            }
        });
        quizScoreSummary.textContent = total === 0
            ? 'چ پرسیار بۆ ڤی بابەتی نینن'
            : `ئەنجام: ${correct} درست ژ ${answered} بەرسڤدای (کۆیێ پرسیاران: ${total})`;
    }

    function renderQuizzesSection() {
        const quizzes = getSubjectQuizzes();
        if (countQuizzesEl) countQuizzesEl.textContent = quizzes.length;
        updateQuizScoreUI(quizzes);
        if (!quizzesContainer) return;

        if (quizzes.length === 0) {
            quizzesContainer.innerHTML = `
                <div style="grid-column:1 / -1; text-align:center; padding:32px 18px; color:var(--secondary-text); border:1px dashed var(--border-color); border-radius:14px;">
                    <i class="fas fa-question-circle" style="font-size:2.2rem; opacity:0.45; margin-bottom:8px;"></i>
                    <p style="margin:0 0 10px;">نوکە چ پرسیارێن هەلبژارتن بۆ ڤی بابەتی نینن.</p>
                    <button type="button" id="quiz-empty-ask-ai-btn" class="btn-action-primary">
                        <i class="fas fa-robot"></i> پرسیارا ژ AI بکە
                    </button>
                </div>
            `;
            const b = document.getElementById('quiz-empty-ask-ai-btn');
            if (b) b.addEventListener('click', () => switchSubjectTab('ask-ai'));
            return;
        }

        quizzesContainer.innerHTML = quizzes.map((q, index) => {
            const pickedIdx = quizAnswersState[q.id];
            const isAnswered = pickedIdx !== undefined;
            const isCorrect = isAnswered && pickedIdx === q.correctIndex;

            return `
                <div class="content-card-box">
                    <div>
                        <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:8px; font-size:0.78rem; color:var(--secondary-text);">
                            <span>پرسیار #${index + 1} • ${escapeHtml(q.chapter || '')}</span>
                            <span>${escapeHtml(q.teacherName || '')}</span>
                        </div>
                        <h4 style="margin:0 0 12px; font-size:1rem; line-height:1.5; color:var(--primary-text);">
                            ${escapeHtml(q.question)}
                        </h4>
                        <div style="display:flex; flex-direction:column; gap:7px;">
                            ${(q.options || []).map((opt, optIdx) => {
                                let style = 'background:var(--surface-alt); border-color:var(--border-color); color:var(--primary-text);';
                                let iconClass = 'far fa-circle';
                                if (isAnswered) {
                                    if (optIdx === q.correctIndex) {
                                        style = 'background:rgba(16,185,129,0.15); border-color:#10b981; color:#10b981; font-weight:700;';
                                        iconClass = 'fas fa-check-circle';
                                    } else if (optIdx === pickedIdx) {
                                        style = 'background:rgba(239,68,68,0.15); border-color:#ef4444; color:#ef4444;';
                                        iconClass = 'fas fa-times-circle';
                                    }
                                }
                                return `
                                    <button type="button" class="btn-quiz-option" data-quiz-id="${escapeHtml(q.id)}" data-opt-idx="${optIdx}" ${isAnswered ? 'disabled' : ''} style="text-align:right; padding:10px 12px; border-radius:10px; border:1.5px solid; font-family:inherit; font-size:0.86rem; cursor:${isAnswered ? 'default' : 'pointer'}; display:flex; align-items:center; justify-content:space-between; gap:8px; ${style}">
                                        <span>${escapeHtml(opt)}</span>
                                        <i class="${iconClass}"></i>
                                    </button>
                                `;
                            }).join('')}
                        </div>
                        ${isAnswered ? `
                            <div style="margin-top:10px; padding:10px 12px; border-radius:10px; font-size:0.83rem; line-height:1.5; background:${isCorrect ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)'}; color:${isCorrect ? '#10b981' : '#ef4444'};">
                                <strong>${isCorrect ? 'بەرسڤا تە درستە!' : 'بەرسڤ خەڵەتە!'}</strong>
                                ${q.explanation ? `<div style="margin-top:4px; color:var(--primary-text);">${escapeHtml(q.explanation)}</div>` : ''}
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');

        quizzesContainer.querySelectorAll('.btn-quiz-option').forEach(btn => {
            btn.addEventListener('click', () => {
                const qId = btn.getAttribute('data-quiz-id');
                const optIdx = parseInt(btn.getAttribute('data-opt-idx'), 10);
                if (quizAnswersState[qId] !== undefined) return;
                quizAnswersState[qId] = optIdx;
                renderQuizzesSection();
            });
        });
    }

    if (resetQuizzesBtn) {
        resetQuizzesBtn.addEventListener('click', () => {
            quizAnswersState = {};
            renderQuizzesSection();
        });
    }

    // ==========================================
    // SECTION 5: ASK AI (بەشێ پرسیارکرن ژ AI)
    // ==========================================
    function getStarterPromptsForSubject(subName) {
        return [
            `گرنگترین خالێن ${subName} بۆ ${currentGradeConfig.shortName || currentGradeConfig.name} ب کورتی شەرح بکە.`,
            `٣ پرسیارێن هەلبژارتن دگەل بەرسڤان ژ بابەتێ ${subName} چێبکە.`,
            `نموونەیەکا کرداری یا ${subName} ب شێوازەکێ سادە ڕوون بکە.`
        ];
    }

    function renderAskAiMessages() {
        if (!askAiMessagesEl) return;
        const subObj = dataStore.getSubjectById(currentSelectedSubject);
        const subName = subObj ? subObj.name : '';

        if (askAiHistory.length === 0) {
            askAiMessagesEl.innerHTML = `
                <div class="ai-msg assistant">
سڵاڤ! ئەز مامۆستایێ AI یێ بابەتێ <strong>${escapeHtml(subName)}</strong> مە بۆ <strong>${escapeHtml(currentGradeConfig.name)}</strong>.
هەر پرسیارەک یان بابەتەکێ ب زەحمەت تە هەبیت، ل خوارێ بنڤیسە داکو ب ساناهی بۆ تە شەرح بکەم.
                </div>
            `;
            return;
        }

        askAiMessagesEl.innerHTML = askAiHistory.map(m => {
            const cls = m.role === 'user' ? 'user' : (m.role === 'error' ? 'error' : 'assistant');
            return `<div class="ai-msg ${cls}">${escapeHtml(m.text)}</div>`;
        }).join('');
        askAiMessagesEl.scrollTop = askAiMessagesEl.scrollHeight;
    }

    function renderAskAiSection() {
        const subObj = dataStore.getSubjectById(currentSelectedSubject);
        const subName = subObj ? subObj.name : '';
        if (askAiContextLabel) {
            askAiContextLabel.textContent = `مامۆستایێ AI یێ تایبەت ب بابەتێ (${subName}) • ${currentGradeConfig.name}`;
        }
        if (askAiStarterChips) {
            const starters = getStarterPromptsForSubject(subName);
            askAiStarterChips.innerHTML = starters.map(txt => `
                <button type="button" class="ai-chip-btn">${escapeHtml(txt)}</button>
            `).join('');
            askAiStarterChips.querySelectorAll('.ai-chip-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    if (askAiInput) askAiInput.value = btn.textContent;
                    sendAskAiQuestion(btn.textContent);
                });
            });
        }
        renderAskAiMessages();
    }

    async function sendAskAiQuestion(rawQuestion) {
        const question = String(rawQuestion || '').trim();
        if (!question || isAskAiSending) return;

        const subObj = dataStore.getSubjectById(currentSelectedSubject);
        const subName = subObj ? subObj.name : '';
        const langName = dataStore.getLanguageLabel(currentLanguage);

        askAiHistory.push({ role: 'user', text: question });
        if (askAiInput) askAiInput.value = '';
        renderAskAiMessages();

        isAskAiSending = true;
        if (askAiSendBtn) {
            askAiSendBtn.disabled = true;
            askAiSendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> چاڤەڕێ بە...';
        }

        try {
            const systemInstructionText = [
                `You are an expert, supportive Kurdish curriculum tutor teaching "${subName}" for "${currentGradeConfig.name}".`,
                `Reply clearly, accurately, and concisely in ${langName} (${currentLanguage === 'ku_ba' ? 'Badini Kurdish in Arabic script' : currentLanguage}).`,
                `Explain step-by-step for students, using clear bullet points or simple formulas when helpful.`
            ].join(' ');

            const conversationContents = askAiHistory
                .filter(m => m.role === 'user' || m.role === 'model')
                .slice(-10)
                .map(m => ({
                    role: m.role === 'user' ? 'user' : 'model',
                    parts: [{ text: m.text }]
                }));

            const resp = await fetch('/api/gemini/v1beta/models/gemini-4-hydrogen:generateContent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    systemInstruction: { parts: [{ text: systemInstructionText }] },
                    contents: conversationContents,
                    generationConfig: { maxOutputTokens: 1400 }
                })
            });

            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) {
                const serverErr = (data && data.error && data.error.message) || `HTTP ${resp.status}`;
                throw new Error(serverErr);
            }

            const answerText = data?.candidates?.[0]?.content?.parts
                ?.map(p => p?.text || '')
                .join('')
                .trim();

            if (!answerText) {
                throw new Error('بەرسڤ ژ AI نەهات. تکایە دووبارە هەول بدە.');
            }

            askAiHistory.push({ role: 'model', text: answerText });
        } catch (err) {
            const msg = String(err?.message || '');
            const friendly = /key|401|403|api_key/i.test(msg)
                ? 'کلیلا API یا Gemini نەهاتیە دیتن یان دروست نینە. تکایە کلیلا خۆ دابین بکە یان ژ ئەدمینی بخوازە.'
                : `کێشەیەک چێبوو د پەیوەندیکرنێ دا ل گەل AI: ${msg || 'دووبارە هەول بدە.'}`;
            askAiHistory.push({ role: 'error', text: friendly });
        } finally {
            isAskAiSending = false;
            if (askAiSendBtn) {
                askAiSendBtn.disabled = false;
                askAiSendBtn.innerHTML = '<i class="fas fa-paper-plane"></i> هنارتن';
            }
            renderAskAiMessages();
        }
    }

    if (askAiForm) {
        askAiForm.addEventListener('submit', (e) => {
            e.preventDefault();
            sendAskAiQuestion(askAiInput ? askAiInput.value : '');
        });
    }

    if (askAiInput) {
        askAiInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendAskAiQuestion(askAiInput.value);
            }
        });
    }

    if (askAiClearBtn) {
        askAiClearBtn.addEventListener('click', () => {
            askAiHistory = [];
            renderAskAiMessages();
        });
    }

    // ==========================================
    // DOCUMENT VIEWER & VIDEO PLAYER MODALS
    // ==========================================
    function openDocumentModal(item, teacher) {
        currentViewingDocItem = item;
        currentViewingDocTeacher = teacher || { name: item.teacherName || 'مامۆستا' };
        const canDownload = canManageOrDownload();

        if (docModalTitle) docModalTitle.textContent = item.title || 'پەڕاو';
        if (docModalTeacher) docModalTeacher.innerHTML = `<i class="fas fa-chalkboard-teacher"></i> ${escapeHtml(currentViewingDocTeacher.name)}`;
        if (docModalSize) docModalSize.innerHTML = item.fileSize ? `<i class="fas fa-weight-hanging"></i> ${escapeHtml(item.fileSize)}` : '';
        if (docModalDownload) {
            docModalDownload.href = canDownload ? (item.fileUrl || '#') : '#';
            docModalDownload.style.display = canDownload ? 'inline-flex' : 'none';
        }
        if (docModalFullscreenBtn) docModalFullscreenBtn.style.display = canDownload ? 'inline-flex' : 'none';
        if (docModalGdriveSave) docModalGdriveSave.style.display = canDownload ? 'inline-flex' : 'none';

        const type = (item.fileType || (isHtmlLesson(item) ? 'html' : 'pdf')).toLowerCase();
        if (docModalBadge) {
            docModalBadge.className = `format-tag ${type}`;
            docModalBadge.textContent = type.toUpperCase();
        }

        if (!canDownload) {
            docViewport.oncontextmenu = () => false;
            docViewport.style.userSelect = 'none';
        } else {
            docViewport.oncontextmenu = null;
            docViewport.style.userSelect = '';
        }

        if (type === 'html') {
            docViewport.innerHTML = '';
            const rawHtml = dataStore.getHtmlContentFromItem(item);
            const iframe = document.createElement('iframe');
            iframe.style.width = '100%';
            iframe.style.height = '640px';
            iframe.style.border = 'none';
            iframe.style.background = '#ffffff';
            iframe.setAttribute('allowfullscreen', 'true');
            iframe.setAttribute('allow', 'fullscreen; autoplay; microphone; clipboard-write; encrypted-media');
            if (!canDownload) {
                iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms');
            }
            if (window.CloudflareLessons && typeof window.CloudflareLessons.attachProxyLoadBridge === 'function') {
                window.CloudflareLessons.attachProxyLoadBridge(iframe);
            }
            if (rawHtml) {
                iframe.srcdoc = (window.CloudflareLessons && typeof window.CloudflareLessons.prepareHtmlForPreview === 'function')
                    ? window.CloudflareLessons.prepareHtmlForPreview(rawHtml, item.fileUrl)
                    : rawHtml;
                docViewport.appendChild(iframe);
            } else if (item.fileUrl && /^https?:\/\//i.test(item.fileUrl)) {
                iframe.src = item.fileUrl;
                docViewport.appendChild(iframe);
                if (window.CloudflareLessons && typeof window.CloudflareLessons.checkServerGeminiProxy === 'function') {
                    window.CloudflareLessons.checkServerGeminiProxy().then(async (proxyOk) => {
                        if (!proxyOk) return;
                        try {
                            const r = await fetch(item.fileUrl, { mode: 'cors' });
                            if (!r.ok) return;
                            const fetchedHtml = await r.text();
                            if (!fetchedHtml) return;
                            iframe.removeAttribute('src');
                            iframe.srcdoc = window.CloudflareLessons.prepareHtmlForPreview(fetchedHtml, item.fileUrl);
                        } catch (e) {}
                    });
                }
            } else {
                iframe.srcdoc = `<div style="padding:36px; text-align:center; font-family:sans-serif;"><h2>${escapeHtml(item.title)}</h2><p>${escapeHtml(item.description || '')}</p></div>`;
                docViewport.appendChild(iframe);
            }

            if (canDownload && docModalFullscreenBtn) {
                docModalFullscreenBtn.onclick = () => {
                    if (rawHtml) {
                        const blobUrl = URL.createObjectURL(new Blob([rawHtml], { type: 'text/html;charset=utf-8' }));
                        window.open(blobUrl, '_blank');
                    } else if (item.fileUrl) {
                        window.open(item.fileUrl, '_blank');
                    }
                };
            }
        } else if (type === 'pptx') {
            if (item.fileUrl && /^https?:\/\//i.test(item.fileUrl)) {
                const embedUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(item.fileUrl)}`;
                docViewport.innerHTML = `<iframe src="${embedUrl}" style="width:100%; height:640px; border:none; background:#ffffff;" allowfullscreen></iframe>`;
            } else {
                docViewport.innerHTML = `<div style="padding:32px; color:#fff; text-align:center;"><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.description || '')}</p></div>`;
            }
        } else if (type === 'image') {
            const imgSrc = item.fileData || item.fileUrl || '';
            docViewport.innerHTML = `<div style="padding:18px; text-align:center;"><img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(item.title)}" style="max-width:100%; max-height:75vh; border-radius:10px;"></div>`;
        } else {
            const pdfSrc = item.fileData || item.fileUrl || 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/examples/learning/helloworld.pdf';
            const pdfParams = canDownload ? '#toolbar=1' : '#toolbar=0&navpanes=0&scrollbar=1';
            docViewport.innerHTML = `<iframe src="${escapeHtml(pdfSrc)}${pdfParams}" style="width:100%; height:600px; border:none; background:#ffffff;"></iframe>`;
            if (docModalFullscreenBtn && canDownload) {
                docModalFullscreenBtn.onclick = () => window.open(pdfSrc, '_blank');
            }
        }

        docModal.classList.add('open');
        if (currentViewingDocTeacher.id) {
            dataStore.incrementViews(currentViewingDocTeacher.id, item.id, 'malzama');
        }
    }

    if (closeDocBtn) {
        closeDocBtn.addEventListener('click', () => {
            docModal.classList.remove('open');
            docViewport.innerHTML = '';
        });
    }

    if (docModalGdriveSave) {
        docModalGdriveSave.addEventListener('click', async () => {
            if (!currentViewingDocItem) return;
            if (!window.GoogleDriveService) {
                notifyUser('گووگڵ درایڤ ئامادە نییە.', 'error');
                return;
            }
            if (!window.GoogleDriveService.getAccessToken()) {
                try {
                    await window.GoogleDriveService.signInWithGoogle();
                } catch (e) {
                    notifyUser('پەیوەستبوون ب Google Drive سەرکەوتوو نەبوو.', 'error');
                    return;
                }
            }
            const item = currentViewingDocItem;
            const teacher = currentViewingDocTeacher || { name: 'مامۆستا' };
            try {
                const html = item.htmlContent || `<h1>${escapeHtml(item.title)}</h1><p>${escapeHtml(item.description || '')}</p>`;
                await window.GoogleDriveService.uploadFile({
                    name: `${item.title}.html`,
                    content: html,
                    mimeType: 'text/html'
                });
                notifyUser(`(${item.title}) ل Google Drive هاتە پاراستن!`, 'success');
            } catch (err) {
                notifyUser('هەڵە د پاراستنێ دا ل Drive: ' + err.message, 'error');
            }
        });
    }

    function openVideoModal(video) {
        const yId = dataStore.getYoutubeId(video.youtubeUrl);
        if (!yId) return;
        if (modalVideoTitle) modalVideoTitle.textContent = video.title;
        if (modalVideoChapter) modalVideoChapter.textContent = video.chapter || '';
        if (youtubeIframe) youtubeIframe.src = `https://www.youtube.com/embed/${yId}?autoplay=1&enablejsapi=1`;
        if (videoModal) videoModal.classList.add('open');
        dataStore.incrementViews(video.teacherId, video.id, 'video');
    }

    if (closePlayerBtn) {
        closePlayerBtn.addEventListener('click', () => {
            videoModal.classList.remove('open');
            if (youtubeIframe) youtubeIframe.src = '';
        });
    }

    [docModal, videoModal].forEach(modal => {
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('open');
                    if (docViewport && modal === docModal) docViewport.innerHTML = '';
                    if (youtubeIframe && modal === videoModal) youtubeIframe.src = '';
                }
            });
        }
    });

    // ==========================================
    // LANGUAGE FILTERING & LIVE LISTENERS
    // ==========================================
    function updateLanguageUI(lang) {
        currentLanguage = lang;
        langPills.forEach(p => p.classList.toggle('active', p.getAttribute('data-lang') === lang));
        if (currentSelectedSubject) {
            const subObj = dataStore.getSubjectById(currentSelectedSubject);
            if (activeSubjectSub && subObj) {
                activeSubjectSub.textContent = `${currentGradeConfig.name} • ${dataStore.getLanguageLabel(lang)}`;
            }
            refreshAllSubjectPanels();
        } else {
            renderSubjectsGrid();
        }
    }

    langPills.forEach(pill => {
        pill.addEventListener('click', () => {
            const lang = pill.getAttribute('data-lang');
            dataStore.setActiveLanguage(lang);
            updateLanguageUI(lang);
            if (window.CloudflareLessons) {
                window.CloudflareLessons.saveUserSettingsToServer({ lang });
            }
        });
    });

    window.addEventListener('languageChanged', (e) => {
        if (e.detail && e.detail.lang) updateLanguageUI(e.detail.lang);
    });
    window.addEventListener('parwardaAuthChanged', syncGradeAuthUI);
    window.addEventListener('teachersUpdated', () => {
        if (currentSelectedSubject) refreshAllSubjectPanels();
        else renderSubjectsGrid();
    });
    window.addEventListener('teachersPinChanged', () => {
        if (currentSelectedSubject) refreshAllSubjectPanels();
    });
    window.addEventListener('educational-content-changed', () => {
        if (currentSelectedSubject) refreshAllSubjectPanels();
    });
    window.addEventListener('cloudflareLessonsUpdated', () => {
        if (currentSelectedSubject) {
            renderMalzamaSection();
            renderAiExplainSection();
        }
    });

    // ==========================================
    // INITIAL BOOTSTRAP
    // ==========================================
    langPills.forEach(p => p.classList.toggle('active', p.getAttribute('data-lang') === currentLanguage));

    if (currentSelectedSubject) {
        openSubjectWorkspace(currentSelectedSubject, initialTabParam || 'teachers');
        if (initialTeacherParam) {
            const t = dataStore.getTeacherById(initialTeacherParam);
            if (t) {
                selectedDetailTeacher = t;
                renderTeachersSection();
            }
        }
    } else {
        showSubjectsView();
    }

    if (window.CloudflareLessons && typeof window.CloudflareLessons.fetchLessons === 'function') {
        window.CloudflareLessons.fetchLessons().catch(() => {});
    }
});
