import { describe, expect, it } from 'vitest';
import { EDGE_TICKS, GRACE_TICKS, ROUND_TICKS } from '../../src/game/constants.ts';
import type { Echo, GameState, StepEvent, Vec } from '../../src/game/model.ts';
import { advanceEchoes, createGame, step } from '../../src/game/sim.ts';

/** Steers straight at a target each tick. */
function toward(s: GameState, target: Vec): Vec {
  const dx = target.x - s.player.x;
  const dy = target.y - s.player.y;
  const len = Math.hypot(dx, dy);
  return len < 1 ? { x: 0, y: 0 } : { x: dx / len, y: dy / len };
}

function playUntil(s: GameState, done: (e: StepEvent[]) => boolean, pick: (s: GameState) => Vec, max = 5000): StepEvent[] {
  for (let i = 0; i < max; i++) {
    const ev = step(s, pick(s));
    if (done(ev) || s.over) return ev;
  }
  throw new Error('did not finish');
}

function echoAt(points: Vec[], n = 1): Echo {
  const path = new Float32Array(points.flatMap((p) => [p.x, p.y]));
  return { n, path, x: 0, y: 0, live: false, erasedAt: null };
}

describe('step', () => {
  it('turns the route into an echo and resets the round when the orb is collected', () => {
    const s = createGame(1);
    const ev = playUntil(s, (e) => e.some((x) => x.type === 'collect'), (g) => toward(g, g.orb));
    expect(ev[0]).toMatchObject({ type: 'collect', n: 1 });
    expect(s.score).toBe(1);
    expect(s.echoes).toHaveLength(1);
    expect(s.history).toHaveLength(1);
    expect(s.roundTick).toBe(0);
    expect(s.rec).toHaveLength(0);
    expect(s.orb).toEqual(s.course.orbs[1]);
  });

  it('ends the run when the round timer runs out', () => {
    const s = createGame(1);
    for (let i = 0; i < ROUND_TICKS - 1; i++) step(s, { x: 0, y: 0 });
    expect(s.over).toBe(false);
    const ev = step(s, { x: 0, y: 0 });
    expect(ev).toEqual([{ type: 'die', at: s.player, cause: { kind: 'time' } }]);
  });

  it('ignores input once the run is over', () => {
    const s = createGame(1);
    for (let i = 0; i < ROUND_TICKS; i++) step(s, { x: 0, y: 0 });
    const before = { ...s.player };
    expect(step(s, { x: 1, y: 0 })).toEqual([]);
    expect(s.player).toEqual(before);
  });

  it('kills on contact with a live echo', () => {
    const s = createGame(1);
    const still = Array.from({ length: 200 }, () => ({ ...s.player }));
    s.echoes.push(echoAt(still, 3));
    const ev = playUntil(s, (e) => e.length > 0, () => ({ x: 0, y: 0 }));
    expect(ev[0]).toMatchObject({ type: 'die', cause: { kind: 'echo', n: 3 } });
    expect(s.roundTick).toBe(GRACE_TICKS + 1);
  });

  it('erases the oldest echo when the eraser is grabbed', () => {
    const s = createGame(1);
    const far = Array.from({ length: 200 }, () => ({ x: 20, y: 20 }));
    s.echoes.push(echoAt(far, 1), echoAt(far, 2));
    s.eraser = { x: s.player.x + 40, y: s.player.y };
    const ev = playUntil(s, (e) => e.some((x) => x.type === 'erase'), () => ({ x: 1, y: 0 }));
    expect(ev.find((x) => x.type === 'erase')).toMatchObject({ n: 1 });
    expect(s.echoes.map((e) => e.n)).toEqual([2]);
    expect(s.erased).toBe(1);
    expect(s.eraser).toBeNull();
  });

  it('replays identically from the same seed and inputs', () => {
    const run = (): GameState => {
      const s = createGame(2024);
      let i = 0;
      while (!s.over && i++ < 4000) {
        const t = toward(s, s.orb);
        // A wobble so routes aren't straight lines.
        step(s, { x: t.x + Math.sin(i / 9) * 0.6, y: t.y + Math.cos(i / 13) * 0.6 });
      }
      return s;
    };
    const a = run();
    const b = run();
    expect(a.score).toBe(b.score);
    expect(a.player).toEqual(b.player);
    expect(a.history.map((e) => Array.from(e.path))).toEqual(b.history.map((e) => Array.from(e.path)));
  });
});

describe('advanceEchoes', () => {
  const points = Array.from({ length: 100 }, (_, i) => ({ x: i, y: 0 }));

  it('keeps echoes harmless during the grace period', () => {
    const e = echoAt(points);
    advanceEchoes([e], GRACE_TICKS, null);
    expect(e.live).toBe(false);
    advanceEchoes([e], GRACE_TICKS + 1, null);
    expect(e.live).toBe(true);
  });

  it('keeps echoes harmless at the ends of their loop', () => {
    const e = echoAt(points);
    advanceEchoes([e], 100 + EDGE_TICKS - 1 + 100, null); // index EDGE-1 on a later loop
    expect(e.live).toBe(false);
    advanceEchoes([e], 300 - EDGE_TICKS, null); // index 100-EDGE
    expect(e.live).toBe(false);
    advanceEchoes([e], 250, null);
    expect(e.live).toBe(true);
    expect(e.x).toBe(50);
  });
});
