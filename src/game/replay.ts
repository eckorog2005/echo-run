import type { Echo, GameState, Vec } from './model.ts';
import { advanceEchoes } from './sim.ts';
import { eraserAt, orbAt } from './orbs.ts';
import type { Course } from './orbs.ts';

export interface ReplayFrame {
  round: number;
  rounds: number;
  roundTick: number;
  player: Vec;
  path: Float32Array;
  pathLen: number;
  trail: Vec[];
  echoes: Echo[];
  orb: Vec;
  eraser: Vec | null;
}

/**
 * Plays a finished run back from its stored round paths: round k's route is
 * history[k].path, and the final round is the partial route at death.
 */
export class Replay {
  private readonly paths: Float32Array[];
  private readonly history: Echo[];
  private readonly course: Course;
  round = 0;
  t = 0;
  done = false;
  private hold = 0;

  constructor(game: GameState) {
    this.history = game.history;
    this.course = game.course;
    this.paths = [...game.history.map((e) => e.path), Float32Array.from(game.rec)];
  }

  get rounds(): number {
    return this.paths.length;
  }

  private pathLen(k: number): number {
    return (this.paths[k]?.length ?? 0) / 2;
  }

  advance(): void {
    if (this.done) return;
    if (this.t < this.pathLen(this.round) - 1) {
      this.t++;
    } else if (this.round < this.rounds - 1) {
      this.round++;
      this.t = 0;
    } else if (++this.hold > 45) {
      this.done = true;
    }
  }

  private erasedBy(e: Echo, k: number, t: number): boolean {
    const at = e.erasedAt;
    return !!at && (at.round < k || (at.round === k && at.roundTick <= t + 1));
  }

  frame(): ReplayFrame {
    const k = this.round;
    const t = this.t;
    const path = this.paths[k] ?? new Float32Array(0);
    const echoes = this.history.slice(0, k).filter((e) => !this.erasedBy(e, k, t));
    advanceEchoes(echoes, t + 1, null);
    const trail: Vec[] = [];
    for (let i = Math.max(0, t - 13); i <= t; i++) trail.push({ x: path[i * 2] ?? 0, y: path[i * 2 + 1] ?? 0 });
    const pickedEraser = this.history.some((e) => e.erasedAt?.round === k && e.erasedAt.roundTick <= t + 1);
    return {
      round: k,
      rounds: this.rounds,
      roundTick: t + 1,
      player: { x: path[t * 2] ?? 0, y: path[t * 2 + 1] ?? 0 },
      path,
      pathLen: (t + 1) * 2,
      trail,
      echoes,
      orb: orbAt(this.course, k),
      eraser: pickedEraser ? null : eraserAt(this.course, k),
    };
  }
}
