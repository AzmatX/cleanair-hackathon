// src/prediction.js
export function predictAQI(reports, weather) {
  if (reports.length === 0) {
    return { current: 45, predicted: 48, status: 'Good', className: 'good', confidence: 85 };
  }
  const recent = reports.slice(-30);
  const avgSev = recent.reduce((s, r) => s + (r.severity || 5), 0) / recent.length;
  let baseAQI = Math.round(avgSev * 40 + 20);
  baseAQI = Math.min(500, Math.max(0, baseAQI));

  // Weather factor
  let factor = 1;
  if (weather.windSpeed > 8) factor *= 0.8;
  if (weather.windSpeed < 3) factor *= 1.2;
  if (weather.humidity > 70) factor *= 1.1;
  if (weather.rain) factor *= 0.7;

  const current = Math.round(baseAQI);
  const predicted = Math.round(baseAQI * factor);

  let status, cls;
  if (predicted <= 50) { status = 'Good'; cls = 'good'; }
  else if (predicted <= 100) { status = 'Moderate'; cls = 'moderate'; }
  else if (predicted <= 200) { status = 'Unhealthy'; cls = 'unhealthy'; }
  else { status = 'Hazardous'; cls = 'hazardous'; }

  const confidence = Math.min(95, Math.round(70 + (reports.length / 50) * 20));
  return { current, predicted, status, className: cls, confidence };
}