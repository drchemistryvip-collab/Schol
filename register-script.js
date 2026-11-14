// =========================================================================
// Register Page Controller — Connected to Cloudflare Worker POST /register
// =========================================================================
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('userTheme') || localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    const registerForm = document.getElementById('register-form');
    const registerError = document.getElementById('register-error');
    const cardStudent = document.getElementById('reg-card-student');
    const cardTeacher = document.getElementById('reg-card-teacher');
    const teacherCodeGroup = document.getElementById('teacher-code-group');
    const teacherCodeInput = document.getElementById('teacher_code');

    function setSelectedRole(role) {
        const isTeacher = role === 'teacher';
        const targetRadio = document.querySelector(`input[name="role"][value="${role}"]`);
        if (targetRadio) targetRadio.checked = true;

        if (cardStudent) {
            cardStudent.classList.toggle('active-student', !isTeacher);
        }
        if (cardTeacher) {
            cardTeacher.classList.toggle('active-teacher', isTeacher);
        }
        if (teacherCodeGroup) {
            teacherCodeGroup.style.display = isTeacher ? 'block' : 'none';
        }
        if (teacherCodeInput) {
            teacherCodeInput.required = isTeacher;
            if (!isTeacher) teacherCodeInput.value = '';
        }
    }

    if (cardStudent) {
        cardStudent.addEventListener('click', () => setSelectedRole('student'));
    }
    if (cardTeacher) {
        cardTeacher.addEventListener('click', () => setSelectedRole('teacher'));
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const full_name = document.getElementById('full_name').value.trim();
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;
            const roleRadio = document.querySelector('input[name="role"]:checked');
            const role = roleRadio ? roleRadio.value : 'student';
            const teacher_code = teacherCodeInput ? teacherCodeInput.value.trim() : '';

            registerError.style.display = 'none';

            if (!full_name || !username || !password) {
                registerError.textContent = 'تکایە ناڤێ تەمام، یوزەرنەیم و پاسوۆردی بنڤیسە.';
                registerError.style.display = 'block';
                return;
            }

            if (role === 'teacher' && !teacher_code) {
                registerError.textContent = 'بۆ هەژمارا مامۆستایان، تکایە «کۆدێ نهێنی یێ مامۆستایان» بنڤیسە.';
                registerError.style.display = 'block';
                if (teacherCodeInput) teacherCodeInput.focus();
                return;
            }

            const submitButton = registerForm.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> دروستکرنا هەژمارێ...';

            try {
                if (!window.CloudflareLessons) {
                    throw new Error('سیستەمێ سێرڤەری ئامادە نینە.');
                }

                await window.CloudflareLessons.registerAccount({
                    full_name: full_name,
                    username: username,
                    password: password,
                    role: role,
                    teacher_code: teacher_code
                });

                window.location.href = 'index.html';
            } catch (error) {
                console.error('Register Error:', error);
                registerError.textContent = error.message || 'دروستکرنا هەژمارێ سەرنەگرت.';
                registerError.style.display = 'block';
                submitButton.disabled = false;
                submitButton.innerHTML = '<i class="fas fa-user-plus"></i> دروستکرنا هەژمارێ (Register)';
            }
        });
    }
});
