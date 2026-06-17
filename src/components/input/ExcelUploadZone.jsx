import { useRef, useState } from 'react';
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertTriangle, X } from 'lucide-react';

/**
 * Stream B — bulk Excel upload.
 * @param {(file: File) => Promise<{rows: number, errors?: {row:number, message:string}[]}>} onFile
 *   Inject the real parsing pipeline here — services/excelService.js running
 *   inside workers/excelParser.worker.js, so the UI thread never blocks on
 *   large spreadsheets. Return per-row errors rather than throwing, so a
 *   handful of bad rows don't sink the whole upload.
 * @param {string} [templateUrl]  Link to the pre-formatted template.
 */
export default function ExcelUploadZone({ onFile, templateUrl = '/templates/bulk-upload-template.xlsx' }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | processing | success | error
  const [fileName, setFileName] = useState('');
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const processFile = async (file) => {
    if (!/\.(xlsx|xls)$/i.test(file.name)) {
      setStatus('error');
      setErrorMsg('Please upload a .xlsx or .xls file.');
      return;
    }
    setFileName(file.name);
    setStatus('processing');
    setErrorMsg('');
    try {
      const res = await onFile(file);
      setResult(res);
      setStatus('success');
    } catch {
      setStatus('error');
      setErrorMsg('Could not read that file. Make sure it matches the template.');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const openPicker = () => inputRef.current?.click();

  const reset = () => {
    setStatus('idle');
    setFileName('');
    setResult(null);
    setErrorMsg('');
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="rounded-xl border border-emerald-100 bg-white/60 p-5">
      <div className="mb-3 flex items-center justify-between text-sm font-medium text-emerald-900">
        <span className="flex items-center gap-2">
          <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
          Bulk Excel Upload
        </span>
        <a href={templateUrl} download className="text-xs font-medium text-emerald-600 underline hover:text-emerald-700">
          Download template
        </a>
      </div>

      {status === 'idle' && (
        <div
          role="button"
          tabIndex={0}
          onClick={openPicker}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openPicker();
            }
          }}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-10 text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
            dragging ? 'border-emerald-500 bg-emerald-50' : 'border-emerald-200 hover:bg-emerald-50/50'
          }`}
        >
          <UploadCloud className="h-8 w-8 text-emerald-400" />
          <p className="text-sm text-emerald-700">Drag & drop your spreadsheet, or click to browse</p>
          <p className="text-xs text-emerald-400">.xlsx or .xls — processed entirely in your browser</p>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
          />
        </div>
      )}

      {status === 'processing' && (
        <div className="flex items-center gap-3 rounded-lg bg-emerald-50 px-4 py-6 text-sm text-emerald-700">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-300 border-t-emerald-600" />
          Reading {fileName}…
        </div>
      )}

      {status === 'success' && (
        <div className="space-y-2 rounded-lg bg-emerald-50 px-4 py-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 font-medium text-emerald-800">
              <CheckCircle2 className="h-4 w-4" />
              {result?.rows ?? 0} rows loaded from {fileName}
            </span>
            <button onClick={reset} className="text-emerald-500 hover:text-emerald-700" aria-label="Clear upload">
              <X className="h-4 w-4" />
            </button>
          </div>
          {result?.errors?.length > 0 && (
            <ul className="space-y-1 text-xs text-amber-700">
              {result.errors.map((e, i) => (
                <li key={i} className="flex items-start gap-1">
                  <AlertTriangle className="mt-0.5 h-3 w-3 flex-shrink-0" />
                  Row {e.row}: {e.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {status === 'error' && (
        <div className="flex items-center justify-between rounded-lg bg-rose-50 px-4 py-4 text-sm text-rose-700">
          <span className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {errorMsg}
          </span>
          <button onClick={reset} className="font-medium underline">Try again</button>
        </div>
      )}
    </div>
  );
}