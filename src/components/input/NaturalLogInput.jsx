import { useState } from 'react';
import { Sparkles, Loader2, AlertTriangle } from 'lucide-react';

const EXAMPLES = [
  'Drove 14km to work in my petrol car',
  'Used the AC for 6 hours today',
  'Threw out about 2kg of food waste',
];

/**
 * Stream A — free-text activity logging.
 * @param {(text: string) => Promise<object>} onParse
 *   Resolves to a parsed ActivityEvent-shaped object (category, subType,
 *   quantity, unit, confidence…). Wire this to services/geminiService.js,
 *   and have that service fall back to services/geminiFallbackParser.js
 *   when offline or rate-limited — this component just surfaces whatever
 *   comes back, or an error state if the promise rejects entirely.
 * @param {(parsed: object, originalText: string) => void} onParsed
 *   Called after a successful parse; the parent should route this into
 *   ParsedLogConfirm rather than writing straight to IndexedDB.
 */
export default function NaturalLogInput({ onParse, onParsed }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    setLoading(true);
    setError('');
    try {
      const parsed = await onParse(trimmed);
      onParsed?.(parsed, trimmed);
      setText('');
    } catch {
      setError('Could not understand that automatically — you can still log it under Manual Entry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-emerald-100 bg-white/60 p-5">
      <label className="mb-2 flex items-center gap-2 text-sm font-medium text-emerald-900">
        <Sparkles className="h-4 w-4 text-emerald-500" />
        Describe an activity
      </label>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={280}
        rows={3}
        placeholder={`e.g., "${EXAMPLES[0]}"`}
        className="w-full resize-none rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm text-emerald-950 placeholder:text-emerald-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
      />
      <div className="mt-1 text-xs text-emerald-500">{text.length}/280</div>

      {error && (
        <div className="mt-2 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !text.trim()}
        className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {loading ? 'Reading…' : 'Log Activity'}
      </button>

      <p className="mt-2 text-xs text-emerald-500">
        Try things like “{EXAMPLES[1]}” or “{EXAMPLES[2]}”.
      </p>
    </form>
  );
}