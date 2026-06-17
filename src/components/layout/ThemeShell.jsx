/**
 * ThemeShell.jsx — Root theme wrapper.
 *
 * Watches the running totalCO2e from ledgerStore and applies
 * data-theme="zero-gravity" to <html> when the net total dips below 0.
 * This triggers the CSS-variable swap in index.css, inverting the entire
 * app palette to neon-blue — Phase 4 "Project Antigravity".
 */

import { useEffect } from 'react';
import { useLedgerStore } from '../../store/ledgerStore';

export default function ThemeShell({ children }) {
  const totalCO2e = useLedgerStore((s) => s.totalCO2e);

  useEffect(() => {
    const root = document.documentElement;
    if (totalCO2e < 0) {
      root.setAttribute('data-theme', 'zero-gravity');
    } else {
      root.removeAttribute('data-theme');
    }
  }, [totalCO2e]);

  return <>{children}</>;
}