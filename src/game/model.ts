import type { Course } from './orbs.ts';

export interface Vec {
  x: number;
  y: number;
}

export interface Echo {
  /** 1-based: echo #n was made by collecting the nth orb. */
  n: number;
  /** Flat [x0, y0, x1, y1, ...] positions, one pair per tick of the round that made it. */
  path: Float32Array;
  x: number;
  y: number;
  live: boolean;
}

export type DeathCause = { kind: 'echo'; n: number } | { kind: 'time' };

export interface GameState {
  seed: number;
  course: Course;
  tick: number;
  /** 0-based index of the round in progress; equals orbs collected so far. */
  round: number;
  roundTick: number;
  score: number;
  erased: number;
  player: Vec;
  /** Positions recorded this round; becomes the next echo. */
  rec: number[];
  /** Echoes currently in play, oldest first. */
  echoes: Echo[];
  /**
   * Every tick's steering input as flat [x0, y0, x1, y1, ...] grid steps in
   * -INPUT_SCALE..INPUT_SCALE. Together with `seed` this reproduces the run.
   */
  inputs: number[];
  orb: Vec;
  eraser: Vec | null;
  over: boolean;
  cause: DeathCause | null;
}

export type StepEvent =
  | { type: 'collect'; at: Vec; n: number }
  | { type: 'erase'; at: Vec; n: number | null }
  | { type: 'die'; at: Vec; cause: DeathCause };
