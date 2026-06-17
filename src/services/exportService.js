/**
 * exportService.js — Client-side export utilities.
 *
 * exportCSV:  converts ledger rows to a UTF-8 CSV blob and triggers a download.
 * exportJSON: full JSON dump of all rows (for data portability / import later).
 *
 * PDF export: deferred — jsPDF requires a paid CDN or bundled binary.
 * A print-ready CSS page (@media print) is used instead for now.
 */

const CSV_HEADERS = [
  'Date',
  'Category',
  'Sub-Type',
  'Facility',
  'Year',
  'Month',
  'Amount',
  'Unit',
  'CO2 (kg)',
  'CH4 (kg)',
  'N2O (kg)',
  'HFC (kg)',
  'Total CO2-e (kg)',
  'Source Stream',
];

function escapeCSV(val) {
  if (val === null || val === undefined) return '';
  const s = String(val);
  // Quote fields that contain commas, quotes, or newlines
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/**
 * Download all ledger rows as a CSV file.
 * @param {Object[]} rows — ledger entries from getAllActivities()
 * @param {string}   [filename]
 */
export function exportCSV(rows, filename = 'carbon-ledger-export.csv') {
  const lines = [CSV_HEADERS.join(',')];

  for (const row of rows) {
    const breakdown = row.breakdown ?? {};
    const line = [
      row.savedAt ? row.savedAt.slice(0, 10) : '',
      row.category ?? '',
      row.subType  ?? '',
      row.facility ?? '',
      row.year     ?? '',
      row.month    ?? '',
      row.amount   ?? '',
      row.unit     ?? '',
      breakdown.CO2 ?? '',
      breakdown.CH4 ?? '',
      breakdown.N2O ?? '',
      breakdown.HFC ?? '',
      row.totalCO2e ?? row.co2e ?? '',
      row.stream    ?? 'manual',
    ].map(escapeCSV).join(',');
    lines.push(line);
  }

  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, filename);
}

/**
 * Download all ledger rows as a JSON file (full fidelity, for re-import).
 * @param {Object[]} rows
 * @param {string}   [filename]
 */
export function exportJSON(rows, filename = 'carbon-ledger-export.json') {
  const blob = new Blob(
    [JSON.stringify(rows, null, 2)],
    { type: 'application/json;charset=utf-8;' }
  );
  triggerDownload(blob, filename);
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Clean up the object URL after the browser has processed the click
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
