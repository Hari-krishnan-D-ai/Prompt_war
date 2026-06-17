/**
 * App.jsx — Root application component.
 *
 * Responsibilities:
 *   1. Hydrate IndexedDB → Zustand stores on first render (useIndexedDB)
 *   2. Wrap the app in ThemeShell (monitors totalCO2e, toggles zero-gravity theme)
 *   3. Provide the persistent Sidebar + main content layout
 *   4. Declare all page routes via React Router v6
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { useIndexedDB } from './hooks/useIndexedDB';
import ThemeShell      from './components/layout/ThemeShell';
import Sidebar         from './components/layout/Sidebar';
import Dashboard       from './pages/Dashboard';
import LogEntry        from './pages/LogEntry';
import BulkUpload      from './pages/BulkUpload';
import Settings        from './pages/Settings';

function AppLayout() {
  // Hydrate both stores from IndexedDB once on mount
  useIndexedDB();

  return (
    <ThemeShell>
      <div className="flex min-h-screen">
        {/* Persistent navigation */}
        <Sidebar />

        {/* Main content area — offset by sidebar width on desktop */}
        <main
          className="flex-1 overflow-y-auto min-h-screen lg:pl-60"
          id="main-content"
        >
          <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-screen-xl mx-auto">
            <Routes>
              <Route path="/"        element={<Dashboard />} />
              <Route path="/log"     element={<LogEntry />}  />
              <Route path="/bulk"    element={<BulkUpload />} />
              <Route path="/settings" element={<Settings />} />
              {/* 404 fallback */}
              <Route path="*" element={
                <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
                  <p className="text-6xl">🌿</p>
                  <h2 className="text-xl font-bold text-emerald-900">Page not found</h2>
                  <a href="/" className="btn-primary">Go to Dashboard</a>
                </div>
              } />
            </Routes>
          </div>
        </main>
      </div>
    </ThemeShell>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}
