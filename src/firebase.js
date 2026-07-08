// src/firebase.js
import { CONFIG } from './config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js';
import { getFirestore, collection, addDoc, query, orderBy, limit, getDocs, doc, updateDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage-compat.js';

let app, db, auth, storage;

export function initFirebase() {
  app = firebase.initializeApp(CONFIG.FIREBASE);
  db = firebase.firestore(app);
  auth = firebase.auth(app);
  storage = firebase.storage(app);
  return { db, auth, storage };
}

export { db, auth, storage };