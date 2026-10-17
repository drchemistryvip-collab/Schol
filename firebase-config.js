// Use provisioned Firebase project configuration
const firebaseConfig = {
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

const auth = typeof firebase !== 'undefined' && firebase.auth ? firebase.auth() : null;
let db = null;
if (typeof firebase !== 'undefined' && firebase.firestore) {
    try {
        if (firebaseConfig.firestoreDatabaseId) {
            try {
                db = firebase.app().firestore(firebaseConfig.firestoreDatabaseId);
            } catch (eDb) {
                db = firebase.firestore();
            }
        } else {
            db = firebase.firestore();
        }
    } catch (e) {
        console.warn('Firestore initialization notice:', e);
    }
}
const storage = typeof firebase !== 'undefined' && firebase.storage ? firebase.storage() : null;

// Expose globally for browser scripts
if (typeof window !== 'undefined') {
    window.firebaseConfig = firebaseConfig;
    window.db = db;
    window.auth = auth;
    window.storage = storage;
}
