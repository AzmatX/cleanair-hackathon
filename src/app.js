// src/app.js – Entry point
import { CONFIG } from './config.js';
import { initFirebase, auth, db, storage } from './firebase.js';
import { initMap, addReportToMap, toggleHeatmap, toggleClustering, resetMapView } from './map.js';
import { analyzeImage } from './ai.js';
import { fetchWeather, fetchAQI } from './weather.js';
import { predictAQI } from './prediction.js';
import { updateDashboard, renderDashboard } from './dashboard.js';
import { addAlert, clearAlerts, exportAlerts } from './alerts.js';
import { saveReport, loadReports, getReports, setReports } from './storage.js';
import { renderCharts, updateCharts } from './charts.js';
import { showToast, debounce, validateLocation, compressImage } from './utils.js';

// Global state
let reports = [];
let mapInstance = null;
let isHeatmapOn = false;
let isClusteringOn = true;

// DOM refs
const form = document.getElementById('report-form');
const photoInput = document.getElementById('photo-input');
const locationInput = document.getElementById('location-input');
const submitBtn = document.getElementById('submit-btn');
const resultDiv = document.getElementById('analysis-result');
const loadingDiv = document.getElementById('analysis-loading');
const dropZone = document.getElementById('drop-zone');
const previewContainer = document.getElementById('image-preview');
const previewImg = document.getElementById('preview-img');
const removePreview = document.getElementById('remove-preview');
const authBtn = document.getElementById('auth-btn');

// ===== INIT =====
async function init() {
  // Firebase
  await initFirebase();

  // Load reports
  reports = await loadReports();
  if (reports.length === 0) {
    // seed some demo data if needed
  }

  // Render UI
  renderDashboard(reports);
  renderCharts(reports);
  updatePrediction(reports);
  updateStats(reports);

  // Listen to auth state
  auth.onAuthStateChanged(user => {
    authBtn.textContent = user ? 'Sign Out' : 'Sign In';
    authBtn.onclick = () => user ? auth.signOut() : auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
  });

  // Event listeners
  form.addEventListener('submit', onSubmit);
  document.getElementById('use-location-btn').addEventListener('click', useLocation);
  document.getElementById('voice-location-btn').addEventListener('click', voiceLocation);
  document.getElementById('toggle-heatmap').addEventListener('click', () => { isHeatmapOn = !isHeatmapOn; toggleHeatmap(isHeatmapOn); });
  document.getElementById('toggle-clustering').addEventListener('click', () => { isClusteringOn = !isClusteringOn; toggleClustering(isClusteringOn); });
  document.getElementById('reset-map').addEventListener('click', resetMapView);
  document.getElementById('clear-alerts').addEventListener('click', clearAlerts);
  document.getElementById('export-alerts').addEventListener('click', exportAlerts);
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
  document.getElementById('export-btn').addEventListener('click', exportData);
  document.getElementById('load-more').addEventListener('click', loadMoreHistory);
  document.getElementById('dashboard-filter').addEventListener('change', filterDashboard);
  document.getElementById('history-filter').addEventListener('change', filterHistory);
  document.getElementById('reset-btn').addEventListener('click', resetForm);

  // Drag & drop
  dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.style.borderColor = '#2b8c9e'; });
  dropZone.addEventListener('dragleave', () => { dropZone.style.borderColor = '#cbd5e1'; });
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = '#cbd5e1';
    const files = e.dataTransfer.files;
    if (files.length) handleFile(files[0]);
  });
  photoInput.addEventListener('change', (e) => {
    if (e.target.files.length) handleFile(e.target.files[0]);
  });
  removePreview.addEventListener('click', () => {
    previewContainer.style.display = 'none';
    photoInput.value = '';
  });

  // Initialize map (will be called when Google Maps loads)
  window.initMap = () => {
    mapInstance = initMap(document.getElementById('map'));
    // Add existing reports to map
    reports.forEach(r => addReportToMap(r, mapInstance));
    // Update map with real-time AQI markers if available
  };

  // Auto-refresh every 60 seconds
  setInterval(() => {
    if (reports.length) {
      updateDashboard(reports);
      updatePrediction(reports);
      updateStats(reports);
    }
  }, 60000);
}

// ===== HANDLE FILE (compress, preview) =====
function handleFile(file) {
  if (!file.type.startsWith('image/')) {
    showToast('Please upload an image file.', 'error');
    return;
  }
  // Preview
  const reader = new FileReader();
  reader.onload = (e) => {
    previewImg.src = e.target.result;
    previewContainer.style.display = 'block';
  };
  reader.readAsDataURL(file);
  // Store file globally for submit
  window._selectedFile = file;
}

