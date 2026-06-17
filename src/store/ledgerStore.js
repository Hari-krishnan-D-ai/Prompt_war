/**
 * ledgerStore.js — Global ledger state via Zustand.
 *
 * Single source of truth for all activity entries in memory.
 * Persisted copies live in IndexedDB via dbService.js.
 *
 * Load order: component mounts → calls loadEntries() → reads IndexedDB →
 * populates entries[] → React re-renders with live data.
 */

import { create } from 'zustand';
import {
  getAllActivities,
  addActivity,
  deleteActivity,
  clearAllActivities,
} from '../services/dbService';
import { calculateEmissions }     from '../core/carbonMath';
import { calculateSequestration } from '../core/sequestrationMath';
import { validateActivityEvent }  from '../core/validators';

/**
 * Compute the running total CO2-e from an entries array.
 * Offset rows carry a negative co2e value; all others are positive.
 */
function computeTotal(entries) {
  return entries.reduce((sum, e) => {
    const val = e.totalCO2e ?? e.co2e ?? 0;
    return sum + val;
  }, 0);
}

/**
 * Translate the raw output of any Stream C form into the canonical
 * ActivityEvent shape expected by carbonMath.js / sequestrationMath.js.
 * Each category maps its form-specific field names onto `subType` and `amount`.
 */
function normalizeToActivityEvent(formData) {
  const base = {
    category:  formData.category,
    facility:  formData.facility,
    year:      formData.year,
    month:     formData.month,
    timestamp: formData.timestamp || new Date().toISOString(),
    stream:    formData.stream ?? 'manual',
  };

  switch (formData.category) {
    case 'Fossil':
      return {
        ...base,
        subType: formData.fuelType?.replace(/\s+/g, '_') ?? formData.subType ?? 'Unknown',
        amount:  Number(formData.amount) || 0,
        unit:    formData.unit,
      };
    case 'Fugitive':
      return {
        ...base,
        subType: formData.applicationType?.replace(/\s+/g, '_') ?? formData.subType ?? 'Unknown',
        amount:  Number(formData.units ?? formData.amount) || 0,
        unit:    'kg',
      };
    case 'Electricity':
      return {
        ...base,
        subType: formData.electricityType?.replace(/[\s-]+/g, '_') ?? formData.subType ?? 'Unknown',
        amount:  Number(formData.amount) || 0,
        unit:    formData.unit,
        electricitySource: formData.electricitySource,
      };
    case 'Water':
      return {
        ...base,
        subType: formData.waterType?.replace(/[\s/]+/g, '_') ?? formData.subType ?? 'Unknown',
        amount:  Number(formData.amount) || 0,
        unit:    formData.unit,
        dischargeSite: formData.dischargeSite,
      };
    case 'Waste':
      return {
        ...base,
        subType: formData.wasteType?.replace(/[\s/]+/g, '_') ?? formData.subType ?? 'Unknown',
        amount:  Number(formData.amount) || 0,
        unit:    formData.unit,
        treatmentType: formData.treatmentType,
      };
    case 'Travel':
      return {
        ...base,
        subType: (formData.mode ?? formData.subType ?? 'Unknown').replace(/\s+/g, '_'),
        amount:  Number(formData.distanceKm ?? formData.distance ?? formData.amount) || 0,
        unit:    'km',
      };
    case 'Offset':
      return {
        ...base,
        subType:   formData.subType ?? 'Biological_Sequestration',
        amount:    0, // Offset uses trees/areas, not a single amount
        trees:     Number(formData.trees)     || 0,
        soilArea:  Number(formData.soilArea)  || 0,
        grassArea: Number(formData.grassArea) || 0,
        waterArea: Number(formData.waterArea) || 0,
        unit:      'm²',
      };
    default:
      return {
        ...base,
        subType: formData.subType ?? 'Unknown',
        amount:  Number(formData.amount) || 0,
        unit:    formData.unit ?? '',
      };
  }
}

export const useLedgerStore = create((set, get) => ({
  entries:    [],
  totalCO2e:  0,
  loading:    false,
  error:      null,

  /** Load all entries from IndexedDB into memory. */
  loadEntries: async () => {
    set({ loading: true, error: null });
    try {
      const entries  = await getAllActivities();
      set({ entries, totalCO2e: computeTotal(entries), loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  /**
   * Calculate + persist a new entry, then prepend it to in-memory state.
   *
   * @param {Object} formData    — raw output from any Stream form or the AI confirmation step
   * @param {Object} emissionData — the loaded JSON from src/data/ (injected by the caller)
   * @returns {Object} The fully calculated ledger row (including id assigned by IndexedDB)
   */
  addEntry: async (formData, emissionData) => {
    // Normalise to canonical ActivityEvent shape before validation
    const event = normalizeToActivityEvent(formData);

    // Validate before touching the math core
    validateActivityEvent(event);

    // Route to the correct math function
    let calculated;
    if (event.category === 'Offset') {
      calculated = calculateSequestration(event, emissionData);
    } else {
      calculated = calculateEmissions(event, emissionData);
    }

    // Merge the calculation result with original fields for display
    const ledgerRow = {
      ...event,
      ...calculated,
      stream: formData.stream ?? 'manual',
    };

    // Persist to IndexedDB and get back the auto-assigned id
    const id = await addActivity(ledgerRow);
    const rowWithId = { ...ledgerRow, id };

    set((state) => {
      const entries   = [rowWithId, ...state.entries];
      const totalCO2e = computeTotal(entries);
      return { entries, totalCO2e };
    });

    return rowWithId;
  },

  /**
   * Delete a single entry by IndexedDB id.
   * @param {number} id
   */
  deleteEntry: async (id) => {
    await deleteActivity(id);
    set((state) => {
      const entries   = state.entries.filter((e) => e.id !== id);
      const totalCO2e = computeTotal(entries);
      return { entries, totalCO2e };
    });
  },

  /** Wipe all entries (Settings → Clear All Data). */
  clearAll: async () => {
    await clearAllActivities();
    set({ entries: [], totalCO2e: 0 });
  },
}));
