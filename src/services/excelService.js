/**
 * excelService.js — Bridge between the UI and the excelParser Web Worker (Stream B).
 *
 * Sends a File object to the worker, waits for the PARSE_RESULT message, then
 * normalises the raw spreadsheet columns into the shared ActivityEvent shape
 * so that carbonMath.js / sequestrationMath.js never see raw Excel headers.
 *
 * Column → ActivityEvent field mapping is declared per-category below.
 * Any row that cannot be mapped cleanly is returned in the errors array —
 * it is never silently dropped.
 */

// Column name → ActivityEvent field name, per category sheet
const COL_MAP = {
  Fossil: {
    Facility:         'facility',
    Year:             'year',
    Month:            'month',
    'Fuel Type':      'subType',
    Unit:             'unit',
    'Amount Consumed':'amount',
  },
  Fugitive: {
    Facility:             'facility',
    Year:                 'year',
    Month:                'month',
    'Application Type':   'subType',
    'Number of Units':    'amount',
  },
  Electricity: {
    Facility:             'facility',
    Year:                 'year',
    Month:                'month',
    'Electricity Type':   'subType',
    'Electricity Source': 'electricitySource',
    Unit:                 'unit',
    'Amount Consumed':    'amount',
  },
  Water: {
    Facility:        'facility',
    Year:            'year',
    Month:           'month',
    'Water Type':    'subType',
    'Discharge Site':'dischargeSite',
    Unit:            'unit',
    Amount:          'amount',
  },
  Waste: {
    Facility:        'facility',
    Year:            'year',
    Month:           'month',
    'Waste Type':    'subType',
    'Treatment Type':'treatmentType',
    Unit:            'unit',
    Amount:          'amount',
  },
  Travel: {
    Facility:                  'facility',
    Year:                      'year',
    Month:                     'month',
    'Mode of Transport':       'subType',
    'Distance Travelled (KM)': 'amount',
  },
  Offset: {
    Facility:                         'facility',
    Year:                             'year',
    Month:                            'month',
    'Number of Trees':                'trees',
    'Area Covered Under Soil (m²)':   'soilArea',
    'Area Covered Under Grass (m²)':  'grassArea',
    'Area Covered Under Water (m²)':  'waterArea',
  },
};

/**
 * Normalise a raw row from the worker into an ActivityEvent-shaped object.
 * Returns null if the row is unmappable and records an error instead.
 */
function normaliseRow(rawRow, category, rowIndex, errors) {
  const map = COL_MAP[category];
  if (!map) {
    errors.push({ row: rowIndex, message: `Unknown category sheet: "${category}"` });
    return null;
  }

  const event = { category, timestamp: new Date().toISOString() };

  for (const [col, field] of Object.entries(map)) {
    const raw = rawRow[col];
    if (raw === '' || raw == null) {
      errors.push({ row: rowIndex, message: `Missing value for column "${col}" in ${category} sheet` });
      return null;
    }
    // Coerce numeric fields
    if (['year', 'amount', 'trees', 'soilArea', 'grassArea', 'waterArea'].includes(field)) {
      const n = Number(raw);
      if (isNaN(n)) {
        errors.push({ row: rowIndex, message: `Non-numeric value "${raw}" in column "${col}"` });
        return null;
      }
      event[field] = n;
    } else {
      event[field] = String(raw).trim();
    }
  }

  // Travel uses 'amount' for distance; treat as the canonical amount field
  if (category === 'Travel' && event.amount !== undefined) {
    event.unit = 'km';
  }

  return event;
}

/**
 * Parse an uploaded Excel file using the Web Worker and normalise all rows.
 *
 * @param {File} file
 * @returns {Promise<{ events: object[], errors: {row:number, message:string}[] }>}
 */
export function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL('../workers/excelParser.worker.js', import.meta.url),
      { type: 'module' }
    );

    const timeout = setTimeout(() => {
      worker.terminate();
      reject(new Error('Excel parsing timed out after 30 seconds.'));
    }, 30_000);

    worker.onmessage = (e) => {
      clearTimeout(timeout);
      worker.terminate();

      const { type, rows, errors: parseErrors, message } = e.data;

      if (type === 'PARSE_ERROR') {
        reject(new Error(message));
        return;
      }

      // Normalise each raw row into ActivityEvent shape
      const normErrors = [];
      const events = [];

      rows.forEach((raw) => {
        const normalised = normaliseRow(raw, raw.category, raw._sourceRow, normErrors);
        if (normalised) events.push(normalised);
      });

      resolve({
        events,
        errors: [...(parseErrors ?? []), ...normErrors],
      });
    };

    worker.onerror = (err) => {
      clearTimeout(timeout);
      worker.terminate();
      reject(new Error(`Worker error: ${err.message}`));
    };

    worker.postMessage({ type: 'PARSE_FILE', file });
  });
}
