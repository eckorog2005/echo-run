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

  it('keeps its base where the thumb landed, steering at full speed past the rim', () => {
    const joy = new Joystick();
    joy.press(1, { x: 100, y: 100 });
    joy.move(1, { x: 200, y: 100 });
    expect(joy.vector().x).toBeCloseTo(1, 5);
    expect({ bx: joy.bx, by: joy.by }).toEqual({ bx: 100, by: 100 });

    joy.move(1, { x: 150, y: 100 });
    expect(joy.vector().x).toBeCloseTo(1, 5);
    joy.move(1, { x: 81, y: 100 });
    expect(joy.vector().x).toBeCloseTo(-0.5, 5);
    expect({ bx: joy.bx, by: joy.by }).toEqual({ bx: 100, by: 100 });
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

  it('rests at the centre of its zone while idle and starts from wherever the thumb lands', () => {
    const joy = new Joystick();
    joy.confine({ x: 12, y: 620, width: 366, height: 140 });
    expect({ bx: joy.bx, by: joy.by, x: joy.x, y: joy.y }).toEqual({ bx: 195, by: 690, x: 195, y: 690 });
    expect(joy.vector()).toEqual({ x: 0, y: 0 });

    joy.press(1, { x: 120, y: 740 });
    joy.move(1, { x: 120, y: 721 });
    expect(joy.vector().y).toBeCloseTo(-0.5, 5);

    joy.release(1);
    expect({ bx: joy.bx, by: joy.by, x: joy.x, y: joy.y }).toEqual({ bx: 195, by: 690, x: 195, y: 690 });
  });

  it('ignores presses that start outside its zone, even if they drag into it', () => {
    const joy = new Joystick();
    joy.confine({ x: 12, y: 620, width: 366, height: 140 });
    expect(joy.press(1, { x: 195, y: 300 })).toBe(false);
    joy.move(1, { x: 195, y: 700 });
    expect(joy.active).toBe(false);
    expect(joy.vector()).toEqual({ x: 0, y: 0 });

    expect(joy.press(2, { x: 195, y: 700 })).toBe(true);
  });

  it('takes presses anywhere again once its zone is lifted', () => {
    const joy = new Joystick();
    joy.confine({ x: 12, y: 620, width: 366, height: 140 });
    joy.confine(null);
    expect(joy.press(1, { x: 195, y: 300 })).toBe(true);
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
