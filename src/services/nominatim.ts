import { LONDON_BOUNDS } from '../types';
import type { NominatimResult } from '../types';

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'MetroSafe/1.0 (https://metrosafe.app)';

export function isInLondon(lat: number, lon: number): boolean {
  return (
    lat >= LONDON_BOUNDS.minLat &&
    lat <= LONDON_BOUNDS.maxLat &&
    lon >= LONDON_BOUNDS.minLon &&
    lon <= LONDON_BOUNDS.maxLon
  );
}

export async function geocodeLocation(query: string): Promise<NominatimResult | null> {
  const viewbox = `${LONDON_BOUNDS.minLon},${LONDON_BOUNDS.minLat},${LONDON_BOUNDS.maxLon},${LONDON_BOUNDS.maxLat}`;
  
  const params = new URLSearchParams({
    q: `${query}, London`,
    format: 'json',
    addressdetails: '1',
    limit: '1',
    viewbox,
    bounded: '1',
  });

  const response = await fetch(`${NOMINATIM_BASE}?${params}`, {
    headers: {
      'User-Agent': USER_AGENT,
    },
  });

  if (!response.ok) {
    throw new Error(`Geocoding failed: ${response.status}`);
  }

  const results: NominatimResult[] = await response.json();
  
  if (results.length === 0) {
    return null;
  }

  const result = results[0];
  const lat = parseFloat(result.lat);
  const lon = parseFloat(result.lon);

  if (!isInLondon(lat, lon)) {
    throw new Error('This location is outside Greater London boundaries.');
  }

  return result;
}

export async function searchLocations(query: string): Promise<NominatimResult[]> {
  if (query.length < 3) return [];
  
  const viewbox = `${LONDON_BOUNDS.minLon},${LONDON_BOUNDS.minLat},${LONDON_BOUNDS.maxLon},${LONDON_BOUNDS.maxLat}`;
  
  const params = new URLSearchParams({
    q: `${query}, London`,
    format: 'json',
    addressdetails: '1',
    limit: '5',
    viewbox,
    bounded: '1',
  });

  const response = await fetch(`${NOMINATIM_BASE}?${params}`, {
    headers: {
      'User-Agent': USER_AGENT,
    },
  });

  if (!response.ok) {
    return [];
  }

  const results: NominatimResult[] = await response.json();
  return results.filter(r => isInLondon(parseFloat(r.lat), parseFloat(r.lon)));
}