// ===== SUBMIT FORM =====
async function onSubmit(e) {
  e.preventDefault();
  const file = window._selectedFile || photoInput.files[0];
  if (!file) return showToast('Please upload a photo.', 'error');
  const location = locationInput.value.trim();
  if (!location || !validateLocation(location)) return showToast('Please enter a valid location.', 'error');

  submitBtn.disabled = true;
  loadingDiv.style.display = 'block';
  resultDiv.style.display = 'none';

  try {
    // Compress image to reduce upload size
    const compressed = await compressImage(file, 800, 800, 0.8);
    const analysis = await analyzeImage(compressed, location);

    const report = {
      id: Date.now().toString(36),
      location,
      ...analysis,
      timestamp: new Date().toISOString(),
      userId: auth.currentUser?.uid || 'anonymous'
    };

    reports.push(report);
    await saveReport(report);
    addAlert(report);
    addReportToMap(report, mapInstance);
    renderDashboard(reports);
    updateCharts(reports);
    updatePrediction(reports);
    updateStats(reports);
    showToast('✅ Report submitted successfully!', 'success');

    resultDiv.style.display = 'block';
    resultDiv.innerHTML = `
      <strong>✅ Analysis Complete</strong><br>
      Type: ${report.type} · Severity: ${report.severity}/10 · AQI: ${report.estimatedAQI || 'N/A'}<br>
      Cause: ${report.primaryCause || 'Unknown'}<br>
      🏛️ Department: ${report.municipalDepartment || 'General'} · Priority: ${report.priority || 'Medium'}<br>
      Recommended Action: ${report.recommendedActions?.[0] || 'Inspection recommended'}
    `;
  } catch (err) {
    showToast(`Error: ${err.message}`, 'error');
    console.error(err);
  } finally {
    submitBtn.disabled = false;
    loadingDiv.style.display = 'none';
    resetForm();
  }
}

// ===== LOCATION =====
function useLocation() {
  if (!navigator.geolocation) return showToast('Geolocation not supported.', 'error');
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const { latitude, longitude } = pos.coords;
      // Reverse geocode using Nominatim
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
        const data = await res.json();
        locationInput.value = data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        // Also fetch AQI for this location
        const aqi = await fetchAQI(latitude, longitude);
        if (aqi) document.getElementById('avg-aqi').textContent = aqi;
      } catch {
        locationInput.value = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      }
    },
    () => showToast('Unable to get location.', 'error')
  );
}

function voiceLocation() {
  if (!('webkitSpeechRecognition' in window)) return showToast('Voice not supported.', 'error');
  const recognition = new webkitSpeechRecognition();
  recognition.lang = 'en-IN';
  recognition.start();
  recognition.onresult = (e) => {
    const transcript = e.results[0][0].transcript;
    locationInput.value = transcript;
  };
  recognition.onerror = () => showToast('Voice recognition failed.', 'error');
}

// ===== THEME =====
function toggleTheme() {
  const html = document.documentElement;
  const current = html.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  document.querySelector('.theme-icon').textContent = next === 'dark' ? '☀️' : '🌙';
  localStorage.setItem('theme', next);
}
// Load theme
if (localStorage.getItem('theme') === 'dark') toggleTheme();

// ===== UPDATE PREDICTION =====
async function updatePrediction(reports) {
  const weather = await fetchWeather(28.6139, 77.2090); // default Delhi
  const pred = predictAQI(reports, weather);
  document.getElementById('current-aqi').textContent = pred.current;
  document.getElementById('predicted-aqi').textContent = pred.predicted;
  const statusEl = document.getElementById('aqi-status');
  statusEl.textContent = pred.status;
  statusEl.className = `value ${pred.className || ''}`;
  document.getElementById('confidence').textContent = pred.confidence + '%';
  document.getElementById('sample-count').textContent = reports.length;
}

// ===== UPDATE STATS =====
function updateStats(reports) {
  const total = reports.length;
  const hotspots = reports.filter(r => r.severity >= 6).length;
  document.getElementById('total-reports').textContent = total;
  document.getElementById('active-hotspots').textContent = hotspots;
  const avg = total ? Math.round(reports.reduce((s, r) => s + (r.estimatedAQI || r.severity * 10), 0) / total) : '--';
  document.getElementById('avg-aqi').textContent = avg;
  // Coverage (unique locations)
  const unique = new Set(reports.map(r => r.location)).size;
  document.getElementById('coverage-area').textContent = unique + ' areas';
}

// ===== EXPORT =====
function exportData() {
  const data = JSON.stringify(reports, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cleanair_reports_${new Date().toISOString()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function loadMoreHistory() { /* implement pagination */ }
function filterDashboard() { /* re-render with filter */ }
function filterHistory() { /* filter history list */ }
function resetForm() {
  form.reset();
  previewContainer.style.display = 'none';
  window._selectedFile = null;
  resultDiv.style.display = 'none';
}

// Start
init();

// Expose map for Google Maps callback
window.initMap = () => {};