// =========================================================================
// Homepage Controller (UPDATED)
// Manages:
// 1. All 13 Grades (KG to 12) & Student Chosen Grades Filter
// 2. Student Grade Onboarding Modal (Automatic on first entry)
// 3. Settings Modal (بەشێ ڕێکخستن) for changing followed grades & language
// 4. Role Selection (Student vs Teacher vs Super Admin)
// 5. Strict Language Matching for Content and Teachers
// =========================================================================

document.addEventListener('DOMContentLoaded', () => {
    const dataStore = window.EducationalData;
    const gradesConfig = window.GRADES_CONFIG;

    // Elements
    const gradesContainer = document.getElementById('grades-grid-container');
    const filterButtons = document.querySelectorAll('.g-filter-btn');
    const totalVisibleGradesCount = document.getElementById('total-visible-grades-count');

    // Followed Grades Banner
    const followedBanner = document.getElementById('followed-grades-banner');
    const followedGradesNames = document.getElementById('followed-grades-names');
    const editFollowedBtn = document.getElementById('edit-followed-grades-btn');
    const showAllGradesToggle = document.getElementById('show-all-grades-toggle');

    // Container and Auth Gate
    const authGateScreen = document.getElementById('auth-gate-screen');
    const mainAppContainer = document.getElementById('main-app-container');
    const profileSetupModal = document.getElementById('profile-setup-modal');

    // Role Indicator & Personalized Profile Elements
    const homeRoleBadge = document.getElementById('home-role-badge');
    const homeRoleText = document.getElementById('home-role-text');
    const homeTeacherLink = document.getElementById('home-teacher-link');
    const homeAdminLink = document.getElementById('home-admin-link');
    const homeLangIndicator = document.getElementById('home-lang-indicator');
    const openRoleSelectorBtn = document.getElementById('open-role-selector-btn');
    const topUserAvatar = document.getElementById('top-user-avatar');
    const topUserName = document.getElementById('top-user-name');
    const topUserBio = document.getElementById('top-user-bio');
    const personalizedUserCard = document.getElementById('personalized-user-card');
    const editMyProfileBtn = document.getElementById('edit-my-profile-btn');
    const btnTopSignout = document.getElementById('btn-top-signout');
    const pendingTeacherVerifyBtn = document.getElementById('pending-teacher-verify-btn');

    // Modals
    const roleModal = document.getElementById('role-selection-modal');
    const closeRoleModalBtn = document.getElementById('close-role-modal-btn');
    const chooseStudentBtn = document.getElementById('choose-student-btn');
    const chooseTeacherBtn = document.getElementById('choose-teacher-btn');
    const chooseAdminBtn = document.getElementById('choose-admin-btn');

    // Student Onboarding Modal
    const studentGradesModal = document.getElementById('student-grades-modal');
    const onboardGradesGrid = document.getElementById('onboard-grades-grid');
    const saveStudentGradesBtn = document.getElementById('save-student-grades-btn');
    const presetGradesBtns = document.querySelectorAll('.preset-grades-btn');

    // Settings Modal (بەشێ ڕێکخستن)
    const settingsModal = document.getElementById('settings-modal');
    const settingsToggleBtn = document.getElementById('settings-toggle-btn');
    const openSettingsBtn = document.getElementById('open-settings-btn');
    const closeSettingsBtn = document.getElementById('close-settings-btn');
    const settingsGradesGrid = document.getElementById('settings-grades-grid');
    const saveAllSettingsBtn = document.getElementById('save-all-settings-btn');
    const settingsCheckAllBtn = document.getElementById('settings-check-all-btn');
    const settingsCheckHighBtn = document.getElementById('settings-check-high-btn');
    const setLightThemeBtn = document.getElementById('set-light-theme-btn');
    const setDarkThemeBtn = document.getElementById('set-dark-theme-btn');

    // Teacher Register Modal
    const teacherRegModal = document.getElementById('teacher-register-modal');
    const closeTeacherRegBtn = document.getElementById('close-teacher-reg-btn');
    const teacherRegForm = document.getElementById('teacher-register-form');

    // Admin Fast Login
    const loginModal = document.getElementById('login-modal');
    const adminLoginTrigger = document.getElementById('admin-login-trigger');
    const fastAdminAuthBtn = document.getElementById('fast-admin-auth-btn');

    let currentLevelFilter = 'all';
    let isShowingAllTemporarily = false;

    // ==========================================
    // 1. POPULATE ONBOARDING & SETTINGS CHECKBOXES
    // ==========================================
    function createGradeCheckboxes(containerEl, preSelectedIds = []) {
        if (!containerEl) return;
        containerEl.innerHTML = gradesConfig.map(g => {
            const isChecked = preSelectedIds.includes(g.id);
            return `
                <label class="grade-check-item">
                    <input type="checkbox" value="${g.id}" ${isChecked ? 'checked' : ''} class="grade-check-box">
                    <span>${g.name}</span>
                </label>
            `;
        }).join('');
    }

    // ==========================================
    // 2. RENDER HOMEPAGE GRADES GRID
    // (Followed Grades Filter + Level Filter)
    // ==========================================
    function renderGrades() {
        const studentFollowed = dataStore.getStudentGrades();
        const currentLang = dataStore.getActiveLanguage();

        // Update banner
        if (studentFollowed && studentFollowed.length > 0 && !isShowingAllTemporarily) {
            followedBanner.style.display = 'flex';
            const namesList = studentFollowed.map(id => {
                const g = gradesConfig.find(item => item.id === String(id));
                return g ? g.shortName : id;
            }).join('، ');
            followedGradesNames.textContent = namesList;
            showAllGradesToggle.textContent = 'نیشاندانی هەموو پۆلەکان (١٣ پۆل)';
        } else {
            if (studentFollowed && studentFollowed.length > 0 && isShowingAllTemporarily) {
                followedBanner.style.display = 'flex';
                followedGradesNames.textContent = 'هەموو پۆلەکان پیشان دەدرێن';
                showAllGradesToggle.textContent = 'گەڕانەوە بۆ پۆلەکانی من';
            } else {
                followedBanner.style.display = 'none';
            }
        }

        // Filter by student preference unless showing all
        let activeGrades = gradesConfig;
        if (studentFollowed && studentFollowed.length > 0 && !isShowingAllTemporarily) {
            activeGrades = gradesConfig.filter(g => studentFollowed.includes(g.id));
        }

        // Filter by educational level (kindergarten, primary, middle, high)
        let filtered = activeGrades;
        if (currentLevelFilter !== 'all') {
            filtered = activeGrades.filter(g => g.level === currentLevelFilter);
        }

        totalVisibleGradesCount.textContent = `${filtered.length} لە ${gradesConfig.length} پۆل`;

        if (filtered.length === 0) {
            gradesContainer.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px; background: var(--surface-color); border-radius: 14px; border: 1px solid var(--border-color); color: var(--secondary-text);">
                    <i class="fas fa-filter" style="font-size: 2.5rem; margin-bottom: 10px; opacity: 0.5;"></i>
                    <h3>هیچ پۆلێک لەم بەشەدا نییە بەپێی هەڵبژاردنی ئێوە</h3>
                    <button class="btn-save" id="reset-grade-view-btn" style="margin-top:10px; padding:8px 18px; font-size:0.85rem;">
                        نیشاندانی گشت پۆلەکان
                    </button>
                </div>
            `;
            const resetBtn = document.getElementById('reset-grade-view-btn');
            if (resetBtn) {
                resetBtn.addEventListener('click', () => {
                    isShowingAllTemporarily = true;
                    currentLevelFilter = 'all';
                    filterButtons.forEach(b => b.classList.toggle('active', b.dataset.filter === 'all'));
                    renderGrades();
                });
            }
            return;
        }

        gradesContainer.innerHTML = filtered.map(g => {
            // Count teachers available for this grade in the CURRENT language
            const teachersInGrade = dataStore.getTeachersForGrade(g.id, currentLang);
            const teacherCount = teachersInGrade.length;
            const subjects = dataStore.getSubjectsForGrade ? dataStore.getSubjectsForGrade(g.id) : [];
            const subjectsPills = subjects.slice(0, 6).map(s => `
                <a href="grade.html?pola=${g.id}&subject=${s.id}" class="grade-sub-pill" onclick="event.stopPropagation();" style="display:inline-block; font-size:0.72rem; padding:2px 8px; border-radius:10px; background:${s.color || '#007bff'}18; color:${s.color || 'var(--blue-accent)'}; border:1px solid ${s.color || '#007bff'}30; text-decoration:none; margin:2px 2px 2px 0; font-weight:600; transition:all 0.15s;">
                    ${s.name}
                </a>
            `).join('');

            const targetUrl = g.customUrl || `grade.html?pola=${g.id}`;
            const isUniv = g.id === 'univ';

            return `
                <div onclick="window.location.href='${targetUrl}'" class="grade-card-item" style="border-right-color: ${g.color || '#007bff'}; cursor:pointer; ${isUniv ? 'background: linear-gradient(135deg, var(--surface-color), rgba(114, 9, 183, 0.05));' : ''}">
                    <div class="grade-card-icon" style="background: ${g.color}18; color: ${g.color || '#007bff'};">
                        <i class="fas ${g.icon || 'fa-school'}"></i>
                    </div>
                    <div style="flex: 1;">
                        <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
                            <h3 style="margin: 0 0 2px; font-size: 1.05rem;">${g.name}</h3>
                            ${isUniv ? '<span style="font-size:0.7rem; background:#7209b7; color:#fff; padding:1px 6px; border-radius:8px; font-weight:700;">بەش و معەدل</span>' : ''}
                        </div>
                        <p style="margin: 0 0 4px; color: var(--secondary-text); font-size: 0.8rem;">
                            ${isUniv 
                                ? '<i class="fas fa-graduation-cap" style="color:#7209b7;"></i> ٢٥+ بەش و کۆنمرەکان | مەلزەمەی زانکۆ' 
                                : `<i class="fas fa-users" style="color:var(--blue-accent);"></i> ${teacherCount} مامۆستا (${dataStore.getLanguageLabel(currentLang)})`}
                        </p>
                        ${subjectsPills ? `
                        <div style="margin-top: 4px; display:flex; flex-wrap:wrap; gap:3px; align-items:center;">
                            <span style="font-size:0.72rem; color:var(--secondary-text); margin-left:3px;"><i class="fas fa-layer-group"></i> بابەتەکان:</span>
                            ${subjectsPills}
                        </div>
                        ` : ''}
                        ${isUniv ? `
                        <div style="margin-top: 6px; display:flex; gap:6px;" onclick="event.stopPropagation();">
                            <a href="university.html" style="font-size:0.75rem; color:#7209b7; text-decoration:none; font-weight:700; background:rgba(114,9,183,0.1); padding:2px 8px; border-radius:6px;">
                                <i class="fas fa-calculator"></i> پشکنینا معەدلی
                            </a>
                            <a href="grade.html?pola=univ" style="font-size:0.75rem; color:var(--blue-accent); text-decoration:none; font-weight:600; background:rgba(0,123,255,0.1); padding:2px 8px; border-radius:6px;">
                                <i class="fas fa-book"></i> مەلزەمەکان
                            </a>
                        </div>
                        ` : ''}
                    </div>
                    <i class="fas fa-chevron-left" style="color: var(--secondary-text); font-size: 0.85rem; margin-right:8px;"></i>
                </div>
            `;
        }).join('');
    }

    // Level Filter Pills
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentLevelFilter = btn.getAttribute('data-filter');
            renderGrades();
        });
    });

    // Toggle Show All Grades vs Followed
    if (showAllGradesToggle) {
        showAllGradesToggle.addEventListener('click', () => {
            isShowingAllTemporarily = !isShowingAllTemporarily;
            renderGrades();
        });
    }

    // ==========================================
    // 3. ROLE MANAGEMENT & INITIAL LAUNCH
    // ==========================================
    function updateRoleUI() {
        const cfUser = window.CloudflareLessons ? window.CloudflareLessons.getCurrentUser() : null;
        const profile = getUserProfile();
        const role = (cfUser && cfUser.role) || (profile && profile.role) || dataStore.getUserRole() || 'student';
        const isSuperAdmin = dataStore.isCurrentUserSuperAdmin();
        const currentLang = dataStore.getActiveLanguage();

        if (homeLangIndicator) {
            homeLangIndicator.textContent = dataStore.getLanguageLabel(currentLang);
        }

        // Personalized Profile Info
        if (cfUser) {
            if (topUserName) topUserName.textContent = cfUser.full_name || 'بەکارهێنەر';
            if (topUserAvatar) {
                topUserAvatar.src = (profile && profile.avatar) || (cfUser.role === 'teacher' ? RANDOM_AVATARS[2] : RANDOM_AVATARS[0]);
            }
            if (topUserBio) {
                const subText = (profile && profile.bio && profile.bio !== 'مامۆستا' && profile.bio !== 'قوتابی')
                    ? profile.bio
                    : (cfUser.username ? `@${cfUser.username}` : '');
                if (subText) {
                    topUserBio.textContent = subText;
                    topUserBio.style.display = 'block';
                } else {
                    topUserBio.style.display = 'none';
                }
            }
        } else if (profile) {
            if (topUserName) topUserName.textContent = profile.name || 'بەکارهێنەر';
            if (topUserAvatar) {
                topUserAvatar.src = profile.avatar || RANDOM_AVATARS[0];
            }
            if (topUserBio) {
                if (profile.bio && profile.bio.trim()) {
                    topUserBio.textContent = profile.bio;
                    topUserBio.style.display = 'block';
                } else {
                    topUserBio.style.display = 'none';
                }
            }
        }

        // Default signout button appearance
        if (btnTopSignout) {
            if (role === 'guest' && !cfUser) {
                btnTopSignout.innerHTML = '<i class="fas fa-sign-in-alt"></i> چوونا ژوور / تۆمارکرن';
                btnTopSignout.style.background = 'rgba(37, 99, 235, 0.12)';
                btnTopSignout.style.color = 'var(--blue-accent)';
                btnTopSignout.style.borderColor = 'rgba(37, 99, 235, 0.3)';
            } else {
                btnTopSignout.innerHTML = '<i class="fas fa-sign-out-alt"></i> دەرکەفتن (Sign Out)';
                btnTopSignout.style.background = 'rgba(220,53,69,0.1)';
                btnTopSignout.style.color = '#dc3545';
                btnTopSignout.style.borderColor = 'rgba(220,53,69,0.25)';
            }
        }

        if (isSuperAdmin) {
            if (homeRoleBadge) {
                homeRoleBadge.className = 'role-badge-pill admin';
                homeRoleText.innerHTML = '<i class="fas fa-shield-alt"></i> ئەدمینێ گشتی';
            }
            if (homeAdminLink) homeAdminLink.style.display = 'inline-flex';
            if (homeTeacherLink) homeTeacherLink.style.display = 'inline-flex';
            if (pendingTeacherVerifyBtn) pendingTeacherVerifyBtn.style.display = 'none';
        } else if (role === 'teacher') {
            const teacherRec = (profile && profile.teacherId ? dataStore.getTeacherById(profile.teacherId) : null) || dataStore.getCurrentTeacher();
            const isVerifiedCfTeacher = Boolean(cfUser && cfUser.role === 'teacher');
            const teacherStatus = isVerifiedCfTeacher
                ? 'approved'
                : ((teacherRec && teacherRec.status) || (profile && profile.teacherStatus) || 'pending');

            if (teacherStatus === 'approved') {
                if (homeRoleBadge) {
                    homeRoleBadge.className = 'role-badge-pill teacher';
                    homeRoleBadge.style.background = '';
                    homeRoleBadge.style.color = '';
                    homeRoleText.innerHTML = '<i class="fas fa-chalkboard-teacher"></i> مامۆستا';
                }
                if (homeTeacherLink) homeTeacherLink.style.display = 'inline-flex';
                if (pendingTeacherVerifyBtn) pendingTeacherVerifyBtn.style.display = 'none';
            } else {
                if (homeRoleBadge) {
                    homeRoleBadge.className = 'role-badge-pill';
                    homeRoleBadge.style.background = 'rgba(245, 158, 11, 0.15)';
                    homeRoleBadge.style.color = '#d97706';
                    homeRoleText.innerHTML = teacherStatus === 'rejected'
                        ? '<i class="fas fa-ban"></i> داخوازی هاتە ڕەتکرن'
                        : '<i class="fas fa-clock"></i> مامۆستا (ل چاڤەڕێی وەرگرتنێ)';
                }
                if (homeTeacherLink) homeTeacherLink.style.display = 'none';
                if (pendingTeacherVerifyBtn) pendingTeacherVerifyBtn.style.display = 'inline-flex';
            }
            if (homeAdminLink) homeAdminLink.style.display = 'none';
        } else if (role === 'guest') {
            if (homeRoleBadge) {
                homeRoleBadge.className = 'role-badge-pill';
                homeRoleBadge.style.background = 'rgba(100, 116, 139, 0.15)';
                homeRoleBadge.style.color = 'var(--secondary-text)';
                homeRoleText.innerHTML = '<i class="fas fa-user-clock"></i> مێڤان (Guest)';
            }
            if (homeTeacherLink) homeTeacherLink.style.display = 'none';
            if (homeAdminLink) homeAdminLink.style.display = 'none';
            if (pendingTeacherVerifyBtn) pendingTeacherVerifyBtn.style.display = 'none';
        } else {
            if (homeRoleBadge) {
                homeRoleBadge.className = 'role-badge-pill';
                homeRoleBadge.style.background = '';
                homeRoleBadge.style.color = '';
                homeRoleText.innerHTML = '<i class="fas fa-user-graduate"></i> قوتابی';
            }
            if (homeTeacherLink) homeTeacherLink.style.display = 'none';
            if (homeAdminLink) homeAdminLink.style.display = 'none';
            if (pendingTeacherVerifyBtn) pendingTeacherVerifyBtn.style.display = 'none';
        }

        if (typeof updateCfQuickComposeUI === 'function') {
            updateCfQuickComposeUI();
        }
        renderGrades();
    }

    // Open Role Selector Modal
    if (openRoleSelectorBtn) {
        openRoleSelectorBtn.addEventListener('click', () => {
            if (roleModal) roleModal.style.display = 'flex';
        });
    }

    closeRoleModalBtn.addEventListener('click', () => {
        roleModal.style.display = 'none';
    });

    // Option 1: Choose Student -> Trigger Onboarding if no grades chosen
    chooseStudentBtn.addEventListener('click', () => {
        dataStore.setUserRole('student');
        roleModal.style.display = 'none';

        // Check if student has chosen grades
        if (!dataStore.hasStudentChosenGrades()) {
            openStudentOnboardingModal();
        } else {
            updateRoleUI();
        }
    });

    // Option 2: Choose Teacher -> Register or Dashboard
    if (chooseTeacherBtn) {
        chooseTeacherBtn.addEventListener('click', () => {
            roleModal.style.display = 'none';
            const currentTeacher = dataStore.getCurrentTeacher();
            if (currentTeacher) {
                dataStore.setUserRole('teacher');
                window.location.href = 'teacher-dashboard.html';
            } else {
                teacherRegModal.style.display = 'flex';
            }
        });
    }

    // Option 3: Super Admin Fast Track (Only if element exists)
    if (chooseAdminBtn) {
        chooseAdminBtn.addEventListener('click', () => {
            roleModal.style.display = 'none';
            activateSuperAdminMode();
        });
    }

    function activateSuperAdminMode() {
        localStorage.setItem('is_admin_mode_active', 'true');
        dataStore.setUserRole('super_admin');
        const adminTeacher = dataStore.getTeacherById('t_hussein') || {
            id: 't_hussein',
            name: 'م. حسێن ئەکرەم زێباری',
            email: 'Hussein.zebary.chemistry96@gmail.com',
            subject: 'کیمیا (Chemistry)',
            viewsCount: 4250,
            grades: ['10', '11', '12', '9'],
            lang: 'ku_ba',
            status: 'approved'
        };
        dataStore.setCurrentTeacher(adminTeacher);
        updateRoleUI();
        alert('بەخێربێیت م. حسێن ئەکرەم زێباری! دەسەڵاتی ئەدمینی گشتی چالاک کرا.');
        window.location.href = 'admin-panel.html';
    }

    // ==========================================
    // 4. STUDENT ONBOARDING MODAL
    // ==========================================
    function openStudentOnboardingModal() {
        // Default check High School grades (10, 11, 12)
        createGradeCheckboxes(onboardGradesGrid, ['10', '11', '12']);
        studentGradesModal.style.display = 'flex';
    }

    presetGradesBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const preset = btn.getAttribute('data-preset');
            let ids = [];
            if (preset === 'high') ids = ['10', '11', '12'];
            else if (preset === 'middle') ids = ['7', '8', '9'];
            else if (preset === 'primary') ids = ['1', '2', '3', '4', '5', '6'];
            else if (preset === 'all') ids = gradesConfig.map(g => g.id);

            createGradeCheckboxes(onboardGradesGrid, ids);
        });
    });

    saveStudentGradesBtn.addEventListener('click', () => {
        const checkedBoxes = onboardGradesGrid.querySelectorAll('input[type="checkbox"]:checked');
        const selected = Array.from(checkedBoxes).map(cb => cb.value);

        if (selected.length === 0) {
            showAppToast('تکایە بەلایەنی کەمەوە پۆلێک هەڵبژێرە.', 'error');
            return;
        }

        dataStore.setStudentGrades(selected);
        if (window.CloudflareLessons) {
            window.CloudflareLessons.saveUserSettingsToServer({ grades: selected });
        }
        studentGradesModal.style.display = 'none';
        isShowingAllTemporarily = false;
        updateRoleUI();
    });

    // ==========================================
    // 5. SETTINGS MODAL (بەشێ ڕێکخستن)
    // ==========================================
    function openSettingsModal() {
        const currentFollowed = dataStore.getStudentGrades() || ['10', '11', '12'];
        createGradeCheckboxes(settingsGradesGrid, currentFollowed);

        // Language Radios
        const currentLang = dataStore.getActiveLanguage();
        document.querySelectorAll('#settings-lang-grid .lang-radio-box').forEach(box => {
            const radio = box.querySelector('input[type="radio"]');
            if (box.getAttribute('data-lang') === currentLang) {
                box.classList.add('active');
                if (radio) radio.checked = true;
            } else {
                box.classList.remove('active');
                if (radio) radio.checked = false;
            }
        });

        settingsModal.style.display = 'flex';
    }

    if (settingsToggleBtn) settingsToggleBtn.addEventListener('click', openSettingsModal);
    if (openSettingsBtn) openSettingsBtn.addEventListener('click', openSettingsModal);
    if (editFollowedBtn) editFollowedBtn.addEventListener('click', openSettingsModal);

    closeSettingsBtn.addEventListener('click', () => {
        settingsModal.style.display = 'none';
    });

    // Language radio clicks inside settings
    document.querySelectorAll('#settings-lang-grid .lang-radio-box').forEach(box => {
        box.addEventListener('click', () => {
            document.querySelectorAll('#settings-lang-grid .lang-radio-box').forEach(b => b.classList.remove('active'));
            box.classList.add('active');
            const radio = box.querySelector('input[type="radio"]');
            if (radio) radio.checked = true;
        });
    });

    settingsCheckAllBtn.addEventListener('click', () => {
        createGradeCheckboxes(settingsGradesGrid, gradesConfig.map(g => g.id));
    });

    settingsCheckHighBtn.addEventListener('click', () => {
        createGradeCheckboxes(settingsGradesGrid, ['10', '11', '12']);
    });

    // Theme buttons inside settings
    setLightThemeBtn.addEventListener('click', () => {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('userTheme', 'light');
        if (window.CloudflareLessons) {
            window.CloudflareLessons.saveUserSettingsToServer({ theme: 'light' });
        }
    });

    setDarkThemeBtn.addEventListener('click', () => {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('userTheme', 'dark');
        if (window.CloudflareLessons) {
            window.CloudflareLessons.saveUserSettingsToServer({ theme: 'dark' });
        }
    });

    // Save All Settings (also syncs to Cloudflare /settings)
    saveAllSettingsBtn.addEventListener('click', async () => {
        const checkedBoxes = settingsGradesGrid.querySelectorAll('input[type="checkbox"]:checked');
        const selected = Array.from(checkedBoxes).map(cb => cb.value);

        if (selected.length > 0) {
            dataStore.setStudentGrades(selected);
        }

        const pickedLangRadio = document.querySelector('#settings-lang-grid input[type="radio"]:checked');
        const pickedLang = (pickedLangRadio && pickedLangRadio.value) || dataStore.getActiveLanguage();
        if (pickedLangRadio && pickedLangRadio.value) {
            dataStore.setActiveLanguage(pickedLangRadio.value);
        }

        const currentTheme = document.documentElement.getAttribute('data-theme') || localStorage.getItem('userTheme') || 'light';

        settingsModal.style.display = 'none';
        isShowingAllTemporarily = false;
        updateRoleUI();

        if (window.CloudflareLessons && window.CloudflareLessons.getCurrentUser()) {
            await window.CloudflareLessons.saveUserSettingsToServer({
                grades: selected.length > 0 ? selected : dataStore.getStudentGrades(),
                lang: pickedLang,
                theme: currentTheme
            });
            showAppToast('ڕێکخستنەکان لسەر هەژمارا تە ل سێرڤەری هاتنە پاراستن. ✅', 'success');
        } else {
            showAppToast('ڕێکخستنەکان بە سەرکەوتوویی پاشەکەوت کران.', 'success');
        }
    });

    // ==========================================
    // 6. TEACHER ONBOARDING FORM
    // ==========================================
    closeTeacherRegBtn.addEventListener('click', () => {
        teacherRegModal.style.display = 'none';
    });

    teacherRegForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('reg-teacher-name').value.trim();
        const subject = document.getElementById('reg-teacher-subject').value.trim();
        const contact = document.getElementById('reg-teacher-contact').value.trim();
        const lang = document.getElementById('reg-teacher-lang').value;
        const select = document.getElementById('reg-teacher-grades');
        const selectedGrades = Array.from(select.selectedOptions).map(opt => opt.value);

        const isAdminUser = dataStore.isCurrentUserSuperAdmin();
        const newTeacher = dataStore.saveTeacher({
            name: name,
            subject: subject,
            email: contact.includes('@') ? contact : '',
            phone: !contact.includes('@') ? contact : '',
            grades: selectedGrades.length ? selectedGrades : ['10', '11', '12'],
            lang: lang,
            status: isAdminUser ? 'approved' : 'pending',
            viewsCount: 15
        });

        dataStore.setUserRole('teacher');
        teacherRegModal.style.display = 'none';
        if (isAdminUser) {
            window.location.href = 'teacher-dashboard.html';
        } else {
            openTeacherVerifyModal(newTeacher);
        }
    });

    // ==========================================
    // 7. ADMIN FAST AUTH MODAL
    // ==========================================
    if (fastAdminAuthBtn) {
        fastAdminAuthBtn.addEventListener('click', () => {
            if (loginModal) loginModal.style.display = 'none';
            activateSuperAdminMode();
        });
    }

    // ==========================================
    // 8. RANDOM AVATARS & PROFILE MANAGEMENT
    // ==========================================
    const RANDOM_AVATARS = [
        // 1. Chemist with flask (Cyan/Blue)
        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%2300b4d8"/><circle cx="50" cy="38" r="18" fill="%23ffffff"/><path d="M22 84c0-16 12-26 28-26s28 10 28 26" fill="%23ffffff"/><circle cx="50" cy="38" r="14" fill="%23fcd5b5"/><circle cx="44" cy="37" r="2" fill="%23333"/><circle cx="56" cy="37" r="2" fill="%23333"/><path d="M46 45q4 3 8 0" stroke="%23333" stroke-width="2" fill="none"/><path d="M68 62l6 10a4 4 0 0 1-3.5 6h-13a4 4 0 0 1-3.5-6l6-10v-5h4v5z" fill="%2328a745"/></svg>',
        // 2. Scholar Graduate (Emerald)
        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%2328a745"/><circle cx="50" cy="40" r="18" fill="%23ffffff"/><path d="M22 86c0-16 12-26 28-26s28 10 28 26" fill="%23ffffff"/><circle cx="50" cy="40" r="14" fill="%23fcd5b5"/><circle cx="44" cy="40" r="2" fill="%23333"/><circle cx="56" cy="40" r="2" fill="%23333"/><path d="M47 47q3 2 6 0" stroke="%23333" stroke-width="2" fill="none"/><path d="M26 30l24-9 24 9-24 9z" fill="%231e293b"/><path d="M70 32v14" stroke="%23ffc107" stroke-width="3"/></svg>',
        // 3. Chemistry Teacher / Professor (Purple)
        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%238a2be2"/><circle cx="50" cy="38" r="18" fill="%23ffffff"/><path d="M22 86c0-16 12-26 28-26s28 10 28 26" fill="%23ffffff"/><circle cx="50" cy="38" r="14" fill="%23e8b896"/><circle cx="43" cy="37" r="4" fill="none" stroke="%23333" stroke-width="1.5"/><circle cx="57" cy="37" r="4" fill="none" stroke="%23333" stroke-width="1.5"/><line x1="47" y1="37" x2="53" y2="37" stroke="%23333" stroke-width="1.5"/><path d="M47 45q3 2 6 0" stroke="%23333" stroke-width="2" fill="none"/><polygon points="50,60 46,75 50,85 54,75" fill="%23e63946"/></svg>',
        // 4. Girl Student (Pink)
        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%23e83e8c"/><path d="M30 46c0-18 8-26 20-26s20 8 20 26v15c-6-4-10-2-10 6 0 0-4-6-10-6s-10 6-10 6c0-8-4-10-10-6z" fill="%234a2e18"/><circle cx="50" cy="42" r="15" fill="%23fed7aa"/><circle cx="44" cy="41" r="2" fill="%23333"/><circle cx="56" cy="41" r="2" fill="%23333"/><path d="M47 48q3 2 6 0" stroke="%23e11d48" stroke-width="2" fill="none"/><path d="M24 88c0-16 11-26 26-26s26 10 26 26" fill="%23fdf2f8"/></svg>',
        // 5. Boy Student (Blue)
        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%230d6efd"/><path d="M32 38c0-12 8-18 18-18s18 6 18 18z" fill="%231e293b"/><circle cx="50" cy="42" r="15" fill="%23fed7aa"/><circle cx="44" cy="41" r="2" fill="%23333"/><circle cx="56" cy="41" r="2" fill="%23333"/><path d="M47 48q3 2 6 0" stroke="%23333" stroke-width="2" fill="none"/><path d="M24 88c0-16 11-26 26-26s26 10 26 26" fill="%23ffffff"/><polygon points="46,62 54,62 52,78 48,78" fill="%230d6efd"/></svg>',
        // 6. Science Genius (Atom)
        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%236f42c1"/><circle cx="50" cy="38" r="18" fill="%23ffffff"/><path d="M22 86c0-16 12-26 28-26s28 10 28 26" fill="%23ffffff"/><circle cx="50" cy="38" r="14" fill="%23fcd5b5"/><circle cx="44" cy="37" r="2" fill="%23333"/><circle cx="56" cy="37" r="2" fill="%23333"/><ellipse cx="50" cy="38" rx="20" ry="7" fill="none" stroke="%23ffc107" stroke-width="2" transform="rotate(-25 50 38)"/><ellipse cx="50" cy="38" rx="20" ry="7" fill="none" stroke="%2300b4d8" stroke-width="2" transform="rotate(25 50 38)"/></svg>',
        // 7. Tech Chemist (Teal)
        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%2320c997"/><circle cx="50" cy="40" r="18" fill="%23ffffff"/><path d="M22 86c0-16 12-26 28-26s28 10 28 26" fill="%23ffffff"/><circle cx="50" cy="40" r="14" fill="%23fed7aa"/><circle cx="44" cy="39" r="2" fill="%23333"/><circle cx="56" cy="39" r="2" fill="%23333"/><path d="M47 46q3 2 6 0" stroke="%23333" stroke-width="2" fill="none"/><path d="M28 42c0-8 6-12 12-12h20c6 0 12 4 12 12" fill="none" stroke="%23333" stroke-width="3"/><circle cx="28" cy="44" r="4" fill="%23ffc107"/><circle cx="72" cy="44" r="4" fill="%23ffc107"/></svg>'
    ];

    function getRandomAvatar(role = 'student') {
        if (role === 'teacher') return RANDOM_AVATARS[2];
        const idx = Math.floor(Math.random() * RANDOM_AVATARS.length);
        return RANDOM_AVATARS[idx];
    }

    function getUserProfile() {
        try {
            const raw = localStorage.getItem('app_user_profile');
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    function saveUserProfile(profileData) {
        if (!profileData) {
            localStorage.removeItem('app_user_profile');
        } else {
            localStorage.setItem('app_user_profile', JSON.stringify(profileData));
        }
    }

    // Toast Notification helper
    function showAppToast(message, type = 'info') {
        const container = document.getElementById('app-toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = `app-toast ${type}`;
        const iconClass = type === 'success' ? 'fa-check-circle' : (type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle');
        const color = type === 'success' ? '#28a745' : (type === 'error' ? '#dc3545' : '#4285F4');
        toast.innerHTML = `<i class="fas ${iconClass}" style="font-size:1.25rem; color:${color}; flex-shrink:0;"></i><span>${message}</span>`;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(15px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    // Load initial user state (Firebase or Local Session)
    function getStoredUser() {
        try {
            const raw = localStorage.getItem('app_logged_in_user');
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    function saveUserSession(user) {
        if (!user) {
            localStorage.removeItem('app_logged_in_user');
        } else {
            const userData = {
                displayName: user.displayName || user.fullName || 'بەکارهێنەر',
                email: user.email || '',
                photoURL: user.photoURL || '',
                uid: user.uid || 'user-' + Date.now()
            };
            localStorage.setItem('app_logged_in_user', JSON.stringify(userData));
        }
    }

    // ==========================================
    // 9. PROFILE SETUP MODAL CONTROLLER
    // (داخازا پرۆفایلی: مامۆستا یان قوتابی، وێنەی عەشوایی یان ئەپلۆد، تێبینی)
    // ==========================================
    const profileRoleStudentCard = document.getElementById('profile-role-student-card');
    const profileRoleTeacherCard = document.getElementById('profile-role-teacher-card');
    const profileTeacherFields = document.getElementById('profile-teacher-fields');
    const profileTeacherSubject = document.getElementById('profile-teacher-subject');
    const profileTeacherPhone = document.getElementById('profile-teacher-phone');
    const profilePreviewAvatar = document.getElementById('profile-preview-avatar');
    const btnRandomAvatar = document.getElementById('btn-random-avatar');
    const profileAvatarUpload = document.getElementById('profile-avatar-upload');
    const avatarUploadProgress = document.getElementById('avatar-upload-progress');
    const avatarUploadPercent = document.getElementById('avatar-upload-percent');
    const avatarUploadBar = document.getElementById('avatar-upload-bar');
    const profileInputName = document.getElementById('profile-input-name');
    const profileInputBio = document.getElementById('profile-input-bio');
    const profileFormError = document.getElementById('profile-form-error');
    const btnSaveProfile = document.getElementById('btn-save-profile');
    const profileGuestSkipBtn = document.getElementById('profile-guest-skip-btn');

    // Teacher WhatsApp / Telegram Verification Modal Elements
    const teacherVerifyModal = document.getElementById('teacher-whatsapp-verify-modal');
    const teacherVerifyMsgPreview = document.getElementById('teacher-verify-msg-preview');
    const teacherSendWhatsappLink = document.getElementById('teacher-send-whatsapp-link');
    const teacherSendTelegramLink = document.getElementById('teacher-send-telegram-link');
    const copyAdminPhoneBtn = document.getElementById('copy-admin-phone-btn');
    const copyTeacherVerifyMsgBtn = document.getElementById('copy-teacher-verify-msg-btn');
    const teacherVerifyBrowseHomeBtn = document.getElementById('teacher-verify-browse-home-btn');

    const ADMIN_CONTACT_LOCAL = '07501990353';
    const ADMIN_CONTACT_INTL = '9647501990353';

    let currentSetupRole = 'student';
    let currentSetupAvatar = RANDOM_AVATARS[0];

    function buildTeacherVerificationMessage(teacherObj) {
        const t = teacherObj || {};
        const lines = [
            'سڵاڤ مامۆستا حوسێن، ئەز داخوازیا بوونە مامۆستا ل ماڵپەڕێ کیمیایێ دکەم:',
            `• ناڤ: ${t.name || 'مامۆستایێ نوو'}`,
            `• وانە / بابەت: ${t.subject || 'کیمیا (Chemistry)'}`,
            t.phone ? `• ژمارا مۆبایلێ: ${t.phone}` : null,
            t.email && !t.email.endsWith('@chem.vip') ? `• ئیمەیل: ${t.email}` : null,
            t.id ? `• کۆدێ داخوازیێ: ${t.id}` : null,
            'تکایە هەژمارا من وەک مامۆستا وەربگرە. سوپاس!'
        ].filter(Boolean);
        return lines.join('\n');
    }

    function openTeacherVerifyModal(teacherObj) {
        const storedProfile = getUserProfile();
        const storedUser = getStoredUser();
        const resolvedTeacher = teacherObj
            || (storedProfile && storedProfile.teacherId ? dataStore.getTeacherById(storedProfile.teacherId) : null)
            || dataStore.getCurrentTeacher()
            || {
                id: (storedProfile && storedProfile.teacherId) || '',
                name: (storedProfile && storedProfile.name) || (storedUser && storedUser.displayName) || 'مامۆستایێ نوو',
                subject: (storedProfile && storedProfile.subject) || 'کیمیا (Chemistry)',
                phone: (storedProfile && storedProfile.phone) || '',
                email: (storedUser && storedUser.email) || ''
            };

        const msgText = buildTeacherVerificationMessage(resolvedTeacher);
        const encodedMsg = encodeURIComponent(msgText);

        if (teacherVerifyMsgPreview) {
            teacherVerifyMsgPreview.textContent = msgText;
        }
        if (teacherSendWhatsappLink) {
            teacherSendWhatsappLink.href = `https://wa.me/${ADMIN_CONTACT_INTL}?text=${encodedMsg}`;
        }
        if (teacherSendTelegramLink) {
            teacherSendTelegramLink.href = `https://t.me/+${ADMIN_CONTACT_INTL}?text=${encodedMsg}`;
        }
        if (teacherVerifyModal) {
            teacherVerifyModal.style.display = 'flex';
        }
    }

    function copyTextQuietly(text, toastMsg) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                if (toastMsg) showAppToast(toastMsg, 'success');
            }).catch(() => {});
        }
    }

    if (copyAdminPhoneBtn) {
        copyAdminPhoneBtn.addEventListener('click', () => {
            copyTextQuietly(ADMIN_CONTACT_LOCAL, `ژمارا (${ADMIN_CONTACT_LOCAL}) هاتە کۆپیکرن!`);
        });
    }

    if (copyTeacherVerifyMsgBtn) {
        copyTeacherVerifyMsgBtn.addEventListener('click', () => {
            const msg = teacherVerifyMsgPreview ? teacherVerifyMsgPreview.textContent : '';
            if (msg) copyTextQuietly(msg, 'دەقێ نامەیێ هاتە کۆپیکرن!');
        });
    }

    if (teacherSendTelegramLink) {
        teacherSendTelegramLink.addEventListener('click', () => {
            const msg = teacherVerifyMsgPreview ? teacherVerifyMsgPreview.textContent : '';
            if (msg) copyTextQuietly(msg, 'دەقێ نامەیێ کۆپی بوو — د تلگرامێ دا Paste بکە و بنێرە.');
        });
    }

    if (teacherVerifyBrowseHomeBtn) {
        teacherVerifyBrowseHomeBtn.addEventListener('click', () => {
            if (teacherVerifyModal) teacherVerifyModal.style.display = 'none';
            if (authGateScreen) authGateScreen.style.display = 'none';
            if (profileSetupModal) profileSetupModal.style.display = 'none';
            if (mainAppContainer) mainAppContainer.style.display = 'block';
            isShowingAllTemporarily = true;
            updateRoleUI();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    if (pendingTeacherVerifyBtn) {
        pendingTeacherVerifyBtn.addEventListener('click', () => {
            openTeacherVerifyModal();
        });
    }

    function openProfileSetupModal(prefillUser = null) {
        const storedProfile = getUserProfile();
        const storedUser = prefillUser || getStoredUser();

        currentSetupRole = (storedProfile && (storedProfile.role === 'teacher' ? 'teacher' : 'student')) || 'student';
        currentSetupAvatar = (storedProfile && storedProfile.avatar) || (storedUser && storedUser.photoURL) || RANDOM_AVATARS[0];

        if (profileFormError) {
            profileFormError.style.display = 'none';
            profileFormError.textContent = '';
        }

        // Select role visually
        setProfileSetupRole(currentSetupRole);

        // Preview avatar
        if (profilePreviewAvatar) {
            profilePreviewAvatar.src = currentSetupAvatar;
        }

        // Fill Name
        if (profileInputName) {
            const rawName = (storedProfile && !storedProfile.isGuest && storedProfile.name)
                || (storedUser && !storedUser.isGuest && (storedUser.displayName || storedUser.fullName))
                || '';
            profileInputName.value = rawName;
        }

        // Fill Bio / Note
        if (profileInputBio) {
            profileInputBio.value = (storedProfile && !storedProfile.isGuest && storedProfile.bio) || '';
        }

        // Fill Teacher Extra Fields
        if (profileTeacherSubject) {
            profileTeacherSubject.value = (storedProfile && storedProfile.subject) || 'کیمیا (Chemistry)';
        }
        if (profileTeacherPhone) {
            profileTeacherPhone.value = (storedProfile && storedProfile.phone) || '';
        }

        if (avatarUploadProgress) avatarUploadProgress.style.display = 'none';
        if (profileSetupModal) profileSetupModal.style.display = 'flex';
    }

    function setProfileSetupRole(role) {
        currentSetupRole = role;
        if (role === 'teacher') {
            if (profileRoleTeacherCard) {
                profileRoleTeacherCard.classList.add('active');
                profileRoleTeacherCard.style.borderColor = '#8A2BE2';
                profileRoleTeacherCard.style.background = 'rgba(138, 43, 226, 0.08)';
            }
            if (profileRoleStudentCard) {
                profileRoleStudentCard.classList.remove('active');
                profileRoleStudentCard.style.borderColor = 'var(--border-color)';
                profileRoleStudentCard.style.background = 'var(--surface-color)';
            }
            if (profileTeacherFields) profileTeacherFields.style.display = 'block';
        } else {
            if (profileRoleStudentCard) {
                profileRoleStudentCard.classList.add('active');
                profileRoleStudentCard.style.borderColor = '#28a745';
                profileRoleStudentCard.style.background = 'rgba(40, 167, 69, 0.08)';
            }
            if (profileRoleTeacherCard) {
                profileRoleTeacherCard.classList.remove('active');
                profileRoleTeacherCard.style.borderColor = 'var(--border-color)';
                profileRoleTeacherCard.style.background = 'var(--surface-color)';
            }
            if (profileTeacherFields) profileTeacherFields.style.display = 'none';
        }
    }

    if (profileRoleStudentCard) {
        profileRoleStudentCard.addEventListener('click', () => setProfileSetupRole('student'));
    }
    if (profileRoleTeacherCard) {
        profileRoleTeacherCard.addEventListener('click', () => setProfileSetupRole('teacher'));
    }

    // Random Avatar Button click: Cycles through vibrant avatars
    if (btnRandomAvatar) {
        let avatarIndex = 0;
        btnRandomAvatar.addEventListener('click', () => {
            avatarIndex = (avatarIndex + 1) % RANDOM_AVATARS.length;
            currentSetupAvatar = RANDOM_AVATARS[avatarIndex];
            if (profilePreviewAvatar) {
                profilePreviewAvatar.src = currentSetupAvatar;
                profilePreviewAvatar.style.transform = 'scale(1.08)';
                profilePreviewAvatar.style.transition = 'transform 0.2s';
                setTimeout(() => { profilePreviewAvatar.style.transform = 'scale(1)'; }, 200);
            }
            showAppToast('وێنەی عەشوایی هەڵبژێردرا! دەتوانیت دووبارە کلیک بکەیت بۆ وێنەی تر.', 'info');
        });
    }

    // Profile Avatar File Upload with real-time percentage
    if (profileAvatarUpload) {
        profileAvatarUpload.addEventListener('change', (e) => {
            const file = e.target.files && e.target.files[0];
            if (!file) return;

            if (avatarUploadProgress) avatarUploadProgress.style.display = 'block';
            if (avatarUploadPercent) avatarUploadPercent.textContent = '0%';
            if (avatarUploadBar) avatarUploadBar.style.width = '0%';

            const reader = new FileReader();

            reader.onprogress = function(ev) {
                if (ev.lengthComputable && ev.total > 0) {
                    const pct = Math.min(100, Math.round((ev.loaded / ev.total) * 100));
                    if (avatarUploadPercent) avatarUploadPercent.textContent = `${pct}%`;
                    if (avatarUploadBar) avatarUploadBar.style.width = `${pct}%`;
                }
            };

            reader.onload = function(event) {
                if (avatarUploadPercent) avatarUploadPercent.textContent = '100%';
                if (avatarUploadBar) avatarUploadBar.style.width = '100%';

                currentSetupAvatar = event.target.result;
                if (profilePreviewAvatar) profilePreviewAvatar.src = currentSetupAvatar;

                showAppToast('وێنەکە بە سەرکەوتوویی بارکرا: ١٠٠٪ ✅', 'success');
                setTimeout(() => {
                    if (avatarUploadProgress) avatarUploadProgress.style.display = 'none';
                }, 1200);
            };

            reader.onerror = function() {
                if (profileFormError) {
                    profileFormError.textContent = 'کێشەیەک لە خوێندنەوەی وێنەکە ڕوویدا.';
                    profileFormError.style.display = 'block';
                }
                if (avatarUploadProgress) avatarUploadProgress.style.display = 'none';
            };

            reader.readAsDataURL(file);
        });
    }

    function enterMainHomePageImmediately() {
        if (window.history && window.history.replaceState) {
            window.history.replaceState({}, document.title, window.location.pathname);
        }
        if (profileSetupModal) profileSetupModal.style.display = 'none';
        if (studentGradesModal) studentGradesModal.style.display = 'none';
        if (roleModal) roleModal.style.display = 'none';
        if (teacherVerifyModal) teacherVerifyModal.style.display = 'none';
        if (authGateScreen) authGateScreen.style.display = 'none';
        if (mainAppContainer) mainAppContainer.style.display = 'block';

        updateRoleUI();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Save Profile button click (Zero blocking async for immediate transition)
    if (btnSaveProfile) {
        btnSaveProfile.addEventListener('click', () => {
            const name = profileInputName ? profileInputName.value.trim() : '';
            const bio = profileInputBio ? profileInputBio.value.trim() : '';

            if (!name) {
                if (profileFormError) {
                    profileFormError.textContent = 'تکایە ناوی خۆت بنووسە بۆ تەواوکردنی پرۆفایل.';
                    profileFormError.style.display = 'block';
                }
                if (profileInputName) profileInputName.focus();
                return;
            }
            if (profileFormError) profileFormError.style.display = 'none';

            const existingProfile = getUserProfile();
            const existingUser = getStoredUser();
            const currentUser = (existingUser && !existingUser.isGuest) ? existingUser : {
                uid: 'user_' + Date.now(),
                displayName: name,
                email: (existingUser && existingUser.email) || 'student@chem.vip'
            };

            const subjectVal = profileTeacherSubject ? profileTeacherSubject.value.trim() : 'کیمیا (Chemistry)';
            const phoneVal = profileTeacherPhone ? profileTeacherPhone.value.trim() : '';

            const profileData = {
                name: name,
                role: currentSetupRole,
                avatar: currentSetupAvatar || RANDOM_AVATARS[0],
                bio: bio,
                subject: subjectVal,
                phone: phoneVal,
                teacherId: (existingProfile && existingProfile.teacherId) || '',
                teacherStatus: (existingProfile && existingProfile.teacherStatus) || '',
                isProfileComplete: true,
                isGuest: false,
                updatedAt: Date.now()
            };

            // Update session & role immediately
            currentUser.displayName = name;
            currentUser.photoURL = profileData.avatar;
            currentUser.isGuest = false;
            saveUserSession(currentUser);
            dataStore.setUserRole(currentSetupRole);

            // Background Firestore sync (non-blocking, only when authenticated with Firebase Auth)
            if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
                const authUser = firebase.auth().currentUser;
                const firestoreDb = window.db || (firebase.firestore ? firebase.firestore() : null);
                if (firestoreDb) {
                    const userDocPayload = {
                        fullName: name,
                        email: authUser.email || currentUser.email || 'user@chem.vip',
                        role: currentSetupRole,
                        bio: bio,
                        isProfileComplete: true,
                        updatedAt: firebase.firestore.FieldValue ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString()
                    };
                    if (profileData.avatar && profileData.avatar.length <= 180000) {
                        userDocPayload.photoURL = profileData.avatar;
                    }
                    firestoreDb.collection('users').doc(authUser.uid).set(userDocPayload, { merge: true }).catch(() => {});
                }
            }

            if (currentSetupRole === 'teacher') {
                const isSuperAdmin = dataStore.isCurrentUserSuperAdmin();
                const realEmail = (currentUser.email && currentUser.email !== 'user@chem.vip' && currentUser.email !== 'student@chem.vip') ? currentUser.email : '';
                const existingTeacher = (profileData.teacherId ? dataStore.getTeacherById(profileData.teacherId) : null)
                    || (realEmail ? dataStore.getAllTeachers().find(t => t.email && t.email.toLowerCase() === realEmail.toLowerCase()) : null);

                const isAlreadyApproved = isSuperAdmin || (existingTeacher && existingTeacher.status !== 'pending' && existingTeacher.status !== 'rejected');

                if (isAlreadyApproved) {
                    const savedTeacher = dataStore.saveTeacher({
                        id: (existingTeacher && existingTeacher.id) || (isSuperAdmin ? 't_hussein' : ('t_' + Date.now())),
                        name: name,
                        subject: subjectVal || 'کیمیا (Chemistry)',
                        email: realEmail,
                        phone: phoneVal,
                        bio: bio || 'مامۆستایێ شارەزا',
                        avatar: profileData.avatar,
                        grades: (existingTeacher && existingTeacher.grades) || ['10', '11', '12'],
                        lang: dataStore.getActiveLanguage(),
                        status: 'approved',
                        viewsCount: (existingTeacher && existingTeacher.viewsCount) || 10
                    });
                    profileData.teacherId = savedTeacher.id;
                    profileData.teacherStatus = 'approved';
                    saveUserProfile(profileData);
                    isShowingAllTemporarily = true;
                    enterMainHomePageImmediately();
                    showAppToast(`بەخێربێیت مامۆستا ${name}! پەناڵی مامۆستایان چالاکە.`, 'success');
                } else {
                    const pendingTeacherId = (existingTeacher && existingTeacher.id) || profileData.teacherId || ('t_' + Date.now());
                    const pendingTeacher = dataStore.saveTeacher({
                        id: pendingTeacherId,
                        name: name,
                        subject: subjectVal || 'کیمیا (Chemistry)',
                        email: realEmail,
                        phone: phoneVal,
                        bio: bio || 'مامۆستایێ نوو',
                        avatar: profileData.avatar,
                        grades: ['10', '11', '12'],
                        lang: dataStore.getActiveLanguage(),
                        status: 'pending',
                        viewsCount: 10
                    });
                    profileData.teacherId = pendingTeacher.id;
                    profileData.teacherStatus = 'pending';
                    saveUserProfile(profileData);

                    if (profileSetupModal) profileSetupModal.style.display = 'none';
                    openTeacherVerifyModal(pendingTeacher);
                    showAppToast('داخوازییا تە هاتە تۆمارکرن! تکایە نامێ بۆ ئەدمینی (07501990353) بنێرە.', 'info');
                }
                return;
            }

            // STUDENT FLOW: Save and enter homepage IMMEDIATELY with zero blocking!
            saveUserProfile(profileData);
            if (!dataStore.hasStudentChosenGrades()) {
                dataStore.setStudentGrades(['10', '11', '12', 'univ']);
            }
            isShowingAllTemporarily = false;
            enterMainHomePageImmediately();
            showAppToast(`بەخێربێیت ${name}! پڕۆفایلی تە بە سەرکەوتوویی تۆمارکرا.`, 'success');
        });
    }

    // Edit Profile Trigger (From Header button or profile card click)
    if (editMyProfileBtn) {
        editMyProfileBtn.addEventListener('click', () => openProfileSetupModal());
    }
    if (personalizedUserCard) {
        personalizedUserCard.addEventListener('click', () => openProfileSetupModal());
    }

    // ==========================================
    // 10. AUTH GATE, GUEST ENTRY & ROUTING CONTROLLER
    // ==========================================
    const gateGoogleSigninBtn = document.getElementById('gate-google-signin-btn');
    const gateCfLoginBtn = document.getElementById('gate-cf-login-btn');
    const gateCfRegisterBtn = document.getElementById('gate-cf-register-btn');
    const gateGuestLoginBtn = document.getElementById('gate-guest-login-btn');
    const gateFastLoginBtn = document.getElementById('gate-fast-login-btn');
    const gateFastName = document.getElementById('gate-fast-name');
    const gateFastEmail = document.getElementById('gate-fast-email');

    if (gateCfLoginBtn) {
        gateCfLoginBtn.addEventListener('click', () => {
            if (window.CloudflareLessons) {
                window.CloudflareLessons.openAuthModal('login');
            } else {
                window.location.href = 'login.html';
            }
        });
    }

    if (gateCfRegisterBtn) {
        gateCfRegisterBtn.addEventListener('click', () => {
            if (window.CloudflareLessons) {
                window.CloudflareLessons.openAuthModal('register');
            } else {
                window.location.href = 'register.html';
            }
        });
    }

    function enterAsGuest() {
        const guestUser = {
            uid: 'guest_' + Date.now(),
            displayName: 'مێڤان (Guest)',
            email: '',
            photoURL: RANDOM_AVATARS[0],
            isGuest: true
        };
        const guestProfile = {
            name: 'مێڤان (Guest)',
            role: 'guest',
            avatar: RANDOM_AVATARS[0],
            bio: 'گەڕان وەک مێڤان',
            isProfileComplete: true,
            isGuest: true,
            updatedAt: Date.now()
        };

        localStorage.removeItem('is_admin_mode_active');
        if (window.CloudflareLessons) {
            localStorage.removeItem('parwarda_cf_user');
        }
        saveUserSession(guestUser);
        saveUserProfile(guestProfile);
        dataStore.setUserRole('guest');
        isShowingAllTemporarily = true;

        enterMainHomePageImmediately();
        showAppToast('بەخێربێیت وەک مێڤان! دەتوانیت گشت قۆناغ و وانان ببینی.', 'info');
    }

    if (gateGuestLoginBtn) {
        gateGuestLoginBtn.addEventListener('click', enterAsGuest);
    }
    if (profileGuestSkipBtn) {
        profileGuestSkipBtn.addEventListener('click', enterAsGuest);
    }

    function checkAuthStateAndDisplay() {
        const cfUser = window.CloudflareLessons ? window.CloudflareLessons.getCurrentUser() : null;
        const storedUser = getStoredUser();
        const profile = getUserProfile();
        const urlNeedsSetup = window.location.search.includes('setupProfile=true');

        if (cfUser) {
            if (authGateScreen) authGateScreen.style.display = 'none';
            if (profileSetupModal) profileSetupModal.style.display = 'none';
            if (mainAppContainer) mainAppContainer.style.display = 'block';
            updateRoleUI();
            return;
        }

        if (!storedUser) {
            if (authGateScreen) authGateScreen.style.display = 'flex';
            if (mainAppContainer) mainAppContainer.style.display = 'none';
            if (profileSetupModal) profileSetupModal.style.display = 'none';
            return;
        }

        if (authGateScreen) authGateScreen.style.display = 'none';

        if ((!profile || !profile.isProfileComplete || urlNeedsSetup) && !storedUser.isGuest) {
            if (mainAppContainer) mainAppContainer.style.display = 'none';
            openProfileSetupModal(storedUser);
        } else {
            if (profile && profile.role === 'guest') {
                isShowingAllTemporarily = true;
            }
            if (profileSetupModal) profileSetupModal.style.display = 'none';
            if (mainAppContainer) mainAppContainer.style.display = 'block';
            updateRoleUI();
        }
    }

    // Google Sign-In Handler
    async function handleGoogleLogin() {
        if (gateGoogleSigninBtn) gateGoogleSigninBtn.disabled = true;

        try {
            let user = null;
            if (window.GoogleDriveService) {
                const res = await window.GoogleDriveService.signInWithGoogle();
                user = res.user;
            } else if (typeof firebase !== 'undefined' && firebase.auth) {
                const provider = new firebase.auth.GoogleAuthProvider();
                provider.setCustomParameters({ prompt: 'select_account' });
                const res = await firebase.auth().signInWithPopup(provider);
                user = res.user;
            }

            if (user) {
                saveUserSession(user);
                const isOfficialSuperAdmin = window.isSuperAdmin && window.isSuperAdmin(user);
                if (isOfficialSuperAdmin) {
                    localStorage.setItem('is_admin_mode_active', 'true');
                    dataStore.setUserRole('super_admin');
                } else {
                    localStorage.removeItem('is_admin_mode_active');
                }

                const profile = getUserProfile();
                if (!profile || !profile.isProfileComplete || profile.isGuest) {
                    openProfileSetupModal(user);
                } else {
                    checkAuthStateAndDisplay();
                }
                showAppToast(`بەخێربێیت ${user.displayName || user.email}! بە سەرکەوتوویی لەگەڵ Google بەسترایەوە.`, 'success');
            }
        } catch (err) {
            console.warn("Google Auth error:", err);
            showAppToast('کێشەیەک لە چوونەژوورەوە بە Google چێبوو: ' + (err.message || ''), 'error');
        } finally {
            if (gateGoogleSigninBtn) gateGoogleSigninBtn.disabled = false;
        }
    }

    if (gateGoogleSigninBtn) {
        gateGoogleSigninBtn.addEventListener('click', handleGoogleLogin);
    }

    // Fast Direct Sign-in Handler
    if (gateFastLoginBtn) {
        gateFastLoginBtn.addEventListener('click', () => {
            const name = (gateFastName && gateFastName.value.trim()) || 'بەکارهێنەری نوێ';
            const email = (gateFastEmail && gateFastEmail.value.trim()) || 'student@chem.vip';

            const userObj = {
                uid: 'user_' + Date.now(),
                displayName: name,
                email: email,
                photoURL: RANDOM_AVATARS[0]
            };

            saveUserSession(userObj);
            if (authGateScreen) authGateScreen.style.display = 'none';
            openProfileSetupModal(userObj);
        });
    }

    // Sign Out Handler
    async function handleSignOut() {
        const cfUser = window.CloudflareLessons ? window.CloudflareLessons.getCurrentUser() : null;
        const profile = getUserProfile();
        if (!cfUser && profile && profile.role === 'guest') {
            if (window.CloudflareLessons) {
                window.CloudflareLessons.openAuthModal('login');
            } else {
                window.location.href = 'login.html';
            }
            return;
        }

        try {
            if (window.GoogleDriveService) {
                await window.GoogleDriveService.signOut();
            }
            if (typeof firebase !== 'undefined' && firebase.auth) {
                await firebase.auth().signOut();
            }
        } catch (err) {
            console.error("Sign out error:", err);
        }

        if (window.CloudflareLessons) {
            window.CloudflareLessons.logoutUser();
        }
        saveUserSession(null);
        saveUserProfile(null);
        localStorage.removeItem('is_admin_mode_active');
        dataStore.setUserRole('student');

        if (authGateScreen) authGateScreen.style.display = 'flex';
        if (mainAppContainer) mainAppContainer.style.display = 'none';
        if (profileSetupModal) profileSetupModal.style.display = 'none';
        if (teacherVerifyModal) teacherVerifyModal.style.display = 'none';

        showAppToast('بە سەرکەوتوویی دەرچوویت (Sign Out).', 'info');
    }

    if (btnTopSignout) {
        btnTopSignout.addEventListener('click', handleSignOut);
    }

    // Sync top bar theme icon & language changes to Cloudflare /settings
    const topThemeBtn = document.getElementById('theme-toggle-btn');
    if (topThemeBtn) {
        topThemeBtn.addEventListener('click', () => {
            setTimeout(() => {
                if (window.CloudflareLessons && window.CloudflareLessons.getCurrentUser()) {
                    const activeTheme = document.documentElement.getAttribute('data-theme') || 'light';
                    window.CloudflareLessons.saveUserSettingsToServer({ theme: activeTheme });
                }
            }, 50);
        });
    }

    // Subscribe to Firebase Auth (only when not overriding Cloudflare session)
    if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().onAuthStateChanged((user) => {
            if (window.CloudflareLessons && window.CloudflareLessons.getCurrentUser()) {
                checkAuthStateAndDisplay();
                return;
            }
            if (user) {
                saveUserSession(user);
                if (window.isSuperAdmin && window.isSuperAdmin(user)) {
                    localStorage.setItem('is_admin_mode_active', 'true');
                }
                checkAuthStateAndDisplay();
            } else {
                checkAuthStateAndDisplay();
            }
        });
    } else {
        checkAuthStateAndDisplay();
    }

    // Cloudflare Auth & Settings Sync Listeners
    window.addEventListener('parwardaAuthChanged', () => {
        checkAuthStateAndDisplay();
        if (typeof renderHomeCloudflareLessons === 'function') {
            renderHomeCloudflareLessons();
        }
    });

    window.addEventListener('parwardaSettingsApplied', () => {
        updateRoleUI();
        if (typeof renderHomeCloudflareLessons === 'function') {
            renderHomeCloudflareLessons();
        }
    });

    // Real-time teacher approval sync listener
    window.addEventListener('teachersUpdated', () => {
        const profile = getUserProfile();
        if (profile && profile.role === 'teacher' && profile.teacherId) {
            const updatedTeacher = dataStore.getTeacherById(profile.teacherId);
            if (updatedTeacher && updatedTeacher.status && updatedTeacher.status !== profile.teacherStatus) {
                const prevStatus = profile.teacherStatus;
                profile.teacherStatus = updatedTeacher.status;
                saveUserProfile(profile);
                if (updatedTeacher.status === 'approved' && prevStatus !== 'approved') {
                    if (teacherVerifyModal) teacherVerifyModal.style.display = 'none';
                    showAppToast('پیرۆزە! ئەدمین داخوازییا تە وەک مامۆستا وەرگرت. پەناڵی مامۆستایان چالاک بوو! ✅', 'success');
                }
            }
        }
        updateRoleUI();
    });

    // Language Change Listener (also syncs to Cloudflare /settings)
    window.addEventListener('languageChanged', (ev) => {
        updateRoleUI();
        const lang = (ev && ev.detail && ev.detail.lang) || dataStore.getActiveLanguage();
        if (window.CloudflareLessons && window.CloudflareLessons.getCurrentUser() && lang) {
            window.CloudflareLessons.saveUserSettingsToServer({ lang: lang });
        }
    });

    // ==========================================
    // 11. CLOUDFLARE WORKER LESSONS, POSTS & QUESTIONS CONTROLLER
    // ==========================================
    const cfHomeGrid = document.getElementById('cf-home-lessons-grid');
    const cfHomeStatus = document.getElementById('cf-home-lessons-status');
    const cfHomeGradeFilter = document.getElementById('cf-home-grade-filter');
    const cfHomeSearch = document.getElementById('cf-home-search');
    const cfHomeRefreshBtn = document.getElementById('cf-home-refresh-btn');
    const cfTypeFilterBtns = document.querySelectorAll('#cf-home-type-filters .g-filter-btn');
    const cfBookmarksCountEl = document.getElementById('cf-bookmarks-count');

    // Quick Compose Elements
    const cfComposeGuestBanner = document.getElementById('cf-compose-guest-banner');
    const cfQuickComposeBox = document.getElementById('cf-quick-compose-box');
    const cfComposeSummaryLabel = document.getElementById('cf-compose-summary-label');
    const cfQuickComposeForm = document.getElementById('cf-quick-compose-form');
    const cfPostTitleInput = document.getElementById('cf-post-title');
    const cfPostGradeSelect = document.getElementById('cf-post-grade');
    const cfPostContentInput = document.getElementById('cf-post-content');
    const cfPostFileInput = document.getElementById('cf-post-file');
    const cfPostFileLabel = document.getElementById('cf-post-file-label');
    const cfPostSubmitBtn = document.getElementById('cf-post-submit-btn');
    const cfQuickPostError = document.getElementById('cf-quick-post-error');
    const cfBannerLoginBtn = document.getElementById('cf-banner-login-btn');
    const cfBannerRegisterBtn = document.getElementById('cf-banner-register-btn');

    let currentCfTypeFilter = 'all';

    if (cfBannerLoginBtn) {
        cfBannerLoginBtn.addEventListener('click', () => {
            if (window.CloudflareLessons) window.CloudflareLessons.openAuthModal('login');
        });
    }
    if (cfBannerRegisterBtn) {
        cfBannerRegisterBtn.addEventListener('click', () => {
            if (window.CloudflareLessons) window.CloudflareLessons.openAuthModal('register');
        });
    }

    const cfStudentPostsBanner = document.getElementById('cf-student-posts-banner');
    const cfFilterMineBtn = document.getElementById('cf-filter-mine-btn');

    function updateCfQuickComposeUI() {
        const cfUser = window.CloudflareLessons ? window.CloudflareLessons.getCurrentUser() : null;
        const canManage = window.CloudflareLessons ? window.CloudflareLessons.canManageOrDownload() : false;

        if (canManage) {
            if (cfComposeGuestBanner) cfComposeGuestBanner.style.display = 'none';
            if (cfStudentPostsBanner) cfStudentPostsBanner.style.display = 'none';
            if (cfQuickComposeBox) cfQuickComposeBox.style.display = 'block';
            if (cfFilterMineBtn) cfFilterMineBtn.style.display = 'inline-flex';
            if (cfComposeSummaryLabel) {
                const authorTitle = cfUser ? cfUser.full_name : 'مامۆستا / ئەدمین';
                cfComposeSummaryLabel.textContent = `بەلاڤکرنا وانە یان فایلەکا نوو ب ناڤێ (${authorTitle})`;
            }
        } else if (cfUser || getStoredUser()) {
            if (cfComposeGuestBanner) cfComposeGuestBanner.style.display = 'none';
            if (cfQuickComposeBox) cfQuickComposeBox.style.display = 'none';
            if (cfStudentPostsBanner) cfStudentPostsBanner.style.display = 'flex';
            if (cfFilterMineBtn) cfFilterMineBtn.style.display = 'none';
        } else {
            if (cfComposeGuestBanner) cfComposeGuestBanner.style.display = 'flex';
            if (cfQuickComposeBox) cfQuickComposeBox.style.display = 'none';
            if (cfStudentPostsBanner) cfStudentPostsBanner.style.display = 'none';
            if (cfFilterMineBtn) cfFilterMineBtn.style.display = 'none';
        }
    }

    if (cfHomeGradeFilter && gradesConfig) {
        cfHomeGradeFilter.innerHTML = '<option value="all">هەمی پۆل و قۆناغ</option>' +
            gradesConfig.map(g => `<option value="${g.id}">${g.name}</option>`).join('');
    }
    if (cfPostGradeSelect && gradesConfig) {
        cfPostGradeSelect.innerHTML = '<option value="all">گشتی (هەمی پۆل)</option>' +
            gradesConfig.map(g => `<option value="${g.id}">${g.name}</option>`).join('');
        cfPostGradeSelect.value = '12';
    }

    if (cfPostFileInput && cfPostFileLabel) {
        cfPostFileInput.addEventListener('change', () => {
            const f = cfPostFileInput.files && cfPostFileInput.files[0];
            cfPostFileLabel.textContent = f
                ? `فایل هەلبژێردرا: ${f.name}`
                : 'هاوپێچکرنا فایلەکێ (PDF, HTML, PPTX, وێنە...)';
        });
    }

    if (cfQuickComposeForm) {
        cfQuickComposeForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!window.CloudflareLessons) return;

            if (!window.CloudflareLessons.canManageOrDownload()) {
                if (cfQuickPostError) {
                    cfQuickPostError.textContent = 'قوتابی نەشێت وانە و فایلان ل ڤێرە بەلاڤ بکەت. بۆ پۆستان بچۆ بەشێ پۆستێن گشتی.';
                    cfQuickPostError.style.display = 'block';
                }
                return;
            }

            const cfUser = window.CloudflareLessons.getCurrentUser();
            if (!cfUser) {
                window.CloudflareLessons.openAuthModal('login');
                return;
            }

            const title = cfPostTitleInput ? cfPostTitleInput.value.trim() : '';
            const grade = cfPostGradeSelect ? cfPostGradeSelect.value : 'all';
            const content = cfPostContentInput ? cfPostContentInput.value.trim() : '';
            const file = (cfPostFileInput && cfPostFileInput.files && cfPostFileInput.files[0]) || null;

            if (!title && !content && !file) {
                if (cfQuickPostError) {
                    cfQuickPostError.textContent = 'تکایە ناڤونیشان و ناوەڕۆکی بنڤیسە.';
                    cfQuickPostError.style.display = 'block';
                }
                return;
            }

            if (cfQuickPostError) cfQuickPostError.style.display = 'none';
            const origHtml = cfPostSubmitBtn ? cfPostSubmitBtn.innerHTML : '';
            if (cfPostSubmitBtn) {
                cfPostSubmitBtn.disabled = true;
                cfPostSubmitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> بەلاڤکرن...';
            }

            try {
                await window.CloudflareLessons.uploadLesson({
                    file: file,
                    meta: {
                        user_id: cfUser.id,
                        author_name: cfUser.full_name,
                        role: cfUser.role,
                        title: title,
                        content: content,
                        description: content,
                        grade: grade,
                        fileName: file ? file.name : '',
                        createdAt: new Date().toISOString()
                    }
                });

                cfQuickComposeForm.reset();
                if (cfPostGradeSelect) cfPostGradeSelect.value = '12';
                if (cfPostFileLabel) {
                    cfPostFileLabel.textContent = 'هاوپێچکرنا فایلەکێ (ئارەزوومەندانە: PDF, وێنە...)';
                }
                showAppToast(
                    cfUser.role === 'teacher'
                        ? 'وانە ب ناڤێ مامۆستای ب سەرکەفتوویی هاتە بەلاڤکرن! ✅'
                        : 'پۆست / پسیارا تە ب سەرکەفتوویی هاتە بەلاڤکرن! ✅',
                    'success'
                );
            } catch (err) {
                if (cfQuickPostError) {
                    cfQuickPostError.textContent = err.message || 'نەشیا بەلاڤ بکەت.';
                    cfQuickPostError.style.display = 'block';
                }
            } finally {
                if (cfPostSubmitBtn) {
                    cfPostSubmitBtn.disabled = false;
                    cfPostSubmitBtn.innerHTML = origHtml;
                }
            }
        });
    }

    cfTypeFilterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            cfTypeFilterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCfTypeFilter = btn.getAttribute('data-cf-type') || 'all';
            renderHomeCloudflareLessons();
        });
    });

    function renderHomeCloudflareLessons() {
        if (!window.CloudflareLessons || !cfHomeGrid) return;
        const allLessons = window.CloudflareLessons.getCachedLessons();
        const cfUser = window.CloudflareLessons.getCurrentUser();
        const bookmarks = window.CloudflareLessons.getBookmarkedIds();
        const pickedGrade = cfHomeGradeFilter ? cfHomeGradeFilter.value : 'all';
        const q = cfHomeSearch ? cfHomeSearch.value.trim().toLowerCase() : '';

        if (cfBookmarksCountEl) {
            cfBookmarksCountEl.textContent = bookmarks.length;
        }

        const filtered = allLessons.filter(item => {
            if (currentCfTypeFilter === 'teacher' && item.role !== 'teacher') return false;
            if (currentCfTypeFilter === 'student' && item.role !== 'student') return false;
            if (currentCfTypeFilter === 'bookmarks' && !bookmarks.includes(String(item.id))) return false;
            if (currentCfTypeFilter === 'mine' && (!cfUser || String(item.user_id) !== String(cfUser.id))) return false;

            if (pickedGrade !== 'all' && String(item.grade) !== String(pickedGrade)) {
                return false;
            }
            if (q) {
                const hay = [item.title, item.content, item.description, item.subject, item.chapter, item.author_name, item.fileName]
                    .filter(Boolean).join(' ').toLowerCase();
                if (!hay.includes(q)) return false;
            }
            return true;
        });

        let emptyMsg = 'هێشتا چ وانە و پۆست ل سێرڤەری نەهاتینە بارکرن.';
        if (currentCfTypeFilter === 'bookmarks') {
            emptyMsg = 'هێشتا تە چ وانە نیشان نەکرینە (Bookmarks). کلیک ل ئایکۆنا نیشانکرنێ لسەر هەر وانەیەکێ بکە!';
        } else if (currentCfTypeFilter === 'mine') {
            emptyMsg = 'هێشتا تە چ وانە یان پسیار بەلاڤ نەکرینە.';
        } else if (allLessons.length > 0) {
            emptyMsg = 'چ وانە ب ڤی فلتەرێ لێگەریانێ نەهاتنە دیتن.';
        }

        window.CloudflareLessons.renderLessonsGrid(cfHomeGrid, filtered, {
            emptyText: emptyMsg
        });

        if (cfHomeStatus) {
            cfHomeStatus.textContent = allLessons.length > 0
                ? `${filtered.length} ژ ${allLessons.length} وانە و پۆست لسەر سێرڤەری هەنە`
                : 'هێشتا چ وانە لسەر سێرڤەری نینن';
        }
    }

    async function loadHomeCloudflareLessons() {
        if (!window.CloudflareLessons || !cfHomeGrid) return;
        if (cfHomeStatus) {
            cfHomeStatus.innerHTML = '<i class="fas fa-spinner fa-spin"></i> بارکرنا وانەیان ژ سێرڤەرێ Cloudflare...';
        }
        try {
            await window.CloudflareLessons.fetchLessons();
            renderHomeCloudflareLessons();
        } catch (err) {
            if (cfHomeStatus) {
                cfHomeStatus.innerHTML = `<span style="color:#dc2626;"><i class="fas fa-exclamation-triangle"></i> ${err.message}</span>`;
            }
            window.CloudflareLessons.renderLessonsGrid(cfHomeGrid, [], {
                emptyText: 'نەشیا پەیوەندیێ ب سێرڤەرێ وانەیان بکەت.'
            });
        }
    }

    if (cfHomeGradeFilter) cfHomeGradeFilter.addEventListener('change', renderHomeCloudflareLessons);
    if (cfHomeSearch) cfHomeSearch.addEventListener('input', renderHomeCloudflareLessons);
    if (cfHomeRefreshBtn) cfHomeRefreshBtn.addEventListener('click', loadHomeCloudflareLessons);
    window.addEventListener('cloudflareLessonsUpdated', renderHomeCloudflareLessons);

    // Run initial state check & fetch Cloudflare lessons immediately on page load
    updateCfQuickComposeUI();
    checkAuthStateAndDisplay();
    loadHomeCloudflareLessons();
});



