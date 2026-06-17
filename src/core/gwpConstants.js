/**
 * Extracts and validates GWP constants from the injected data JSON.
 * @param {Object} emissionData - The parsed JSON object from src/data/
 * @returns {Object} Validated GWP constants
 */
export function getGwpConstants(emissionData) {
  if (!emissionData || !emissionData.GWP_100) {
    throw new Error("Invalid Emission Data: Missing GWP_100 definitions.");
  }
  
  return {
    CO2: emissionData.GWP_100.CO2 || 1,
    CH4: emissionData.GWP_100.CH4 || 28,
    N2O: emissionData.GWP_100.N2O || 265,
    HFC: emissionData.GWP_100.HFC || 1000
  };
}