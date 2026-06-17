/**
 * geminiService.js — Stream A natural-language parser via the Gemini API.
 *
 * Uses the gemini-2.0-flash model (current free-tier model as of 2025-Q4).
 * If the call fails for any reason (no key, offline, quota), the service
 * throws an Error so the caller can route to geminiFallbackParser.js.
 *
 * Returns: { category, subType, quantity, unit, confidence, rawText }
 * where category is one of the 7 valid ActivityEvent categories.
 */

const MODEL    = 'gemini-2.0-flash';
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

const SYSTEM_PROMPT = `You are a carbon-accounting assistant. Parse the user's activity description into structured JSON.

Return ONLY a single valid JSON object with these exact fields:
{
  "category": string,   // one of: Fossil, Fugitive, Electricity, Water, Waste, Travel, Offset
  "subType":  string,   // specific sub-type, e.g. "Petrol_Car", "LPG_Cooking", "Indian_Grid"
  "quantity": number,   // numeric amount
  "unit":     string,   // unit of measure, e.g. "km", "kWh", "kg", "litres"
  "confidence": number  // 0.0 to 1.0, your confidence in this parse
}

Rules:
- category MUST be one of the 7 listed values — never invent one.
- subType should match the relevant emission-factor key where possible (snake_case).
- If uncertain about any field, lower the confidence score.
- Do NOT include markdown, code fences, or any text outside the JSON object.`;

/**
 * Parse free text into a structured ActivityEvent using Gemini.
 * @param {string} text   — the user's raw input
 * @param {string} apiKey — VITE_GEMINI_API_KEY
 * @returns {Promise<{category, subType, quantity, unit, confidence, rawText}>}
 * @throws {Error} if the API call fails or returns malformed JSON
 */
export async function parseWithGemini(text, apiKey) {
  if (!apiKey) {
    throw new Error('No Gemini API key configured.');
  }

  const url      = `${BASE_URL}/${MODEL}:generateContent?key=${apiKey}`;
  const payload  = {
    contents: [
      { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
      { role: 'model', parts: [{ text: '{}' }] }, // Prime the model to output JSON
      { role: 'user', parts: [{ text }] },
    ],
    generationConfig: {
      temperature:     0.1,   // Low temperature for deterministic structured output
      maxOutputTokens: 256,
    },
  };

  let response;
  try {
    response = await fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
  } catch (networkErr) {
    throw new Error(`Network error reaching Gemini: ${networkErr.message}`);
  }

  if (!response.ok) {
    const errBody = await response.text().catch(() => '');
    throw new Error(`Gemini API error ${response.status}: ${errBody}`);
  }

  const data = await response.json();
  const rawContent = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  // Strip accidental markdown fences if present
  const cleaned = rawContent.replace(/```json|```/g, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`Gemini returned non-JSON output: ${rawContent}`);
  }

  const VALID_CATEGORIES = ['Fossil', 'Fugitive', 'Electricity', 'Water', 'Waste', 'Travel', 'Offset'];
  if (!VALID_CATEGORIES.includes(parsed.category)) {
    throw new Error(`Gemini returned unknown category: "${parsed.category}"`);
  }

  return {
    category:   parsed.category,
    subType:    parsed.subType   || 'Unknown',
    quantity:   Number(parsed.quantity) || 0,
    unit:       parsed.unit      || '',
    confidence: Math.min(1, Math.max(0, Number(parsed.confidence) || 0.5)),
    rawText:    text,
  };
}
