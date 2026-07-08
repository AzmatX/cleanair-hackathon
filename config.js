// config.js – load environment variables (replaces old CONFIG)
export const CONFIG = {
  GEMINI_API_KEY: import.meta.env?.VITE_GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY',
  FIREBASE: {
    apiKey: import.meta.env?.VITE_FIREBASE_API_KEY || 'YOUR_FIREBASE_API_KEY',
    authDomain: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN || 'YOUR_PROJECT.firebaseapp.com',
    projectId: import.meta.env?.VITE_FIREBASE_PROJECT_ID || 'YOUR_PROJECT_ID',
    storageBucket: import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET || 'YOUR_PROJECT.appspot.com',
    messagingSenderId: import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID || 'YOUR_SENDER_ID',
    appId: import.meta.env?.VITE_FIREBASE_APP_ID || 'YOUR_APP_ID',
  },
  MAPS_API_KEY: import.meta.env?.VITE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_API_KEY',
  OPENAQ_API_KEY: import.meta.env?.VITE_OPENAQ_API_KEY || '',
};