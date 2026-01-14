import { LONDON_BOUNDS } from '../types';
import type { NominatimResult } from '../types';
import { isPostcodeFormat, smartPostcodeLookup } from './postcodes';

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
  // Try postcodes.io first for postcode-format queries (more precise)
  if (isPostcodeFormat(query)) {
    const postcodeResult = await smartPostcodeLookup(query);
    if (postcodeResult) {
      // Convert to NominatimResult format for compatibility
      return {
        place_id: Date.now(), // Use timestamp as unique ID
        lat: String(postcodeResult.lat),
        lon: String(postcodeResult.lon),
        display_name: postcodeResult.displayName,
        boundingbox: [], // Not needed for our use case
        type: 'postcode',
        class: 'place',
      };
    }
    // Fall through to Nominatim if postcodes.io fails
  }
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

  // Try postcodes.io first for postcode-format queries
  if (isPostcodeFormat(query)) {
    const postcodeResult = await smartPostcodeLookup(query);
    if (postcodeResult) {
      return [{
        place_id: Date.now(),
        lat: String(postcodeResult.lat),
        lon: String(postcodeResult.lon),
        display_name: postcodeResult.displayName,
        boundingbox: [],
        type: 'postcode',
        class: 'place',
      }];
    }
  }

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
