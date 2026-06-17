/**
 * LedgerTable.jsx — Paginated, sortable table of all logged entries.
 *
 * Row severity tinting:
 *   - totalCO2e > 50 kg → high (rose)
 *   - totalCO2e > 10 kg → medium (amber)
 *   - else              → low (emerald)
 *
 * Offset rows always render with a green tint regardless of their
 * negative co2e value (they are eco-positive actions).
 */

import { useState } from 'react';
import { Trash2, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLedgerStore } from '../../store/ledgerStore';

const PAGE_SIZE = 15;

const CATEGORY_BADGE = {
  Fossil:      'bg-orange-100 text-orange-700',
  Fugitive:    'bg-purple-100 text-purple-700',
  Electricity: 'bg-yellow-100 text-yellow-700',
  Water:       'bg-blue-100 text-blue-700',
  Waste:       'bg-rose-100 text-rose-700',
  Travel:      'bg-indigo-100 text-indigo-700',
  Offset:      'bg-emerald-100 text-emerald-700',
};

function rowSeverity(entry) {
  if (entry.category === 'Offset') return 'row-low';
  const co2e = Math.abs(entry.totalCO2e ?? entry.co2e ?? 0);
  if (co2e > 50) return 'row-high';
  if (co2e > 10) return 'row-medium';
  return 'row-low';
}

function SortIcon({ field, sortKey, dir }) {
  if (sortKey !== field) return <ChevronUp className="h-3 w-3 opacity-30" />;
  return dir === 'asc'
    ? <ChevronUp   className="h-3 w-3 text-emerald-600" />
    : <ChevronDown className="h-3 w-3 text-emerald-600" />;
}

export default function LedgerTable() {
  const entries     = useLedgerStore((s) => s.entries);
  const deleteEntry = useLedgerStore((s) => s.deleteEntry);

  const [sortKey, setSortKey] = useState('savedAt');
  const [sortDir, setSortDir] = useState('desc');
  const [page,    setPage]    = useState(0);
  const [deleting, setDeleting] = useState(null);

  const sorted = [...entries].sort((a, b) => {
    let av = a[sortKey] ?? 0;
    let bv = b[sortKey] ?? 0;
    if (typeof av === 'string') av = av.toLowerCase();
    if (typeof bv === 'string') bv = bv.toLowerCase();
    if (av < bv) return sortDir === 'asc' ? -1 : 1;
    if (av > bv) return sortDir === 'asc' ?  1 : -1;
    return 0;
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageSlice  = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
    setPage(0);
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await deleteEntry(id);
    } finally {
      setDeleting(null);
    }
  };

  const TH = ({ label, field }) => (
    <th
      scope="col"
      onClick={() => toggleSort(field)}
      className="cursor-pointer select-none whitespace-nowrap px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-emerald-700 hover:text-emerald-900 transition-colors"
    >
      <span className="flex items-center gap-1">
        {label}
        <SortIcon field={field} sortKey={sortKey} dir={sortDir} />
      </span>
    </th>
  );

  if (entries.length === 0) {
    return (
      <div className="card flex flex-col items-center justify-center gap-3 py-16 text-center">
        <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
          <ChevronDown className="h-6 w-6 text-emerald-400" />
        </div>
        <p className="text-sm font-medium text-emerald-700">No entries yet</p>
        <p className="text-xs text-emerald-500">Log your first activity to see it here.</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-emerald-100" id="ledger-table">
          <thead className="bg-emerald-50/60">
            <tr>
              <TH label="Date"       field="savedAt"   />
              <TH label="Category"   field="category"  />
              <TH label="Sub-type"   field="subType"   />
              <TH label="Facility"   field="facility"  />
              <TH label="Period"     field="year"      />
              <TH label="Amount"     field="amount"    />
              <TH label="CO₂-e (kg)" field="totalCO2e" />
              <th scope="col" className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-emerald-50 bg-white">
            {pageSlice.map((entry) => {
              const co2e   = entry.totalCO2e ?? entry.co2e ?? 0;
              const isOffset = entry.category === 'Offset';
              return (
                <tr key={entry.id} className={`transition-colors ${rowSeverity(entry)}`}>
                  <td className="whitespace-nowrap px-3 py-2.5 text-xs text-emerald-600">
                    {entry.savedAt?.slice(0, 10) ?? '—'}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_BADGE[entry.category] ?? 'bg-gray-100 text-gray-600'}`}>
                      {entry.category}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-emerald-800">
                    {(entry.subType ?? '—').replace(/_/g, ' ')}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-emerald-700">{entry.facility ?? '—'}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-xs text-emerald-600">
                    {entry.month ? `${entry.month} ${entry.year}` : (entry.year ?? '—')}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-xs text-emerald-700">
                    {entry.amount != null ? `${Number(entry.amount).toLocaleString()} ${entry.unit ?? ''}` : '—'}
                  </td>
                  <td className={`whitespace-nowrap px-3 py-2.5 text-xs font-semibold tabular-nums ${
                    isOffset ? 'text-emerald-700' : co2e > 50 ? 'text-rose-600' : co2e > 10 ? 'text-amber-600' : 'text-emerald-700'
                  }`}>
                    {isOffset ? '−' : ''}{Math.abs(co2e).toFixed(3)}
                  </td>
                  <td className="px-3 py-2.5">
                    <button
                      onClick={() => handleDelete(entry.id)}
                      disabled={deleting === entry.id}
                      className="rounded p-1 text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-40"
                      aria-label={`Delete entry ${entry.id}`}
                      id={`delete-entry-${entry.id}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-emerald-100 px-4 py-2.5 bg-emerald-50/40">
          <span className="text-xs text-emerald-600">
            {sorted.length} entries · Page {page + 1} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="rounded p-1 text-emerald-600 hover:bg-emerald-100 disabled:opacity-30 transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="rounded p-1 text-emerald-600 hover:bg-emerald-100 disabled:opacity-30 transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
