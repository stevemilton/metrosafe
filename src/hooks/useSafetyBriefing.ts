import { useQuery } from '@tanstack/react-query';
import { generateSafetyBriefing } from '../services/gemini';
import type { CrimeSummary } from '../types';

export function useSafetyBriefing(location: string | null, summary: CrimeSummary | null) {
  return useQuery({
    queryKey: ['safetyBriefing', location, summary?.totalCrimes],
    queryFn: () => generateSafetyBriefing(location!, summary!),
    enabled: !!location && !!summary && summary.totalCrimes > 0,
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    retry: 1,
  });
}
