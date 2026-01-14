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
      <div className="card p-6 h-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-secondary)] flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
          </div>
          <div>
            <h3 className="font-semibold text-[var(--color-text)]">Loading Statistics</h3>
            <p className="text-sm text-[var(--color-text-muted)]">Analyzing data...</p>
          </div>
        </div>
        <div className="space-y-4 animate-pulse">
          <div className="grid grid-cols-2 gap-3">
            <div className="h-20 bg-[var(--color-surface-secondary)] rounded-xl" />
            <div className="h-20 bg-[var(--color-surface-secondary)] rounded-xl" />
          </div>
          <div className="h-44 bg-[var(--color-surface-secondary)] rounded-xl" />
          <div className="h-32 bg-[var(--color-surface-secondary)] rounded-xl" />
        </div>
      </div>
    );
  }

  if (!summary || summary.totalCrimes === 0) {
    return (
      <div className="card p-6 text-center h-full flex flex-col items-center justify-center">
        <div className="w-14 h-14 rounded-xl bg-[var(--color-surface-secondary)] flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
        </div>
        <h3 className="font-semibold text-[var(--color-text)] mb-2">Crime Statistics</h3>
        <p className="text-sm text-[var(--color-text-muted)]">
          Search for a location to view statistics
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
  const categoryCount = Object.keys(summary.categoryCounts).length;

  return (
    <div className="card overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-[var(--color-text)]">Crime Statistics</h3>
            <p className="text-xs text-[var(--color-text-muted)]">{categoryCount} categories • Last 30 days</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 overflow-auto space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="stat-card">
            <p className="stat-value gradient-text">{summary.totalCrimes.toLocaleString()}</p>
            <p className="stat-label">Total Incidents</p>
          </div>
          <div className="stat-card">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: topCategory?.color }} />
              <p className="text-lg font-bold" style={{ color: topCategory?.color }}>{topPercentage}%</p>
            </div>
            <p className="stat-label truncate" title={topCategory?.fullName}>{topCategory?.fullName}</p>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-[var(--color-surface-secondary)]/50 rounded-xl p-4">
          <h4 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">Top Categories</h4>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={barData} layout="vertical" margin={{ left: 0, right: 8 }}>
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                width={80}
                tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: 'white',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  boxShadow: 'var(--shadow-md)',
                }}
                formatter={(value, _name, props) => {
                  const payload = props.payload as { fullName: string };
                  return [(value as number).toLocaleString(), payload.fullName];
                }}
                cursor={{ fill: 'rgba(0,0,0,0.04)' }}
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
        <div className="bg-[var(--color-surface-secondary)]/50 rounded-xl p-4">
          <h4 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Distribution</h4>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={60}
                paddingAngle={3}
                dataKey="value"
                stroke="white"
                strokeWidth={2}
              >
                {pieData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'white',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  boxShadow: 'var(--shadow-md)',
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: '10px' }}
                formatter={(value) => <span style={{ color: 'var(--color-text-secondary)' }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Hotspot Streets */}
        {summary.topStreets.length > 0 && (
          <div className="bg-[var(--color-surface-secondary)]/50 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--color-border-light)]">
              <h4 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Hotspots
              </h4>
            </div>
            <div className="divide-y divide-[var(--color-border-light)]">
              {summary.topStreets.slice(0, 5).map((street, index) => (
                <div key={index} className="list-item">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[var(--color-surface)] flex items-center justify-center text-[10px] font-semibold text-[var(--color-text-muted)]">
                      {index + 1}
                    </span>
                    <span className="text-sm text-[var(--color-text-secondary)]">{street.street}</span>
                  </div>
                  <span className="text-sm font-semibold text-[var(--color-primary)]">{street.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
