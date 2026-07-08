// src/ai.js
import { CONFIG } from './config.js';

export async function analyzeImage(imageFile, location) {
  const base64 = await fileToBase64(imageFile);
  const prompt = `
You are an Environmental AI Assistant for municipal governments.
Analyze the uploaded image like an environmental inspector.

Return ONLY valid JSON with these fields:
{
  "type": "Smoke|Dust|Garbage|Construction|Industrial|VehicleEmission|OpenBurning|WaterPollution|Clean",
  "subcategory": "string (more specific)",
  "severity": 1-10,
  "confidence": 0-100,
  "estimatedAQI": 0-500,
  "estimatedPM2_5": "string (e.g., '80 µg/m³')",
  "estimatedPM10": "string",
  "pollutionSource": "string",
  "primaryCause": "string",
  "secondaryCause": "string",
  "affectedArea": "string (e.g., '500 m²')",
  "humanHealthRisk": "string",
  "environmentRisk": "string",
  "municipalDepartment": "string (e.g., 'Public Works', 'Environment', 'Health')",
  "priority": "Critical|High|Medium|Low",
  "recommendedActions": ["action1", "action2", "action3"],
  "citizenAdvice": "string",
  "isConstructionWaste": boolean,
  "isGarbage": boolean,
  "isIndustrial": boolean,
  "isSmoke": boolean,
  "isVehicleEmission": boolean,
  "isOpenBurning": boolean,
  "isDust": boolean,
  "isWaterPollution": boolean,
  "isIllegalDumping": boolean,
  "needsImmediateInspection": boolean,
  "estimatedCleanupCost": "string (e.g., '$500')",
  "estimatedResolutionTime": "string (e.g., '2 days')",
  "explanation": "string (brief reasoning)",
  "summary": "string (one sentence)"
}
  `;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${CONFIG.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: prompt },
          { inline_data: { mime_type: imageFile.type || 'image/jpeg', data: base64 } }
        ]
      }]
    })
  });

  if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);
  const data = await response.json();
  const text = data.candidates[0].content.parts[0].text;
  const jsonMatch = text.match(/\{.*\}/s);
  if (!jsonMatch) throw new Error('Invalid response format');
  const result = JSON.parse(jsonMatch[0]);
  // Add location
  result.location = location;
  return result;
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}