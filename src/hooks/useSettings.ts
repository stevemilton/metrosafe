import { useEffect, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, readSettings, ensureSettings, updateSettings } from '../db';
import type { AppSettings } from '../types';

export function useSettings() {
  // READ ONLY - liveQuery must not trigger writes
  const settings = useLiveQuery(() => readSettings(), []);

  // Ensure defaults exist on first load (outside liveQuery)
  useEffect(() => {
    if (settings === undefined) return; // still loading
    if (settings === null || settings === undefined) {
      void ensureSettings();
    }
  }, [settings]);

  const update = useCallback(async (updates: Partial<AppSettings>) => {
    await updateSettings(updates);
  }, []);

  return { settings: settings ?? null, updateSettings: update };
}

export function useRecentSearches(limit = 10) {
  return useLiveQuery(() => 
    db.searches.orderBy('timestamp').reverse().limit(limit).toArray()
  , [limit]);
}
