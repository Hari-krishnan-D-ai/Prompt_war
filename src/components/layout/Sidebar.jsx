/**
 * Sidebar.jsx — Persistent navigation rail + live CO2e badge.
 *
 * Renders a collapsible sidebar on mobile (hamburger toggle) and a fixed
 * rail on desktop. Shows the running net CO2e total from the ledger store.
 * Active route is highlighted via the .nav-link.active class defined in
 * index.css so it auto-adapts to the zero-gravity theme.
 */

import { useState } from 'react';
import { NavLink }  from 'react-router-dom';
import {
  LayoutDashboard,
  PenLine,
  FileSpreadsheet,
  Settings,
  Leaf,
  Menu,
  X,
  Zap,
} from 'lucide-react';
import { useLedgerStore } from '../../store/ledgerStore';

const NAV_ITEMS = [
  { to: '/',            label: 'Dashboard',   icon: LayoutDashboard },
  { to: '/log',         label: 'Log Entry',   icon: PenLine         },
  { to: '/bulk',        label: 'Bulk Upload', icon: FileSpreadsheet },
  { to: '/settings',    label: 'Settings',    icon: Settings        },
];

function CO2eBadge({ total }) {
  const isNegative = total < 0;
  const formatted  = Math.abs(total).toFixed(1);

  return (
    <div
      className={`mx-3 mt-auto mb-4 rounded-xl p-3 text-center transition-all duration-700 ${
        isNegative
          ? 'bg-zg-900/80 border border-zg-600 animate-gravity-glow'
          : 'bg-emerald-50 border border-emerald-200'
      }`}
    >
      <div className="flex items-center justify-center gap-1 mb-0.5">
        {isNegative
          ? <Zap className="h-3.5 w-3.5 text-zg-neon" />
          : <Leaf className="h-3.5 w-3.5 text-emerald-500" />
        }
        <span className={`text-xs font-medium ${isNegative ? 'text-zg-300' : 'text-emerald-600'}`}>
          {isNegative ? 'Net Negative 🎉' : 'Net Balance'}
        </span>
      </div>
      <div className={`text-lg font-bold tabular-nums ${isNegative ? 'gradient-text-zg' : 'text-emerald-900'}`}>
        {isNegative ? '−' : ''}{formatted}
      </div>
      <div className={`text-xs ${isNegative ? 'text-zg-400' : 'text-emerald-500'}`}>kg CO₂-e</div>
    </div>
  );
}

export default function Sidebar() {
  const [open, setOpen]  = useState(false);
  const totalCO2e        = useLedgerStore((s) => s.totalCO2e);
  const isNegative       = totalCO2e < 0;

  const navContent = (
    <nav className="flex h-full flex-col">
      {/* Brand */}
      <div className={`flex items-center gap-2.5 px-4 py-4 border-b ${isNegative ? 'border-zg-700' : 'border-emerald-100'}`}>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${isNegative ? 'bg-zg-500' : 'bg-emerald-600'} shadow`}>
          <Leaf className="h-4 w-4 text-white" />
        </div>
        <div>
          <div className={`text-sm font-bold ${isNegative ? 'text-zg-100' : 'text-emerald-900'}`}>Carbon Ledger</div>
          <div className={`text-xs ${isNegative ? 'text-zg-400' : 'text-emerald-500'}`}>CO₂-e Tracker</div>
        </div>
      </div>

      {/* Nav links */}
      <div className="flex-1 space-y-1 px-2 py-4">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={() => setOpen(false)}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </div>

      {/* Live CO2e badge */}
      <CO2eBadge total={totalCO2e} />
    </nav>
  );

  return (
    <>
      {/* ── Mobile hamburger ──────────────────────────────────────────── */}
      <button
        onClick={() => setOpen(true)}
        className={`fixed top-3 left-3 z-50 flex h-9 w-9 items-center justify-center rounded-lg shadow-md lg:hidden ${
          isNegative ? 'bg-zg-800 text-zg-200' : 'bg-white text-emerald-700'
        }`}
        aria-label="Open navigation"
        id="sidebar-open-btn"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* ── Mobile drawer overlay ─────────────────────────────────────── */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Mobile drawer ────────────────────────────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-60 transform border-r shadow-xl transition-transform duration-200 ease-out lg:hidden ${
          open ? 'translate-x-0 animate-slide-in' : '-translate-x-full'
        } ${isNegative ? 'bg-zg-950 border-zg-700' : 'bg-white border-emerald-100'}`}
      >
        <button
          onClick={() => setOpen(false)}
          className={`absolute top-3 right-3 rounded-lg p-1 ${isNegative ? 'text-zg-400 hover:text-zg-100' : 'text-emerald-400 hover:text-emerald-700'}`}
          aria-label="Close navigation"
          id="sidebar-close-btn"
        >
          <X className="h-5 w-5" />
        </button>
        {navContent}
      </aside>

      {/* ── Desktop fixed sidebar ─────────────────────────────────────── */}
      <aside
        className={`hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:w-60 lg:flex-col border-r transition-colors duration-700 ${
          isNegative ? 'bg-zg-950 border-zg-700' : 'bg-white border-emerald-100'
        }`}
      >
        {navContent}
      </aside>
    </>
  );
}