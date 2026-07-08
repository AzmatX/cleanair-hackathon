// src/weather.js
import { CONFIG } from './config.js';

export async function fetchWeather(lat, lon) {
  try {
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relativehumidity_2m&timezone=auto`);
    const data = await res.json();
    return {
      windSpeed: data.current_weather.windspeed || 0,
      humidity: data.hourly?.relativehumidity_2m?.[0] || 50,
      temperature: data.current_weather.temperature || 25,
      rain: data.current_weather.weathercode === 61 || false
    };
  } catch {
    return { windSpeed: 5, humidity: 60, temperature: 28, rain: false };
  }
}

export async function fetchAQI(lat, lon) {
  try {
    // Using OpenAQ – free, no key required for basic
    const res = await fetch(`https://api.openaq.org/v2/latest?coordinates=${lat},${lon}&limit=1`);
    const data = await res.json();
    if (data.results && data.results.length) {
      const param = data.results[0].measurements.find(m => m.parameter === 'pm25');
      if (param) return Math.round(param.value);
    }
    return null;
  } catch {
    return null;
  }
}