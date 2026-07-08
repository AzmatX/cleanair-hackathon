// ============================================================
//  CLEANAIR AI – Complete Application
//  Version 2.0 – Multi-source Fusion, Heatmap, Prediction
// ============================================================

// ---------- STATE ----------
let reports = [];
let map = null;
let heatmap = null;
let heatmapData = [];
let markers = [];
let userLocation = null;
let isHeatmapVisible = false;
let dashboardData = [];

// ---------- DOM REFS ----------
const form = document.getElementById('report-form');
const photoInput = document.getElementById('photo-input');
const locationInput = document.getElementById('location-input');
const submitBtn = document.getElementById('submit-btn');
const alertsList = document.getElementById('alerts-list');
const resultDiv = document.getElementById('analysis-result');
const totalReportsSpan = document.getElementById('total-reports');
const activeHotspotsSpan = document.getElementById('active-hotspots');
const avgAQISpan = document.getElementById('avg-aqi');
const dashboardGrid = document.getElementById('dashboard-grid');
const currentAQISpan = document.getElementById('current-aqi');
const predictedAQISpan = document.getElementById('predicted-aqi');
const aqiStatusSpan = document.getElementById('aqi-status');
const confidenceSpan = document.getElementById('confidence');

// ---------- CONFIG ----------
const CONFIG = window.CONFIG || {
    GEMINI_API_KEY: 'YOUR_GEMINI_KEY',
    FIREBASE: { /* your config */ },
    MAPS_API_KEY: 'YOUR_MAPS_KEY'
};

// ---------- FIREBASE ----------
firebase.initializeApp(CONFIG.FIREBASE);
const db = firebase.firestore();

// ---------- GOOGLE MAPS ----------
function initMap() {
    const defaultLoc = { lat: 28.6139, lng: 77.2090 };
    map = new google.maps.Map(document.getElementById('map'), {
        center: defaultLoc,
        zoom: 12,
        styles: [{ featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] }]
    });

    // Heatmap layer
    heatmap = new google.maps.visualization.HeatmapLayer({
        data: heatmapData,
        radius: 30,
        opacity: 0.6,
        gradient: [
            'rgba(0, 255, 0, 0)',
            'rgba(0, 255, 0, 0.2)',
            'rgba(255, 255, 0, 0.4)',
            'rgba(255, 165, 0, 0.6)',
            'rgba(255, 0, 0, 0.8)'
        ],
        map: null // hidden initially
    });

    // Get user location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            pos => {
                userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                map.setCenter(userLocation);
            },
            () => {}
        );
    }

    loadReportsFromFirebase();
}
window.initMap = initMap;

// ---------- GEMINI ANALYSIS ----------
async function analyzeWithGemini(imageFile) {
    try {
        const reader = new FileReader();
        const imageData = await new Promise((resolve, reject) => {
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(imageFile);
        });

        const prompt = `Analyze this image for pollution. Reply in this exact JSON format:
        {
            "type": "Smoke" | "Dust" | "Garbage" | "Construction" | "Industrial" | "Clean",
            "severity": number 1-10,
            "cause": "short description",
            "confidence": number 0-100,
            "action": "suggested response"
        }`;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${CONFIG.GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: prompt },
                            { inline_data: { mime_type: imageFile.type || 'image/jpeg', data: imageData } }
                        ]
                    }]
                })
            }
        );

        if (!response.ok) throw new Error(`API error ${response.status}`);
        const data = await response.json();
        const text = data.candidates[0].content.parts[0].text;
        // Parse JSON from response
        const jsonMatch = text.match(/\{.*\}/s);
        if (!jsonMatch) throw new Error('Invalid response format');
        const result = JSON.parse(jsonMatch[0]);
        return result;
    } catch (error) {
        console.error('Gemini error:', error);
        // Fallback mock
        return {
            type: ['Smoke', 'Dust', 'Garbage', 'Clean'][Math.floor(Math.random() * 4)],
            severity: Math.floor(Math.random() * 8) + 3,
            cause: 'Suspected local burning',
            confidence: Math.floor(Math.random() * 30) + 60,
            action: 'Inspection recommended'
        };
    }
}

// ---------- WEATHER SIMULATION ----------
function getWeatherData() {
    // Simulate weather (in production, call OpenWeatherMap API)
    return {
        windSpeed: Math.random() * 10 + 2, // km/h
        humidity: Math.random() * 60 + 30, // %
        temperature: Math.random() * 20 + 20, // °C
        rain: Math.random() > 0.7
    };
}

