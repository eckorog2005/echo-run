import { describe, expect, it } from 'vitest';
import { Replay } from '../../src/game/replay.ts';
import { createGame, step } from '../../src/game/sim.ts';
import type { GameState } from '../../src/game/model.ts';

function playRounds(rounds: number): GameState {
  const s = createGame(3);
  while (s.score < rounds) {
    const dx = s.orb.x - s.player.x;
    const dy = s.orb.y - s.player.y;
    const len = Math.hypot(dx, dy) || 1;
    step(s, { x: dx / len, y: dy / len });
    if (s.over) throw new Error('died early');
  }
  for (let i = 0; i < 30; i++) step(s, { x: 0, y: 0 });
  return s;
}

describe('Replay', () => {
  it('walks every round and shows earlier echoes appearing in order', () => {
    const game = playRounds(3);
    const r = new Replay(game);
    expect(r.rounds).toBe(4);
    const seen: number[] = [];
    let guard = 0;
    while (!r.done && guard++ < 10000) {
      const f = r.frame();
      if (f.roundTick === 1) seen.push(f.echoes.length);
      r.advance();
    }
    expect(r.done).toBe(true);
    expect(seen).toEqual([0, 1, 2, 3]);
  });

  it('starts each round on its recorded route', () => {
    const game = playRounds(2);
    const r = new Replay(game);
    const f = r.frame();
    expect(f.player.x).toBeCloseTo(game.history[0]!.path[0]!);
    expect(f.orb).toEqual(game.course.orbs[0]);
  });
});
