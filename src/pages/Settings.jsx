/**
 * Settings.jsx — User preferences and danger zone.
 *
 * Sections:
 *   1. AI Parsing toggle (privacy) — persisted to IndexedDB
 *   2. Gemini API Key (session-only, not persisted to disk)
 *   3. Emission factor year + region selectors — persisted to IndexedDB
 *   4. Danger zone: Clear All Data
 *
 * The API key is never written to IndexedDB; users must re-enter it
 * after a page reload (or set VITE_GEMINI_API_KEY in their .env for
 * development convenience).
 */

import { useState } from 'react';
import {
  Brain, Key, Calendar, Globe, Trash2,
  Eye, EyeOff, CheckCircle2, AlertTriangle,
} from 'lucide-react';
import { useSettingsStore } from '../store/settingsStore';
import { useLedgerStore }   from '../store/ledgerStore';

const SUPPORTED_YEARS   = [2025, 2026];
const SUPPORTED_REGIONS = [{ code: 'IN', label: 'India (IN)' }];

function Section({ title, icon: Icon, children }) {
  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-emerald-900 border-b border-emerald-100 pb-3">
        <Icon className="h-4 w-4 text-emerald-500" />
        {title}
      </div>
      {children}
    </div>
  );
}

function Toggle({ label, description, checked, onChange, id }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-emerald-900">{label}</p>
        {description && <p className="text-xs text-emerald-500 mt-0.5">{description}</p>}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        id={id}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 ${
          checked ? 'bg-emerald-600' : 'bg-emerald-200'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${
            checked ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

export default function Settings() {
  const { aiEnabled, setAiEnabled, apiKey, setApiKey, dataYear, setDataYear, region, setRegion } = useSettingsStore();
  const { clearAll, entries } = useLedgerStore();

  const [showKey,     setShowKey]     = useState(false);
  const [keyDraft,    setKeyDraft]    = useState(apiKey);
  const [keySaved,    setKeySaved]    = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing,    setClearing]    = useState(false);

  const saveKey = () => {
    setApiKey(keyDraft);
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 2000);
  };

  const handleClearAll = async () => {
    setClearing(true);
    try {
      await clearAll();
      setConfirmClear(false);
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-xl font-bold text-emerald-950">Settings</h1>
        <p className="text-xs text-emerald-500 mt-0.5">
          All preferences are stored locally on your device.
        </p>
      </div>

      {/* AI Parsing */}
      <Section title="AI Parsing (Stream A)" icon={Brain}>
        <Toggle
          id="toggle-ai-enabled"
          label="Enable AI activity parsing"
          description="When on, free-text entries are sent to the Gemini API for categorisation. Turn off for full local-only mode."
          checked={aiEnabled}
          onChange={setAiEnabled}
        />
        {!aiEnabled && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">
            AI parsing is off. All entries must be logged via Manual Entry or Bulk Upload.
          </div>
        )}
      </Section>

      {/* API Key */}
      <Section title="Gemini API Key" icon={Key}>
        <p className="text-xs text-emerald-600">
          Your key is stored <strong>in memory only</strong> — it is never written to IndexedDB or disk.
          You'll need to re-enter it after a page reload (or set{' '}
          <code className="rounded bg-emerald-100 px-1 font-mono text-emerald-700">VITE_GEMINI_API_KEY</code>{' '}
          in your <code className="rounded bg-emerald-100 px-1 font-mono text-emerald-700">.env</code> file).
        </p>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              id="input-api-key"
              type={showKey ? 'text' : 'password'}
              value={keyDraft}
              onChange={(e) => setKeyDraft(e.target.value)}
              placeholder="AIza…"
              className="field-input pr-9"
            />
            <button
              onClick={() => setShowKey((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-emerald-400 hover:text-emerald-700"
              aria-label={showKey ? 'Hide API key' : 'Show API key'}
              type="button"
            >
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <button onClick={saveKey} className="btn-primary text-xs" id="save-api-key-btn">
            {keySaved ? <CheckCircle2 className="h-4 w-4" /> : 'Apply'}
          </button>
        </div>
        <p className="text-xs text-emerald-500">
          Get a free key at{' '}
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-emerald-700"
          >
            aistudio.google.com
          </a>
          .
        </p>
      </Section>

      {/* Emission Factor Dataset */}
      <Section title="Emission Factor Dataset" icon={Calendar}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-emerald-900" htmlFor="select-year">
              Data Year
            </label>
            <select
              id="select-year"
              value={dataYear}
              onChange={(e) => setDataYear(Number(e.target.value))}
              className="field-input"
            >
              {SUPPORTED_YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-emerald-900" htmlFor="select-region">
              Region
            </label>
            <select
              id="select-region"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="field-input"
            >
              {SUPPORTED_REGIONS.map((r) => (
                <option key={r.code} value={r.code}>{r.label}</option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-xs text-emerald-500">
          Applies to all new entries. Existing entries retain the factors they were calculated with.
        </p>
      </Section>

      {/* Danger Zone */}
      <Section title="Danger Zone" icon={Trash2}>
        <p className="text-sm text-emerald-700">
          Permanently delete all {entries.length} logged entr{entries.length === 1 ? 'y' : 'ies'} from your device.
          This cannot be undone.
        </p>
        {!confirmClear ? (
          <button
            onClick={() => setConfirmClear(true)}
            disabled={entries.length === 0}
            className="rounded-lg border border-rose-300 px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            id="clear-data-btn"
          >
            <span className="flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              Clear All Data
            </span>
          </button>
        ) : (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 space-y-3">
            <div className="flex items-start gap-2 text-sm text-rose-700">
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Are you sure? All {entries.length} entries will be permanently deleted from IndexedDB.</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleClearAll}
                disabled={clearing}
                className="rounded-lg bg-rose-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60 transition-colors"
                id="confirm-clear-btn"
              >
                {clearing ? 'Clearing…' : 'Yes, delete everything'}
              </button>
              <button
                onClick={() => setConfirmClear(false)}
                className="rounded-lg border border-rose-200 px-4 py-1.5 text-sm text-rose-600 hover:bg-rose-100 transition-colors"
                id="cancel-clear-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Section>
    </div>
  );
}
