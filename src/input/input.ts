import type { Vec } from '../game/model.ts';

const KEYMAP: Record<string, 'l' | 'r' | 'u' | 'd'> = {
  ArrowLeft: 'l', KeyA: 'l', ArrowRight: 'r', KeyD: 'r',
  ArrowUp: 'u', KeyW: 'u', ArrowDown: 'd', KeyS: 'd',
};

export const JOY_R = 38;

export interface Joystick {
  active: boolean;
  id: number | null;
  ax: number;
  ay: number;
  x: number;
  y: number;
}

/** Keyboard plus a floating drag joystick: press anywhere on the stage and drag to steer. */
export class Input {
  readonly joy: Joystick = { active: false, id: null, ax: 0, ay: 0, x: 0, y: 0 };
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
      this.joy.active = false;
    });

    stage.addEventListener('pointerdown', (e) => {
      if (!this.joystickEnabled || this.joy.active) return;
      const p = this.local(e);
      Object.assign(this.joy, { active: true, id: e.pointerId, ax: p.x, ay: p.y, x: p.x, y: p.y });
      try {
        stage.setPointerCapture(e.pointerId);
      } catch {
        // Capture is a nicety; dragging still works without it.
      }
    });
    stage.addEventListener('pointermove', (e) => {
      const j = this.joy;
      if (!j.active || e.pointerId !== j.id) return;
      const p = this.local(e);
      j.x = p.x;
      j.y = p.y;
      // Drag the anchor along so reversing direction is instant.
      const dx = j.x - j.ax, dy = j.y - j.ay, len = Math.hypot(dx, dy);
      if (len > JOY_R) {
        j.ax = j.x - (dx / len) * JOY_R;
        j.ay = j.y - (dy / len) * JOY_R;
      }
    });
    const end = (e: PointerEvent): void => {
      if (e.pointerId === this.joy.id) this.joy.active = false;
    };
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
    const j = this.joy;
    if (j.active) {
      const dx = j.x - j.ax, dy = j.y - j.ay, len = Math.hypot(dx, dy);
      if (len > 5) {
        const m = Math.min(len, JOY_R) / JOY_R;
        return { x: (dx / len) * m, y: (dy / len) * m };
      }
    }
    return { x: 0, y: 0 };
  }
}
