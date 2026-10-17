// --- START OF FILE: register-script.js (GUHERTÎ) ---
document.addEventListener('DOMContentLoaded', () => {
    const db = firebase.firestore();
    const auth = firebase.auth();

    const registerForm = document.getElementById('register-form');
    const registerError = document.getElementById('register-error');

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fullName = document.getElementById('fullName').value.trim();
        const phoneNumber = document.getElementById('phoneNumber').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const secretNumber = document.getElementById('confirmPassword').value.trim();

        if (!fullName || !phoneNumber || !email || !password || !secretNumber) {
            registerError.textContent = 'تکایە هەمی خانەیان پر بکە.';
            registerError.style.display = 'block';
            return;
        }

        const submitButton = registerForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'ل هیڤیێ بە...';
        registerError.style.display = 'none';

        try {
            let user = null;
            let usedFirebase = false;

            try {
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                user = userCredential.user;
                usedFirebase = true;
                
                await db.collection('users').doc(user.uid).set({
                    fullName: fullName,
                    phoneNumber: phoneNumber,
                    email: email,
                    secretNumber: secretNumber,
                    isSubscribed: false, 
                    isAdmin: false, // New users NEVER have admin privileges
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            } catch (fbError) {
                console.warn('Firebase createUser error, attempting intelligent diagnosis/fallback:', fbError);

                if (fbError.code === 'auth/email-already-in-use') {
                    throw fbError;
                } else if (fbError.code === 'auth/weak-password') {
                    throw fbError;
                } else if (fbError.code === 'auth/invalid-email') {
                    throw fbError;
                }

                // If unauthorized domain (e.g. Netlify) or operation not allowed in Firebase
                // Fallback to storing user locally so the user is not locked out
                const localUsers = JSON.parse(localStorage.getItem('app_registered_users') || '[]');
                const exists = localUsers.some(u => u.email.toLowerCase() === email.toLowerCase());
                if (exists) {
                    throw { code: 'auth/email-already-in-use' };
                }

                const newUser = {
                    uid: 'user_' + Date.now(),
                    fullName: fullName,
                    phoneNumber: phoneNumber,
                    email: email,
                    secretNumber: secretNumber,
                    isSubscribed: false,
                    isAdmin: false,
                    createdAt: Date.now()
                };
                localUsers.push(newUser);
                localStorage.setItem('app_registered_users', JSON.stringify(localUsers));

                // Save active session as student (NEVER admin)
                localStorage.setItem('app_logged_in_user', JSON.stringify({
                    uid: newUser.uid,
                    displayName: fullName,
                    email: email,
                    phoneNumber: phoneNumber,
                    role: 'student',
                    isAdmin: false
                }));
                localStorage.removeItem('is_admin_mode_active');
                localStorage.setItem('app_learn_user_role', 'student');
            }

            // Normal successful navigation to pending page
            window.location.href = 'pending.html';

        } catch (error) {
            console.error('Register Error:', error);
            if (error.code === 'auth/email-already-in-use') {
                registerError.textContent = 'ئەڤ ئیمەیلە بەری نها هاتیە تۆمارکرن. تکایە بچۆ لاپەڕەی چوونەژوور.';
            } else if (error.code === 'auth/weak-password') {
                registerError.textContent = 'تێپەڕەوشە لاوازە، دڤێت ژ 6 پیتا پتر بیت.';
            } else if (error.code === 'auth/invalid-email') {
                registerError.textContent = 'ناونیشانی ئیمەیل نادروستە، تکایە ئیمەیلێکی دروست بنووسە.';
            } else if (error.code === 'auth/unauthorized-domain') {
                registerError.innerHTML = 'دۆمەینی ماڵپەڕەکە (Netlify) لە ناو لیستی Authorized Domains لە فایەربەیس چالاک نەکراوە.<br><small>تکایە ناونیشانی sch001.netlify.app لە بەشی Firebase Auth -> Settings زیاد بکە.</small>';
            } else {
                registerError.textContent = 'کێشەیەک ڕوویدا: ' + (error.message || 'تکایە دووبارە هەوڵ بدەرەوە');
            }
            registerError.style.display = 'block';
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'تۆمار بکە';
        }
    });

    const googleRegBtn = document.getElementById('google-register-btn');
    if (googleRegBtn) {
        googleRegBtn.addEventListener('click', async () => {
            googleRegBtn.disabled = true;
            try {
                let user = null;
                if (window.GoogleDriveService) {
                    const res = await window.GoogleDriveService.signInWithGoogle();
                    user = res.user;
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
                    
                    // Sync profile to Firestore users collection
                    try {
                        await db.collection('users').doc(user.uid).set({
                            fullName: user.displayName || 'بەکارهێنەری گووگڵ',
                            email: user.email,
                            phoneNumber: user.phoneNumber || '',
                            isSubscribed: true,
                            isAdmin: isOfficialSuperAdmin,
                            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                        }, { merge: true });
                    } catch (e) {
                        console.warn('Firestore user profile sync:', e);
                    }

                    // Save local session
                    localStorage.setItem('app_logged_in_user', JSON.stringify({
                        uid: user.uid,
                        displayName: user.displayName || user.email,
                        email: user.email,
                        role: isOfficialSuperAdmin ? 'super_admin' : 'student',
                        isAdmin: isOfficialSuperAdmin
                    }));

                    window.location.href = 'index.html';
                }
            } catch (err) {
                console.error('Google Register Error:', err);
                if (registerError) {
                    if (err.code === 'auth/unauthorized-domain') {
                        registerError.innerHTML = 'ئاگاداری: پێویستە ناونیشانی sch001.netlify.app لە ناو Firebase Console زیاد بکرێت (Authentication -> Settings -> Authorized Domains).';
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
