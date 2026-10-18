import { describe, expect, it } from 'vitest';
import type { Vec } from '../../src/game/model.ts';
import { Steering } from '../../src/input/steering.ts';
import { layout, type Layout, type Size } from '../../src/render/view.ts';

const screen = (stage: Size, phone: boolean): Layout => ({ ...layout(stage, phone, 'right'), stage });
const desktop = screen({ width: 1024, height: 724 }, false);
const portraitPhone = screen({ width: 390, height: 760 }, true);
const landscapePhone = screen({ width: 844, height: 390 }, true);

function padCentre(at: Layout): Vec {
  const pad = at.pad;
  if (!pad) throw new Error('layout has no pad');
  return { x: pad.x + pad.width / 2, y: pad.y + pad.height / 2 };
}

function steering(at: Layout = desktop): Steering {
  const s = new Steering();
  s.relayout(at);
  s.direction(true);
  return s;
}

describe('Steering', () => {
  it('steers in proportion to how far the thumb drags, from anywhere on a stage layout', () => {
    const s = steering();
    s.press(1, { x: 900, y: 100 });
    s.move(1, { x: 919, y: 100 });
    const v = s.direction(true);
    expect(v.x).toBeCloseTo(0.5, 5);
    expect(v.y).toBeCloseTo(0, 5);
  });

  it('ignores presses outside the steering pad on a phone layout, even if they drag into it', () => {
    const s = steering(landscapePhone);
    const c = padCentre(landscapePhone);
    expect(s.press(1, { x: 400, y: 200 })).toBe(false);
    s.move(1, c);
    s.move(1, { x: c.x + 19, y: c.y });
    expect(s.direction(true)).toEqual({ x: 0, y: 0 });

    expect(s.press(2, c)).toBe(true);
    s.move(2, { x: c.x + 19, y: c.y });
    expect(s.direction(true).x).toBeCloseTo(0.5, 5);
  });

  it('gives no steering when not playing and lets go of a held touch', () => {
    const s = steering();
    s.press(1, { x: 500, y: 300 });
    s.move(1, { x: 600, y: 300 });
    expect(s.direction(false)).toEqual({ x: 0, y: 0 });
    expect(s.stick.active).toBe(false);

    s.move(1, { x: 700, y: 300 });
    expect(s.direction(true)).toEqual({ x: 0, y: 0 });
  });

  it('ignores a press that arrives while not playing', () => {
    const s = steering();
    s.direction(false);
    expect(s.press(1, { x: 500, y: 300 })).toBe(false);
    s.move(1, { x: 600, y: 300 });
    expect(s.direction(true)).toEqual({ x: 0, y: 0 });
  });

  it('lets go of a held touch on relayout and rests the stick at the new pad centre', () => {
    const s = steering(landscapePhone);
    const c = padCentre(landscapePhone);
    s.press(1, c);
    s.move(1, { x: c.x + 30, y: c.y });

    s.relayout(portraitPhone);
    expect(s.direction(true)).toEqual({ x: 0, y: 0 });
    const rest = padCentre(portraitPhone);
    expect(s.stick).toMatchObject({ active: false, anchor: rest, knob: rest });

    s.move(1, { x: rest.x + 30, y: rest.y });
    expect(s.direction(true)).toEqual({ x: 0, y: 0 });
  });

  it('stops steering when the steering thumb lifts', () => {
    const s = steering();
    s.press(1, { x: 500, y: 300 });
    s.move(1, { x: 600, y: 300 });
    s.release(2);
    expect(s.direction(true).x).toBeCloseTo(1, 5);
    s.release(1);
    expect(s.direction(true)).toEqual({ x: 0, y: 0 });
  });

  it('leaves a drag unchanged when the arena is upright', () => {
    const s = steering();
    s.press(1, { x: 500, y: 300 });
    s.move(1, { x: 519, y: 262 });
    const v = s.direction(true);
    expect(v.x).toBeGreaterThan(0);
    expect(v.y).toBeLessThan(0);
    expect(Math.abs(v.y)).toBeGreaterThan(Math.abs(v.x));
  });

  it('turns a drag up the screen into arena-left on a portrait phone, where the arena is rotated', () => {
    const s = steering(portraitPhone);
    const c = padCentre(portraitPhone);
    s.press(1, c);
    s.move(1, { x: c.x, y: c.y - 100 });
    const v = s.direction(true);
    expect(v.x).toBeCloseTo(-1, 5);
    expect(v.y).toBeCloseTo(0, 5);
  });

  it('turns a drag right on the screen into arena-up on a portrait phone', () => {
    const s = steering(portraitPhone);
    const c = padCentre(portraitPhone);
    s.press(1, c);
    s.move(1, { x: c.x + 100, y: c.y });
    const v = s.direction(true);
    expect(v.x).toBeCloseTo(0, 5);
    expect(v.y).toBeCloseTo(-1, 5);
  });

  it('lets held keys win over a held touch', () => {
    const s = steering();
    s.press(1, { x: 500, y: 300 });
    s.move(1, { x: 600, y: 300 });
    expect(s.keyDown('ArrowUp')).toBe(true);
    expect(s.direction(true)).toEqual({ x: 0, y: -1 });

    s.keyUp('ArrowUp');
    expect(s.direction(true).x).toBeCloseTo(1, 5);
  });

  it('normalises diagonal keys so diagonals are no faster', () => {
    const s = steering();
    s.keyDown('KeyD');
    s.keyDown('KeyS');
    const v = s.direction(true);
    expect(v.x).toBeCloseTo(Math.SQRT1_2, 5);
    expect(v.y).toBeCloseTo(Math.SQRT1_2, 5);
  });

  it('reports only steering keys as taken', () => {
    const s = steering();
    expect(s.keyDown('Space')).toBe(false);
    expect(s.direction(true)).toEqual({ x: 0, y: 0 });
  });

  it('lets go of keys and the held touch when the window loses focus', () => {
    const s = steering();
    s.keyDown('ArrowLeft');
    s.press(1, { x: 500, y: 300 });
    s.move(1, { x: 600, y: 300 });
    s.blur();
    expect(s.direction(true)).toEqual({ x: 0, y: 0 });
    s.move(1, { x: 700, y: 300 });
    expect(s.direction(true)).toEqual({ x: 0, y: 0 });
  });

  it('rotates key steering into arena space too', () => {
    const s = steering(portraitPhone);
    s.keyDown('ArrowUp');
    expect(s.direction(true)).toEqual({ x: -1, y: 0 });
  });

  it('gives no key steering while not playing', () => {
    const s = steering();
    s.keyDown('ArrowRight');
    expect(s.direction(false)).toEqual({ x: 0, y: 0 });
  });

  it('keeps the drawn knob inside the joystick radius however far the thumb drags', () => {
    const s = steering(landscapePhone);
    const c = padCentre(landscapePhone);
    s.press(1, c);
    for (const p of [{ x: c.x + 300, y: c.y + 10 }, { x: c.x - 80, y: c.y - 200 }, { x: c.x + 5, y: c.y }]) {
      s.move(1, p);
      const { anchor, knob, radius, active } = s.stick;
      expect(active).toBe(true);
      expect(Math.hypot(knob.x - anchor.x, knob.y - anchor.y)).toBeLessThanOrEqual(radius + 1e-9);
    }
  });
});
