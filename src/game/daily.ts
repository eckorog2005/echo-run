import type { DeathCause } from './model.ts';
import { hashString } from './rng.ts';
import type { KeyValueStore } from '../storage.ts';

export interface DailyRecord {
  score: number;
  erased: number;
  cause: DeathCause;
}

/** Local calendar date as YYYY-MM-DD. */
export function dateKey(d: Date = new Date()): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function dailySeed(key: string): number {
  return hashString(`echo-run/${key}`);
}

const storageKey = (key: string): string => `echo-daily:${key}`;

export function loadDaily(store: KeyValueStore, key: string): DailyRecord | null {
  const raw = store.get(storageKey(key));
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as DailyRecord;
    return typeof v.score === 'number' ? v : null;
  } catch {
    return null;
  }
}

/** Saves only the first attempt of the day. Returns true if this attempt counted. */
export function recordDaily(store: KeyValueStore, key: string, rec: DailyRecord): boolean {
  if (loadDaily(store, key)) return false;
  store.set(storageKey(key), JSON.stringify(rec));
  return true;
}
