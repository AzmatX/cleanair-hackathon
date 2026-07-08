# 🌿 CleanAir AI – Hyperlocal Pollution Intelligence Platform

> **AI‑powered citizen reporting and municipal decision support**  
> Built for **Google Build with AI: Code for Communities 2026** – Track 2: Clean Air & Clean Streets

---

## 🚀 Overview

CleanAir AI transforms every citizen into an environmental sensor.  
It combines **Gemini Vision** (image analysis), **Google Maps** (hotspot visualization), **real‑time weather & AQI APIs**, and a **municipal dashboard** to help cities detect, prioritise, and resolve pollution incidents faster.

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| 📸 **AI Image Analysis** | Gemini Vision analyses photos to detect pollution type, severity, estimated AQI, PM2.5, PM10, and recommended actions. |
| 🗺️ **Live Map** | Markers, heatmap, clustering, and polygons to visualise pollution hotspots. |
| 📊 **Municipal Dashboard** | Ward‑wise ranking, severity scores, and action recommendations (Inspect / Monitor / Routine). |
| 📈 **24‑Hour Forecast** | Predicts AQI trends using weather (wind, humidity, rain) and historical reports. |
| 🚨 **Real‑time Alerts** | Instant notifications with severity and location. |
| 🔐 **Authentication** | Firebase Auth – sign in with Google to save reports across devices. |
| 📱 **PWA** | Install as a native app with offline support. |
| 🌙 **Dark / Light Theme** | System‑aware and toggleable. |
| 🎤 **Voice Input** | Use speech to enter location. |
| 📤 **Export** | Download reports as JSON or alerts as text. |

---

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3 (Glassmorphism), ES2023 Modules
- **AI**: Google Gemini Pro Vision (structured JSON output)
- **Maps**: Google Maps JavaScript API + MarkerClusterer + Heatmap
- **Data**: Open‑Meteo (weather), OpenAQ (AQI), Nominatim (geocoding)
- **Backend**: Firebase (Firestore, Auth, Storage, Hosting)
- **Charts**: Chart.js
- **PWA**: Service Worker + Manifest

---

## 🧠 Advanced AI Prompt

The Gemini prompt returns **30+ actionable fields** including:

- `estimatedAQI`, `estimatedPM2_5`, `estimatedPM10`
- `municipalDepartment`, `priority`, `recommendedActions`
- `needsImmediateInspection`, `estimatedCleanupCost`, `estimatedResolutionTime`

---

## 📁 Project Structure (Modular)
