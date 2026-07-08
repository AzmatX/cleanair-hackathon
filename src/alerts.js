// src/alerts.js
let alerts = [];

export function addAlert(report) {
  const list = document.getElementById('alerts-list');
  const empty = list.querySelector('.empty-state');
  if (empty) empty.remove();

  const typeEmoji = { Smoke:'🔥', Dust:'💨', Garbage:'🗑️', Construction:'🏗️', Industrial:'🏭', Clean:'✅' }[report.type] || '⚠️';
  const div = document.createElement('div');
  div.className = `alert-item ${report.severity >= 7 ? '' : report.severity >= 4 ? 'moderate' : 'clean'}`;
  const time = new Date(report.timestamp).toLocaleTimeString();
  div.innerHTML = `
    <h4>${typeEmoji} ${report.type} at ${report.location}</h4>
    <p>Severity: ${report.severity}/10 · ${report.primaryCause || ''}</p>
    <p>${report.needsImmediateInspection ? '🚨 HOTSPOT – ' + (report.recommendedActions?.[0] || 'Inspect') : '✅ Routine'}</p>
    <span class="timestamp">🕐 ${time}</span>
  `;
  list.prepend(div);
  document.getElementById('alert-count').textContent = document.querySelectorAll('.alert-item').length;
}

export function clearAlerts() {
  document.getElementById('alerts-list').innerHTML = '<p class="empty-state">No alerts.</p>';
  document.getElementById('alert-count').textContent = '0';
}

export function exportAlerts() {
  // Export alerts as text
  const items = document.querySelectorAll('.alert-item');
  let text = 'CleanAir AI Alerts\n';
  items.forEach(el => text += el.textContent.trim() + '\n');
  const blob = new Blob([text], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `alerts_${new Date().toISOString()}.txt`;
  a.click();
}