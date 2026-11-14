// =========================================================================
// Login Page Controller — Connected to Cloudflare Worker POST /login
// =========================================================================
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('userTheme') || localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;

            const submitButton = loginForm.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> چاڤەڕێ بە...';
            loginError.style.display = 'none';

            try {
                if (!window.CloudflareLessons) {
                    throw new Error('سیستەمێ سێرڤەری ئامادە نینە.');
                }

                await window.CloudflareLessons.loginAccount({
                    username: username,
                    password: password
                });

                window.location.href = 'index.html';
            } catch (error) {
                console.error('Login Error:', error);
                loginError.textContent = error.message || 'یوزەرنەیم یان پاسوۆرد خەلەتە.';
                loginError.style.display = 'block';
                submitButton.disabled = false;
                submitButton.innerHTML = '<i class="fas fa-sign-in-alt"></i> چوونەژوور (Login)';
            }
        });
    }
});
