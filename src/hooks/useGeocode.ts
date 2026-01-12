import { useQuery } from '@tanstack/react-query';
import { searchLocations, geocodeLocation } from '../services/nominatim';
import type { NominatimResult } from '../types';

export function useLocationSearch(query: string) {
  return useQuery({
    queryKey: ['locationSearch', query],
    queryFn: () => searchLocations(query),
    enabled: query.length >= 3,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useGeocode(query: string | null) {
  return useQuery<NominatimResult | null, Error>({
    queryKey: ['geocode', query],
    queryFn: () => (query ? geocodeLocation(query) : null),
    enabled: !!query,
    staleTime: 1000 * 60 * 30, // 30 minutes
    retry: 1,
  });
}
