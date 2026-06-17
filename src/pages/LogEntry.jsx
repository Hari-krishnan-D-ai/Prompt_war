/**
 * LogEntry.jsx — Unified entry point for all three input streams.
 *
 * Tab layout:
 *   [AI Input]  → NaturalLogInput → geminiService / fallback → ParsedLogConfirm → addEntry
 *   [Manual]    → category selector → matching Stream C form → addEntry
 *   [Bulk →]    → link to /bulk page (ExcelUploadZone lives there)
 *
 * The AI tab is disabled (grayed out) when:
 *   - settingsStore.aiEnabled === false (privacy toggle)
 *
 * All three paths call ledgerStore.addEntry() with the loaded emissionData
 * so that carbonMath.js / sequestrationMath.js can run without any network
 * access and without knowing which stream produced the event.
 */

import { useState, useCallback } from 'react';
import { Link }                  from 'react-router-dom';
import { Sparkles, PenLine, FileSpreadsheet, ArrowRight, CheckCircle2 } from 'lucide-react';

import { useLedgerStore }    from '../store/ledgerStore';
import { useSettingsStore }  from '../store/settingsStore';
import { useOnlineStatus }   from '../hooks/useOnlineStatus';
import { parseWithGemini }   from '../services/geminiService';
import { parseWithFallback } from '../services/geminiFallbackParser';

import NaturalLogInput from '../components/input/NaturalLogInput';
import ParsedLogConfirm from '../components/input/ParsedLogConfirm';

import FossilFuelForm   from '../components/input/ManualEntryForm/FossilFuelForm';
import FugitiveForm     from '../components/input/ManualEntryForm/FugitiveForm';
import ElectricityForm  from '../components/input/ManualEntryForm/ElectricityForm';
import WaterForm        from '../components/input/ManualEntryForm/WaterForm';
import WasteForm        from '../components/input/ManualEntryForm/WasteForm';
import TravelForm       from '../components/input/ManualEntryForm/TravelForm';
import OffsetForm       from '../components/input/ManualEntryForm/OffsetForm';

/* ─── helpers ─────────────────────────────────────────────────────────── */

const CATEGORIES = ['Fossil', 'Fugitive', 'Electricity', 'Water', 'Waste', 'Travel', 'Offset'];

const CATEGORY_ICONS = {
  Fossil:      '🔥',
  Fugitive:    '💨',
  Electricity: '⚡',
  Water:       '💧',
  Waste:       '🗑️',
  Travel:      '🚗',
  Offset:      '🌳',
};

const FORM_MAP = {
  Fossil:      FossilFuelForm,
  Fugitive:    FugitiveForm,
  Electricity: ElectricityForm,
  Water:       WaterForm,
  Waste:       WasteForm,
  Travel:      TravelForm,
  Offset:      OffsetForm,
};

/** Dynamically load the emission-factors JSON for the selected year+region. */
async function loadEmissionData(year, region) {
  try {
    const mod = await import(`../data/emissionFactors.${region.toLowerCase()}.${year}.json`);
    return mod.default;
  } catch {
    // Fallback to 2025 IN if the requested combination is not available
    const mod = await import('../data/emissionFactors.in.2025.json');
    return mod.default;
  }
}

/* ─── component ───────────────────────────────────────────────────────── */

