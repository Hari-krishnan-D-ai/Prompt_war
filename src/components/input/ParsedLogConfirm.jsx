import { useState, useEffect } from 'react';
import { Check, X, Pencil } from 'lucide-react';

const CATEGORIES = ['Fossil', 'Fugitive', 'Electricity', 'Water', 'Waste', 'Travel', 'Offset'];

function confidenceTone(confidence) {
  if (confidence == null) return null;
  if (confidence >= 0.8) return { label: 'High confidence', tone: 'bg-emerald-100 text-emerald-700' };
  if (confidence >= 0.5) return { label: 'Medium confidence', tone: 'bg-amber-100 text-amber-700' };
  return { label: 'Low confidence — please check', tone: 'bg-rose-100 text-rose-700' };
}

/**
 * The trust layer between Stream A / the free-text part of Stream B and the
 * ledger. AI output is never committed to IndexedDB without passing through
 * this confirmation screen first.
 * @param {object} parsed        {category, subType, quantity, unit, confidence?}
 * @param {string} originalText  The raw text the user typed
 * @param {(finalData: object) => void | Promise<void>} onConfirm
 * @param {() => void} onDiscard
 */
export default function ParsedLogConfirm({ parsed, originalText, onConfirm, onDiscard }) {
  const [data, setData] = useState(parsed);
  const [saving, setSaving] = useState(false);

  useEffect(() => setData(parsed), [parsed]);

  if (!parsed) return null;
  const tone = confidenceTone(parsed.confidence);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const handleConfirm = async () => {
    setSaving(true);
    try {
      await onConfirm({ ...data, quantity: Number(data.quantity) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-emerald-900">
          <Pencil className="h-4 w-4 text-emerald-500" />
          Confirm what we understood
        </div>
        {tone && <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${tone.tone}`}>{tone.label}</span>}
      </div>

      <p className="mb-4 text-xs italic text-emerald-600/80">“{originalText}”</p>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-emerald-800">Category</span>
          <select
            name="category"
            value={data.category || ''}
            onChange={handleChange}
            className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm"
          >
            <option value="" disabled>Select…</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-emerald-800">Sub-type</span>
          <input
            name="subType"
            value={data.subType || ''}
            onChange={handleChange}
            className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-emerald-800">Quantity</span>
          <input
            type="number"
            name="quantity"
            value={data.quantity ?? ''}
            onChange={handleChange}
            className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-emerald-800">Unit</span>
          <input
            name="unit"
            value={data.unit || ''}
            onChange={handleChange}
            className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm"
          />
        </label>
      </div>

      <div className="mt-4 flex gap-3">
        <button
          onClick={handleConfirm}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 disabled:opacity-60"
        >
          <Check className="h-4 w-4" />
          {saving ? 'Saving…' : 'Confirm & Save'}
        </button>
        <button
          onClick={onDiscard}
          className="flex items-center gap-2 rounded-lg border border-emerald-200 px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
        >
          <X className="h-4 w-4" />
          Discard
        </button>
      </div>
    </div>
  );
}