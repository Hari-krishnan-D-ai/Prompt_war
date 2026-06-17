/**
 * geminiFallbackParser.js — Local keyword/regex activity parser.
 *
 * Used when:
 *   - The user has no Gemini API key configured
 *   - The user is offline
 *   - The Gemini API call fails or exceeds quota
 *   - The user has disabled AI parsing via the privacy toggle
 *
 * Returns the same shape as geminiService.parseWithGemini so callers
 * never need to handle two different return types.
 * Confidence is capped at 0.55 — always lower than a successful Gemini parse.
 *
 * No network calls, no side effects — pure keyword/regex matching.
 */

/* ─── Keyword maps ────────────────────────────────────────────────────────── */

const RULES = [
  // ── Travel ──────────────────────────────────────────────────────────────
  {
    category: 'Travel',
    subType:  'Petrol_Car',
    unit:     'km',
    patterns: [/petrol\s*car/i, /drove.*(petrol|gasoline)/i, /car\s*(journey|trip|ride)/i],
    quantity: /(\d+[\d.,]*)\s*(km|kilometer|kilometre|mile)/i,
  },
  {
    category: 'Travel',
    subType:  'Diesel_Car',
    unit:     'km',
    patterns: [/diesel\s*car/i, /drove.*diesel/i],
    quantity: /(\d+[\d.,]*)\s*(km|kilometer|kilometre)/i,
  },
  {
    category: 'Travel',
    subType:  'Two_Wheeler',
    unit:     'km',
    patterns: [/bike|motorcycle|scooter|two.?wheel/i],
    quantity: /(\d+[\d.,]*)\s*(km|kilometer|kilometre)/i,
  },
  {
    category: 'Travel',
    subType:  'Public_Bus',
    unit:     'km',
    patterns: [/bus|public\s*transport/i],
    quantity: /(\d+[\d.,]*)\s*(km|kilometer|kilometre)/i,
  },
  {
    category: 'Travel',
    subType:  'Electric_Vehicle',
    unit:     'km',
    patterns: [/electric\s*(car|vehicle|ev)\b/i],
    quantity: /(\d+[\d.,]*)\s*(km|kilometer|kilometre)/i,
  },
  {
    category: 'Travel',
    subType:  'Domestic_Flight',
    unit:     'km',
    patterns: [/flight|flew|airplane|domestic\s*flight/i],
    quantity: /(\d+[\d.,]*)\s*(km|kilometer|kilometre|mile)/i,
  },

  // ── Electricity ──────────────────────────────────────────────────────────
  {
    category: 'Electricity',
    subType:  'Indian_Grid',
    unit:     'kWh',
    patterns: [/electri|power|grid|kwh|unit.*electricity|plug/i, /ac.*hour|air.?condit.*hour/i],
    quantity: /(\d+[\d.,]*)\s*(kwh|kw.?h|unit|hour)/i,
  },

  // ── Fossil ───────────────────────────────────────────────────────────────
  {
    category: 'Fossil',
    subType:  'LPG_Cooking',
    unit:     'kg',
    patterns: [/lpg|cooking\s*gas|cylinder|gas\s*cook|stove/i],
    quantity: /(\d+[\d.,]*)\s*(kg|kilogram|cylinder)/i,
  },
  {
    category: 'Fossil',
    subType:  'Petrol',
    unit:     'litres',
    patterns: [/petrol|gasoline|filled.*fuel|fuel.*up/i],
    quantity: /(\d+[\d.,]*)\s*(litre|liter|l\b)/i,
  },
  {
    category: 'Fossil',
    subType:  'Diesel',
    unit:     'litres',
    patterns: [/diesel\s*(fill|pump|litre)/i],
    quantity: /(\d+[\d.,]*)\s*(litre|liter|l\b)/i,
  },

  // ── Waste ────────────────────────────────────────────────────────────────
  {
    category: 'Waste',
    subType:  'Landfill',
    unit:     'kg',
    patterns: [/threw?\s*out|garbage|trash|landfill|rubbish|waste/i],
    quantity: /(\d+[\d.,]*)\s*(kg|kilogram|bag)/i,
  },

  // ── Water ────────────────────────────────────────────────────────────────
  {
    category: 'Water',
    subType:  'Municipal_Supply',
    unit:     'litres',
    patterns: [/water\s*(use|usage|consumed|consumption)/i, /litre.*water|water.*litre/i],
    quantity: /(\d+[\d.,]*)\s*(litre|liter|l\b)/i,
  },

  // ── Fugitive ─────────────────────────────────────────────────────────────
  {
    category: 'Fugitive',
    subType:  'AC_Refrigerant_Leak',
    unit:     'kg',
    patterns: [/refrigerant|ac\s*leak|air.?condit.*refill|r-22|r-32|hfc/i],
    quantity: /(\d+[\d.,]*)\s*(kg|kilogram)/i,
  },

  // ── Offset ───────────────────────────────────────────────────────────────
  {
    category: 'Offset',
    subType:  'Tree_Planting',
    unit:     'trees',
    patterns: [/plant.*tree|tree.*plant|sapling|offset.*tree/i],
    quantity: /(\d+)\s*(tree|sapling)/i,
  },
];

/**
 * Extract a numeric quantity from text using a regex pattern.
 * Handles commas as thousand separators (e.g. "1,500 km").
 */
function extractQuantity(text, pattern) {
  const m = text.match(pattern);
  if (!m) return 0;
  return parseFloat(m[1].replace(/,/g, '')) || 0;
}

/**
 * Parse a free-text activity description using local rules.
 * @param {string} text
 * @returns {{ category, subType, quantity, unit, confidence, rawText }}
 */
export function parseWithFallback(text) {
  const normalised = text.trim();

  for (const rule of RULES) {
    const matchesCategory = rule.patterns.some((p) => p.test(normalised));
    if (!matchesCategory) continue;

    const quantity   = extractQuantity(normalised, rule.quantity);
    const confidence = quantity > 0 ? 0.55 : 0.3; // lower confidence without a quantity

    return {
      category:   rule.category,
      subType:    rule.subType,
      quantity,
      unit:       rule.unit,
      confidence,
      rawText:    normalised,
    };
  }

  // Nothing matched — return a low-confidence skeleton for the user to correct
  return {
    category:   'Fossil',
    subType:    'Unknown',
    quantity:   0,
    unit:       '',
    confidence: 0.1,
    rawText:    normalised,
  };
}
