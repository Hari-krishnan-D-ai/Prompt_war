/**
 * useIndexedDB.js — Hydration hook.
 *
 * Loads all persisted entries + settings from IndexedDB into Zustand on
 * the component's first mount. Subsequent re-renders use the in-memory
 * store; this hook only fires the async waterfall once.
 */

import { useEffect } from 'react';
import { useLedgerStore }   from '../store/ledgerStore';
import { useSettingsStore } from '../store/settingsStore';

export function useIndexedDB() {
  const loadEntries = useLedgerStore((s) => s.loadEntries);
  const hydrate     = useSettingsStore((s) => s.hydrate);
  const hydrated    = useSettingsStore((s) => s.hydrated);

  useEffect(() => {
    if (!hydrated) {
      // Fire both loads in parallel — they share the same DB connection
      Promise.all([loadEntries(), hydrate()]).catch((err) => {
        console.error('[useIndexedDB] Hydration failed:', err);
      });
    }
  }, [hydrated, loadEntries, hydrate]);
}
