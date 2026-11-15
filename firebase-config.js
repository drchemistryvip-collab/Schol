// Use provisioned Firebase project configuration
var firebaseConfig = {
    apiKey: "AIzaSyCwIlFc0S_ta7rHMDMcc1HV6v-8rUG13Tc",
    authDomain: "euphoric-reporter-4wrl4.firebaseapp.com",
    projectId: "euphoric-reporter-4wrl4",
    storageBucket: "euphoric-reporter-4wrl4.firebasestorage.app",
    messagingSenderId: "1038351445351",
    appId: "1:1038351445351:web:b4ad53bdcd5db677a2d3c2",
    firestoreDatabaseId: "ai-studio-2v-3e5e9769-f2be-4e26-b0d9-247f42aa1a44"
};

if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

var auth = typeof firebase !== 'undefined' && firebase.auth ? firebase.auth() : null;
var db = null;

if (typeof firebase !== 'undefined' && firebase.firestore) {
    try {
        var defaultApp = firebase.app();
        if (firebaseConfig.firestoreDatabaseId && typeof window !== 'undefined' && typeof window.__getNamedFirestore === 'function') {
            db = window.__getNamedFirestore(defaultApp, firebaseConfig.firestoreDatabaseId);
            var originalFirestoreFn = firebase.firestore;
            var patchedFirestoreFn = function (appArg) {
                if (!appArg || appArg === defaultApp) {
                    return db;
                }
                return originalFirestoreFn.call(firebase, appArg);
            };
            Object.getOwnPropertyNames(originalFirestoreFn).forEach(function (key) {
                if (!(key in patchedFirestoreFn)) {
                    try {
                        Object.defineProperty(
                            patchedFirestoreFn,
                            key,
                            Object.getOwnPropertyDescriptor(originalFirestoreFn, key)
                        );
                    } catch (propErr) {}
                }
            });
            try {
                Object.setPrototypeOf(patchedFirestoreFn, Object.getPrototypeOf(originalFirestoreFn));
            } catch (protoErr) {}
            firebase.firestore = patchedFirestoreFn;
            if (defaultApp) {
                defaultApp.firestore = function (dbIdArg) {
                    if (!dbIdArg || dbIdArg === firebaseConfig.firestoreDatabaseId) {
                        return db;
                    }
                    return window.__getNamedFirestore(defaultApp, dbIdArg);
                };
            }
        } else {
            db = firebase.firestore();
        }
    } catch (e) {
        console.warn('Firestore initialization notice:', e);
    }
}

var storage = typeof firebase !== 'undefined' && firebase.storage ? firebase.storage() : null;

// Expose globally for browser scripts
if (typeof window !== 'undefined') {
    window.firebaseConfig = firebaseConfig;
    window.db = db;
    window.auth = auth;
    window.storage = storage;
}