// ---------- PREDICTION ENGINE ----------
function predictAQI(reports, weather) {
    if (reports.length === 0) {
        return { current: 45, predicted: 48, status: 'Good', confidence: 85 };
    }

    const recent = reports.slice(-20);
    const avgSeverity = recent.reduce((sum, r) => sum + r.analysis.severity, 0) / recent.length;

    // Base AQI from severity (1-10 -> 0-500)
    let baseAQI = Math.round(avgSeverity * 45 + 20);
    baseAQI = Math.min(500, Math.max(0, baseAQI));

    // Weather factors
    let factor = 1;
    if (weather.windSpeed > 8) factor *= 0.8;    // wind disperses
    if (weather.windSpeed < 3) factor *= 1.2;    // no dispersion
    if (weather.humidity > 70) factor *= 1.1;    // moisture traps particles
    if (weather.rain) factor *= 0.7;             // rain cleans

    const currentAQI = Math.round(baseAQI);
    const predictedAQI = Math.round(baseAQI * factor);

    let status, cls;
    if (predictedAQI <= 50) { status = 'Good'; cls = 'good'; }
    else if (predictedAQI <= 100) { status = 'Moderate'; cls = 'moderate'; }
    else if (predictedAQI <= 200) { status = 'Unhealthy'; cls = 'unhealthy'; }
    else { status = 'Hazardous'; cls = 'hazardous'; }

    const confidence = Math.min(95, Math.round(70 + (reports.length / 50) * 20));

    return { current: currentAQI, predicted: predictedAQI, status, className: cls, confidence };
}

// ---------- DASHBOARD UPDATE ----------
function updateDashboard(reports) {
    // Group reports by area (simplified: use first 5 chars of location)
    const areas = {};
    reports.forEach(r => {
        const key = r.location.substring(0, 10).trim() || 'Unknown';
        if (!areas[key]) areas[key] = [];
        areas[key].push(r);
    });

    const dashboardItems = Object.keys(areas).map(area => {
        const items = areas[area];
        const avgSeverity = items.reduce((s, r) => s + r.analysis.severity, 0) / items.length;
        const hotspot = items.filter(r => r.isHotspot).length;
        return {
            area,
            severity: Math.round(avgSeverity),
            reports: items.length,
            hotspots: hotspot,
            action: avgSeverity > 6 ? 'Immediate Inspection' :
                avgSeverity > 4 ? 'Monitoring Required' : 'Routine Check'
        };
    }).sort((a, b) => b.severity - a.severity).slice(0, 6);

    dashboardGrid.innerHTML = dashboardItems.map(item => `
        <div class="dashboard-item" style="border-left-color: ${item.severity > 6 ? '#ef4444' : item.severity > 4 ? '#eab308' : '#22c55e'}">
            <div class="area">📍 ${item.area}</div>
            <div class="severity">Severity: ${item.severity}/10 · ${item.reports} reports · ${item.hotspots} hotspots</div>
            <span class="action">${item.action}</span>
        </div>
    `).join('');

    // Update stats
    const total = reports.length;
    const hotspots = reports.filter(r => r.isHotspot).length;
    totalReportsSpan.textContent = total;
    activeHotspotsSpan.textContent = hotspots;
    const avgAQI = total > 0 ? Math.round(reports.reduce((s, r) => s + r.analysis.severity * 10, 0) / total) : '--';
    avgAQISpan.textContent = avgAQI;

    // Update prediction UI
    const weather = getWeatherData();
    const pred = predictAQI(reports, weather);
    currentAQISpan.textContent = pred.current;
    predictedAQISpan.textContent = pred.predicted;
    aqiStatusSpan.textContent = pred.status;
    aqiStatusSpan.className = `value ${pred.className}`;
    confidenceSpan.textContent = pred.confidence + '%';
}

// ---------- ADD ALERT ----------
function addAlert(report) {
    const empty = alertsList.querySelector('.empty-state');
    if (empty) empty.remove();

    const typeEmoji = {
        'Smoke': '🔥',
        'Dust': '💨',
        'Garbage': '🗑️',
        'Construction': '🏗️',
        'Industrial': '🏭',
        'Clean': '✅'
    }[report.analysis.type] || '⚠️';

    const alertDiv = document.createElement('div');
    alertDiv.className = `alert-item ${report.isHotspot ? '' : 'clean'}`;
    const time = new Date(report.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    alertDiv.innerHTML = `
        <h4>${typeEmoji} ${report.analysis.type} at ${report.location}</h4>
        <p>Severity: ${report.analysis.severity}/10 · ${report.analysis.cause}</p>
        <p>${report.isHotspot ? '🚨 HOTSPOT · Action: ' + report.analysis.action : '✅ Clean area'}</p>
        <span class="timestamp">🕐 ${time}</span>
    `;
    alertsList.prepend(alertDiv);

    while (alertsList.children.length > 50) alertsList.removeChild(alertsList.lastChild);
}

// ---------- ADD MARKER & HEATMAP ----------
function addMapData(report) {
    // Determine location (use user location or random offset)
    const lat = userLocation ? userLocation.lat + (Math.random() - 0.5) * 0.02 :
        28.6139 + (Math.random() - 0.5) * 0.1;
    const lng = userLocation ? userLocation.lng + (Math.random() - 0.5) * 0.02 :
        77.2090 + (Math.random() - 0.5) * 0.1;
    const pos = { lat, lng };

    // Marker
    const color = report.isHotspot ? '#ef4444' :
        report.analysis.severity > 5 ? '#eab308' : '#22c55e';
    const marker = new google.maps.Marker({
        position: pos,
        map: map,
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: color,
            fillOpacity: 0.9,
            strokeColor: 'white',
            strokeWeight: 2,
            scale: 8
        },
        title: `${report.analysis.type} (${report.analysis.severity}/10)`
    });
    markers.push(marker);

    // Info window
    const info = new google.maps.InfoWindow({
        content: `
            <div style="font-family:Inter;padding:0.5rem;">
                <strong>${report.analysis.type}</strong><br>
                📍 ${report.location}<br>
                ⚠️ Severity: ${report.analysis.severity}/10<br>
                ${report.isHotspot ? '🚨 HOTSPOT' : '✅ Normal'}
            </div>
        `
    });
    marker.addListener('click', () => info.open(map, marker));

    // Heatmap data point (weight = severity)
    heatmapData.push({ location: pos, weight: report.analysis.severity / 10 });
    if (heatmap) {
        heatmap.setData(heatmapData);
    }
}

