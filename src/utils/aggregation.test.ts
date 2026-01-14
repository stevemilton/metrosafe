import { describe, it, expect } from 'vitest';
import {
  aggregateCrimeData,
  formatCategoryName,
  getCategoryPercentage,
} from './aggregation';
import type { CrimeRecord, CrimeSummary } from '../types';

// Helper to create mock crime records
function createMockCrime(overrides: Partial<CrimeRecord> = {}): CrimeRecord {
  return {
    category: 'theft-from-the-person',
    location_type: 'Force',
    location: {
      latitude: '51.5074',
      longitude: '-0.1278',
      street: { id: 1, name: 'High Street' },
    },
    context: '',
    outcome_status: null,
    persistent_id: `test-${Math.random()}`,
    id: Math.floor(Math.random() * 10000),
    location_subtype: '',
    month: '2024-01',
    ...overrides,
  };
}

describe('aggregateCrimeData', () => {
  it('returns empty summary for empty array', () => {
    const result = aggregateCrimeData([]);

    expect(result.totalCrimes).toBe(0);
    expect(result.dateRange).toBe('N/A');
    expect(result.categoryCounts).toEqual({});
    expect(result.topStreets).toEqual([]);
    expect(result.temporalDistribution.byMonth).toEqual({});
  });

  it('counts total crimes correctly', () => {
    const crimes = [createMockCrime(), createMockCrime(), createMockCrime()];
    const result = aggregateCrimeData(crimes);

    expect(result.totalCrimes).toBe(3);
  });

  it('aggregates category counts correctly', () => {
    const crimes = [
      createMockCrime({ category: 'burglary' }),
      createMockCrime({ category: 'burglary' }),
      createMockCrime({ category: 'robbery' }),
      createMockCrime({ category: 'violent-crime' }),
    ];
    const result = aggregateCrimeData(crimes);

    expect(result.categoryCounts).toEqual({
      burglary: 2,
      robbery: 1,
      'violent-crime': 1,
    });
  });

  it('identifies top 5 streets by crime count', () => {
    const crimes = [
      // High Street: 4 crimes
      ...Array(4).fill(null).map(() =>
        createMockCrime({ location: { latitude: '51.5', longitude: '-0.1', street: { id: 1, name: 'High Street' } } })
      ),
      // Main Road: 3 crimes
      ...Array(3).fill(null).map(() =>
        createMockCrime({ location: { latitude: '51.5', longitude: '-0.1', street: { id: 2, name: 'Main Road' } } })
      ),
      // Oak Lane: 2 crimes
      ...Array(2).fill(null).map(() =>
        createMockCrime({ location: { latitude: '51.5', longitude: '-0.1', street: { id: 3, name: 'Oak Lane' } } })
      ),
      // Park Avenue: 1 crime
      createMockCrime({ location: { latitude: '51.5', longitude: '-0.1', street: { id: 4, name: 'Park Avenue' } } }),
    ];

    const result = aggregateCrimeData(crimes);

    expect(result.topStreets).toHaveLength(4);
    expect(result.topStreets[0]).toEqual({ street: 'High Street', count: 4 });
    expect(result.topStreets[1]).toEqual({ street: 'Main Road', count: 3 });
    expect(result.topStreets[2]).toEqual({ street: 'Oak Lane', count: 2 });
    expect(result.topStreets[3]).toEqual({ street: 'Park Avenue', count: 1 });
  });

  it('limits top streets to 5', () => {
    const streets = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
    const crimes = streets.map((name) =>
      createMockCrime({ location: { latitude: '51.5', longitude: '-0.1', street: { id: 1, name } } })
    );

    const result = aggregateCrimeData(crimes);

    expect(result.topStreets).toHaveLength(5);
  });

  it('calculates date range correctly', () => {
    const crimes = [
      createMockCrime({ month: '2024-01' }),
      createMockCrime({ month: '2024-03' }),
      createMockCrime({ month: '2024-02' }),
    ];

    const result = aggregateCrimeData(crimes);

    expect(result.dateRange).toBe('2024-01 to 2024-03');
  });

  it('handles single month correctly', () => {
    const crimes = [
      createMockCrime({ month: '2024-06' }),
      createMockCrime({ month: '2024-06' }),
    ];

    const result = aggregateCrimeData(crimes);

    expect(result.dateRange).toBe('2024-06 to 2024-06');
  });

  it('aggregates temporal distribution by month', () => {
    const crimes = [
      createMockCrime({ month: '2024-01' }),
      createMockCrime({ month: '2024-01' }),
      createMockCrime({ month: '2024-02' }),
    ];

    const result = aggregateCrimeData(crimes);

    expect(result.temporalDistribution.byMonth).toEqual({
      '2024-01': 2,
      '2024-02': 1,
    });
  });
});

describe('formatCategoryName', () => {
  it('formats hyphenated category names', () => {
    expect(formatCategoryName('theft-from-the-person')).toBe('Theft From The Person');
    expect(formatCategoryName('violent-crime')).toBe('Violent Crime');
    expect(formatCategoryName('anti-social-behaviour')).toBe('Anti Social Behaviour');
  });

  it('handles single word categories', () => {
    expect(formatCategoryName('burglary')).toBe('Burglary');
    expect(formatCategoryName('robbery')).toBe('Robbery');
  });

  it('handles empty string', () => {
    expect(formatCategoryName('')).toBe('');
  });
});

describe('getCategoryPercentage', () => {
  const mockSummary: CrimeSummary = {
    totalCrimes: 100,
    dateRange: '2024-01 to 2024-03',
    categoryCounts: {
      burglary: 25,
      robbery: 15,
      'violent-crime': 10,
    },
    topStreets: [],
    temporalDistribution: { byMonth: {} },
  };

  it('calculates percentage correctly', () => {
    expect(getCategoryPercentage(mockSummary, 'burglary')).toBe(25);
    expect(getCategoryPercentage(mockSummary, 'robbery')).toBe(15);
    expect(getCategoryPercentage(mockSummary, 'violent-crime')).toBe(10);
  });

  it('returns 0 for non-existent category', () => {
    expect(getCategoryPercentage(mockSummary, 'unknown')).toBe(0);
  });

  it('returns 0 when total crimes is 0', () => {
    const emptySummary: CrimeSummary = {
      ...mockSummary,
      totalCrimes: 0,
    };
    expect(getCategoryPercentage(emptySummary, 'burglary')).toBe(0);
  });

  it('rounds percentages correctly', () => {
    const summary: CrimeSummary = {
      ...mockSummary,
      totalCrimes: 3,
      categoryCounts: { test: 1 },
    };
    // 1/3 = 33.33... should round to 33
    expect(getCategoryPercentage(summary, 'test')).toBe(33);
  });
});
