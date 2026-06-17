/**
 * BulkUpload.jsx — Stream B: Excel file upload and batch processing.
 *
 * Flow:
 *   1. ExcelUploadZone → excelService.parseExcelFile() (runs in worker)
 *   2. Show parsed rows + per-row errors to user
 *   3. User clicks "Confirm & Save All" → batch through calc.worker → addActivity each row
 *   4. Rows with errors are shown but excluded from the commit unless the user
 *      edits them (future enhancement — they are flagged, not silently dropped)
 */

import { useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, Loader2, FileSpreadsheet } from 'lucide-react';
import ExcelUploadZone from '../components/input/ExcelUploadZone';
import { parseExcelFile } from '../services/excelService';
import { useLedgerStore }  from '../store/ledgerStore';
import { useSettingsStore } from '../store/settingsStore';

async function loadEmissionData(year, region) {
  try {
    const mod = await import(`../data/emissionFactors.${region.toLowerCase()}.${year}.json`);
    return mod.default;
  } catch {
    const mod = await import('../data/emissionFactors.in.2025.json');
    return mod.default;
  }
}

export default function BulkUpload() {
  const addEntry            = useLedgerStore((s) => s.addEntry);
  const { dataYear, region } = useSettingsStore();

  const [parseResult, setParseResult] = useState(null); // { events, errors }
  const [committing,  setCommitting]  = useState(false);
  const [commitResult, setCommitResult] = useState(null); // { saved, failed }
  const [fileError,   setFileError]   = useState('');

  const handleFile = useCallback(async (file) => {
    setParseResult(null);
    setCommitResult(null);
    setFileError('');
    try {
      const result = await parseExcelFile(file);
      setParseResult(result);
      return { rows: result.events.length, errors: result.errors };
    } catch (err) {
      setFileError(err.message);
      throw err;
    }
  }, []);

  const handleCommit = async () => {
    if (!parseResult?.events?.length) return;
    setCommitting(true);
    setCommitResult(null);

    const emissionData = await loadEmissionData(dataYear, region);
    let saved = 0;
    let failed = 0;
    const failedRows = [];

    for (const event of parseResult.events) {
      try {
        await addEntry({ ...event, stream: 'excel' }, emissionData);
        saved++;
      } catch (err) {
        failed++;
        failedRows.push({ event, message: err.message });
      }
    }

    setCommitting(false);
    setCommitResult({ saved, failed, failedRows });
    if (saved > 0) setParseResult(null); // Reset uploader after partial/full success
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-emerald-950">Bulk Upload</h1>
        <p className="text-xs text-emerald-500 mt-0.5">
          Upload a filled copy of the template to log many activities at once.
        </p>
      </div>

      {/* Template instructions */}
      <div className="card p-5 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
          <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
          How it works
        </div>
        <ol className="list-decimal list-inside space-y-1 text-xs text-emerald-700">
          <li>Download the template below — it has one sheet per emission category.</li>
          <li>Fill in your data. Each row is one activity entry.</li>
          <li>Re-upload the file. It is parsed entirely in your browser — no data leaves your device.</li>
          <li>Review the parsed rows, then click <strong>Confirm &amp; Save All</strong>.</li>
        </ol>
      </div>

      <ExcelUploadZone onFile={handleFile} />

      {fileError && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          {fileError}
        </div>
      )}

      {/* Preview parsed rows */}
      {parseResult && (
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-emerald-900">
              {parseResult.events.length} valid rows ready to save
              {parseResult.errors.length > 0 && (
                <span className="ml-2 text-amber-600">
                  + {parseResult.errors.length} error{parseResult.errors.length > 1 ? 's' : ''}
                </span>
              )}
            </p>
            <button
              onClick={handleCommit}
              disabled={committing || parseResult.events.length === 0}
              className="btn-primary text-xs"
              id="bulk-confirm-btn"
            >
              {committing
                ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</>
                : <><CheckCircle2 className="h-3.5 w-3.5" /> Confirm &amp; Save All</>
              }
            </button>
          </div>

          {/* Row errors */}
          {parseResult.errors.length > 0 && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
              <p className="text-xs font-semibold text-amber-700 mb-1">
                These rows will be skipped (fix them in the spreadsheet and re-upload):
              </p>
              <ul className="space-y-0.5">
                {parseResult.errors.map((e, i) => (
                  <li key={i} className="flex items-start gap-1 text-xs text-amber-700">
                    <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    Row {e.row}: {e.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Valid rows preview */}
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs divide-y divide-emerald-100">
              <thead>
                <tr className="text-left text-emerald-600">
                  <th className="pb-1 pr-3 font-semibold">Category</th>
                  <th className="pb-1 pr-3 font-semibold">Sub-type</th>
                  <th className="pb-1 pr-3 font-semibold">Facility</th>
                  <th className="pb-1 pr-3 font-semibold">Period</th>
                  <th className="pb-1 font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-50">
                {parseResult.events.slice(0, 20).map((ev, i) => (
                  <tr key={i}>
                    <td className="py-1 pr-3 text-emerald-800">{ev.category}</td>
                    <td className="py-1 pr-3 text-emerald-600">{String(ev.subType ?? '—').replace(/_/g, ' ')}</td>
                    <td className="py-1 pr-3 text-emerald-600">{ev.facility}</td>
                    <td className="py-1 pr-3 text-emerald-500">{ev.month} {ev.year}</td>
                    <td className="py-1 text-emerald-600">{ev.amount} {ev.unit ?? ''}</td>
                  </tr>
                ))}
                {parseResult.events.length > 20 && (
                  <tr>
                    <td colSpan={5} className="py-1 text-emerald-400 italic">
                      … and {parseResult.events.length - 20} more rows
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Commit result */}
      {commitResult && (
        <div className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm ${
          commitResult.failed === 0
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
            : 'border-amber-200 bg-amber-50 text-amber-700'
        } eco-saved`}>
          <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold">
              {commitResult.saved} entr{commitResult.saved === 1 ? 'y' : 'ies'} saved successfully.
              {commitResult.failed > 0 && ` ${commitResult.failed} failed.`}
            </p>
            {commitResult.failedRows.map((f, i) => (
              <p key={i} className="text-xs mt-0.5 opacity-80">{f.event.category}: {f.message}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
