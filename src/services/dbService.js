/**
 * dbService.js — IndexedDB persistence layer via the `idb` wrapper.
 *
 * Schema v1:
 *   - "activities"  keyPath: "id" (autoIncrement)  — all logged ActivityEvent ledger rows
 *   - "settings"    keyPath: "key"                  — key/value settings store
 *
 * Migration contract:
 *   Every schema change MUST bump DB_VERSION and add a new case in the
 *   upgradeDB switch block. Never mutate an existing object store in-place.
 */

import { openDB } from 'idb';

const DB_NAME    = 'carbon-ledger';
const DB_VERSION = 1;

/** Singleton promise — opens exactly once per page load. */
let _dbPromise = null;

function getDB() {
  if (!_dbPromise) {
    _dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        // Use a switch with intentional fall-through so each version
        // builds on the previous one.
        switch (oldVersion) {
          case 0: {
            // v1 — initial schema
            const activityStore = db.createObjectStore('activities', {
              keyPath:       'id',
              autoIncrement: true,
            });
            // Indexes for fast filtering
            activityStore.createIndex('by-category',  'category',  { unique: false });
            activityStore.createIndex('by-timestamp', 'timestamp', { unique: false });
            activityStore.createIndex('by-year-month', ['year', 'month'], { unique: false });

            db.createObjectStore('settings', { keyPath: 'key' });
            break;
          }
          // case 1:  /* future v2 migration goes here */ break;
        }
      },
      blocked() {
        console.warn('[dbService] DB upgrade blocked — another tab may be open.');
      },
      blocking() {
        // A newer tab is trying to upgrade; let it proceed.
        _dbPromise = null;
      },
    });
  }
  return _dbPromise;
}

/* ─── Activities ─────────────────────────────────────────────────────────── */

/**
 * Persist a fully-calculated ledger row.
 * @param {Object} row — the output of calculateEmissions / calculateSequestration
 *                       plus the original form fields for display.
 * @returns {number} The assigned auto-increment id.
 */
export async function addActivity(row) {
  const db = await getDB();
  return db.add('activities', { ...row, savedAt: new Date().toISOString() });
}

/**
 * Returns all stored activity rows, newest first.
 * @returns {Promise<Object[]>}
 */
export async function getAllActivities() {
  const db = await getDB();
  const all = await db.getAll('activities');
  return all.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
}

/**
 * Delete a single activity by its auto-increment id.
 * @param {number} id
 */
export async function deleteActivity(id) {
  const db = await getDB();
  return db.delete('activities', id);
}

/**
 * Wipe the entire activities store (used by Settings → "Clear All Data").
 */
export async function clearAllActivities() {
  const db = await getDB();
  return db.clear('activities');
}

/* ─── Settings ───────────────────────────────────────────────────────────── */

/**
 * Read a setting by key.
 * @param {string} key
 * @param {*} defaultValue — returned if the key does not exist
 */
export async function getSetting(key, defaultValue = null) {
  const db = await getDB();
  const record = await db.get('settings', key);
  return record ? record.value : defaultValue;
}

/**
 * Write a setting by key.
 * @param {string} key
 * @param {*} value — must be structured-clone-able (no functions, DOM nodes, etc.)
 */
export async function setSetting(key, value) {
  const db = await getDB();
  return db.put('settings', { key, value });
}
