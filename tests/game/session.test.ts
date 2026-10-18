import { describe, expect, it } from 'vitest';
import { CARD_DELAY_TICKS, ROUND_TICKS } from '../../src/game/constants.ts';
import type { Vec } from '../../src/game/model.ts';
import { Session, type RunResult, type SessionEvent } from '../../src/game/session.ts';
import { memoryStore, type KeyValueStore } from '../../src/storage.ts';

const TODAY = '2026-10-03';
const STILL: Vec = { x: 0, y: 0 };

function session(store: KeyValueStore = memoryStore(), today = TODAY): Session {
  return new Session({ store, today: () => today, randomSeed: () => 42 });
}

/** Steers straight at the orb, using only what the session shows. */
function towardOrb(s: Session): Vec {
  const { player, orb } = s.scene();
  if (!player || !orb) return STILL;
  const dx = orb.x - player.x;
  const dy = orb.y - player.y;
  const len = Math.hypot(dx, dy);
  return len < 1 ? STILL : { x: dx / len, y: dy / len };
}

/** Ticks until an event of the given type appears; returns it and how many ticks it took. */
function tickUntil<T extends SessionEvent['type']>(
  s: Session,
  type: T,
  steer: (s: Session) => Vec = () => STILL,
  max = 10000,
): { event: Extract<SessionEvent, { type: T }>; ticks: number } {
  for (let i = 1; i <= max; i++) {
    const event = s.tick(steer(s)).find((e) => e.type === type);
    if (event) return { event: event as Extract<SessionEvent, { type: T }>, ticks: i };
  }
  throw new Error(`no ${type} event`);
}

/** Plays until death, then waits for the death card. */
function runToCard(s: Session, steer?: (s: Session) => Vec): RunResult {
  tickUntil(s, 'die', steer);
  return tickUntil(s, 'card').event.result;
}

