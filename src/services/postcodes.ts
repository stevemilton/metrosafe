/**
 * Postcodes.io API service for precise UK postcode geocoding
 * https://postcodes.io/ - Free, no API key required
 */

import { isInLondon } from './nominatim';

interface PostcodeResult {
  postcode: string;
  latitude: number;
  longitude: number;
  admin_district: string | null;
  parish: string | null;
  admin_ward: string | null;
  region: string;
  country: string;
}

interface PostcodesApiResponse {
  status: number;
  result: PostcodeResult | null;
}

const POSTCODES_API_BASE = 'https://api.postcodes.io';

// UK postcode regex - matches full postcodes with or without space
// Examples: SW1A 1AA, SW1A1AA, E1 6AN, EC1A 1BB, W1A 0AX
const UK_POSTCODE_REGEX = /^([A-Z]{1,2}[0-9][0-9A-Z]?\s?[0-9][A-Z]{2})$/i;

// Outcode only regex (first part of postcode)
// Examples: SW1A, E1, EC1A, W1A
const UK_OUTCODE_REGEX = /^([A-Z]{1,2}[0-9][0-9A-Z]?)$/i;

/**
 * Check if a string looks like a UK postcode
 */
export function isPostcodeFormat(query: string): boolean {
  const trimmed = query.trim().toUpperCase();
  return UK_POSTCODE_REGEX.test(trimmed) || UK_OUTCODE_REGEX.test(trimmed);
}

/**
 * Normalize postcode format (remove spaces, uppercase)
 */
function normalizePostcode(postcode: string): string {
  return postcode.replace(/\s+/g, '').toUpperCase();
}

/**
 * Lookup a full UK postcode and return lat/lng
 */
export async function lookupPostcode(postcode: string): Promise<{
  lat: number;
  lon: number;
  displayName: string;
  postcode: string;
} | null> {
  const normalized = normalizePostcode(postcode);

  try {
    const response = await fetch(`${POSTCODES_API_BASE}/postcodes/${normalized}`);

    if (!response.ok) {
      if (response.status === 404) {
        return null; // Postcode not found
      }
      throw new Error(`Postcodes.io API error: ${response.status}`);
    }

    const data: PostcodesApiResponse = await response.json();

    if (!data.result) {
      return null;
    }

    const { latitude, longitude, admin_district, admin_ward, region } = data.result;

    // Verify it's in London
    if (!isInLondon(latitude, longitude)) {
      throw new Error('This postcode is outside Greater London boundaries.');
    }

    // Build display name from available data
    const parts = [
      data.result.postcode,
      admin_ward,
      admin_district,
      region,
    ].filter(Boolean);

    return {
      lat: latitude,
      lon: longitude,
      displayName: parts.join(', '),
      postcode: data.result.postcode,
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('outside Greater London')) {
      throw error;
    }
    // For other errors, return null to allow fallback to Nominatim
    console.warn('Postcodes.io lookup failed:', error);
    return null;
  }
}

/**
 * Lookup an outcode (first part of postcode) - returns centroid
 */
export async function lookupOutcode(outcode: string): Promise<{
  lat: number;
  lon: number;
  displayName: string;
  outcode: string;
} | null> {
  const normalized = outcode.replace(/\s+/g, '').toUpperCase();

  try {
    const response = await fetch(`${POSTCODES_API_BASE}/outcodes/${normalized}`);

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Postcodes.io API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.result) {
      return null;
    }

    const { latitude, longitude, admin_district } = data.result;

    // Verify it's in London
    if (!isInLondon(latitude, longitude)) {
      throw new Error('This postcode area is outside Greater London boundaries.');
    }

    const districts = Array.isArray(admin_district) ? admin_district : [admin_district];
    const displayName = `${data.result.outcode}, ${districts[0] || 'London'}`;

    return {
      lat: latitude,
      lon: longitude,
      displayName,
      outcode: data.result.outcode,
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('outside Greater London')) {
      throw error;
    }
    console.warn('Postcodes.io outcode lookup failed:', error);
    return null;
  }
}

/**
 * Smart postcode lookup - tries full postcode first, then outcode
 */
export async function smartPostcodeLookup(query: string): Promise<{
  lat: number;
  lon: number;
  displayName: string;
} | null> {
  const trimmed = query.trim();

  // Try full postcode first
  if (UK_POSTCODE_REGEX.test(trimmed)) {
    const result = await lookupPostcode(trimmed);
    if (result) {
      return {
        lat: result.lat,
        lon: result.lon,
        displayName: result.displayName,
      };
    }
  }

  // Try outcode
  if (UK_OUTCODE_REGEX.test(trimmed)) {
    const result = await lookupOutcode(trimmed);
    if (result) {
      return {
        lat: result.lat,
        lon: result.lon,
        displayName: result.displayName,
      };
    }
  }

  return null;
}
