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
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Loading Statistics</h3>
            <p className="text-sm text-[var(--color-text-muted)]">Analyzing crime data...</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-24 rounded-xl animate-shimmer" />
          <div className="h-48 rounded-xl animate-shimmer" />
          <div className="h-32 rounded-xl animate-shimmer" />
        </div>
      </div>
    );
  }

  if (!summary || summary.totalCrimes === 0) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">📊</span>
        </div>
        <h3 className="text-lg font-semibold mb-2">Crime Statistics</h3>
        <p className="text-[var(--color-text-muted)] text-sm max-w-md mx-auto">
          Search for a location to see detailed crime statistics and analysis.
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

  // Calculate category count for subtitle
  const categoryCount = Object.keys(summary.categoryCounts).length;

  return (
    <div className="glass rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-[var(--color-border)] bg-[var(--color-surface)]/50">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shrink-0">
            <span className="text-xl">📊</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Crime Statistics</h3>
            <p className="text-sm text-[var(--color-text-muted)]">
              {categoryCount} categories • Last 30 days
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="stat-card">
            <p className="stat-value gradient-text">
              {summary.totalCrimes.toLocaleString()}
            </p>
            <p className="stat-label">Total Incidents</p>
          </div>
          <div className="stat-card">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: topCategory?.color }}
              />
              <p className="text-lg font-semibold truncate" style={{ color: topCategory?.color }}>
                {topPercentage}%
              </p>
            </div>
            <p className="stat-label truncate" title={topCategory?.fullName}>
              {topCategory?.fullName}
            </p>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="border border-[var(--color-border)] rounded-xl p-4 bg-[var(--color-surface)]/50">
          <h4 className="text-sm font-semibold mb-4 text-[var(--color-text-muted)] uppercase tracking-wider">
            Top Categories
          </h4>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={barData} layout="vertical" margin={{ left: 0, right: 10 }}>
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                width={90}
                tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  boxShadow: 'var(--shadow-card)',
                }}
                formatter={(value, _name, props) => {
                  const payload = props.payload as { fullName: string };
                  return [(value as number).toLocaleString(), payload.fullName];
                }}
                cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }}
              />
              <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                {barData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="border border-[var(--color-border)] rounded-xl p-4 bg-[var(--color-surface)]/50">
          <h4 className="text-sm font-semibold mb-2 text-[var(--color-text-muted)] uppercase tracking-wider">
            Distribution
          </h4>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={3}
                dataKey="value"
                stroke="var(--color-surface)"
                strokeWidth={2}
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
                  boxShadow: 'var(--shadow-card)',
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: '11px' }}
                formatter={(value) => (
                  <span style={{ color: 'var(--color-text-muted)' }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Hotspot Streets */}
        {summary.topStreets.length > 0 && (
          <div className="border border-[var(--color-border)] rounded-xl overflow-hidden bg-[var(--color-surface)]/50">
            <div className="px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface)]/50">
              <h4 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider flex items-center gap-2">
                <span>📍</span> Hotspot Locations
              </h4>
            </div>
            <div className="divide-y divide-[var(--color-border)]">
              {summary.topStreets.slice(0, 5).map((street, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center px-4 py-3 hover:bg-[var(--color-surface-elevated)] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-[var(--color-surface-elevated)] flex items-center justify-center text-xs font-medium text-[var(--color-text-muted)]">
                      {index + 1}
                    </span>
                    <span className="text-sm">{street.street}</span>
                  </div>
                  <span className="font-semibold text-sm px-2 py-1 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary-light)]">
                    {street.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
