import { describe, expect, it } from 'vitest';
import { isPhone, layout, toArenaDirection, type ArenaView } from '../../src/render/view.ts';

const view = (width: number, height: number): ArenaView => layout({ width, height }, false, 'right').view;

describe('layout', () => {
  it('fills a landscape desktop stage with the upright arena and leaves the HUD to the page', () => {
    expect(layout({ width: 1024, height: 724 }, false, 'right')).toEqual({
      hud: null,
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

  it('gives no screen a steering pad yet, phone or not', () => {
    const screens = [[390, 844], [375, 667], [844, 390], [1024, 724], [768, 1024]] as const;
    for (const [width, height] of screens) {
      for (const phone of [false, true]) {
        for (const side of ['left', 'right'] as const) {
          expect(layout({ width, height }, phone, side).pad).toBeNull();
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
