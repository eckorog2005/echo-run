import { INPUT_SCALE } from './constants.ts';
import type { GameState, StepEvent } from './model.ts';
import { createGame, step } from './sim.ts';

/** Ticks to linger on the final frame before the replay reports it is done. */
const END_HOLD_TICKS = 45;

/**
 * Plays a finished run back by re-simulating it from its seed and input log,
 * so every frame is a real GameState produced by the same rules as live play.
 */
export class Replay {
  readonly state: GameState;
  /** Rounds the run reached, including the one it ended in. */
  readonly rounds: number;
  done = false;
  private readonly inputs: readonly number[];
  private next = 0;
  private hold = 0;

  constructor(game: GameState) {
    this.state = createGame(game.seed);
    this.rounds = game.round + 1;
    this.inputs = game.inputs.slice();
  }

  /** 0-based round currently being replayed. */
  get round(): number {
    return this.state.round;
  }

  /** Replays one tick and returns its events; after the last input, holds on the final frame. */
  advance(): StepEvent[] {
    if (this.done) return [];
    if (this.next < this.inputs.length) {
      const x = (this.inputs[this.next] ?? 0) / INPUT_SCALE;
      const y = (this.inputs[this.next + 1] ?? 0) / INPUT_SCALE;
      this.next += 2;
      return step(this.state, { x, y });
    }
    if (++this.hold > END_HOLD_TICKS) this.done = true;
    return [];
  }
}
