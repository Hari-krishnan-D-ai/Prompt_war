/**
 * Dashboard.jsx — Main overview page.
 *
 * KPI row: Total CO₂-e | Monthly average | Total offset | Net balance
 * Charts:  EmissionsChart (monthly bar) + GasBreakdown (pie) side by side
 * Below:   PerCapitaComparator + LedgerTable
 * Export:  CSV download button
 */

import { useMemo } from 'react';
import { Link }    from 'react-router-dom';
import { Download, PenLine, Leaf, Flame, Zap, TrendingDown } from 'lucide-react';

import { useLedgerStore }  from '../store/ledgerStore';
import { exportCSV }       from '../services/exportService';
import LedgerTable         from '../components/dashboard/LedgerTable';
import EmissionsChart      from '../components/dashboard/EmissionsChart';
import GasBreakdown        from '../components/dashboard/GasBreakdown';
import PerCapitaComparator from '../components/dashboard/PerCapitaComparator';

function KpiCard({ label, value, unit, icon: Icon, tone, id }) {
  const tones = {
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-600',
    amber:   'bg-amber-50  border-amber-200   text-amber-600',
    rose:    'bg-rose-50   border-rose-200    text-rose-600',
    blue:    'bg-zg-50     border-zg-200      text-zg-600',
  };
  return (
    <div className={`card flex items-start gap-4 p-5 border ${tones[tone] ?? tones.emerald}`} id={id}>
      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-emerald-600 truncate">{label}</p>
        <p className="kpi-value mt-0.5 text-2xl">{value}</p>
        <p className="text-xs text-emerald-500">{unit}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const entries   = useLedgerStore((s) => s.entries);
  const totalCO2e = useLedgerStore((s) => s.totalCO2e);
  const loading   = useLedgerStore((s) => s.loading);

  const { emissionsTotal, offsetTotal, monthlyAvg } = useMemo(() => {
    const emissionsEntries = entries.filter((e) => e.category !== 'Offset');
    const offsetEntries    = entries.filter((e) => e.category === 'Offset');
    const emissionsTotal   = emissionsEntries.reduce((s, e) => s + (e.totalCO2e ?? e.co2e ?? 0), 0);
    const offsetTotal      = offsetEntries.reduce((s, e)    => s + Math.abs(e.totalCO2e ?? e.co2e ?? 0), 0);

    // Monthly average over distinct logged months
    const months     = new Set(entries.map((e) => e.savedAt?.slice(0, 7)).filter(Boolean));
    const monthCount = Math.max(1, months.size);
    const monthlyAvg = emissionsTotal / monthCount;

    return { emissionsTotal, offsetTotal, monthlyAvg };
  }, [entries]);

  const netTone = totalCO2e < 0 ? 'blue' : totalCO2e > 100 ? 'rose' : 'emerald';

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center gap-3 text-emerald-600">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-300 border-t-emerald-600" />
        Loading ledger…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-emerald-950">Dashboard</h1>
          <p className="text-xs text-emerald-500 mt-0.5">
            {entries.length === 0
              ? 'Start logging activities to build your carbon ledger.'
              : `${entries.length} entr${entries.length === 1 ? 'y' : 'ies'} logged`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {entries.length > 0 && (
            <button
              onClick={() => exportCSV(entries)}
              className="btn-ghost text-xs"
              id="export-csv-btn"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </button>
          )}
          <Link to="/log" className="btn-primary text-xs" id="log-entry-btn">
            <PenLine className="h-3.5 w-3.5" />
            Log Entry
          </Link>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          id="kpi-total-emissions"
          label="Total Emissions"
          value={emissionsTotal.toFixed(1)}
          unit="kg CO₂-e"
          icon={Flame}
          tone={emissionsTotal > 500 ? 'rose' : emissionsTotal > 100 ? 'amber' : 'emerald'}
        />
        <KpiCard
          id="kpi-monthly-avg"
          label="Monthly Average"
          value={monthlyAvg.toFixed(1)}
          unit="kg CO₂-e / month"
          icon={TrendingDown}
          tone="amber"
        />
        <KpiCard
          id="kpi-total-offset"
          label="Total Offset"
          value={offsetTotal.toFixed(1)}
          unit="kg CO₂-e sequestered"
          icon={Leaf}
          tone="emerald"
        />
        <KpiCard
          id="kpi-net-balance"
          label="Net Balance"
          value={`${totalCO2e < 0 ? '−' : ''}${Math.abs(totalCO2e).toFixed(1)}`}
          unit={totalCO2e < 0 ? 'kg CO₂-e net negative 🎉' : 'kg CO₂-e'}
          icon={Zap}
          tone={netTone}
        />
      </div>

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <EmissionsChart />
        </div>
        <GasBreakdown />
      </div>

      {/* Comparator + Table */}
      <PerCapitaComparator />

      <div>
        <h2 className="mb-3 text-sm font-semibold text-emerald-900">Activity Ledger</h2>
        <LedgerTable />
      </div>

      {/* Empty state CTA */}
      {entries.length === 0 && (
        <div className="card flex flex-col items-center gap-4 py-12 text-center">
          <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center">
            <Leaf className="h-8 w-8 text-emerald-400" />
          </div>
          <div>
            <p className="font-semibold text-emerald-800">Your ledger is empty</p>
            <p className="text-sm text-emerald-500 mt-1">
              Log your first activity to start measuring your CO₂ footprint.
            </p>
          </div>
          <Link to="/log" className="btn-primary" id="dashboard-log-cta">
            <PenLine className="h-4 w-4" />
            Log First Activity
          </Link>
        </div>
      )}
    </div>
  );
}
