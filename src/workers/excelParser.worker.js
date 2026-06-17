import * as XLSX from 'xlsx';

/**
 * Parses an uploaded .xlsx/.xls workbook off the main thread. Expects one
 * sheet per category, named exactly like the category (Fossil, Fugitive,
 * Electricity, Water, Waste, Travel, Offset) — matches the template built
 * by services/excelService.js. A sheet may be left empty/omitted if the
 * user has nothing to log for that category that period.
 *
 * NOTE: rows come back with the original human-readable column names
 * (e.g. "Amount Consumed", "Distance Travelled (KM)") exactly as typed in
 * the spreadsheet — they are NOT yet in the normalized ActivityEvent shape
 * that Streams A and C produce. Mapping these raw columns onto that shared
 * shape is core/validators.js's job, by design, so this worker only has to
 * know about spreadsheets, never about the calculation engine.
 *
 * Message in:  { type: 'PARSE_FILE', file: File }
 * Message out: { type: 'PARSE_RESULT', rows: object[], errors: {row, message}[] }
 *           or: { type: 'PARSE_ERROR', message: string }
 */
const REQUIRED_BY_SHEET = {
  Fossil: ['Facility', 'Year', 'Month', 'Fuel Type', 'Unit', 'Amount Consumed'],
  Fugitive: ['Facility', 'Year', 'Month', 'Application Type', 'Number of Units'],
  Electricity: ['Facility', 'Year', 'Month', 'Electricity Type', 'Electricity Source', 'Unit', 'Amount Consumed'],
  Water: ['Facility', 'Year', 'Month', 'Water Type', 'Discharge Site', 'Unit', 'Amount'],
  Waste: ['Facility', 'Year', 'Month', 'Waste Type', 'Treatment Type', 'Unit', 'Amount'],
  Travel: ['Facility', 'Year', 'Month', 'Mode of Transport', 'Distance Travelled (KM)'],
  Offset: [
    'Facility', 'Year', 'Month', 'Number of Trees',
    'Area Covered Under Soil (m²)', 'Area Covered Under Grass (m²)', 'Area Covered Under Water (m²)',
  ],
};

self.onmessage = async (event) => {
  const { type, file } = event.data;
  if (type !== 'PARSE_FILE') return;

  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });

    const rows = [];
    const errors = [];
    let rowCounter = 0;

    Object.entries(REQUIRED_BY_SHEET).forEach(([category, requiredCols]) => {
      const sheet = workbook.Sheets[category];
      if (!sheet) return; // category sheet is optional

      const sheetRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      sheetRows.forEach((raw) => {
        rowCounter += 1;
        const missing = requiredCols.filter((col) => raw[col] === '' || raw[col] == null);
        if (missing.length > 0) {
          errors.push({ row: rowCounter, message: `Missing ${missing.join(', ')} in "${category}" sheet` });
          return;
        }
        rows.push({ category, ...raw, _sourceRow: rowCounter });
      });
    });

    self.postMessage({ type: 'PARSE_RESULT', rows, errors });
  } catch (err) {
    self.postMessage({ type: 'PARSE_ERROR', message: err.message || 'Could not read file' });
  }
};