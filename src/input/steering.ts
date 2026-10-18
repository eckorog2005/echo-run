import type { Vec } from '../game/model.ts';
import type { Layout } from '../render/view.ts';
import { JOY_R, Joystick } from './joystick.ts';

type Key = 'l' | 'r' | 'u' | 'd';

const KEYMAP: Record<string, Key> = {
  ArrowLeft: 'l', KeyA: 'l', ArrowRight: 'r', KeyD: 'r',
  ArrowUp: 'u', KeyW: 'u', ArrowDown: 'd', KeyS: 'd',
};

/** The joystick as drawn: the knob is already clamped to `radius` from the anchor. */
export interface Stick {
  readonly anchor: Vec;
  readonly knob: Vec;
  readonly active: boolean;
  readonly radius: number;
}

/** Which way the player steers each tick, in arena space, from the keyboard and the drag joystick. */
export class Steering {
  private readonly joy = new Joystick();
  private readonly keys = new Set<Key>();
  private playing = false;
  private rotated = false;

  get stick(): Stick {
    const { ax, ay, x, y, active } = this.joy;
    const dx = x - ax, dy = y - ay;
    const k = Math.min(1, JOY_R / (Math.hypot(dx, dy) || 1));
    return { anchor: { x: ax, y: ay }, knob: { x: ax + dx * k, y: ay + dy * k }, active, radius: JOY_R };
  }

  press(id: number, p: Vec): boolean {
    return this.playing && this.joy.press(id, p);
  }

  move(id: number, p: Vec): void {
    this.joy.move(id, p);
  }

  /** Returns whether the key steers. */
  keyDown(code: string): boolean {
    const k = KEYMAP[code];
    if (k) this.keys.add(k);
    return k !== undefined;
  }

  keyUp(code: string): void {
    const k = KEYMAP[code];
    if (k) this.keys.delete(k);
  }

  blur(): void {
    this.keys.clear();
    this.joy.cancel();
  }

  release(id: number): void {
    this.joy.release(id);
  }

  /** Lets go of a held touch so the player never keeps drifting after the screen rearranges. */
  relayout(next: Layout): void {
    this.joy.cancel();
    this.joy.confine(next.pad);
    this.rotated = next.view.rotated;
  }

  direction(playing: boolean): Vec {
    this.playing = playing;
    if (!playing) {
      this.joy.cancel();
      return { x: 0, y: 0 };
    }
    const v = this.screenDirection();
    // 0 - x rather than -x so zero stays +0, not -0.
    return this.rotated ? { x: v.y, y: 0 - v.x } : v;
  }

  private screenDirection(): Vec {
    const x = (this.keys.has('r') ? 1 : 0) - (this.keys.has('l') ? 1 : 0);
    const y = (this.keys.has('d') ? 1 : 0) - (this.keys.has('u') ? 1 : 0);
    if (!x && !y) return this.joy.vector();
    const l = Math.hypot(x, y);
    return { x: x / l, y: y / l };
  }
}