export default function LogEntry() {
  const addEntry   = useLedgerStore((s) => s.addEntry);
  const { aiEnabled, apiKey, dataYear, region } = useSettingsStore();
  const isOnline   = useOnlineStatus();

  const [activeTab,    setActiveTab]    = useState('manual');
  const [category,     setCategory]     = useState('Fossil');
  const [parsedData,   setParsedData]   = useState(null);
  const [originalText, setOriginalText] = useState('');
  const [saveSuccess,  setSaveSuccess]  = useState(false);
  const [saveError,    setSaveError]    = useState('');

  /* ── AI parsing (Stream A) ────────────────────────────────────────── */

  const handleParse = useCallback(async (text) => {
    // Try Gemini first; fall back automatically
    if (aiEnabled && isOnline && apiKey) {
      try {
        return await parseWithGemini(text, apiKey);
      } catch (err) {
        console.warn('[LogEntry] Gemini failed, using fallback:', err.message);
      }
    }
    return parseWithFallback(text);
  }, [aiEnabled, isOnline, apiKey]);

  const handleParsed = (parsed, text) => {
    setParsedData(parsed);
    setOriginalText(text);
    setSaveSuccess(false);
    setSaveError('');
  };

  /* ── Confirm AI parse → save ─────────────────────────────────────── */

  const handleAIConfirm = async (confirmed) => {
    setSaveError('');
    try {
      const emissionData = await loadEmissionData(dataYear, region);
      await addEntry({
        ...confirmed,
        subType:  confirmed.subType,
        amount:   confirmed.quantity,
        unit:     confirmed.unit,
        stream:   'ai',
        timestamp: new Date().toISOString(),
      }, emissionData);
      setParsedData(null);
      setOriginalText('');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err.message);
    }
  };

  /* ── Manual form → save ──────────────────────────────────────────── */

  const handleManualSubmit = async (formData) => {
    setSaveError('');
    try {
      const emissionData = await loadEmissionData(dataYear, region);
      await addEntry({ ...formData, stream: 'manual' }, emissionData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err.message);
      throw err; // Let the form keep its error state
    }
  };

  const ActiveForm = FORM_MAP[category] ?? FossilFuelForm;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-emerald-950">Log Activity</h1>
        <p className="text-xs text-emerald-500 mt-0.5">
          Record an emissions-producing or offset activity.
        </p>
      </div>

      {/* Success banner */}
      {saveSuccess && (
        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 eco-saved">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          Entry saved and added to your ledger!
        </div>
      )}

      {/* Error banner */}
      {saveError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {saveError}
        </div>
      )}

      {/* Tab row */}
      <div className="flex items-center gap-2 border-b border-emerald-100 pb-3">
        <button
          id="tab-ai"
          onClick={() => { setActiveTab('ai'); setSaveSuccess(false); setSaveError(''); }}
          className={`tab-btn ${activeTab === 'ai' ? 'active' : ''} ${!aiEnabled ? 'opacity-40 cursor-not-allowed' : ''}`}
          disabled={!aiEnabled}
          title={!aiEnabled ? 'AI parsing disabled in Settings' : undefined}
        >
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            AI Input
          </span>
        </button>
        <button
          id="tab-manual"
          onClick={() => { setActiveTab('manual'); setSaveSuccess(false); setSaveError(''); }}
          className={`tab-btn ${activeTab === 'manual' ? 'active' : ''}`}
        >
          <span className="flex items-center gap-1.5">
            <PenLine className="h-3.5 w-3.5" />
            Manual Entry
          </span>
        </button>
        <Link
          to="/bulk"
          className="tab-btn flex items-center gap-1.5 text-emerald-600"
          id="tab-bulk-link"
        >
          <FileSpreadsheet className="h-3.5 w-3.5" />
          Bulk Upload
          <ArrowRight className="h-3 w-3 opacity-60" />
        </Link>
      </div>

      {/* ── AI tab ──────────────────────────────────────────────────── */}
      {activeTab === 'ai' && aiEnabled && (
        <div className="space-y-4">
          {!isOnline && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">
              You are offline — using the local keyword parser (lower confidence).
            </div>
          )}
          {!apiKey && isOnline && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">
              No Gemini API key set — using the local keyword parser. Add your key in Settings.
            </div>
          )}
          <NaturalLogInput onParse={handleParse} onParsed={handleParsed} />
          {parsedData && (
            <ParsedLogConfirm
              parsed={parsedData}
              originalText={originalText}
              onConfirm={handleAIConfirm}
              onDiscard={() => { setParsedData(null); setOriginalText(''); }}
            />
          )}
        </div>
      )}

      {/* ── Manual tab ──────────────────────────────────────────────── */}
      {activeTab === 'manual' && (
        <div className="space-y-5">
          {/* Category selector */}
          <div>
            <p className="mb-2 text-xs font-semibold text-emerald-700 uppercase tracking-wide">Category</p>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Category selector">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  id={`cat-btn-${cat.toLowerCase()}`}
                  onClick={() => setCategory(cat)}
                  className={`rounded-xl px-3.5 py-1.5 text-sm font-medium transition-all duration-150 border ${
                    category === cat
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow'
                      : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                  }`}
                >
                  {CATEGORY_ICONS[cat]} {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic form */}
          <ActiveForm onSubmit={handleManualSubmit} key={category} />
        </div>
      )}
    </div>
  );
}
