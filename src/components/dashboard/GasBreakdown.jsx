/**
 * GasBreakdown.jsx — Kyoto Six gas distribution pie chart.
 *
 * Shows the share of CO2, CH4, N2O, and HFC (grouped from the
 * breakdown field on each ledger row). Offset rows are excluded
 * since they reduce, not emit.
 */

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useLedgerStore } from '../../store/ledgerStore';

const GAS_COLORS = {
  CO2: '#f59e0b',
  CH4: '#ef4444',
  N2O: '#8b5cf6',
  HFC: '#06b6d4',
};

const GAS_LABELS = {
  CO2: 'CO₂',
  CH4: 'CH₄',
  N2O: 'N₂O',
  HFC: 'HFCs',
};

function buildGasData(entries) {
  const totals = { CO2: 0, CH4: 0, N2O: 0, HFC: 0 };

  for (const entry of entries) {
    if (entry.category === 'Offset') continue;
    const bd = entry.breakdown ?? {};
    for (const gas of Object.keys(totals)) {
      totals[gas] += bd[gas] ?? 0;
    }
  }

  return Object.entries(totals)
    .filter(([, v]) => v > 0)
    .map(([gas, value]) => ({
      name:  GAS_LABELS[gas] ?? gas,
      value: parseFloat(value.toFixed(4)),
      color: GAS_COLORS[gas] ?? '#9ca3af',
    }));
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div className="rounded-xl border border-emerald-200 bg-white p-2.5 text-xs shadow-lg">
      <p className="font-semibold text-emerald-900">{name}</p>
      <p className="text-emerald-600">{value.toFixed(4)} kg</p>
    </div>
  );
};

const RADIAN = Math.PI / 180;
const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function GasBreakdown() {
  const entries = useLedgerStore((s) => s.entries);
  const data    = buildGasData(entries);

  return (
    <div className="card p-5">
      <h3 className="mb-4 text-sm font-semibold text-emerald-900">GHG Gas Breakdown</h3>
      {data.length === 0 ? (
        <div className="flex h-48 items-center justify-center text-sm text-emerald-400">
          No emission entries yet.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={85}
              paddingAngle={3}
              dataKey="value"
              labelLine={false}
              label={renderLabel}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '11px' }}
              formatter={(v) => <span className="text-emerald-700">{v}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
