// ============================================================
//  CLEANAIR AI – Configuration
//  ⚠️ DO NOT COMMIT THIS FILE TO GITHUB (add to .gitignore)
// ============================================================

const CONFIG = {
    // Get from https://aistudio.google.com/
    GEMINI_API_KEY: 'YOUR_GEMINI_API_KEY',

    // Firebase project settings (from Firebase Console)
    FIREBASE: {
        apiKey: 'YOUR_FIREBASE_API_KEY',
        authDomain: 'YOUR_PROJECT.firebaseapp.com',
        projectId: 'YOUR_PROJECT_ID',
        storageBucket: 'YOUR_PROJECT.appspot.com',
        messagingSenderId: 'YOUR_SENDER_ID',
        appId: 'YOUR_APP_ID'
    },

    // Google Maps API Key (enable Maps JavaScript API & Visualization)
    MAPS_API_KEY: 'YOUR_GOOGLE_MAPS_API_KEY'
};

// Make it globally accessible
window.CONFIG = CONFIG;