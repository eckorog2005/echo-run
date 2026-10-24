import { describe, expect, it } from 'vitest';
import { ERASER_EVERY, ROUND_TICKS, TICK } from '../../src/game/constants.ts';
import type { RunResult } from '../../src/game/session.ts';
import { deathCard, titleCard } from '../../src/ui/cards.ts';

const result = (over: Partial<RunResult> = {}): RunResult => ({
  mode: 'endless',
  outcome: { kind: 'plain' },
  cause: { kind: 'echo', n: 2 },
  score: 3,
  erased: 0,
  best: 7,
  ...over,
});

describe('deathCard', () => {
  it.each([
    [{ kind: 'counted', shareLine: 'Echo Run · 3 orbs' }, { text: 'Daily result saved', muted: false }],
    [{ kind: 'practice' }, { text: 'Practice run', muted: true }],
    [{ kind: 'newBest' }, { text: 'New best', muted: false }],
    [{ kind: 'plain' }, null],
  ] as const)('badges a %o outcome', (outcome, badge) => {
    expect(deathCard(result({ outcome })).badge).toEqual(badge);
  });

  it('gives the share line only for a counted attempt', () => {
    expect(deathCard(result({ mode: 'daily', outcome: { kind: 'counted', shareLine: 'line' } })).shareLine).toBe('line');
    expect(deathCard(result({ mode: 'daily', outcome: { kind: 'practice' } })).shareLine).toBeNull();
  });

  it('names the echo that caught the player', () => {
    expect(deathCard(result()).headline).toBe('Caught by echo #2');
  });

  it('explains a timeout using the real round length', () => {
    const card = deathCard(result({ cause: { kind: 'time' }, score: 0 }));
    expect(card.headline).toBe('Out of time');
    expect(card.summary).toBe(`The orb fades after ${ROUND_TICKS * TICK} seconds. No orbs this time.`);
  });

  it('counts the echoes made and, when there were any, the ones erased', () => {
    expect(deathCard(result({ score: 1 })).summary).toBe('You made 1 echo.');
    expect(deathCard(result({ score: 6, erased: 1 })).summary).toBe('You made 6 echoes and erased 1.');
  });

  it('shows the endless best only for endless runs', () => {
    expect(deathCard(result()).best).toBe(7);
    expect(deathCard(result({ mode: 'daily' })).best).toBeNull();
  });

  it('offers run again, replay, and menu, with run again first', () => {
    expect(deathCard(result()).buttons.map((b) => [b.action, b.style])).toEqual([
      ['again', 'primary'], ['replay', 'secondary'], ['menu', 'ghost'],
    ]);
  });
});

describe('titleCard', () => {
  const fresh = { today: '2026-10-23', daily: null, shareLine: null };
  const played = { today: '2026-10-23', daily: { score: 1, erased: 0, cause: { kind: 'time' } as const }, shareLine: 'line' };

  it('states the real round length and eraser cadence in the legend', () => {
    const text = titleCard(fresh).legend.map((l) => l.text).join(' | ');
    expect(text).toContain(`Reach it within ${ROUND_TICKS * TICK} seconds`);
    expect(text).toContain(`Every ${ERASER_EVERY}th round`);
  });

  it('offers the daily run until it has been played, then practice', () => {
    expect(titleCard(fresh).buttons.map((b) => b.label)).toEqual(['Daily run', 'Endless']);
    expect(titleCard(played).buttons.map((b) => b.label)).toEqual(['Practice daily', 'Endless']);
  });

  it('shows today\'s counted score and share line once played', () => {
    expect(titleCard(fresh)).toMatchObject({ todayScore: null, shareLine: null });
    expect(titleCard(played)).toMatchObject({ todayScore: '1 orb', shareLine: 'line' });
  });
});
