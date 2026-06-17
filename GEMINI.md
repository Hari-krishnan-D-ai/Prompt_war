# GEMINI.md — Individual Carbon Accounting Engine

## Project Identity
A 100% free, client-side, local-first carbon ledger that converts daily
activities into CO2-equivalent (CO2-e) figures using the Kyoto Six
greenhouse gases and GWP-100 normalization. No backend, no paid
infrastructure — everything runs in the browser.

## Hard Constraints (never violate these)
- Zero paid infrastructure. No server, no paid DB, no paid AI tier. Every
  external call must be replaceable by a free-tier endpoint or a local fallback.
- All persistent data lives in IndexedDB on the user's device. Never assume
  a backend exists.
- Everything under /src/core (carbonMath.js, sequestrationMath.js) must
  stay pure and deterministic — same input, same output, no API calls,
  no randomness, no side effects. This is the scientific core and must be
  unit-testable in isolation.
- Emission factors and GWP constants are NEVER hardcoded inside components
  or in /src/core. They live in versioned JSON under /src/data, keyed by
  year and region, so they can be updated without touching logic.
- Every number shown to the user must be traceable to a source. Any new or
  changed emission factor needs a matching entry in
  /src/data/sourceCitations.md in the same commit.

## Tech Stack
- React 18 + Vite (SPA, no SSR)
- Tailwind CSS — Emerald/Sage green for eco-positive states, amber→red by
  severity for high-emission alerts, neon-blue for the net-negative
  "zero-gravity" state (Phase 4)
- Google Gemini Flash API (free tier, via VITE_GEMINI_API_KEY) for
  natural-language parsing — confirm the current free-tier model name
  before assuming an older version string is still valid
- SheetJS (xlsx) for in-browser Excel read/write
- IndexedDB via the `idb` wrapper for persistence
- Web Workers for anything CPU-heavy (bulk Excel parsing, batch math runs)
  so the UI thread never blocks

## Data Flow (3 input streams → 1 core)
1. Stream A — Natural language: free text → Gemini API → structured
   {category, subType, quantity, unit} → shown to the user for
   confirmation → carbonMath.js → IndexedDB.
2. Stream B — Bulk Excel: template upload → SheetJS parses in a Web
   Worker → rows validated against the Stream C schema → any free-text
   notes batched to Gemini for categorization → carbonMath.js → IndexedDB.
3. Stream C — Manual structured entry: category-specific form (Fossil,
   Fugitive, Electricity, Water, Waste, Travel, Offset) → validated →
   carbonMath.js → IndexedDB.

All three streams must normalize to the same internal `ActivityEvent`
shape before reaching carbonMath.js. If you find yourself adding a
stream-specific `if` inside carbonMath.js, fix the normalization layer
instead — the core must never know which stream produced a row.

## Category Field Reference
- Fossil: Facility, Year, Month, Fuel Type, Unit, Amount Consumed
- Fugitive: Facility, Year, Month, Application Type, Number of Units
- Electricity: Facility, Year, Month, Electricity Type, Electricity
  Source, Unit, Amount Consumed
- Water: Facility, Year, Month, Water Type, Discharge Site, Unit, Amount
- Waste: Facility, Year, Month, Waste Type, Treatment Type, Unit, Amount
- Travel: Facility, Year, Month, Mode of Transport, Distance Travelled (KM)
- Offset: Facility, Year, Month, Number of Trees, Area Covered Under Soil
  (m²), Area Covered Under Grass (m²), Area Covered Under Water (m²)

Final ledger value = sum(Fossil + Fugitive + Electricity + Water + Waste)
− Offset (sequestration). Offset math lives in sequestrationMath.js,
deliberately separate from emissions math for auditability.

## Required Resilience Behaviors
- Offline/quota fallback: if the Gemini call fails or the user is
  offline, fall back to geminiFallbackParser.js (local keyword/regex
  matcher) rather than blocking the log entry.
- Human-in-the-loop confirmation: Stream A and the free-text portion of
  Stream B must always show the parsed result before writing to
  IndexedDB. Never auto-commit an AI guess silently.
- Schema validation before math: every row from every stream passes
  through validators.js before reaching carbonMath.js. Malformed Excel
  rows get flagged with a row number in the UI, never silently dropped
  or silently miscalculated.
- IndexedDB migrations: every schema change needs a version bump and a
  migration function in dbService.js — never mutate the schema in place.
- Privacy toggle: Stream A sends raw user text to Google's servers.
  Settings must expose a clear toggle to disable AI parsing entirely and
  fall back to Stream C only.

## UI Behavior Rules
- Default theme: Emerald/Sage green, minimalist.
- Eco-positive log → glowing green pulse animation.
- High-emission log → flashing alert, severity-scaled (amber → red), not
  a flat binary state.
