import { validateActivityEvent } from './validators.js';
import { getGwpConstants } from './gwpConstants.js';

/**
 * Calculates CO2-e for a normalized ActivityEvent.
 * This is a pure function. It relies purely on injected data to ensure strict auditability.
 * 
 * Core Equation: Activity Data x Emission Factor x GWP = Total GHG Emissions
 * 
 * @param {Object} activityEvent - The validated row from Stream A, B, or C.
 * @param {Object} emissionDataJSON - The loaded dataset from src/data/
 * @returns {Object} The complete ledger row with calculated GHG weights and total CO2-e
 */
export function calculateEmissions(activityEvent, emissionDataJSON) {
  // 1. Validate the input shape
  validateActivityEvent(activityEvent);

  // 2. Extract constants securely
  const GWP = getGwpConstants(emissionDataJSON);
  const Factors = emissionDataJSON.Factors;

  const { category, subType, amount, timestamp } = activityEvent;

  // 3. Offset Math is routed elsewhere per constraints
  if (category === 'Offset') {
    throw new Error("Offset calculations must be routed to sequestrationMath.js.");
  }

  // 4. Ensure the specific factor exists in the provided JSON
  const categoryFactors = Factors[category];
  if (!categoryFactors || !categoryFactors[subType]) {
    throw new Error(`Missing emission factor in provided data for: ${category} -> ${subType}`);
  }

  const factorRecord = categoryFactors[subType];
  const baselineEmissions = amount * factorRecord.factor;

  // 5. Calculate specific gas weights based on allocation percentages
  const gasWeights = {
    CO2: baselineEmissions * (factorRecord.gasAllocation.CO2 || 0),
    CH4: baselineEmissions * (factorRecord.gasAllocation.CH4 || 0),
    N2O: baselineEmissions * (factorRecord.gasAllocation.N2O || 0),
    HFC: baselineEmissions * (factorRecord.gasAllocation.HFC || 0)
  };

  // 6. Apply 100-year GWP normalization to get final CO2-equivalent
  const totalCO2e = 
    (gasWeights.CO2 * GWP.CO2) +
    (gasWeights.CH4 * GWP.CH4) +
    (gasWeights.N2O * GWP.N2O) +
    (gasWeights.HFC * GWP.HFC);

  // 7. Return the immutable, calculated ledger record
  return {
    eventId: `${timestamp}-${category}-${subType}`, // Deterministic ID generation
    timestamp,
    category,
    subType,
    amount,
    unit: factorRecord.unit,
    breakdown: {
      CO2: parseFloat(gasWeights.CO2.toFixed(5)),
      CH4: parseFloat(gasWeights.CH4.toFixed(5)),
      N2O: parseFloat(gasWeights.N2O.toFixed(5)),
      HFC: parseFloat(gasWeights.HFC.toFixed(5))
    },
    totalCO2e: parseFloat(totalCO2e.toFixed(5))
  };
}