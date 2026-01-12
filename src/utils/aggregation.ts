import type { CrimeRecord, CrimeSummary } from '../types';

export function aggregateCrimeData(crimes: CrimeRecord[]): CrimeSummary {
  const categoryCounts: Record<string, number> = {};
  const streetCounts: Record<string, number> = {};
  const monthCounts: Record<string, number> = {};

  for (const crime of crimes) {
    categoryCounts[crime.category] = (categoryCounts[crime.category] || 0) + 1;
    const street = crime.location.street.name;
    streetCounts[street] = (streetCounts[street] || 0) + 1;
    monthCounts[crime.month] = (monthCounts[crime.month] || 0) + 1;
  }

  const topStreets = Object.entries(streetCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([street, count]) => ({ street, count }));

  const months = Object.keys(monthCounts).sort();
  const dateRange = months.length > 0 ? `${months[0]} to ${months[months.length - 1]}` : 'N/A';

  return {
    totalCrimes: crimes.length,
    dateRange,
    categoryCounts,
    topStreets,
    temporalDistribution: { byMonth: monthCounts },
  };
}

export function formatCategoryName(category: string): string {
  return category
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function getCategoryPercentage(summary: CrimeSummary, category: string): number {
  if (summary.totalCrimes === 0) return 0;
  return Math.round(((summary.categoryCounts[category] || 0) / summary.totalCrimes) * 100);
}
