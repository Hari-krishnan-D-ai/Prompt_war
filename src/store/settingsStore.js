/**
 * settingsStore.js — User preferences via Zustand.
 *
 * Settings are also persisted to IndexedDB (except apiKey — stored in-memory
 * only per the privacy constraint; users must re-enter it after a page reload).
 *
 * Persisted keys in IndexedDB "settings" store:
 *   - "aiEnabled"   boolean  — whether Stream A / partial Stream B AI is active
 *   - "dataYear"    number   — which emission-factor year to use (default: current)
 *   - "region"      string   — emission-factor region key (default: "IN")
 */

import { create } from 'zustand';
import { getSetting, setSetting } from '../services/dbService';

const CURRENT_YEAR = new Date().getFullYear();

export const useSettingsStore = create((set, get) => ({
  // AI toggle — respects user privacy
  aiEnabled: true,

  // API key — never persisted to disk, session-only
  apiKey: import.meta.env.VITE_GEMINI_API_KEY ?? '',

  // Emission-factor dataset selection
  dataYear: CURRENT_YEAR,
  region:   'IN',

  // Whether the store has been hydrated from IndexedDB
  hydrated: false,

  /** Load persisted settings from IndexedDB. Call this once on app mount. */
  hydrate: async () => {
    const [aiEnabled, dataYear, region] = await Promise.all([
      getSetting('aiEnabled', true),
      getSetting('dataYear',  CURRENT_YEAR),
      getSetting('region',    'IN'),
    ]);
    set({ aiEnabled, dataYear, region, hydrated: true });
  },

  /** Toggle AI parsing on/off and persist the preference. */
  setAiEnabled: async (value) => {
    set({ aiEnabled: value });
    await setSetting('aiEnabled', value);
  },

  /**
   * Set API key for the current session only (never written to IndexedDB).
   * If the user provides the key via .env, it is pre-populated from env.
   */
  setApiKey: (key) => {
    set({ apiKey: key.trim() });
  },

  /** Change the emission-factor dataset year. */
  setDataYear: async (year) => {
    set({ dataYear: year });
    await setSetting('dataYear', year);
  },

  /** Change the emission-factor region. */
  setRegion: async (region) => {
    set({ region });
    await setSetting('region', region);
  },
}));