- Net-negative cumulative ledger (< 0.00 kg CO2-e) → full theme inversion
  to the neon-blue "zero-gravity" aesthetic (Phase 4 / Project
  Antigravity). This checks the running total, not a single entry.

## Build Order
1. carbonMath.js + gwpConstants.js + emissionFactors JSON + validators.js
   — fully unit-tested before any UI work.
2. React shell + Stream C manual forms — app must be fully usable with
   zero external API calls at this stage.
3. dbService.js (IndexedDB + migrations) wired to Stream C.
4. Stream A (Gemini) + ParsedLogConfirm.jsx + geminiFallbackParser.js.
5. Stream B (SheetJS + Web Worker) + bulk-upload-template.xlsx.
6. Dashboard charts (week/quarter/year) + GasBreakdown +
   PerCapitaComparator.
7. Phase 4: sequestrationMath.js, Offset form, zero-gravity inversion.
8. exportService.js (CSV/PDF report) once the rest is stable.

## Commands
- `npm run dev` — local dev server
- `npm run build` — static production build (deployable to any free
  static host)
- `npm test` — run after any change under /src/core or /src/data
- `npm run lint` — before committing

## Environment Variables
- `VITE_GEMINI_API_KEY` — required only for Stream A/B AI parsing; the
  app must degrade gracefully without it (see Resilience Behaviors)

## Things Not To Do
- Don't introduce a backend or paid service "for simplicity" — the
  zero-cost constraint is the point of the project.
- Don't hardcode any emission factor, GWP value, or fuel constant
  directly in a component or in carbonMath.js.
- Don't let carbonMath.js or sequestrationMath.js import React, call
  fetch, or touch IndexedDB directly — keep the core pure.
- Don't auto-commit Gemini's parsed output without a confirmation step.
- Don't assume a specific Gemini model name is still the current
  free-tier option — verify before wiring up geminiService.js.
## Folder structure 
  carbon-accounting-engine/
├── public/
│   ├── favicon.svg
│   └── manifest.json                      # PWA installability
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── index.css                          # Tailwind + custom keyframes
│   │
│   ├── core/                              # Phase 1 — pure, deterministic math only
│   │   ├── carbonMath.js
│   │   ├── gwpConstants.js
│   │   ├── sequestrationMath.js           # Phase 4 offset math, kept separate
│   │   └── validators.js
│   │
│   ├── data/                              # swappable, versioned, citable
│   │   ├── emissionFactors.in.2025.json
│   │   ├── emissionFactors.in.2026.json
│   │   └── sourceCitations.md
│   │
│   ├── workers/
│   │   ├── calc.worker.js
│   │   └── excelParser.worker.js
│   │
│   ├── services/
│   │   ├── geminiService.js
│   │   ├── geminiFallbackParser.js        # offline/quota fallback
│   │   ├── excelService.js
│   │   ├── dbService.js                   # IndexedDB + migrations
│   │   └── exportService.js               # CSV/PDF report
│   │
│   ├── store/
│   │   ├── ledgerStore.js
│   │   └── settingsStore.js               # units, theme, privacy toggle
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.jsx
│   │   │   └── ThemeShell.jsx             # emerald <-> neon-blue inversion
│   │   ├── input/
│   │   │   ├── NaturalLogInput.jsx        # Stream A
│   │   │   ├── ParsedLogConfirm.jsx       # confirmation step
│   │   │   ├── ExcelUploadZone.jsx        # Stream B
│   │   │   └── ManualEntryForm/  
                ├── constants.js
                ├── FormFields.jsx         # Stream C
│   │   │       ├── FossilFuelForm.jsx
│   │   │       ├── FugitiveForm.jsx
│   │   │       ├── ElectricityForm.jsx
│   │   │       ├── WaterForm.jsx
│   │   │       ├── WasteForm.jsx
│   │   │       ├── TravelForm.jsx
│   │   │       └── OffsetForm.jsx
│   │   ├── dashboard/
│   │   │   ├── LedgerTable.jsx
│   │   │   ├── EmissionsChart.jsx
│   │   │   ├── GasBreakdown.jsx
│   │   │   └── PerCapitaComparator.jsx
│   │   └── shared/
│   │       ├── Calendar.jsx
│   │       └── ConfidenceBadge.jsx
│   │
│   ├── hooks/
│   │   ├── useIndexedDB.js
│   │   └── useOnlineStatus.js
│   │
│   └── pages/
│       ├── Dashboard.jsx
│       ├── LogEntry.jsx
│       ├── BulkUpload.jsx
│       └── Settings.jsx
│
├── templates/
│   └── bulk-upload-template.xlsx
├── tests/
│   ├── carbonMath.test.js
│   └── validators.test.js
├── GEMINI.md
├── .env.example
├── tailwind.config.js
├── vite.config.js
└── package.json