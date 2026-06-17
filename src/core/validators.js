const VALID_CATEGORIES = [
  'Fossil', 
  'Fugitive', 
  'Electricity', 
  'Water', 
  'Waste', 
  'Travel', 
  'Offset'
];

/**
 * Validates an ActivityEvent payload from any input stream (A, B, or C).
 * @param {Object} event - The normalized activity payload
 * @returns {boolean} True if valid, otherwise throws an explicit Error.
 */
export function validateActivityEvent(event) {
  if (!event || typeof event !== 'object') {
    throw new Error("Validation Error: ActivityEvent must be a valid object.");
  }

  if (!VALID_CATEGORIES.includes(event.category)) {
    throw new Error(`Validation Error: Invalid category '${event.category}'. Must be one of: ${VALID_CATEGORIES.join(', ')}.`);
  }

  if (typeof event.subType !== 'string' || event.subType.trim() === '') {
    throw new Error("Validation Error: ActivityEvent requires a defined 'subType' string.");
  }

  if (typeof event.amount !== 'number' || event.amount < 0 || isNaN(event.amount)) {
    throw new Error("Validation Error: 'amount' must be a positive number.");
  }

  // Ensures determinism: the caller must provide the timestamp, not the core.
  if (!event.timestamp || isNaN(Date.parse(event.timestamp))) {
    throw new Error("Validation Error: A valid ISO 'timestamp' must be provided by the caller.");
  }

  return true;
}