describe('Session', () => {
  it('starts on the title screen showing the demo echoes', () => {
    const s = session();
    expect(s.screen).toBe('title');
    expect(s.scene().player).toBeNull();
    expect(s.scene().echoes.length).toBeGreaterThan(0);
  });

  it('counts the first daily run of the day and gives a share line (story 1)', () => {
    const store = memoryStore();
    const s = session(store);
    s.start('daily');
    expect(s.screen).toBe('play');
    expect(s.hud().mode).toBe(`Daily · ${TODAY}`);
    const result = runToCard(s);
    expect(result.outcome).toEqual({ kind: 'counted', shareLine: `Echo Run ${TODAY} · 0 orbs · out of time` });
    expect(result.cause).toEqual({ kind: 'time' });
    expect(s.titleInfo().daily).toEqual({ score: 0, erased: 0, cause: { kind: 'time' } });
  });

  it('treats later daily runs that day as practice and keeps the saved result (story 2)', () => {
    const store = memoryStore();
    const first = session(store);
    first.start('daily');
    runToCard(first);

    const s = session(store);
    s.start('daily');
    expect(s.hud().mode).toBe(`Daily · ${TODAY} · practice`);
    const result = runToCard(s, towardOrb);
    expect(result.score).toBeGreaterThan(0);
    expect(result.outcome).toEqual({ kind: 'practice' });
    expect(s.hud()).toMatchObject({ bestLabel: 'Today', best: '0' });
  });

  it('shows the day\'s saved score as soon as the counted attempt ends', () => {
    const s = session();
    s.start('daily');
    expect(s.hud()).toMatchObject({ bestLabel: 'Today', best: '–' });
    tickUntil(s, 'die');
    expect(s.hud().best).toBe('0');
    s.menu();
    expect(s.hud().best).toBe('0');
  });

  it('picks up a new day\'s empty record when returning to the menu after midnight', () => {
    const store = memoryStore();
    let today = TODAY;
    const s = new Session({ store, today: () => today, randomSeed: () => 42 });
    s.start('daily');
    runToCard(s);
    today = '2026-10-04';
    s.menu();
    expect(s.hud().best).toBe('–');
    expect(s.titleInfo()).toEqual({ today: '2026-10-04', daily: null, shareLine: null });
    s.start('daily');
    expect(s.hud()).toMatchObject({ mode: 'Daily · 2026-10-04', best: '–' });
    expect(runToCard(s).outcome.kind).toBe('counted');
  });

  it('does not read storage to build the HUD each frame', () => {
    const store = memoryStore();
    let reads = 0;
    const counting: KeyValueStore = { get: (k) => (reads++, store.get(k)), set: (k, v) => store.set(k, v) };
    const s = session(counting);
    s.start('daily');
    reads = 0;
    for (let i = 0; i < 100; i++) {
      s.tick(STILL);
      s.hud();
      s.scene();
    }
    expect(reads).toBe(0);
  });

  it('plays the same daily course every time that day', () => {
    const a = session();
    const b = session(memoryStore());
    a.start('daily');
    b.start('daily');
    expect(a.scene().orb).toEqual(b.scene().orb);
  });

  it('saves a new endless best that survives a reload (story 3)', () => {
    const store = memoryStore();
    const s = session(store);
    s.start('endless');
    expect(s.hud()).toMatchObject({ mode: 'Endless', bestLabel: 'Best', best: '0' });
    const result = runToCard(s, towardOrb);
    expect(result.score).toBeGreaterThan(0);
    expect(result.outcome).toEqual({ kind: 'newBest' });
    expect(result.best).toBe(result.score);

    const reloaded = session(store);
    reloaded.start('endless');
    expect(reloaded.hud().best).toBe(String(result.score));
    const worse = runToCard(reloaded);
    expect(worse.outcome).toEqual({ kind: 'plain' });
    expect(worse.best).toBe(result.score);
  });

  it('shows the death card a fixed number of ticks after dying', () => {
    const s = session();
    s.start('endless');
    const died = tickUntil(s, 'die');
    expect(died.ticks).toBe(ROUND_TICKS);
    expect(s.screen).toBe('dead');
    expect(tickUntil(s, 'card').ticks).toBe(CARD_DELAY_TICKS);
    for (let i = 0; i < 200; i++) expect(s.tick(STILL)).toEqual([]);
  });

  it('returns to the death card when the replay is skipped', () => {
    const s = session();
    s.start('endless');
    const result = runToCard(s, towardOrb);
    s.watchReplay();
    expect(s.screen).toBe('replay');
    s.tick(STILL);
    expect(s.scene().banner).toMatch(/^Replay · round 1 of \d+/);
    s.skipReplay();
    expect(s.screen).toBe('dead');
    expect(s.tick(STILL)).toEqual([{ type: 'card', result }]);
  });

  it('returns to the death card when the replay finishes', () => {
    const s = session();
    s.start('endless');
    const result = runToCard(s);
    s.watchReplay();
    expect(tickUntil(s, 'card').event.result).toEqual(result);
    expect(s.screen).toBe('dead');
  });

  it('highlights the echo that ended the run', () => {
    const s = session();
    s.start('endless');
    let result: RunResult | null = null;
    // Circle the orb before grabbing it so later echoes cross the route.
    for (let i = 0; i < 20000 && !result; i++) {
      const t = towardOrb(s);
      const ev = s.tick({ x: t.x + Math.sin(i / 9) * 0.6, y: t.y + Math.cos(i / 13) * 0.6 });
      result = ev.find((e) => e.type === 'card')?.result ?? null;
    }
    expect(result?.cause.kind).toBe('echo');
    const n = result?.cause.kind === 'echo' ? result.cause.n : -1;
    expect(s.scene().killerN).toBe(n);
  });

  it('ignores steering outside of play and goes back to the title on menu', () => {
    const s = session();
    expect(s.tick({ x: 1, y: 0 })).toEqual([]);
    s.start('endless');
    s.menu();
    expect(s.screen).toBe('title');
    expect(s.scene().player).toBeNull();
    expect(s.hud().score).toBe(0);
  });

  it('reports no round and no time left on the title screen', () => {
    const s = session();
    expect(s.hud()).toMatchObject({ roundLabel: '', timeLeft: 0, secondsLeft: '0.0 s', timerLabel: '' });
    s.start('endless');
    s.menu();
    expect(s.hud()).toMatchObject({ roundLabel: '', timeLeft: 0, secondsLeft: '0.0 s', timerLabel: '' });
  });

  it('reports the round and the time left during play, refilling the timer when an orb is collected', () => {
    const s = session();
    s.start('endless');
    expect(s.hud()).toMatchObject({ roundLabel: 'Round 1', timeLeft: 1, secondsLeft: '7.0 s' });
    for (let i = 0; i < ROUND_TICKS / 2; i++) s.tick(STILL);
    expect(s.hud().timeLeft).toBeCloseTo(0.5, 5);
    expect(s.hud().secondsLeft).toBe('3.5 s');
    for (let i = 0; i < 6; i++) s.tick(STILL);
    expect(s.hud().secondsLeft).toBe('3.4 s');

    tickUntil(s, 'collect', towardOrb);
    expect(s.hud()).toMatchObject({ roundLabel: 'Round 2', timeLeft: 1, timerLabel: 'Round 2 · Endless' });
    s.tick(STILL);
    expect(s.hud().timeLeft).toBeCloseTo(1 - 1 / ROUND_TICKS, 5);
  });

  it('flags low time on the HUD and the scene at the same tick', () => {
    const s = session();
    expect(s.hud().lowTime).toBe(false);
    expect(s.scene().lowTime).toBe(false);
    s.start('endless');
    for (let i = 0; i < 294; i++) s.tick(STILL);
    expect(s.hud()).toMatchObject({ secondsLeft: '2.1 s', lowTime: false });
    expect(s.scene().lowTime).toBe(false);
    s.tick(STILL);
    expect(s.hud().lowTime).toBe(true);
    expect(s.scene().lowTime).toBe(true);
  });

  it('reports the final round with no time left once the run is over', () => {
    const s = session();
    s.start('endless');
    tickUntil(s, 'die');
    expect(s.hud()).toMatchObject({ roundLabel: 'Round 1', timeLeft: 0, secondsLeft: '0.0 s', lowTime: false });
    expect(s.scene().lowTime).toBe(false);
    s.tick(STILL);
    expect(s.hud()).toMatchObject({ roundLabel: 'Round 1', timeLeft: 0 });
  });

  it('reports the replayed round and its time left during a replay', () => {
    const s = session();
    s.start('endless');
    runToCard(s, towardOrb);
    s.watchReplay();
    s.tick(STILL);
    const first = s.hud();
    expect(first.roundLabel).toBe('Round 1');
    expect(first.timeLeft).toBeGreaterThan(0.9);
    expect(first.timeLeft).toBeLessThan(1);
    expect(first).toMatchObject({ secondsLeft: '7.0 s', lowTime: false });

    let reachedRound2 = false;
    for (let i = 0; i < ROUND_TICKS && s.screen === 'replay' && !reachedRound2; i++) {
      s.tick(STILL);
      reachedRound2 = s.hud().roundLabel === 'Round 2';
    }
    expect(reachedRound2).toBe(true);
    expect(s.hud().timeLeft).toBeGreaterThan(0.9);
  });

  it('labels the timer with the round and mode, leaving out the date so practice always shows', () => {
    const store = memoryStore();
    const s = session(store);
    s.start('daily');
    expect(s.hud().timerLabel).toBe('Round 1 · Daily');
    runToCard(s);
    s.start('daily');
    expect(s.hud().timerLabel).toBe('Round 1 · Daily · practice');
  });
});
