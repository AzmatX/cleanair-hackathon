// src/storage.js
import { db, auth } from './firebase.js';

export async function saveReport(report) {
  // Save to Firebase if authenticated
  if (auth.currentUser) {
    try {
      await db.collection('reports').add({
        ...report,
        userId: auth.currentUser.uid,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
    } catch (e) {
      console.warn('Firebase save failed, using localStorage', e);
      saveLocal(report);
    }
  } else {
    saveLocal(report);
  }
}

function saveLocal(report) {
  const reports = JSON.parse(localStorage.getItem('cleanair_reports') || '[]');
  reports.push(report);
  localStorage.setItem('cleanair_reports', JSON.stringify(reports));
}

export async function loadReports() {
  let reports = [];
  // Try Firebase
  if (auth.currentUser) {
    try {
      const snapshot = await db.collection('reports')
        .where('userId', '==', auth.currentUser.uid)
        .orderBy('timestamp', 'desc')
        .limit(100)
        .get();
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.timestamp?.toDate) data.timestamp = data.timestamp.toDate().toISOString();
        reports.push(data);
      });
      if (reports.length) return reports;
    } catch (e) { console.warn('Firebase load failed', e); }
  }
  // Fallback localStorage
  const local = JSON.parse(localStorage.getItem('cleanair_reports') || '[]');
  return local;
}

export function getReports() { /* ... */ }
export function setReports(r) { /* ... */ }