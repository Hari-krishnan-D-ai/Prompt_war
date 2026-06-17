/**
 * Calculates absolute biological sequestration (carbon removals).
 * Pure, deterministic function kept separate from emissions logic for strict auditability.
 * * @param {Object} activityEvent - The normalized Offset row (Stream A, B, or C).
 * @param {Object} emissionDataJSON - The loaded dataset containing Sequestration baseline constants.
 * @returns {Object} The ledger row with calculated mitigation breakdown and negative total CO2-e.
 */
export function calculateSequestration(activityEvent, emissionDataJSON) {
  if (!activityEvent || activityEvent.category !== 'Offset') {
    throw new Error("Sequestration calculation engine exclusively processes 'Offset' categorized events.");
  }

  if (!emissionDataJSON || !emissionDataJSON.Sequestration) {
    throw new Error("Missing Sequestration constants. Ensure the external JSON is injected properly.");
  }

  const timestamp = activityEvent.timestamp || new Date().toISOString();
  const seqFactors = emissionDataJSON.Sequestration;

  const trees = Number(activityEvent.trees) || 0;
  const soilArea = Number(activityEvent.soilArea) || 0;
  const grassArea = Number(activityEvent.grassArea) || 0;
  const waterArea = Number(activityEvent.waterArea) || 0;

  // Calculate distinct biological mitigation weights
  const mitigation = {
    trees: trees * (seqFactors.Tree_Mature?.factor || 21.77),
    soil: soilArea * (seqFactors.Soil_Carbon?.factor || 0.44),
    grass: grassArea * (seqFactors.Grass_Cover?.factor || 0.12),
    water: waterArea * (seqFactors.Water_Body?.factor || 0.20)
  };

  const totalSequestered = mitigation.trees + mitigation.soil + mitigation.grass + mitigation.water;

  return {
    eventId: `${timestamp}-Offset-Sequestration`,
    timestamp: timestamp,
    category: 'Offset',
    subType: 'Biological Sequestration',
    unit: 'kg CO2e removed',
    breakdown: {
      trees: parseFloat(mitigation.trees.toFixed(5)),
      soil: parseFloat(mitigation.soil.toFixed(5)),
      grass: parseFloat(mitigation.grass.toFixed(5)),
      water: parseFloat(mitigation.water.toFixed(5))
    },
    // Removals are output as negative to natively balance against positive emissions in the aggregator
    co2e: -parseFloat(totalSequestered.toFixed(5)) 
  };
}