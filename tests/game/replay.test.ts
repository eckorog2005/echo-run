import { describe, expect, it } from 'vitest';
import { Replay } from '../../src/game/replay.ts';
import { createGame, step } from '../../src/game/sim.ts';
import type { GameState, Vec } from '../../src/game/model.ts';

/** Steers at the orb with a wobble, so routes curve and echoes eventually catch the player. */
function wobble(s: GameState, i: number): Vec {
  const dx = s.orb.x - s.player.x;
  const dy = s.orb.y - s.player.y;
  const len = Math.hypot(dx, dy) || 1;
  return { x: dx / len + Math.sin(i / 9) * 0.6, y: dy / len + Math.cos(i / 13) * 0.6 };
}

interface Snapshot {
  tick: number;
  round: number;
  score: number;
  erased: number;
  player: Vec;
  orb: Vec;
  eraser: Vec | null;
  echoes: { n: number; x: number; y: number; live: boolean }[];
  over: boolean;
}

function snap(s: GameState): Snapshot {
  return {
    tick: s.tick,
    round: s.round,
    score: s.score,
    erased: s.erased,
    player: { ...s.player },
    orb: { ...s.orb },
    eraser: s.eraser && { ...s.eraser },
    echoes: s.echoes.map((e) => ({ n: e.n, x: e.x, y: e.y, live: e.live })),
    over: s.over,
  };
}

/** Plays a full run, snapshotting after every tick. */
function liveRun(seed: number): { game: GameState; frames: Snapshot[] } {
  const game = createGame(seed);
  const frames: Snapshot[] = [];
  for (let i = 0; !game.over && i < 20000; i++) {
    step(game, wobble(game, i));
    frames.push(snap(game));
  }
  return { game, frames };
}

describe('Replay', () => {
  it('matches the live run on every tick', () => {
    for (const seed of [7, 2024, 99]) {
      const { game, frames } = liveRun(seed);
      expect(game.over).toBe(true);
      const r = new Replay(game);
      const seen: Snapshot[] = [];
      for (let i = 0; i < frames.length; i++) {
        r.advance();
        seen.push(snap(r.state));
      }
      expect(seen).toEqual(frames);
      expect(r.state.cause).toEqual(game.cause);
    }
  });

  it('holds on the final frame, then finishes', () => {
    const { game, frames } = liveRun(7);
    const r = new Replay(game);
    for (let i = 0; i < frames.length; i++) r.advance();
    expect(r.done).toBe(false);
    for (let i = 0; i < 46; i++) r.advance();
    expect(r.done).toBe(true);
    expect(snap(r.state)).toEqual(frames.at(-1));
  });

  it('shows earlier echoes appearing in order', () => {
    const { game } = liveRun(2024);
    const r = new Replay(game);
    expect(r.rounds).toBe(game.round + 1);
    const seen: number[] = [];
    let lastRound = -1;
    while (!r.done) {
      r.advance();
      if (r.round !== lastRound) {
        lastRound = r.round;
        seen.push(r.state.echoes.length + r.state.erased);
      }
    }
    expect(seen).toEqual(Array.from({ length: r.rounds }, (_, k) => k));
  });

  it('reports each step’s events so the caller can react to them', () => {
    const { game } = liveRun(7);
    const r = new Replay(game);
    const types: string[] = [];
    while (!r.done) for (const ev of r.advance()) types.push(ev.type);
    expect(types.filter((t) => t === 'collect')).toHaveLength(game.score);
    expect(types.at(-1)).toBe('die');
  });
});
