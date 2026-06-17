/**
 * Calendar.jsx — Compact month/year picker.
 *
 * Used in the ParsedLogConfirm step so the user can set which
 * month an AI-parsed entry belongs to before committing to IndexedDB.
 */

import { MONTHS, YEARS } from '../input/ManualEntryForm/constants';

export default function Calendar({ month, year, onChange }) {
  const handleMonth = (e) => onChange?.({ month: e.target.value, year });
  const handleYear  = (e) => onChange?.({ month, year: Number(e.target.value) });

  const cls =
    'rounded-lg border border-emerald-200 bg-white px-2 py-1.5 text-sm text-emerald-900 ' +
    'focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200';

  return (
    <div className="flex items-center gap-2">
      <select value={month ?? ''} onChange={handleMonth} className={cls} aria-label="Month">
        <option value="" disabled>Month</option>
        {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
      </select>
      <select value={year ?? ''} onChange={handleYear} className={cls} aria-label="Year">
        {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
      </select>
    </div>
  );
}
