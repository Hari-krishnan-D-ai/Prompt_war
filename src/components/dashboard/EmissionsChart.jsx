/**
 * EmissionsChart.jsx — Monthly CO₂-e bar chart (last 12 months).
 *
 * Aggregates all entries by year+month, plots a Recharts BarChart
 * with dual bars: emissions (positive) and offsets (negative, shown
 * as a green bar below the axis).
 */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { useLedgerStore } from '../../store/ledgerStore';

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function buildMonthlyData(entries) {
  const now    = new Date();
  const months = [];

  // Build last-12-months scaffolding
  for (let i = 11; i >= 0; i--) {
    const d   = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    months.push({
      key,
      label:     `${MONTH_SHORT[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`,
      emissions: 0,
      offsets:   0,
    });
  }

  const monthMap = Object.fromEntries(months.map((m) => [m.key, m]));

  for (const entry of entries) {
    // Derive key from savedAt or year+month fields
    let key;
    if (entry.savedAt) {
      key = entry.savedAt.slice(0, 7); // "YYYY-MM"
    } else if (entry.year && entry.month) {
      const mIdx = MONTH_SHORT.findIndex((m) => entry.month.startsWith(m)) + 1;
      key = `${entry.year}-${String(mIdx).padStart(2, '0')}`;
    }

    if (!key || !monthMap[key]) continue;

    const co2e = entry.totalCO2e ?? entry.co2e ?? 0;
    if (co2e < 0) {
      monthMap[key].offsets += Math.abs(co2e);
    } else {
      monthMap[key].emissions += co2e;
    }
  }

  return months.map((m) => ({
    ...m,
    emissions: parseFloat(m.emissions.toFixed(2)),
    offsets:   parseFloat(m.offsets.toFixed(2)),
  }));
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-emerald-200 bg-white p-3 text-xs shadow-lg">
      <p className="mb-1 font-semibold text-emerald-900">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {p.value.toFixed(2)} kg CO₂-e
        </p>
      ))}
    </div>
  );
};

export default function EmissionsChart() {
  const entries = useLedgerStore((s) => s.entries);
  const data    = buildMonthlyData(entries);

  const hasData = data.some((d) => d.emissions > 0 || d.offsets > 0);

  return (
    <div className="card p-5">
      <h3 className="mb-4 text-sm font-semibold text-emerald-900">Monthly Emissions vs Offsets</h3>
      {!hasData ? (
        <div className="flex h-48 items-center justify-center text-sm text-emerald-400">
          No data yet — log your first entry to see the chart.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="#d1fae5" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: '#059669' }}
              axisLine={{ stroke: '#d1fae5' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#059669' }}
              axisLine={false}
              tickLine={false}
              unit=" kg"
              width={52}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
              formatter={(v) => <span className="text-emerald-700">{v}</span>}
            />
            <ReferenceLine y={0} stroke="#059669" strokeOpacity={0.4} />
            <Bar dataKey="emissions" name="Emissions" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={28} />
            <Bar dataKey="offsets"   name="Offsets"   fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
