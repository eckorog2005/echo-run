import { describe, expect, it } from 'vitest';
import { isPhone, layout, toArenaDirection, type ArenaView, type Rect } from '../../src/render/view.ts';

const view = (width: number, height: number): ArenaView => layout({ width, height }, false, 'right').view;

describe('layout', () => {
  it('fills a landscape desktop stage with the upright arena and leaves the HUD to the page', () => {
    expect(layout({ width: 1024, height: 724 }, false, 'right')).toEqual({
      hud: null,
      timer: null,
      arena: { x: 12, y: 12, width: 1000, height: 700 },
      pad: null,
      view: { rotated: false, scale: 1, offsetX: 12, offsetY: 12 },
    });
  });

  it('rotates the arena on a portrait stage so it fills the height', () => {
    expect(layout({ width: 724, height: 1024 }, false, 'right')).toMatchObject({
      arena: { x: 12, y: 12, width: 700, height: 1000 },
      view: { rotated: true, scale: 1, offsetX: 12, offsetY: 12 },
    });
  });

  it('picks whichever orientation gives the larger arena on a near-square stage', () => {
    const tall = view(800, 850);
    expect(tall.rotated).toBe(true);
    expect(tall.scale).toBeCloseTo(0.826, 3);

    const wide = view(850, 800);
    expect(wide.rotated).toBe(false);
    expect(wide.scale).toBeCloseTo(0.826, 3);
  });

  it('stays upright when both orientations fit equally', () => {
    expect(view(800, 800).rotated).toBe(false);
  });

  it('never returns a zero scale for a collapsed stage', () => {
    expect(view(0, 0).scale).toBeGreaterThan(0);
  });

  it('gives no steering pad to non-phones, or to landscape phones yet', () => {
    const screens = [[390, 763], [375, 647], [844, 390], [1024, 724], [768, 1024]] as const;
    for (const [width, height] of screens) {
      for (const side of ['left', 'right'] as const) {
        expect(layout({ width, height }, false, side)).toMatchObject({ hud: null, timer: null, pad: null });
      }
    }
    expect(layout({ width: 844, height: 390 }, true, 'right').pad).toBeNull();
  });
});

describe('layout on a portrait phone', () => {
  // A 390×844 phone and a 375×667 phone, measured inside their safe areas.
  const tall = layout({ width: 390, height: 763 }, true, 'right');
  const small = layout({ width: 375, height: 647 }, true, 'right');

  it('stacks a one-row HUD, a full-width rotated arena, the timer row, and the steering pad', () => {
    expect(tall.hud).toEqual({ x: 12, y: 0, width: 366, height: 44 });
    expect(tall.arena.x).toBeCloseTo(12, 5);
    expect(tall.arena.y).toBe(54);
    expect(tall.arena.width).toBeCloseTo(366, 5);
    expect(tall.arena.height).toBeCloseTo(522.86, 2);
    expect(tall.view).toMatchObject({ rotated: true, offsetY: 54 });
    expect(tall.view.offsetX).toBeCloseTo(12, 5);
    expect(tall.view.scale).toBeCloseTo(366 / 700, 5);
    expect(tall.timer?.y).toBeCloseTo(tall.arena.y + tall.arena.height + 10, 5);
    expect(tall.pad?.x).toBe(12);
    expect(tall.pad?.width).toBe(366);
    expect(tall.pad?.height).toBeGreaterThan(140);
    expect(tall.pad?.height).toBeLessThan(150);
    expect((tall.pad?.y ?? 0) + (tall.pad?.height ?? 0)).toBeCloseTo(763, 5);
  });

  it('shrinks the arena on a small phone to keep the steering pad 120px tall', () => {
    expect(small.pad?.height).toBeCloseTo(120, 5);
    expect(small.arena.width).toBeLessThan(351);
    expect(small.arena.x + small.arena.width / 2).toBeCloseTo(375 / 2, 5);
    expect(small.view.scale).toBeCloseTo(small.arena.height / 1000, 5);
  });

  it('keeps every region inside the stage without overlapping', () => {
    for (const [l, stage] of [[tall, { width: 390, height: 763 }], [small, { width: 375, height: 647 }]] as const) {
      const regions = [l.hud, l.arena, l.timer, l.pad].filter((r): r is Rect => r !== null);
      expect(regions).toHaveLength(4);
      for (const r of regions) {
        expect(r.x).toBeGreaterThanOrEqual(0);
        expect(r.y).toBeGreaterThanOrEqual(0);
        expect(r.x + r.width).toBeLessThanOrEqual(stage.width + 1e-9);
        expect(r.y + r.height).toBeLessThanOrEqual(stage.height + 1e-9);
      }
      for (const [i, a] of regions.entries()) {
        for (const b of regions.slice(i + 1)) {
          const apart = a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y;
          expect(apart).toBe(true);
        }
      }
    }
  });
});

describe('isPhone', () => {
  it('counts a coarse-pointer screen whose shorter side is 500px or less as a phone, in either orientation', () => {
    expect(isPhone({ width: 390, height: 844 }, true)).toBe(true);
    expect(isPhone({ width: 844, height: 390 }, true)).toBe(true);
    expect(isPhone({ width: 500, height: 900 }, true)).toBe(true);
  });

  it('leaves tablets and fine-pointer screens on the desktop layout', () => {
    expect(isPhone({ width: 768, height: 1024 }, true)).toBe(false);
    expect(isPhone({ width: 501, height: 900 }, true)).toBe(false);
    expect(isPhone({ width: 390, height: 844 }, false)).toBe(false);
  });
});

describe('toArenaDirection', () => {
  it('leaves steering unchanged when the arena is upright', () => {
    expect(toArenaDirection({ x: 0.5, y: -1 }, false)).toEqual({ x: 0.5, y: -1 });
  });

  it('turns screen-up into arena-left when the arena is rotated clockwise', () => {
    expect(toArenaDirection({ x: 0, y: -1 }, true)).toEqual({ x: -1, y: 0 });
  });

  it('turns screen-right into arena-up when the arena is rotated clockwise', () => {
    expect(toArenaDirection({ x: 1, y: 0 }, true)).toEqual({ x: 0, y: -1 });
  });
});
