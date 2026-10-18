import type { Vec } from '../game/model.ts';
import type { Steering } from './steering.ts';

/** Forwards keyboard and stage pointer events, in stage pixels, to the steering. */
export class Input {
  constructor(private readonly stage: HTMLElement, steering: Steering) {
    window.addEventListener('keydown', (e) => {
      if (steering.keyDown(e.code)) e.preventDefault();
    });
    window.addEventListener('keyup', (e) => steering.keyUp(e.code));
    window.addEventListener('blur', () => steering.blur());

    stage.addEventListener('pointerdown', (e) => {
      if (!steering.press(e.pointerId, this.local(e))) return;
      try {
        stage.setPointerCapture(e.pointerId);
      } catch {
        // Capture is a nicety; dragging still works without it.
      }
    });
    stage.addEventListener('pointermove', (e) => steering.move(e.pointerId, this.local(e)));
    const end = (e: PointerEvent): void => steering.release(e.pointerId);
    stage.addEventListener('pointerup', end);
    stage.addEventListener('pointercancel', end);
  }

  private local(e: PointerEvent): Vec {
    const r = this.stage.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
}
