import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { CRIME_COLORS } from '../types';
import type { CrimeSummary } from '../types';
import { formatCategoryName } from '../utils/aggregation';

interface StatsDashboardProps {
  summary: CrimeSummary | null;
  isLoading?: boolean;
}

export function StatsDashboard({ summary, isLoading }: StatsDashboardProps) {
  if (isLoading) {
    return (
      <div className="glass rounded-2xl p-6 animate-pulse">
        <div className="h-6 bg-[var(--color-surface-elevated)] rounded w-1/3 mb-6"></div>
        <div className="h-48 bg-[var(--color-surface-elevated)] rounded"></div>
      </div>
    );
  }

  if (!summary || summary.totalCrimes === 0) {
    return (
      <div className="glass rounded-2xl p-6 text-center">
        <p className="text-[var(--color-text-muted)]">
          Search for a location to see crime statistics
        </p>
      </div>
    );
  }

  const barData = Object.entries(summary.categoryCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([category, count]) => ({
      name: formatCategoryName(category).split(' ').slice(0, 2).join(' '),
      fullName: formatCategoryName(category),
      count,
      color: CRIME_COLORS[category] || CRIME_COLORS['other-crime'],
    }));

  const pieData = Object.entries(summary.categoryCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([category, count]) => ({
      name: formatCategoryName(category),
      value: count,
      color: CRIME_COLORS[category] || CRIME_COLORS['other-crime'],
    }));

  const topCategory = barData[0];
  const topPercentage = Math.round((topCategory?.count / summary.totalCrimes) * 100);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-3xl font-bold gradient-primary bg-clip-text text-transparent">
            {summary.totalCrimes.toLocaleString()}
          </p>
          <p className="text-sm text-[var(--color-text-muted)]">Total Incidents</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-xl font-semibold" style={{ color: topCategory?.color }}>
            {topCategory?.fullName}
          </p>
          <p className="text-sm text-[var(--color-text-muted)]">{topPercentage}% of crimes</p>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-lg font-semibold mb-4">Top Crime Categories</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={barData} layout="vertical" margin={{ left: 0, right: 20 }}>
            <XAxis type="number" hide />
            <YAxis 
              type="category" 
              dataKey="name" 
              width={100}
              tick={{ fill: 'var(--color-text)', fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
              }}
              formatter={(value: number, _name: string, props: { payload: { fullName: string } }) => [
                value.toLocaleString(),
                props.payload.fullName
              ]}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {barData.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Pie Chart */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-lg font-semibold mb-4">Crime Distribution</h3>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
              }}
            />
            <Legend
              formatter={(value) => (
                <span style={{ color: 'var(--color-text)', fontSize: '12px' }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Hotspot Streets */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-lg font-semibold mb-4">Hotspot Streets</h3>
        <div className="space-y-2">
          {summary.topStreets.map((street, index) => (
            <div key={index} className="flex justify-between items-center py-2 border-b border-[var(--color-border)] last:border-0">
              <span className="text-[var(--color-text-muted)]">{street.street}</span>
              <span className="font-semibold">{street.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
