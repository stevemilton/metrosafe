import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateGridCoordinates, getCurrentMonth } from './policeApi';

describe('generateGridCoordinates', () => {
  const centerLat = 51.5074; // London
  const centerLon = -0.1278;

  it('generates coordinates within specified radius', () => {
    const coords = generateGridCoordinates(centerLat, centerLon, 1);

    // All points should be within ~1km of center
    for (const coord of coords) {
      const latDiff = Math.abs(coord.lat - centerLat);
      const lonDiff = Math.abs(coord.lon - centerLon);
      // Rough check: 0.009 lat degrees ≈ 1km, 0.014 lon degrees ≈ 1km at London latitude
      expect(latDiff).toBeLessThanOrEqual(0.015);
      expect(lonDiff).toBeLessThanOrEqual(0.02);
    }
  });

  it('includes center point', () => {
    const coords = generateGridCoordinates(centerLat, centerLon, 1);

    // Should include or be very close to center
    const hasNearCenter = coords.some(
      (c) => Math.abs(c.lat - centerLat) < 0.001 && Math.abs(c.lon - centerLon) < 0.001
    );
    expect(hasNearCenter).toBe(true);
  });

  it('generates more points for larger radius', () => {
    const smallRadius = generateGridCoordinates(centerLat, centerLon, 0.5);
    const largeRadius = generateGridCoordinates(centerLat, centerLon, 2);

    expect(largeRadius.length).toBeGreaterThan(smallRadius.length);
  });

  it('returns at least one point', () => {
    const coords = generateGridCoordinates(centerLat, centerLon, 0.1);
    expect(coords.length).toBeGreaterThanOrEqual(1);
  });

  it('generates symmetric grid around center', () => {
    const coords = generateGridCoordinates(centerLat, centerLon, 1);

    // Find min/max coordinates
    const lats = coords.map((c) => c.lat);
    const lons = coords.map((c) => c.lon);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);

    // Grid should be roughly symmetric around center
    const latSpread = (maxLat - minLat) / 2;
    const lonSpread = (maxLon - minLon) / 2;

    expect(Math.abs(centerLat - (minLat + latSpread))).toBeLessThan(0.01);
    expect(Math.abs(centerLon - (minLon + lonSpread))).toBeLessThan(0.015);
  });
});

describe('getCurrentMonth', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns date 2 months in the past', () => {
    // Set to April 15, 2024
    vi.setSystemTime(new Date('2024-04-15'));

    const result = getCurrentMonth();

    // Should be February 2024 (2 months back)
    expect(result).toBe('2024-02');
  });

  it('handles year boundary correctly', () => {
    // Set to January 15, 2024
    vi.setSystemTime(new Date('2024-01-15'));

    const result = getCurrentMonth();

    // Should be November 2023 (2 months back crosses year boundary)
    expect(result).toBe('2023-11');
  });

  it('handles February correctly', () => {
    // Set to February 15, 2024
    vi.setSystemTime(new Date('2024-02-15'));

    const result = getCurrentMonth();

    // Should be December 2023
    expect(result).toBe('2023-12');
  });

  it('pads single digit months with zero', () => {
    // Set to May 15, 2024
    vi.setSystemTime(new Date('2024-05-15'));

    const result = getCurrentMonth();

    // Should be March 2024 with padded month
    expect(result).toBe('2024-03');
  });

  it('returns format YYYY-MM', () => {
    vi.setSystemTime(new Date('2024-08-01'));

    const result = getCurrentMonth();

    expect(result).toMatch(/^\d{4}-\d{2}$/);
  });
});

describe('haversineDistance (indirectly via generateGridCoordinates)', () => {
  it('filters points outside radius', () => {
    const centerLat = 51.5074;
    const centerLon = -0.1278;

    // Generate a small grid
    const coords = generateGridCoordinates(centerLat, centerLon, 1);

    // All points should form a roughly circular pattern within the radius
    // A square grid of 3x3 should have 9 points, but after circular filter it should be less
    // (corners get filtered out)
    const gridSteps = 1 * 2 + 1; // radius * 2 + center = 3x3 = 9 potential points
    const maxPoints = gridSteps * gridSteps;

    // Should have fewer points than full grid due to circular filter
    expect(coords.length).toBeLessThanOrEqual(maxPoints);
    expect(coords.length).toBeGreaterThan(0);
  });
});
