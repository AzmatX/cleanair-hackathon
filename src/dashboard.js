// src/dashboard.js
export function renderDashboard(reports, filter = 'all') {
  const grid = document.getElementById('dashboard-grid');
  // Group by area (first 10 chars)
  const areas = {};
  reports.forEach(r => {
    const key = r.location.substring(0, 10).trim() || 'Unknown';
    if (!areas[key]) areas[key] = [];
    areas[key].push(r);
  });

  let items = Object.entries(areas).map(([area, list]) => {
    const avgSev = list.reduce((s, r) => s + (r.severity || 0), 0) / list.length;
    const hotspotCount = list.filter(r => r.severity >= 6).length;
    return { area, avgSev, count: list.length, hotspots: hotspotCount };
  });

  if (filter === 'hotspot') items = items.filter(i => i.hotspots > 0);
  else if (filter === 'critical') items = items.filter(i => i.avgSev >= 7);

  items.sort((a, b) => b.avgSev - a.avgSev);

  grid.innerHTML = items.slice(0, 6).map(item => `
    <div class="dashboard-item" style="border-left-color: ${item.avgSev > 6 ? '#ef4444' : item.avgSev > 4 ? '#eab308' : '#22c55e'}">
      <div class="area">📍 ${item.area}</div>
      <div class="severity">Severity: ${item.avgSev.toFixed(1)}/10 · ${item.count} reports · ${item.hotspots} hotspots</div>
      <span class="action">${item.avgSev > 6 ? '🚨 Immediate Inspection' : item.avgSev > 4 ? '⚠️ Monitoring Required' : '✅ Routine Check'}</span>
    </div>
  `).join('') || '<p class="empty-state">No areas with reports.</p>';
}