import type { Vec } from '../game/model.ts';
import type { Rect } from '../render/view.ts';

export const JOY_R = 38;
const DEAD_ZONE = 5;

/** A floating drag joystick in screen space: press sets the base, dragging steers. */
export class Joystick {
  active = false;
  private id: number | null = null;
  bx = 0;
  by = 0;
  x = 0;
  y = 0;
  private zone: Rect | null = null;

  /** Null takes presses anywhere on the stage. */
  confine(zone: Rect | null): void {
    this.zone = zone && { ...zone };
    if (!this.active) this.settle();
  }

  /** Returns whether this press took the joystick; a second finger can't take it over. */
  press(id: number, p: Vec): boolean {
    if (this.active || !this.inZone(p)) return false;
    this.active = true;
    this.id = id;
    this.bx = this.x = p.x;
    this.by = this.y = p.y;
    return true;
  }

  move(id: number, p: Vec): void {
    if (!this.active || id !== this.id) return;
    this.x = p.x;
    this.y = p.y;
  }

  release(id: number): void {
    if (id === this.id) this.cancel();
  }

  cancel(): void {
    this.active = false;
    this.settle();
  }

  vector(): Vec {
    const { dx, dy, len } = this.offset();
    if (!this.active || len <= DEAD_ZONE) return { x: 0, y: 0 };
    const m = Math.min(len, JOY_R) / JOY_R;
    return { x: (dx / len) * m, y: (dy / len) * m };
  }

  private offset(): { dx: number; dy: number; len: number } {
    const dx = this.x - this.bx, dy = this.y - this.by;
    return { dx, dy, len: Math.hypot(dx, dy) };
  }

  private inZone(p: Vec): boolean {
    const z = this.zone;
    return !z || (p.x >= z.x && p.x <= z.x + z.width && p.y >= z.y && p.y <= z.y + z.height);
  }

  private settle(): void {
    if (!this.zone) return;
    this.bx = this.x = this.zone.x + this.zone.width / 2;
    this.by = this.y = this.zone.y + this.zone.height / 2;
  }
}
