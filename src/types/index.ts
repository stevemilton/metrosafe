// src/types/index.ts
export interface NominatimResult { place_id: number; lat: string; lon: string; display_name: string; boundingbox: string[]; type: string; class: string; }

export const LONDON_BOUNDS = { minLat: 51.2867, maxLat: 51.6918, minLon: -0.5103, maxLon: 0.3340 };

export interface CrimeRecord { category: string; location_type: string; location: { latitude: string; longitude: string; street: { id: number; name: string; }; }; context: string; outcome_status: { category: string; date: string; } | null; persistent_id: string; id: number; location_subtype: string; month: string; }

export interface Search { id?: number; query: string; location: { lat: number; lon: number; displayName: string; }; timestamp: number; crimeCount: number; }

export interface Crime { id?: number; searchId: number; category: string; latitude: number; longitude: number; street: string; month: string; persistentId: string; }

export interface AppSettings { id?: number; geminiApiKey: string | null; theme: "light" | "dark"; defaultTimeRange: "1m" | "3m" | "12m"; showHeatmap: boolean; }

export interface CrimeSummary { totalCrimes: number; dateRange: string; categoryCounts: Record<string, number>; topStreets: Array<{ street: string; count: number }>; temporalDistribution: { byMonth: Record<string, number>; }; }

export interface LocationData { lat: number; lon: number; displayName: string; }

export const CRIME_COLORS: Record<string, string> = { "violent-crime": "#ef4444", "robbery": "#ef4444", "theft-from-the-person": "#f59e0b", "burglary": "#8b5cf6", "anti-social-behaviour": "#0ea5e9", "vehicle-crime": "#10b981", "other-crime": "#6b7280" };
