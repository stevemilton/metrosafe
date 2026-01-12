import type { CrimeRecord } from '../types';

const POLICE_API_BASE = 'https://data.police.uk/api';
const REQUEST_DELAY_MS = 70; // 15 req/s ≈ 67ms + 3ms buffer
const MAX_RETRIES = 3;

class CrimeFetcherQueue {
  private queue: Array<{
    lat: number;
    lon: number;
    date: string;
    resolve: (value: CrimeRecord[]) => void;
    reject: (error: Error) => void;
  }> = [];
  private isProcessing = false;

  async fetchCrimes(lat: number, lon: number, date: string): Promise<CrimeRecord[]> {
    return new Promise((resolve, reject) => {
      this.queue.push({ lat, lon, date, resolve, reject });
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const request = this.queue.shift()!;
      try {
        const data = await this.fetchWithRetry(request.lat, request.lon, request.date);
        request.resolve(data);
      } catch (error) {
        request.reject(error as Error);
      }
      if (this.queue.length > 0) {
        await this.sleep(REQUEST_DELAY_MS);
      }
    }
    this.isProcessing = false;
  }

  private async fetchWithRetry(lat: number, lon: number, date: string, attempt = 1): Promise<CrimeRecord[]> {
    try {
      const url = `${POLICE_API_BASE}/crimes-street/all-crime?lat=${lat}&lng=${lon}&date=${date}`;
      const response = await fetch(url);

      if (response.status === 429) {
        if (attempt >= MAX_RETRIES) throw new Error('Rate limit exceeded');
        await this.sleep(1000);
        return this.fetchWithRetry(lat, lon, date, attempt + 1);
      }

      if (response.status === 404) {
        return []; // No data for this location
      }

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      if (attempt >= MAX_RETRIES) throw error;
      await this.sleep(500 * attempt);
      return this.fetchWithRetry(lat, lon, date, attempt + 1);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const crimeFetcher = new CrimeFetcherQueue();

export function generateGridCoordinates(
  centerLat: number,
  centerLon: number,
  radiusKm: number
): Array<{ lat: number; lon: number }> {
  const LAT_KM = 0.009; // ~1km in latitude degrees
  const LON_KM = 0.014; // ~1km in longitude degrees at London's latitude
  const points: Array<{ lat: number; lon: number }> = [];
  const steps = Math.ceil(radiusKm);

  for (let latOffset = -steps; latOffset <= steps; latOffset++) {
    for (let lonOffset = -steps; lonOffset <= steps; lonOffset++) {
      const lat = centerLat + latOffset * LAT_KM;
      const lon = centerLon + lonOffset * LON_KM;
      const distance = haversineDistance(centerLat, centerLon, lat, lon);
      if (distance <= radiusKm) {
        points.push({ lat, lon });
      }
    }
  }
  return points;
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function getCurrentMonth(): string {
  const now = new Date();
  // Police API data has ~2 month delay, use 2 months ago
  now.setMonth(now.getMonth() - 2);
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export async function fetchCrimesForArea(
  lat: number,
  lon: number,
  radiusKm = 1,
  onProgress?: (completed: number, total: number) => void
): Promise<CrimeRecord[]> {
  const coordinates = generateGridCoordinates(lat, lon, radiusKm);
  const date = getCurrentMonth();
  const total = coordinates.length;
  let completed = 0;

  const results = await Promise.all(
    coordinates.map(async (coord) => {
      const crimes = await crimeFetcher.fetchCrimes(coord.lat, coord.lon, date);
      completed++;
      onProgress?.(completed, total);
      return crimes;
    })
  );

  // Deduplicate by persistent_id
  const seen = new Set<string>();
  const uniqueCrimes: CrimeRecord[] = [];
  for (const crimes of results) {
    for (const crime of crimes) {
      if (!seen.has(crime.persistent_id)) {
        seen.add(crime.persistent_id);
        uniqueCrimes.push(crime);
      }
    }
  }
  return uniqueCrimes;
}
