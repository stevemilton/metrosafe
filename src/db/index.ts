import Dexie from 'dexie';
import type { Table } from 'dexie';
import type { Search, Crime, AppSettings } from '../types';

class MetroSafeDatabase extends Dexie {
  searches!: Table<Search, number>;
  crimes!: Table<Crime, number>;
  settings!: Table<AppSettings, number>;

  constructor() {
    super('MetroSafeDB');
    this.version(1).stores({
      searches: '++id, query, timestamp',
      crimes: '++id, searchId, category, month',
      settings: 'id',
    });
  }
}

export const db = new MetroSafeDatabase();

// READ ONLY - for use in liveQuery
export async function readSettings(): Promise<AppSettings | undefined> {
  return db.settings.get(1);
}

// WRITE - ensure defaults exist (call outside liveQuery)
export async function ensureSettings(): Promise<AppSettings> {
  const existing = await db.settings.get(1);
  if (existing) return existing;

  const defaults: AppSettings = {
    id: 1,
    geminiApiKey: null,
    theme: 'dark',
    defaultTimeRange: '1m',
    showHeatmap: true,
  };

  await db.settings.put(defaults);
  return defaults;
}

// WRITE - update settings
export async function updateSettings(updates: Partial<AppSettings>): Promise<void> {
  const current = await db.settings.get(1);
  if (current) {
    await db.settings.put({ ...current, ...updates, id: 1 });
  } else {
    const defaults: AppSettings = {
      id: 1,
      geminiApiKey: null,
      theme: 'dark',
      defaultTimeRange: '1m',
      showHeatmap: true,
      ...updates,
    };
    await db.settings.put(defaults);
  }
}

// Search history helpers
export async function saveSearch(search: Omit<Search, 'id'>): Promise<number> {
  return db.searches.add(search as Search);
}

export async function getRecentSearches(limit = 10): Promise<Search[]> {
  return db.searches.orderBy('timestamp').reverse().limit(limit).toArray();
}

// Crime data helpers
export async function saveCrimes(searchId: number, crimes: Omit<Crime, 'id' | 'searchId'>[]): Promise<void> {
  await db.crimes.bulkAdd(crimes.map(crime => ({ ...crime, searchId })) as Crime[]);
}

export async function getCrimesForSearch(searchId: number): Promise<Crime[]> {
  return db.crimes.where('searchId').equals(searchId).toArray();
}
