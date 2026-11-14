// =========================================================================
// University Portal & Admission Average Controller (university.js)
// Handles:
// 1. Department rendering from UNIVERSITY_DEPARTMENTS
// 2. 12th Grade Average / Score Matching (General, Parallel, Private)
// 3. Category & Branch Filtering (Scientific vs Literary)
// 4. City / University filtering
// 5. Interactive Modal for Department Details & Career Paths
// 6. Theme Switching Sync
// =========================================================================

document.addEventListener('DOMContentLoaded', () => {
    const dataStore = window.EducationalData;
    const departments = (window.UNIVERSITY_DEPARTMENTS && window.UNIVERSITY_DEPARTMENTS.length > 0)
        ? window.UNIVERSITY_DEPARTMENTS 
        : (dataStore && dataStore.getAllUniversityDepartments ? dataStore.getAllUniversityDepartments() : []);

    // DOM Elements
    const gridEl = document.getElementById('departments-grid');
    const scoreInput = document.getElementById('student-score-input');
    const branchSelect = document.getElementById('student-branch-select');
    const citySelect = document.getElementById('student-city-select');
    const applyBtn = document.getElementById('calc-apply-btn');
    const resetBtn = document.getElementById('calc-reset-btn');
    const searchInput = document.getElementById('dept-search-input');
    const categoryPills = document.querySelectorAll('.cat-btn');
    const totalDeptCountEl = document.getElementById('total-dept-count');

    // Summary Strip
    const summaryStrip = document.getElementById('score-summary-strip');
    const summaryScoreValue = document.getElementById('summary-score-value');
    const countAcceptedEl = document.getElementById('count-accepted');
    const countParallelEl = document.getElementById('count-parallel');
    const countPrivateEl = document.getElementById('count-private');

    // Modal
    const modalBackdrop = document.getElementById('dept-modal-backdrop');
    const modalClose = document.getElementById('dept-modal-close');
    const modalBody = document.getElementById('dept-modal-body');

    // Theme Toggle
    const themeToggleBtn = document.getElementById('univ-theme-toggle');

    // State
    let currentScore = null;
    let currentBranch = 'all';
    let currentCity = 'all';
    let currentCategory = 'all';
    let searchQuery = '';

    if (totalDeptCountEl) {
        totalDeptCountEl.textContent = departments.length;
    }

    // =========================================================================
    // Theme initialization
    // =========================================================================
    function initTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        if (themeToggleBtn) {
            const icon = themeToggleBtn.querySelector('i');
            if (icon) {
                icon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            }
            themeToggleBtn.addEventListener('click', () => {
                const cur = document.documentElement.getAttribute('data-theme') || 'light';
                const next = cur === 'dark' ? 'light' : 'dark';
                document.documentElement.setAttribute('data-theme', next);
                localStorage.setItem('theme', next);
                if (icon) {
                    icon.className = next === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
                }
            });
        }
    }
    initTheme();

    // =========================================================================
    // Filter & Render logic
    // =========================================================================
    function getQualificationStatus(dept, score) {
        if (score === null || isNaN(score) || score <= 0) return null;
        if (score >= dept.minScoreGeneral) {
            return {
                type: 'accepted',
                label: 'وەردەگیرێت (حکومی)',
                color: '#10b981',
                bg: 'rgba(16, 185, 129, 0.15)',
                border: '#10b981',
                icon: 'fa-check-circle'
            };
        } else if (score >= dept.minScoreParallel) {
            return {
                type: 'parallel',
                label: 'پارالێل / ئێواران',
                color: '#d97706',
                bg: 'rgba(245, 158, 11, 0.15)',
                border: '#f59e0b',
                icon: 'fa-adjust'
            };
        } else if (score >= dept.minScorePrivate) {
            return {
                type: 'private',
                label: 'زانکۆی ئەهلی',
                color: '#3b82f6',
                bg: 'rgba(59, 130, 246, 0.15)',
                border: '#3b82f6',
                icon: 'fa-building-columns'
            };
        } else {
            const diff = (dept.minScoreGeneral - score).toFixed(1);
            return {
                type: 'not_eligible',
                label: `کەمتری بە ${diff} نمرە`,
                color: '#ef4444',
                bg: 'rgba(239, 68, 68, 0.1)',
                border: 'rgba(239, 68, 68, 0.3)',
                icon: 'fa-exclamation-circle'
            };
        }
    }

    function renderDepartments() {
        if (!gridEl) return;

        let filtered = departments.filter(dept => {
            // Category filter
            if (currentCategory !== 'all' && dept.category !== currentCategory) {
                return false;
            }

            // Branch filter
            if (currentBranch !== 'all') {
                if (dept.branch !== 'both' && dept.branch !== currentBranch) {
                    return false;
                }
            }

            // City / University filter
            if (currentCity !== 'all') {
                const matchesUniv = dept.universities.some(u => u.includes(currentCity));
                if (!matchesUniv) return false;
            }

            // Search query
            if (searchQuery.trim() !== '') {
                const q = searchQuery.toLowerCase().trim();
                const matchNameKu = dept.nameKu.toLowerCase().includes(q);
                const matchNameEn = dept.nameEn ? dept.nameEn.toLowerCase().includes(q) : false;
                const matchDesc = dept.description ? dept.description.toLowerCase().includes(q) : false;
                const matchUniv = dept.universities.some(u => u.toLowerCase().includes(q));
                if (!matchNameKu && !matchNameEn && !matchDesc && !matchUniv) {
                    return false;
                }
            }

            return true;
        });

        // Summary calculations if score is given
        if (currentScore !== null && !isNaN(currentScore) && currentScore > 0) {
            let acceptedCount = 0;
            let parallelCount = 0;
            let privateCount = 0;

            filtered.forEach(dept => {
                if (currentScore >= dept.minScoreGeneral) acceptedCount++;
                else if (currentScore >= dept.minScoreParallel) parallelCount++;
                else if (currentScore >= dept.minScorePrivate) privateCount++;
            });

            if (summaryStrip) {
                summaryStrip.style.display = 'flex';
                if (summaryScoreValue) summaryScoreValue.textContent = currentScore;
                if (countAcceptedEl) countAcceptedEl.textContent = acceptedCount;
                if (countParallelEl) countParallelEl.textContent = parallelCount;
                if (countPrivateEl) countPrivateEl.textContent = privateCount;
            }

            // Sort so eligible departments appear first
            filtered.sort((a, b) => {
                const statusA = currentScore >= a.minScoreGeneral ? 3 : (currentScore >= a.minScoreParallel ? 2 : (currentScore >= a.minScorePrivate ? 1 : 0));
                const statusB = currentScore >= b.minScoreGeneral ? 3 : (currentScore >= b.minScoreParallel ? 2 : (currentScore >= b.minScorePrivate ? 1 : 0));
                if (statusA !== statusB) return statusB - statusA;
                return b.minScoreGeneral - a.minScoreGeneral;
            });
        } else {
            if (summaryStrip) summaryStrip.style.display = 'none';
        }

        if (filtered.length === 0) {
            gridEl.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 48px 20px; background: var(--surface-color); border-radius: 16px; border: 1px solid var(--border-color); color: var(--secondary-text);">
                    <i class="fas fa-search" style="font-size: 2.8rem; margin-bottom: 14px; opacity: 0.4;"></i>
                    <h3 style="margin: 0 0 8px; font-size: 1.2rem; color: var(--primary-text);">هیچ بەشێک نەدۆزرایەوە بەپێی ئەم مەرجانە</h3>
                    <p style="margin: 0 0 16px; font-size: 0.88rem;">تکایە فلتەرەکان پاک بکەرەوە یان وشەی گەڕان بگۆڕە.</p>
                    <button type="button" id="grid-reset-search-btn" class="calc-btn-primary" style="margin: 0 auto; padding: 8px 18px; font-size: 0.85rem;">
                        نیشاندانی هەموو بەشەکان
                    </button>
                </div>
            `;
            const rBtn = document.getElementById('grid-reset-search-btn');
            if (rBtn) {
                rBtn.addEventListener('click', resetFilters);
            }
            return;
        }

        gridEl.innerHTML = filtered.map(dept => {
            const status = getQualificationStatus(dept, currentScore);
            const branchBadge = dept.branch === 'scientific' 
                ? '<span class="meta-tag" style="background:rgba(0,123,255,0.1); color:#007bff;"><i class="fas fa-flask"></i> زانستی</span>'
                : (dept.branch === 'literary' 
                    ? '<span class="meta-tag" style="background:rgba(230,57,70,0.1); color:#e63946;"><i class="fas fa-feather-alt"></i> وێژەیی</span>'
                    : '<span class="meta-tag" style="background:rgba(40,167,69,0.1); color:#28a745;"><i class="fas fa-check-double"></i> زانستی و وێژەیی</span>');

            const statusMarkup = status ? `
                <span class="admission-status-pill" style="background:${status.bg}; color:${status.color}; border:1px solid ${status.border};">
                    <i class="fas ${status.icon}"></i> ${status.label}
                </span>
            ` : '';

            const univSample = dept.universities.slice(0, 3).join('، ') + (dept.universities.length > 3 ? ` (+${dept.universities.length - 3} زانکۆی تر)` : '');

            return `
                <article class="dept-card" style="border-top-color: ${dept.color || '#7209b7'};" data-dept-id="${dept.id}">
                    ${statusMarkup}
                    <div>
                        <div class="dept-header" style="${status ? 'margin-top: 22px;' : ''}">
                            <div class="dept-icon" style="background: ${dept.color}18; color: ${dept.color || '#7209b7'};">
                                <i class="fas ${dept.icon || 'fa-graduation-cap'}"></i>
                            </div>
                            <div class="dept-title-group" style="flex:1;">
                                <h3>${dept.nameKu}</h3>
                                <span class="dept-sub">${dept.nameEn || ''}</span>
                            </div>
                        </div>

                        <div class="dept-score-matrix">
                            <div class="score-col">
                                <span class="score-label">گشتی (حکومی)</span>
                                <span class="score-val general">${dept.minScoreGeneral.toFixed(1)}</span>
                            </div>
                            <div class="score-col" style="border-right: 1px solid var(--border-color); border-left: 1px solid var(--border-color);">
                                <span class="score-label">پارالێل</span>
                                <span class="score-val parallel">${dept.minScoreParallel.toFixed(1)}</span>
                            </div>
                            <div class="score-col">
                                <span class="score-label">ئەهلی / تایبەت</span>
                                <span class="score-val private">${dept.minScorePrivate.toFixed(1)}</span>
                            </div>
                        </div>

                        <div class="dept-meta-tags">
                            ${branchBadge}
                            <span class="meta-tag"><i class="fas fa-calendar-alt"></i> ${dept.durationYears} ساڵ خوێندن</span>
                            <span class="meta-tag"><i class="fas fa-tag"></i> ${dept.categoryKu || 'کۆلێژ'}</span>
                        </div>

                        <p class="dept-desc">${dept.description || ''}</p>

                        <div class="dept-univs-box">
                            <strong><i class="fas fa-map-marker-alt"></i> لەم زانکۆیانە هەیە:</strong> ${univSample}
                        </div>
                    </div>

                    <div class="dept-footer-actions">
                        <button type="button" class="dept-btn dept-btn-outline open-dept-detail" data-dept-id="${dept.id}">
                            <i class="fas fa-info-circle"></i> هەموو زانیارییەکان
                        </button>
                        <a href="grade.html?pola=univ&dept=${dept.id}" class="dept-btn dept-btn-primary">
                            <i class="fas fa-book-open"></i> کەرەستە و وانەکان
                        </a>
                    </div>
                </article>
            `;
        }).join('');

        // Attach modal openers
        document.querySelectorAll('.open-dept-detail').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-dept-id');
                openDepartmentModal(id);
            });
        });
    }

    // =========================================================================
    // Modal Handler
    // =========================================================================
    function openDepartmentModal(deptId) {
        const dept = departments.find(d => d.id === deptId);
        if (!dept || !modalBody || !modalBackdrop) return;

        const univListHtml = dept.universities.map(u => `
            <li style="margin-bottom:6px; display:flex; align-items:center; gap:8px;">
                <i class="fas fa-university" style="color:var(--univ-primary);"></i>
                <span>${u}</span>
            </li>
        `).join('');

        modalBody.innerHTML = `
            <div style="display:flex; align-items:center; gap:14px; margin-bottom:16px;">
                <div style="width:54px; height:54px; border-radius:14px; background:${dept.color}18; color:${dept.color}; display:flex; align-items:center; justify-content:center; font-size:1.6rem;">
                    <i class="fas ${dept.icon}"></i>
                </div>
                <div>
                    <h2 style="margin:0 0 4px; font-size:1.35rem; color:var(--primary-text);">${dept.nameKu}</h2>
                    <span style="font-size:0.85rem; color:var(--secondary-text);">${dept.nameEn}</span>
                </div>
            </div>

            <div style="background:var(--background-color); border:1px solid var(--border-color); border-radius:14px; padding:14px; margin-bottom:18px;">
                <h4 style="margin:0 0 8px; font-size:0.9rem;"><i class="fas fa-chart-line" style="color:var(--univ-primary);"></i> نمرەی وەرگرتن (معەدل):</h4>
                <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:10px; text-align:center;">
                    <div style="padding:8px; background:var(--surface-color); border-radius:10px; border:1px solid var(--border-color);">
                        <div style="font-size:0.75rem; color:var(--secondary-text);">حکومی گشتی</div>
                        <div style="font-size:1.2rem; font-weight:800; color:#10b981;">${dept.minScoreGeneral.toFixed(1)}</div>
                    </div>
                    <div style="padding:8px; background:var(--surface-color); border-radius:10px; border:1px solid var(--border-color);">
                        <div style="font-size:0.75rem; color:var(--secondary-text);">پارالێل / ئێواران</div>
                        <div style="font-size:1.2rem; font-weight:800; color:#f59e0b;">${dept.minScoreParallel.toFixed(1)}</div>
                    </div>
                    <div style="padding:8px; background:var(--surface-color); border-radius:10px; border:1px solid var(--border-color);">
                        <div style="font-size:0.75rem; color:var(--secondary-text);">ئەهلی و تایبەت</div>
                        <div style="font-size:1.2rem; font-weight:800; color:#3b82f6;">${dept.minScorePrivate.toFixed(1)}</div>
                    </div>
                </div>
            </div>

            <div style="margin-bottom:16px;">
                <h4 style="margin:0 0 6px; font-size:0.95rem;"><i class="fas fa-align-right" style="color:var(--univ-primary);"></i> دەربارەی بەش:</h4>
                <p style="margin:0; font-size:0.9rem; color:var(--secondary-text); line-height:1.6;">${dept.description}</p>
            </div>

            <div style="margin-bottom:16px;">
                <h4 style="margin:0 0 6px; font-size:0.95rem;"><i class="fas fa-briefcase" style="color:var(--univ-primary);"></i> بوارەکانی کارکردن لە داهاتوودا:</h4>
                <div style="background:rgba(16,185,129,0.08); border:1px solid rgba(16,185,129,0.25); border-radius:10px; padding:12px; font-size:0.88rem; color:var(--primary-text); line-height:1.5;">
                    ${dept.careerFields}
                </div>
            </div>

            <div style="margin-bottom:20px;">
                <h4 style="margin:0 0 8px; font-size:0.95rem;"><i class="fas fa-map-marker-alt" style="color:var(--univ-primary);"></i> زانکۆکانی هەرێم کە ئەم بەشەیان تێدایە:</h4>
                <ul style="list-style:none; padding:0; margin:0; font-size:0.88rem;">
                    ${univListHtml}
                </ul>
            </div>

            <div style="display:flex; gap:10px; justify-content:flex-end;">
                <a href="grade.html?pola=univ&dept=${dept.id}" class="calc-btn-primary" style="text-decoration:none; padding:10px 20px; font-size:0.88rem;">
                    <i class="fas fa-book-reader"></i> سەرچاوە و وانەکانی ئەم بەشە
                </a>
            </div>
        `;

        modalBackdrop.style.display = 'flex';
    }

    if (modalClose) {
        modalClose.addEventListener('click', () => {
            modalBackdrop.style.display = 'none';
        });
    }
    if (modalBackdrop) {
        modalBackdrop.addEventListener('click', (e) => {
            if (e.target === modalBackdrop) {
                modalBackdrop.style.display = 'none';
            }
        });
    }

    // =========================================================================
    // Filter controls & Listeners
    // =========================================================================
    function resetFilters() {
        if (scoreInput) scoreInput.value = '';
        if (branchSelect) branchSelect.value = 'all';
        if (citySelect) citySelect.value = 'all';
        if (searchInput) searchInput.value = '';
        currentScore = null;
        currentBranch = 'all';
        currentCity = 'all';
        currentCategory = 'all';
        searchQuery = '';
        categoryPills.forEach(p => p.classList.toggle('active', p.getAttribute('data-cat') === 'all'));
        renderDepartments();
    }

    if (applyBtn) {
        applyBtn.addEventListener('click', () => {
            const rawVal = scoreInput ? parseFloat(scoreInput.value) : NaN;
            currentScore = !isNaN(rawVal) ? rawVal : null;
            if (branchSelect) currentBranch = branchSelect.value;
            if (citySelect) currentCity = citySelect.value;
            renderDepartments();
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', resetFilters);
    }

    if (scoreInput) {
        scoreInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                if (applyBtn) applyBtn.click();
            }
        });
    }

    if (branchSelect) {
        branchSelect.addEventListener('change', () => {
            currentBranch = branchSelect.value;
            renderDepartments();
        });
    }

    if (citySelect) {
        citySelect.addEventListener('change', () => {
            currentCity = citySelect.value;
            renderDepartments();
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            renderDepartments();
        });
    }

    categoryPills.forEach(pill => {
        pill.addEventListener('click', () => {
            categoryPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            currentCategory = pill.getAttribute('data-cat') || 'all';
            renderDepartments();
        });
    });

    // Initial render
    renderDepartments();
});
