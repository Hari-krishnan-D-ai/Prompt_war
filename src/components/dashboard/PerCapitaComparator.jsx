/**
 * PerCapitaComparator.jsx — User footprint vs global and India benchmarks.
 *
 * Reference values (annualised):
 *   Global average : 4,700 kg CO₂-e per person per year
 *   India average  : 1,900 kg CO₂-e per person per year
 *
 * Sources: see /src/data/sourceCitations.md — "Per-Capita Reference Values"
 *
 * The component annualises the user's total by prorating across the number
 * of distinct months they have logged data for.
 */

import { useMemo } from 'react';
import { useLedgerStore } from '../../store/ledgerStore';

const BENCHMARKS = [
  { label: 'India average',  value: 1900,  color: 'bg-emerald-500' },
  { label: 'Global average', value: 4700,  color: 'bg-amber-500'   },
];

function annualise(entries) {
  if (entries.length === 0) return 0;

  // Collect distinct year-month keys across all entries
  const months = new Set(
    entries.map((e) => {
      if (e.savedAt) return e.savedAt.slice(0, 7);
      if (e.year && e.month) return `${e.year}-${e.month}`;
      return null;
    }).filter(Boolean)
  );

  const monthCount = Math.max(1, months.size);
  const total      = entries.reduce((s, e) => s + (e.totalCO2e ?? e.co2e ?? 0), 0);
  return (total / monthCount) * 12; // annualise
}

function ProgressBar({ label, value, max, color, isUser }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className={`font-medium ${isUser ? 'text-emerald-900' : 'text-emerald-700'}`}>{label}</span>
        <span className={`tabular-nums font-semibold ${isUser ? 'text-emerald-900' : 'text-emerald-600'}`}>
          {Math.round(value).toLocaleString()} kg/yr
        </span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-emerald-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function PerCapitaComparator() {
  const entries     = useLedgerStore((s) => s.entries);
  const annualTotal = useMemo(() => annualise(entries), [entries]);

  const maxValue    = Math.max(annualTotal, 5000);
  const userColor   = annualTotal < 1900 ? 'bg-emerald-500' : annualTotal < 4700 ? 'bg-amber-400' : 'bg-rose-500';

  return (
    <div className="card p-5 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-emerald-900">Per-Capita Comparison</h3>
        <p className="text-xs text-emerald-500 mt-0.5">Annualised from your logged data</p>
      </div>

      <div className="space-y-3">
        <ProgressBar
          label="Your footprint"
          value={annualTotal}
          max={maxValue}
          color={userColor}
          isUser
        />
        {BENCHMARKS.map((b) => (
          <ProgressBar
            key={b.label}
            label={b.label}
            value={b.value}
            max={maxValue}
            color={b.color}
            isUser={false}
          />
        ))}
      </div>

      {annualTotal < 1900 && entries.length > 0 && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-700">
          🎉 You are below the India average! Keep it up.
        </div>
      )}
      {annualTotal === 0 && (
        <p className="text-xs text-emerald-400 text-center">
          Log at least one month of data to see your annualised footprint.
        </p>
      )}
    </div>
  );
}
