import { describe, expect, it } from 'vitest';
import { hashString, mulberry32 } from './rng.ts';
import { dailySeed } from './daily.ts';

describe('mulberry32', () => {
  it('produces the same sequence for the same seed', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    for (let i = 0; i < 50; i++) expect(a()).toBe(b());
  });

  it('stays within [0, 1)', () => {
    const r = mulberry32(7);
    for (let i = 0; i < 1000; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('seeds', () => {
  it('hashes strings deterministically', () => {
    expect(hashString('echo')).toBe(hashString('echo'));
    expect(hashString('echo')).not.toBe(hashString('echp'));
  });

  it('gives different dates different daily seeds', () => {
    expect(dailySeed('2026-10-02')).not.toBe(dailySeed('2026-10-03'));
  });
});
