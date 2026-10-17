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

            return `
                <div onclick="window.location.href='grade.html?pola=${g.id}'" class="grade-card-item" style="border-right-color: ${g.color || '#007bff'}; cursor:pointer;">
                    <div class="grade-card-icon" style="background: ${g.color}18; color: ${g.color || '#007bff'};">
                        <i class="fas ${g.icon || 'fa-school'}"></i>
                    </div>
                    <div style="flex: 1;">
                        <h3 style="margin: 0 0 4px; font-size: 1.05rem;">${g.name}</h3>
                        <p style="margin: 0 0 4px; color: var(--secondary-text); font-size: 0.8rem;">
                            <i class="fas fa-users" style="color:var(--blue-accent);"></i> ${teacherCount} مامۆستا (${dataStore.getLanguageLabel(currentLang)})
                        </p>
                        ${subjectsPills ? `
                        <div style="margin-top: 4px; display:flex; flex-wrap:wrap; gap:3px; align-items:center;">
                            <span style="font-size:0.72rem; color:var(--secondary-text); margin-left:3px;"><i class="fas fa-layer-group"></i> بابەتەکان:</span>
                            ${subjectsPills}
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
        const profile = getUserProfile();
        const role = profile ? profile.role : dataStore.getUserRole();
        const isSuperAdmin = dataStore.isCurrentUserSuperAdmin();
        const currentLang = dataStore.getActiveLanguage();

        if (homeLangIndicator) {
            homeLangIndicator.textContent = dataStore.getLanguageLabel(currentLang);
        }

        // Personalized Profile Info
        if (profile) {
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

        if (isSuperAdmin) {
            if (homeRoleBadge) {
                homeRoleBadge.className = 'role-badge-pill admin';
                homeRoleText.innerHTML = '<i class="fas fa-shield-alt"></i> ئەدمینێ گشتی';
            }
            if (homeAdminLink) homeAdminLink.style.display = 'inline-flex';
            if (homeTeacherLink) homeTeacherLink.style.display = 'inline-flex';
        } else if (role === 'teacher') {
            if (homeRoleBadge) {
                homeRoleBadge.className = 'role-badge-pill teacher';
                homeRoleText.innerHTML = '<i class="fas fa-chalkboard-teacher"></i> مامۆستا';
            }
            if (homeTeacherLink) homeTeacherLink.style.display = 'inline-flex';
            if (homeAdminLink) homeAdminLink.style.display = 'none';
        } else {
            if (homeRoleBadge) {
                homeRoleBadge.className = 'role-badge-pill';
                homeRoleText.innerHTML = '<i class="fas fa-user-graduate"></i> قوتابی';
            }
            if (homeTeacherLink) homeTeacherLink.style.display = 'none';
            if (homeAdminLink) homeAdminLink.style.display = 'none';
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
            alert('تکایە بەلایەنی کەمەوە پۆلێک هەڵبژێرە.');
            return;
        }

        dataStore.setStudentGrades(selected);
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

        // Load Gemini API Key
        const geminiKeyInput = document.getElementById('settings-gemini-key');
        const geminiKeyStatus = document.getElementById('settings-gemini-key-status');
        const currentGeminiKey = localStorage.getItem('gemini_custom_api_key') || '';
        if (geminiKeyInput) {
            geminiKeyInput.value = currentGeminiKey;
        }
        if (geminiKeyStatus) {
            if (currentGeminiKey) {
                geminiKeyStatus.innerHTML = '<span style="color:#28a745;"><i class="fas fa-check-circle"></i> کلیل تۆمارکراوە و ئامادەیە بۆ بەکارهێنان</span>';
                geminiKeyStatus.style.display = 'block';
            } else {
                geminiKeyStatus.style.display = 'none';
            }
        }

        settingsModal.style.display = 'flex';
    }

    // Toggle Gemini key visibility
    const toggleGeminiKeyBtn = document.getElementById('toggle-gemini-key-btn');
    if (toggleGeminiKeyBtn) {
        toggleGeminiKeyBtn.addEventListener('click', () => {
            const input = document.getElementById('settings-gemini-key');
            if (!input) return;
            if (input.type === 'password') {
                input.type = 'text';
                toggleGeminiKeyBtn.innerHTML = '<i class="fas fa-eye-slash"></i>';
            } else {
                input.type = 'password';
                toggleGeminiKeyBtn.innerHTML = '<i class="fas fa-eye"></i>';
            }
        });
    }

    // Test Gemini API Key
    const testGeminiKeyBtn = document.getElementById('test-gemini-key-btn');
    if (testGeminiKeyBtn) {
        testGeminiKeyBtn.addEventListener('click', async () => {
            const input = document.getElementById('settings-gemini-key');
            const key = input ? input.value.trim() : '';
            const statusEl = document.getElementById('settings-gemini-key-status');
            if (!key) {
                if (statusEl) {
                    statusEl.innerHTML = '<span style="color:#dc3545; font-weight:bold;"><i class="fas fa-exclamation-triangle"></i> خەلەتە! تکایە سەرەتا کلیلی API بنووسە.</span>';
                    statusEl.style.display = 'block';
                }
                return;
            }

            testGeminiKeyBtn.disabled = true;
            testGeminiKeyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> د پشکنینێ دایە...';
            if (statusEl) {
                statusEl.innerHTML = '<span style="color:#007bff;"><i class="fas fa-spinner fa-spin"></i> پشکنینا دروستییا کلیلی ل سێرڤەری Google (Gemini 3.8 Flash)...</span>';
                statusEl.style.display = 'block';
            }

            try {
                const res = await fetch('/api/gemini/validate-key', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ apiKey: key })
                });
                const data = await res.json();
                if (res.ok && data.valid) {
                    localStorage.setItem('gemini_custom_api_key', key);
                    if (statusEl) {
                        statusEl.innerHTML = `
                            <div style="background:rgba(40,167,69,0.12); border:1px solid #28a745; color:#28a745; padding:8px 12px; border-radius:8px; font-weight:bold;">
                                <i class="fas fa-check-circle"></i> سەرکەفتی بوو! کلیلی API یا دروستە و مۆدێلا Gemini چالاکە.
                            </div>
                        `;
                        statusEl.style.display = 'block';
                    }
                    showAppToast('سەرکەفتی بوو! کلیلی API یا دروستە و هاتە پاشکەفتن.', 'success');
                } else {
                    if (statusEl) {
                        statusEl.innerHTML = `
                            <div style="background:rgba(220,53,69,0.12); border:1px solid #dc3545; color:#dc3545; padding:8px 12px; border-radius:8px; font-weight:bold;">
                                <i class="fas fa-times-circle"></i> خەلەتە! کلیلی API نادروستە یان کار ناکەت.
                            </div>
                        `;
                        statusEl.style.display = 'block';
                    }
                }
            } catch (err) {
                if (statusEl) {
                    statusEl.innerHTML = `
                        <div style="background:rgba(220,53,69,0.12); border:1px solid #dc3545; color:#dc3545; padding:8px 12px; border-radius:8px; font-weight:bold;">
                            <i class="fas fa-times-circle"></i> خەلەتە! کێشەیەک لە پەیوەندی کردن بە سێرڤەر ڕوویدا.
                        </div>
                    `;
                    statusEl.style.display = 'block';
                }
            } finally {
                testGeminiKeyBtn.disabled = false;
                testGeminiKeyBtn.innerHTML = '<i class="fas fa-vial"></i> پشکنینا کلیلی';
            }
        });
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
    });

    setDarkThemeBtn.addEventListener('click', () => {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('userTheme', 'dark');
    });

    // Save All Settings
    saveAllSettingsBtn.addEventListener('click', () => {
        // 1. Followed grades
        const checkedBoxes = settingsGradesGrid.querySelectorAll('input[type="checkbox"]:checked');
        const selected = Array.from(checkedBoxes).map(cb => cb.value);

        if (selected.length > 0) {
            dataStore.setStudentGrades(selected);
        }

        // 2. Language
        const pickedLangRadio = document.querySelector('#settings-lang-grid input[type="radio"]:checked');
        if (pickedLangRadio && pickedLangRadio.value) {
            dataStore.setActiveLanguage(pickedLangRadio.value);
        }

        // 3. Gemini API Key
        const geminiKeyInput = document.getElementById('settings-gemini-key');
        if (geminiKeyInput) {
            const trimmedKey = geminiKeyInput.value.trim();
            if (trimmedKey) {
                localStorage.setItem('gemini_custom_api_key', trimmedKey);
            } else {
                localStorage.removeItem('gemini_custom_api_key');
            }
        }

        settingsModal.style.display = 'none';
        isShowingAllTemporarily = false;
        updateRoleUI();
        alert('ڕێکخستنەکان بە سەرکەوتوویی پاشەکەوت کران.');
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

        const newTeacher = dataStore.saveTeacher({
            name: name,
            subject: subject,
            email: contact.includes('@') ? contact : '',
            phone: !contact.includes('@') ? contact : '',
            grades: selectedGrades.length ? selectedGrades : ['10', '11', '12'],
            lang: lang,
            viewsCount: 15
        });

        dataStore.setUserRole('teacher');
        teacherRegModal.style.display = 'none';
        alert(`بەخێربێیت مامۆستا ${name}! پڕۆفایلی ئێوە تۆمارکرا.`);
        window.location.href = 'teacher-dashboard.html';
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
    const profilePreviewAvatar = document.getElementById('profile-preview-avatar');
    const btnRandomAvatar = document.getElementById('btn-random-avatar');
    const profileAvatarUpload = document.getElementById('profile-avatar-upload');
    const avatarUploadProgress = document.getElementById('avatar-upload-progress');
    const avatarUploadPercent = document.getElementById('avatar-upload-percent');
    const avatarUploadBar = document.getElementById('avatar-upload-bar');
    const profileInputName = document.getElementById('profile-input-name');
    const profileInputBio = document.getElementById('profile-input-bio');
    const btnSaveProfile = document.getElementById('btn-save-profile');

    let currentSetupRole = 'student';
    let currentSetupAvatar = RANDOM_AVATARS[0];

    function openProfileSetupModal(prefillUser = null) {
        const storedProfile = getUserProfile();
        const storedUser = prefillUser || getStoredUser();

        currentSetupRole = (storedProfile && storedProfile.role) || 'student';
        currentSetupAvatar = (storedProfile && storedProfile.avatar) || (storedUser && storedUser.photoURL) || RANDOM_AVATARS[0];

        // Select role visually
        setProfileSetupRole(currentSetupRole);

        // Preview avatar
        if (profilePreviewAvatar) {
            profilePreviewAvatar.src = currentSetupAvatar;
        }

        // Fill Name
        if (profileInputName) {
            profileInputName.value = (storedProfile && storedProfile.name) || (storedUser && (storedUser.displayName || storedUser.fullName)) || '';
        }

        // Fill Bio / Note
        if (profileInputBio) {
            profileInputBio.value = (storedProfile && storedProfile.bio) || '';
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
                alert('کێشەیەک لە خوێندنەوەی وێنەکە ڕوویدا.');
                if (avatarUploadProgress) avatarUploadProgress.style.display = 'none';
            };

            reader.readAsDataURL(file);
        });
    }

    // Save Profile button click
    if (btnSaveProfile) {
        btnSaveProfile.addEventListener('click', async () => {
            const name = profileInputName ? profileInputName.value.trim() : '';
            const bio = profileInputBio ? profileInputBio.value.trim() : '';

            if (!name) {
                alert('تکایە ناوی خۆت بنووسە بۆ تەواوکردنی پرۆفایل.');
                if (profileInputName) profileInputName.focus();
                return;
            }

            const currentUser = getStoredUser() || {
                uid: 'user_' + Date.now(),
                displayName: name,
                email: 'user@chem.vip'
            };

            const profileData = {
                name: name,
                role: currentSetupRole,
                avatar: currentSetupAvatar || RANDOM_AVATARS[0],
                bio: bio,
                isProfileComplete: true,
                updatedAt: Date.now()
            };

            saveUserProfile(profileData);

            // Update session
            currentUser.displayName = name;
            currentUser.photoURL = profileData.avatar;
            saveUserSession(currentUser);

            // Set role in dataStore
            dataStore.setUserRole(currentSetupRole);

            // If teacher, register into local teachers list if not existing
            if (currentSetupRole === 'teacher') {
                const currentTeacher = dataStore.getCurrentTeacher();
                if (!currentTeacher || currentTeacher.id === 't_hussein') {
                    const newTeacher = dataStore.saveTeacher({
                        name: name,
                        subject: 'کیمیا (Chemistry)',
                        email: currentUser.email,
                        avatar: profileData.avatar,
                        grades: ['12', '11', '10'],
                        lang: dataStore.getActiveLanguage(),
                        viewsCount: 10
                    });
                    dataStore.setCurrentTeacher(newTeacher);
                }
            }

            // Sync with Firestore if user is signed in with Firebase
            if (typeof firebase !== 'undefined' && firebase.firestore && currentUser.uid) {
                try {
                    const db = firebase.firestore();
                    await db.collection('users').doc(currentUser.uid).set({
                        fullName: name,
                        role: currentSetupRole,
                        photoURL: profileData.avatar,
                        bio: bio,
                        isProfileComplete: true,
                        updatedAt: firebase.firestore.FieldValue ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString()
                    }, { merge: true });
                } catch (fsErr) {
                    console.warn('Firestore sync note:', fsErr);
                }
            }

            // Remove setupProfile query param from URL
            if (window.history && window.history.replaceState) {
                const cleanUrl = window.location.pathname;
                window.history.replaceState({}, document.title, cleanUrl);
            }

            if (profileSetupModal) profileSetupModal.style.display = 'none';
            if (authGateScreen) authGateScreen.style.display = 'none';
            if (mainAppContainer) mainAppContainer.style.display = 'block';

            updateRoleUI();
            showAppToast(`بەخێربێیت ${name}! پڕۆفایلی تە بە سەرکەوتوویی تۆمارکرا.`, 'success');

            // If student has not chosen grades yet, prompt them now
            if (currentSetupRole === 'student' && !dataStore.hasStudentChosenGrades()) {
                openStudentOnboardingModal();
            }
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
    // 10. AUTH GATE & ROUTING CONTROLLER
    // (شاشەی چوونەژوورەوەی پێشینە - خو تشتەک نەهێتە سەرێ ژبلی لوگین بە یان ئەکاونتەک نی)
    // ==========================================
    const gateGoogleSigninBtn = document.getElementById('gate-google-signin-btn');
    const gateFastLoginBtn = document.getElementById('gate-fast-login-btn');
    const gateFastName = document.getElementById('gate-fast-name');
    const gateFastEmail = document.getElementById('gate-fast-email');

    function checkAuthStateAndDisplay() {
        const storedUser = getStoredUser();
        const profile = getUserProfile();
        const urlNeedsSetup = window.location.search.includes('setupProfile=true');

        if (!storedUser) {
            // Not logged in -> Show Auth Gate, Hide Main App, Hide Profile Modal
            if (authGateScreen) authGateScreen.style.display = 'flex';
            if (mainAppContainer) mainAppContainer.style.display = 'none';
            if (profileSetupModal) profileSetupModal.style.display = 'none';
            return;
        }

        // User is logged in -> Hide Auth Gate
        if (authGateScreen) authGateScreen.style.display = 'none';

        // Check if Profile is incomplete or setup requested
        if (!profile || !profile.isProfileComplete || urlNeedsSetup) {
            if (mainAppContainer) mainAppContainer.style.display = 'none';
            openProfileSetupModal(storedUser);
        } else {
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

                // Check profile
                const profile = getUserProfile();
                if (!profile || !profile.isProfileComplete) {
                    openProfileSetupModal(user);
                } else {
                    checkAuthStateAndDisplay();
                }
                showAppToast(`بەخێربێیت ${user.displayName || user.email}! بە سەرکەوتوویی لەگەڵ Google بەسترایەوە.`, 'success');
            }
        } catch (err) {
            console.warn("Google Auth error:", err);
            alert('کێشەیەک لە چوونەژوورەوە بە Google چێبوو: ' + (err.message || ''));
        } finally {
            if (gateGoogleSigninBtn) gateGoogleSigninBtn.disabled = false;
        }
    }

    if (gateGoogleSigninBtn) {
        gateGoogleSigninBtn.addEventListener('click', handleGoogleLogin);
    }

    // Fast Direct Sign-in Handler (Fallback without popups)
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

            // Open Profile Setup immediately
            openProfileSetupModal(userObj);
        });
    }

    // Sign Out Handler (تسجیل خروج)
    async function handleSignOut() {
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

        saveUserSession(null);
        saveUserProfile(null);
        localStorage.removeItem('is_admin_mode_active');
        dataStore.setUserRole('student');

        if (authGateScreen) authGateScreen.style.display = 'flex';
        if (mainAppContainer) mainAppContainer.style.display = 'none';
        if (profileSetupModal) profileSetupModal.style.display = 'none';

        showAppToast('بە سەرکەوتوویی دەرچوویت (Sign Out).', 'info');
    }

    if (btnTopSignout) {
        btnTopSignout.addEventListener('click', handleSignOut);
    }

    // Subscribe to Firebase Auth
    if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().onAuthStateChanged((user) => {
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

    // Language Change Listener
    window.addEventListener('languageChanged', (e) => {
        updateRoleUI();
    });

    // Run initial state check
    checkAuthStateAndDisplay();
});

