import { describe, expect, it } from 'vitest';
import { Joystick } from '../../src/input/joystick.ts';

describe('Joystick', () => {
  it('steers in proportion to how far the thumb moves from where it pressed', () => {
    const joy = new Joystick();
    joy.press(1, { x: 100, y: 100 });
    joy.move(1, { x: 119, y: 100 });
    const v = joy.vector();
    expect(v.x).toBeCloseTo(0.5, 5);
    expect(v.y).toBeCloseTo(0, 5);
  });

  it('gives no steering while the thumb stays within the dead zone', () => {
    const joy = new Joystick();
    joy.press(1, { x: 100, y: 100 });
    expect(joy.vector()).toEqual({ x: 0, y: 0 });
    joy.move(1, { x: 103, y: 103 });
    expect(joy.vector()).toEqual({ x: 0, y: 0 });
    joy.move(1, { x: 105, y: 100 });
    expect(joy.vector()).toEqual({ x: 0, y: 0 });
    joy.move(1, { x: 105.5, y: 100 });
    expect(joy.vector().x).toBeCloseTo(5.5 / 38, 5);
  });

  it('drags the anchor along when the thumb passes the radius so a reversal flips direction at once', () => {
    const joy = new Joystick();
    joy.press(1, { x: 100, y: 100 });
    joy.move(1, { x: 200, y: 100 });
    expect(joy.vector().x).toBeCloseTo(1, 5);
    expect({ ax: joy.ax, ay: joy.ay }).toEqual({ ax: 162, ay: 100 });

    joy.move(1, { x: 150, y: 100 });
    expect(joy.vector().x).toBeCloseTo(-12 / 38, 5);
  });

  it('stops steering when the steering thumb lifts, but not when another finger does', () => {
    const joy = new Joystick();
    joy.press(1, { x: 100, y: 100 });
    joy.move(1, { x: 200, y: 100 });
    joy.release(2);
    expect(joy.vector().x).toBeCloseTo(1, 5);

    joy.release(1);
    expect(joy.active).toBe(false);
    expect(joy.vector()).toEqual({ x: 0, y: 0 });
  });

  it('ignores a second finger while the first is steering', () => {
    const joy = new Joystick();
    expect(joy.press(1, { x: 100, y: 100 })).toBe(true);
    expect(joy.press(2, { x: 300, y: 300 })).toBe(false);
    joy.move(2, { x: 400, y: 300 });
    joy.move(1, { x: 100, y: 119 });
    const v = joy.vector();
    expect(v.x).toBeCloseTo(0, 5);
    expect(v.y).toBeCloseTo(0.5, 5);
  });

  it('rests at its resting anchor while idle and starts from wherever the thumb lands', () => {
    const joy = new Joystick();
    joy.restAt({ x: 195, y: 760 });
    expect({ ax: joy.ax, ay: joy.ay, x: joy.x, y: joy.y }).toEqual({ ax: 195, ay: 760, x: 195, y: 760 });
    expect(joy.vector()).toEqual({ x: 0, y: 0 });

    joy.press(1, { x: 120, y: 740 });
    joy.move(1, { x: 120, y: 721 });
    expect(joy.vector().y).toBeCloseTo(-0.5, 5);

    joy.release(1);
    expect({ ax: joy.ax, ay: joy.ay, x: joy.x, y: joy.y }).toEqual({ ax: 195, ay: 760, x: 195, y: 760 });
  });

  it('keeps its resting anchor when the caller later changes the point it passed', () => {
    const joy = new Joystick();
    const centre = { x: 195, y: 760 };
    joy.restAt(centre);
    centre.x = 0;
    joy.press(1, { x: 50, y: 50 });
    joy.release(1);
    expect({ ax: joy.ax, ay: joy.ay }).toEqual({ ax: 195, ay: 760 });
  });

  it('can be cancelled without knowing which finger is steering, and the thumb must press again', () => {
    const joy = new Joystick();
    joy.press(7, { x: 100, y: 100 });
    joy.move(7, { x: 200, y: 100 });
    joy.cancel();
    expect(joy.active).toBe(false);
    expect(joy.vector()).toEqual({ x: 0, y: 0 });

    joy.move(7, { x: 300, y: 100 });
    expect(joy.vector()).toEqual({ x: 0, y: 0 });
  });
});
