import { describe, expect, it } from 'vitest';
import { fitArena, toArenaDirection } from '../../src/render/view.ts';

describe('fitArena', () => {
  it('draws the arena upright and centred on a landscape stage', () => {
    expect(fitArena(1024, 724)).toEqual({ rotated: false, scale: 1, offsetX: 12, offsetY: 12 });
  });

  it('rotates the arena on a portrait stage so it fills the height', () => {
    expect(fitArena(724, 1024)).toEqual({ rotated: true, scale: 1, offsetX: 12, offsetY: 12 });
  });

  it('picks whichever orientation gives the larger arena on a near-square stage', () => {
    const tall = fitArena(800, 850);
    expect(tall.rotated).toBe(true);
    expect(tall.scale).toBeCloseTo(0.826, 3);

    const wide = fitArena(850, 800);
    expect(wide.rotated).toBe(false);
    expect(wide.scale).toBeCloseTo(0.826, 3);
  });

  it('stays upright when both orientations fit equally', () => {
    expect(fitArena(800, 800).rotated).toBe(false);
  });

  it('never returns a zero scale for a collapsed stage', () => {
    expect(fitArena(0, 0).scale).toBeGreaterThan(0);
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
