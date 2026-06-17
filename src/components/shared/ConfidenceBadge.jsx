/**
 * ConfidenceBadge.jsx — Colour-coded AI confidence indicator.
 *
 * Displayed on ParsedLogConfirm cards and the BulkUpload AI-categorised rows.
 * Green ≥ 0.8, amber ≥ 0.5, red < 0.5.
 */

export default function ConfidenceBadge({ confidence }) {
  if (confidence == null) return null;

  let label, className;
  if (confidence >= 0.8) {
    label     = `High (${Math.round(confidence * 100)}%)`;
    className = 'bg-emerald-100 text-emerald-700 border-emerald-200';
  } else if (confidence >= 0.5) {
    label     = `Medium (${Math.round(confidence * 100)}%)`;
    className = 'bg-amber-100 text-amber-700 border-amber-200';
  } else {
    label     = `Low (${Math.round(confidence * 100)}%) — please check`;
    className = 'bg-rose-100 text-rose-700 border-rose-200';
  }

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}
