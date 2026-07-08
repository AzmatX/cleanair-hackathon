// src/charts.js
import Chart from 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';

let aqiChart, severityChart, forecastChart;

export function renderCharts(reports) {
  // AQI Trend (last 10 reports)
  const labels = reports.slice(-10).map(r => new Date(r.timestamp).toLocaleDateString());
  const aqiData = reports.slice(-10).map(r => r.estimatedAQI || r.severity * 10 || 50);

  const ctxAqi = document.getElementById('aqiTrendChart').getContext('2d');
  if (aqiChart) aqiChart.destroy();
  aqiChart = new Chart(ctxAqi, {
    type: 'line',
    data: {
      labels,
      datasets: [{ label: 'AQI Trend', data: aqiData, borderColor: '#2b8c9e', tension: 0.3 }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });

  // Severity Distribution
  const severityCounts = [0,0,0,0,0,0,0,0,0,0];
  reports.forEach(r => { if (r.severity) severityCounts[r.severity-1]++; });
  const ctxSev = document.getElementById('severityChart').getContext('2d');
  if (severityChart) severityChart.destroy();
  severityChart = new Chart(ctxSev, {
    type: 'bar',
    data: {
      labels: ['1','2','3','4','5','6','7','8','9','10'],
      datasets: [{ label: 'Severity Count', data: severityCounts, backgroundColor: '#ef4444' }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });

  // Forecast chart (placeholder)
  const ctxForecast = document.getElementById('forecastChart').getContext('2d');
  if (forecastChart) forecastChart.destroy();
  forecastChart = new Chart(ctxForecast, {
    type: 'line',
    data: {
      labels: ['Now', '+6h', '+12h', '+18h', '+24h'],
      datasets: [{ label: 'Predicted AQI', data: [50, 55, 60, 58, 53], borderColor: '#eab308', tension: 0.3 }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });
}

export function updateCharts(reports) {
  renderCharts(reports);
}