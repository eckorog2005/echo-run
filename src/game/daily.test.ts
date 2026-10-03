import { describe, expect, it } from 'vitest';
import { dateKey, loadDaily, recordDaily } from './daily.ts';
import { shareText } from './share.ts';
import { memoryStore } from '../storage.ts';

describe('daily', () => {
  it('formats local dates as YYYY-MM-DD', () => {
    expect(dateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('counts only the first attempt of the day', () => {
    const store = memoryStore();
    expect(recordDaily(store, '2026-10-02', { score: 9, erased: 1, cause: { kind: 'time' } })).toBe(true);
    expect(recordDaily(store, '2026-10-02', { score: 30, erased: 0, cause: { kind: 'time' } })).toBe(false);
    expect(loadDaily(store, '2026-10-02')?.score).toBe(9);
    expect(recordDaily(store, '2026-10-03', { score: 4, erased: 0, cause: { kind: 'time' } })).toBe(true);
  });

  it('ignores corrupt saved data', () => {
    const store = memoryStore();
    store.set('echo-daily:2026-10-02', '{nope');
    expect(loadDaily(store, '2026-10-02')).toBeNull();
  });
});

describe('shareText', () => {
  it('describes an echo death with erasers used', () => {
    expect(shareText('2026-10-02', { score: 14, erased: 2, cause: { kind: 'echo', n: 9 } })).toBe(
      'Echo Run 2026-10-02 · 14 orbs · 2 erased · caught by #9',
    );
  });

  it('omits erasers when none were used and handles one orb', () => {
    expect(shareText('2026-10-02', { score: 1, erased: 0, cause: { kind: 'time' } })).toBe(
      'Echo Run 2026-10-02 · 1 orb · out of time',
    );
  });
});
