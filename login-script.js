// --- START OF FILE: login-script.js ---
document.addEventListener('DOMContentLoaded', () => {
    const auth = firebase.auth();
    const db = firebase.firestore();

    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        const submitButton = loginForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'ل هیڤیێ بە...';
        loginError.style.display = 'none';

        try {
            let user = null;
            try {
                const userCredential = await auth.signInWithEmailAndPassword(email, password);
                user = userCredential.user;
            } catch (fbErr) {
                // If unauthorized domain (e.g. Netlify) check locally registered user
                const localUsers = JSON.parse(localStorage.getItem('app_registered_users') || '[]');
                const localUser = localUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
                if (localUser) {
                    user = {
                        uid: localUser.uid,
                        displayName: localUser.fullName,
                        email: localUser.email
                    };
                } else {
                    throw fbErr;
                }
            }

            const isOfficialSuperAdmin = window.isSuperAdmin && window.isSuperAdmin(user);
            if (isOfficialSuperAdmin) {
                localStorage.setItem('is_admin_mode_active', 'true');
            } else {
                localStorage.removeItem('is_admin_mode_active');
            }

            localStorage.setItem('app_logged_in_user', JSON.stringify({
                uid: user.uid,
                displayName: user.displayName || user.email,
                email: user.email,
                role: isOfficialSuperAdmin ? 'super_admin' : 'student',
                isAdmin: isOfficialSuperAdmin
            }));

            if (typeof checkUserStatus === 'function') {
                await checkUserStatus(user);
            }
            
            window.location.href = 'index.html';

        } catch (error) {
            console.error('Login Error:', error);
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                loginError.textContent = 'ئیمەیل یان تێپەڕەوشە خەلەتە.';
            } else if (error.code === 'auth/unauthorized-domain') {
                loginError.innerHTML = 'ئاگاداری: پێویستە ناونیشانی sch001.netlify.app لە ناو Firebase Console زیاد بکرێت (Authentication -> Settings -> Authorized Domains).';
            } else {
                loginError.textContent = 'کێشەیەک د چونا ژوور دا چێبوو: ' + (error.message || '');
            }
            loginError.style.display = 'block';
            submitButton.disabled = false;
            submitButton.textContent = 'داخل ببە';
        }
    });

    const googleLoginBtn = document.getElementById('google-login-btn');
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', async () => {
            googleLoginBtn.disabled = true;
            try {
                let user = null;
                if (window.GoogleDriveService) {
                    const result = await window.GoogleDriveService.signInWithGoogle();
                    user = result.user;
                } else {
                    const provider = new firebase.auth.GoogleAuthProvider();
                    const result = await auth.signInWithPopup(provider);
                    user = result.user;
                }

                if (user) {
                    const isOfficialSuperAdmin = window.isSuperAdmin && window.isSuperAdmin(user);
                    if (isOfficialSuperAdmin) {
                        localStorage.setItem('is_admin_mode_active', 'true');
                    } else {
                        localStorage.removeItem('is_admin_mode_active');
                    }

                    localStorage.setItem('app_logged_in_user', JSON.stringify({
                        uid: user.uid,
                        displayName: user.displayName || user.email,
                        email: user.email,
                        role: isOfficialSuperAdmin ? 'super_admin' : 'student',
                        isAdmin: isOfficialSuperAdmin
                    }));

                    if (typeof checkUserStatus === 'function') {
                        await checkUserStatus(user);
                    }
                    window.location.href = 'index.html';
                }
            } catch (err) {
                console.error('Google Sign-In Error:', err);
                if (loginError) {
                    if (err.code === 'auth/unauthorized-domain') {
                        loginError.innerHTML = 'ئاگاداری: پێویستە ناونیشانی sch001.netlify.app لە ناو Firebase Console زیاد بکرێت (Authentication -> Settings -> Authorized Domains).';
                    } else {
                        loginError.textContent = 'کێشەیەک لە چوونەژوورەوە بە گووگڵ چێبوو: ' + (err.message || '');
                    }
                    loginError.style.display = 'block';
                }
            } finally {
                googleLoginBtn.disabled = false;
            }
        });
    }
});
// --- END OF FILE: login-script.js ---
