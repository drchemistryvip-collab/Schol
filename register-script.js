// --- START OF FILE: register-script.js (SECURED & STABLE) ---
document.addEventListener('DOMContentLoaded', () => {
    const auth = (typeof firebase !== 'undefined' && firebase.auth) ? firebase.auth() : null;
    const db = (typeof window !== 'undefined' && window.db) ? window.db : ((typeof firebase !== 'undefined' && firebase.firestore) ? firebase.firestore() : null);

    const registerForm = document.getElementById('register-form');
    const registerError = document.getElementById('register-error');

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fullName = document.getElementById('fullName').value.trim();
            const phoneNumber = document.getElementById('phoneNumber').value.trim();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (!fullName || !phoneNumber || !email || !password || !confirmPassword) {
                registerError.textContent = 'تکایە هەمی خانەیان پر بکە.';
                registerError.style.display = 'block';
                return;
            }

            if (password.length < 6) {
                registerError.textContent = 'تێپەڕەوشە دەبێت لایەنی کەم ٦ پیت یان ژمارە بێت.';
                registerError.style.display = 'block';
                return;
            }

            if (password !== confirmPassword) {
                registerError.textContent = 'تێپەڕەوشە و دووبارەکردنەوەی وەک یەک نین، تکایە دڵنیابە لە دروستی.';
                registerError.style.display = 'block';
                return;
            }

            const submitButton = registerForm.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.textContent = 'ل هیڤیێ بە...';
            registerError.style.display = 'none';

            // Timeout wrapper to prevent eternal hanging on network / unauthorized domain issues
            const withTimeout = (promise, ms = 4000) => {
                return Promise.race([
                    promise,
                    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))
                ]);
            };

            try {
                let userUid = 'user_' + Date.now();
                let userEmail = email;
                let registeredWithFirebase = false;

                if (auth) {
                    try {
                        const userCredential = await withTimeout(auth.createUserWithEmailAndPassword(email, password), 4500);
                        if (userCredential && userCredential.user) {
                            userUid = userCredential.user.uid;
                            registeredWithFirebase = true;

                            // Sync profile to Firestore
                            if (db) {
                                db.collection('users').doc(userUid).set({
                                    fullName: fullName,
                                    phoneNumber: phoneNumber,
                                    email: email,
                                    role: 'student',
                                    isAdmin: false,
                                    createdAt: firebase.firestore.FieldValue ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString()
                                }).catch(err => console.warn('Firestore user save notice:', err));
                            }
                        }
                    } catch (fbError) {
                        console.warn('Firebase createUser warning/fallback:', fbError);

                        if (fbError.code === 'auth/email-already-in-use') {
                            throw fbError;
                        } else if (fbError.code === 'auth/weak-password') {
                            throw fbError;
                        } else if (fbError.code === 'auth/invalid-email') {
                            throw fbError;
                        }
                        // For domain unauthorized, timeout, or network issues: fallback to local storage
                    }
                }

                // Save user into local storage users registry
                const localUsers = JSON.parse(localStorage.getItem('app_registered_users') || '[]');
                const exists = localUsers.some(u => u.email && u.email.toLowerCase() === email.toLowerCase());
                if (exists && !registeredWithFirebase) {
                    throw { code: 'auth/email-already-in-use' };
                }

                const newUserRecord = {
                    uid: userUid,
                    fullName: fullName,
                    phoneNumber: phoneNumber,
                    email: email,
                    role: 'student',
                    isAdmin: false,
                    createdAt: Date.now()
                };
                localUsers.push(newUserRecord);
                localStorage.setItem('app_registered_users', JSON.stringify(localUsers));

                // Save active session
                localStorage.setItem('app_logged_in_user', JSON.stringify({
                    uid: userUid,
                    displayName: fullName,
                    email: email,
                    phoneNumber: phoneNumber,
                    role: 'student',
                    isAdmin: false
                }));
                localStorage.removeItem('is_admin_mode_active');
                localStorage.setItem('app_learn_user_role', 'student');

                // Redirect directly to Profile Setup
                window.location.href = 'index.html?setupProfile=true';

            } catch (error) {
                console.error('Register Error:', error);
                if (error.code === 'auth/email-already-in-use') {
                    registerError.textContent = 'ئەڤ ئیمەیلە بەری نها هاتیە تۆمارکرن. تکایە بچۆ لاپەڕەی چوونەژوور.';
                } else if (error.code === 'auth/weak-password') {
                    registerError.textContent = 'تێپەڕەوشە لاوازە، دڤێت ژ 6 پیتا پتر بیت.';
                } else if (error.code === 'auth/invalid-email') {
                    registerError.textContent = 'ناونیشانی ئیمەیل نادروستە، تکایە ئیمەیلێکی دروست بنووسە.';
                } else if (error.code === 'auth/unauthorized-domain') {
                    registerError.innerHTML = 'ئاگاداری: پێویستە ناونیشانی ئەم وێبسایتە لە ناو Firebase Console زیاد بکرێت (Authentication -> Settings -> Authorized Domains).';
                } else {
                    registerError.textContent = 'کێشەیەک ڕوویدا: ' + (error.message || 'تکایە دووبارە هەوڵ بدەرەوە');
                }
                registerError.style.display = 'block';
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = 'تۆمار بکە';
            }
        });
    }

    // Google Quick Register with pure Firebase Auth
    const googleRegBtn = document.getElementById('google-register-btn');
    if (googleRegBtn && auth) {
        googleRegBtn.addEventListener('click', async () => {
            googleRegBtn.disabled = true;
            try {
                const provider = new firebase.auth.GoogleAuthProvider();
                provider.setCustomParameters({ prompt: 'select_account' });
                const result = await auth.signInWithPopup(provider);
                const user = result.user;

                if (user) {
                    const isOfficialSuperAdmin = window.isSuperAdmin && window.isSuperAdmin(user);
                    if (isOfficialSuperAdmin) {
                        localStorage.setItem('is_admin_mode_active', 'true');
                    } else {
                        localStorage.removeItem('is_admin_mode_active');
                    }

                    // Save session
                    localStorage.setItem('app_logged_in_user', JSON.stringify({
                        uid: user.uid,
                        displayName: user.displayName || user.email,
                        email: user.email,
                        photoURL: user.photoURL || '',
                        role: isOfficialSuperAdmin ? 'super_admin' : 'student',
                        isAdmin: isOfficialSuperAdmin
                    }));

                    if (typeof checkUserStatus === 'function') {
                        await checkUserStatus(user);
                    }

                    // Go to Profile Setup
                    window.location.href = 'index.html?setupProfile=true';
                }
            } catch (err) {
                console.error('Google Register Error:', err);
                if (registerError) {
                    if (err.code === 'auth/popup-closed-by-user') {
                        registerError.textContent = 'پەنجەرەی گووگڵ پێش تەواوبوونی چوونەژوورەوە داخرا. تکایە دووبارە هەوڵ بدەرەوە.';
                    } else if (err.code === 'auth/unauthorized-domain') {
                        registerError.innerHTML = 'ئاگاداری: پێویستە ناونیشانی ئەم وێبسایتە لە ناو Firebase Console زیاد بکرێت (Authentication -> Settings -> Authorized Domains).';
                    } else {
                        registerError.textContent = 'کێشەیەک لە تۆمارکردن بە گووگڵ چێبوو: ' + (err.message || '');
                    }
                    registerError.style.display = 'block';
                }
            } finally {
                googleRegBtn.disabled = false;
            }
        });
    }
});
// --- END OF FILE: register-script.js ---
