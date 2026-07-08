// src/map.js
import { CONFIG } from './config.js';

let map, heatmap, clusterer, markers = [];

export function initMap(container) {
  const defaultLoc = { lat: 28.6139, lng: 77.2090 };
  map = new google.maps.Map(container, {
    center: defaultLoc,
    zoom: 12,
    styles: [{ featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] }],
    mapTypeControl: true,
    streetViewControl: true,
  });
  heatmap = new google.maps.visualization.HeatmapLayer({
    data: [],
    radius: 30,
    opacity: 0.6,
    gradient: ['rgba(0,255,0,0)', 'rgba(0,255,0,0.2)', 'rgba(255,255,0,0.4)', 'rgba(255,165,0,0.6)', 'rgba(255,0,0,0.8)'],
    map: null
  });
  clusterer = new MarkerClusterer({ map, markers: [] });
  return map;
}

export function addReportToMap(report, mapInstance) {
  const lat = report.lat || (28.6139 + (Math.random() - 0.5) * 0.1);
  const lng = report.lng || (77.2090 + (Math.random() - 0.5) * 0.1);
  const pos = { lat, lng };
  const color = report.severity >= 7 ? '#ef4444' : report.severity >= 4 ? '#eab308' : '#22c55e';
  const marker = new google.maps.Marker({
    position: pos,
    map: mapInstance,
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: color,
      fillOpacity: 0.9,
      strokeColor: 'white',
      strokeWeight: 2,
      scale: 8
    },
    title: `${report.type} (${report.severity}/10)`
  });
  markers.push(marker);
  // Info window
  const info = new google.maps.InfoWindow({
    content: `<div><strong>${report.type}</strong><br>📍 ${report.location}<br>⚠️ Severity: ${report.severity}/10<br>AQI: ${report.estimatedAQI || 'N/A'}</div>`
  });
  marker.addListener('click', () => info.open(map, marker));

  // Add to heatmap data
  heatmap.getData().push({ location: pos, weight: report.severity / 10 });
  heatmap.setData(heatmap.getData());

  // Update clusterer
  clusterer.addMarker(marker);
}

export function toggleHeatmap(show) {
  heatmap.setMap(show ? map : null);
}

export function toggleClustering(show) {
  clusterer.setMap(show ? map : null);
  if (!show) {
    markers.forEach(m => m.setMap(map));
  } else {
    markers.forEach(m => m.setMap(null));
    clusterer.addMarkers(markers);
  }
}

export function resetMapView() {
  map.setCenter({ lat: 28.6139, lng: 77.2090 });
  map.setZoom(12);
}