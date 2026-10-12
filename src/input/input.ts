import type { Vec } from '../game/model.ts';
import { Joystick } from './joystick.ts';

const KEYMAP: Record<string, 'l' | 'r' | 'u' | 'd'> = {
  ArrowLeft: 'l', KeyA: 'l', ArrowRight: 'r', KeyD: 'r',
  ArrowUp: 'u', KeyW: 'u', ArrowDown: 'd', KeyS: 'd',
};

/** Keyboard plus a floating drag joystick: press anywhere on the stage and drag to steer. */
export class Input {
  readonly joy = new Joystick();
  joystickEnabled = false;
  private readonly keys = new Set<string>();

  constructor(private readonly stage: HTMLElement) {
    window.addEventListener('keydown', (e) => {
      const k = KEYMAP[e.code];
      if (k) {
        this.keys.add(k);
        e.preventDefault();
      }
    });
    window.addEventListener('keyup', (e) => {
      const k = KEYMAP[e.code];
      if (k) this.keys.delete(k);
    });
    window.addEventListener('blur', () => {
      this.keys.clear();
      this.joy.cancel();
    });

    stage.addEventListener('pointerdown', (e) => {
      if (!this.joystickEnabled || !this.joy.press(e.pointerId, this.local(e))) return;
      try {
        stage.setPointerCapture(e.pointerId);
      } catch {
        // Capture is a nicety; dragging still works without it.
      }
    });
    stage.addEventListener('pointermove', (e) => {
      if (this.joy.active) this.joy.move(e.pointerId, this.local(e));
    });
    const end = (e: PointerEvent): void => this.joy.release(e.pointerId);
    stage.addEventListener('pointerup', end);
    stage.addEventListener('pointercancel', end);
  }

  private local(e: PointerEvent): Vec {
    const r = this.stage.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  direction(): Vec {
    const x = (this.keys.has('r') ? 1 : 0) - (this.keys.has('l') ? 1 : 0);
    const y = (this.keys.has('d') ? 1 : 0) - (this.keys.has('u') ? 1 : 0);
    if (x || y) {
      const l = Math.hypot(x, y);
      return { x: x / l, y: y / l };
    }
    return this.joy.vector();
  }
}
