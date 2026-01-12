import { useQuery } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { fetchCrimesForArea } from '../services/policeApi';
import { aggregateCrimeData } from '../utils/aggregation';
import type { CrimeRecord, CrimeSummary } from '../types';

interface UseCrimeDataResult {
  crimes: CrimeRecord[];
  summary: CrimeSummary | null;
  isLoading: boolean;
  error: Error | null;
  progress: { completed: number; total: number };
}

export function useCrimeData(
  lat: number | null,
  lon: number | null,
  radiusKm = 1
): UseCrimeDataResult {
  const [progress, setProgress] = useState({ completed: 0, total: 0 });

  const handleProgress = useCallback((completed: number, total: number) => {
    setProgress({ completed, total });
  }, []);

  const query = useQuery({
    queryKey: ['crimes', lat, lon, radiusKm],
    queryFn: async () => {
      if (lat === null || lon === null) return [];
      setProgress({ completed: 0, total: 0 });
      return fetchCrimesForArea(lat, lon, radiusKm, handleProgress);
    },
    enabled: lat !== null && lon !== null,
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
    retry: 2,
  });

  const summary = query.data ? aggregateCrimeData(query.data) : null;

  return {
    crimes: query.data || [],
    summary,
    isLoading: query.isLoading || query.isFetching,
    error: query.error,
    progress,
  };
}