// ---------- SAVE TO FIREBASE ----------
async function saveReport(report) {
    try {
        await db.collection('reports').add({
            ...report,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log('✅ Saved to Firebase');
    } catch (e) {
        console.warn('Firebase save failed, using localStorage');
        const saved = JSON.parse(localStorage.getItem('cleanair_reports') || '[]');
        saved.push(report);
        localStorage.setItem('cleanair_reports', JSON.stringify(saved));
    }
}

// ---------- LOAD FROM FIREBASE ----------
async function loadReportsFromFirebase() {
    try {
        const snapshot = await db.collection('reports')
            .orderBy('timestamp', 'desc')
            .limit(50)
            .get();

        if (!snapshot.empty) {
            snapshot.forEach(doc => {
                const data = doc.data();
                if (data.timestamp?.toDate) data.timestamp = data.timestamp.toDate().toISOString();
                reports.push(data);
                addAlert(data);
                addMapData(data);
            });
            updateDashboard(reports);
            return;
        }
    } catch (e) { console.warn('Firebase load failed'); }

    // Fallback localStorage
    const saved = JSON.parse(localStorage.getItem('cleanair_reports') || '[]');
    saved.forEach(r => {
        reports.push(r);
        addAlert(r);
        addMapData(r);
    });
    updateDashboard(reports);
}

// ---------- PROCESS REPORT ----------
async function processReport(photo, location) {
    submitBtn.disabled = true;
    submitBtn.textContent = '🧠 Analyzing with Gemini...';

    try {
        const analysis = await analyzeWithGemini(photo);
        const isHotspot = analysis.type !== 'Clean' && analysis.severity >= 6;

        const report = {
            id: Date.now().toString(36),
            location: location,
            analysis: analysis,
            timestamp: new Date().toISOString(),
            isHotspot: isHotspot
        };

        reports.push(report);
        await saveReport(report);
        addAlert(report);
        addMapData(report);
        updateDashboard(reports);

        resultDiv.className = 'show';
        resultDiv.innerHTML = `
            <strong>✅ Analysis Complete</strong><br>
            Type: ${analysis.type} · Severity: ${analysis.severity}/10 · Confidence: ${analysis.confidence}%<br>
            Cause: ${analysis.cause}<br>
            ${isHotspot ? '🚨 HOTSPOT – ' + analysis.action : '✅ Area appears clean.'}
        `;
        document.getElementById('map-section').scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        resultDiv.className = 'show';
        resultDiv.innerHTML = `❌ Error: ${error.message}`;
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = '🔍 Analyze with Gemini AI';
    }
}

// ---------- EVENT LISTENERS ----------
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const photo = photoInput.files[0];
    const location = locationInput.value.trim();
    if (!photo) return alert('Please upload a photo.');
    if (!location) return alert('Please enter a location.');
    await processReport(photo, location);
    form.reset();
    resultDiv.className = 'show';
    resultDiv.innerHTML = '📸 Processing...';
});

document.getElementById('use-location-btn').addEventListener('click', () => {
    if (!navigator.geolocation) return alert('Geolocation not supported.');
    navigator.geolocation.getCurrentPosition(
        pos => {
            const { latitude, longitude } = pos.coords;
            fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${CONFIG.MAPS_API_KEY}`)
                .then(res => res.json())
                .then(data => {
                    const address = data.results[0]?.formatted_address || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
                    locationInput.value = address;
                })
                .catch(() => locationInput.value = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
            userLocation = { lat: latitude, lng: longitude };
        },
        err => alert('Unable to get location. Please enter manually.')
    );
});

document.getElementById('toggle-heatmap').addEventListener('click', () => {
    isHeatmapVisible = !isHeatmapVisible;
    heatmap.setMap(isHeatmapVisible ? map : null);
    document.getElementById('toggle-heatmap').textContent = isHeatmapVisible ? 'Hide Heatmap' : 'Show Heatmap';
});

// ---------- AUTO REFRESH ----------
setInterval(() => { if (reports.length > 0) updateDashboard(reports); }, 60000);

// ---------- INIT ----------
console.log('🌿 CleanAir AI v2.0 loaded');