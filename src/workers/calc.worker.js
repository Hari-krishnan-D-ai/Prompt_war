import { calculateEmissions } from '../core/carbonMath.js';
import { calculateSequestration } from '../core/sequestrationMath.js';
import { validateActivityEvent } from '../core/validators.js';

/**
 * Runs the calculation engine over a whole batch of rows off the main
 * thread, so a bulk Excel upload or a full-ledger recalculation never
 * freezes the UI.
 *
 * Message in:  { type: 'CALCULATE_BATCH', rows: ActivityEvent[], factors: EmissionFactors }
 * Message out: { type: 'BATCH_RESULT', results: CalculatedRow[], errors: {row, message}[] }
 */
self.onmessage = (event) => {
  const { type, rows, factors } = event.data;
  if (type !== 'CALCULATE_BATCH') return;

  const results = [];
  const errors = [];

  rows.forEach((row, index) => {
    try {
      validateActivityEvent(row);
    } catch (validationErr) {
      errors.push({ row: index + 1, message: validationErr.message || 'Validation failed' });
      return;
    }

    try {
      const computed = row.category === 'Offset'
        ? calculateSequestration(row, factors)
        : calculateEmissions(row, factors);

      results.push({
        ...row,
        totalCO2e:    computed.totalCO2e ?? computed.co2e,
        co2e:         computed.totalCO2e ?? computed.co2e,
        breakdown:    computed.breakdown ?? null,
        timestamp:    row.timestamp ?? new Date().toISOString(),
      });
    } catch (err) {
      errors.push({ row: index + 1, message: err.message || 'Calculation failed' });
    }
  });

  self.postMessage({ type: 'BATCH_RESULT', results, errors });
};