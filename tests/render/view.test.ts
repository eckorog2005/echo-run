import { describe, expect, it } from 'vitest';
import { WORLD_H, WORLD_W } from '../../src/game/constants.ts';
import type { Vec } from '../../src/game/model.ts';
import { isPhone, layout, wrapText, type ArenaView, type Rect } from '../../src/render/view.ts';

const view = (width: number, height: number): ArenaView => layout({ width, height }, false, 'right').view;

describe('layout', () => {
  it('fills a landscape desktop stage with the upright arena and leaves the HUD to the page', () => {
    expect(layout({ width: 1024, height: 724 }, false, 'right')).toEqual({
      kind: 'stage',
      hud: null,
      timer: null,
      sheet: null,
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

  it('gives no steering pad to non-phones', () => {
    const screens = [[390, 763], [375, 647], [844, 390], [1024, 724], [768, 1024]] as const;
    for (const [width, height] of screens) {
      for (const side of ['left', 'right'] as const) {
        expect(layout({ width, height }, false, side)).toMatchObject({ kind: 'stage', hud: null, timer: null, pad: null, sheet: null });
      }
    }
  });
});

describe('layout on a portrait phone', () => {
  // A 390×844 phone and a 375×667 phone, measured inside their safe areas.
  const tall = layout({ width: 390, height: 763 }, true, 'right');
  const small = layout({ width: 375, height: 647 }, true, 'right');

  it('stacks a one-row HUD, a full-width rotated arena, the timer row, and the steering pad', () => {
    expect(tall.kind).toBe('portrait');
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
    expectTiled(tall, { width: 390, height: 763 });
    expectTiled(small, { width: 375, height: 647 });
  });

  it('lets cards cover everything below the HUD row', () => {
    expect(tall.sheet).toEqual({ x: 0, y: 44, width: 390, height: 763 - 44 });
  });

  it('ignores the pad side', () => {
    expect(layout({ width: 390, height: 763 }, true, 'left')).toEqual(tall);
  });
});

describe('layout on a landscape phone', () => {
  const right = layout({ width: 844, height: 390 }, true, 'right');
  const left = layout({ width: 844, height: 390 }, true, 'left');

  it('draws the arena upright at full height between the HUD column and the steering pad, pad on the right by default', () => {
    expect(right.kind).toBe('landscape');
    expect(right.view.rotated).toBe(false);
    expect(right.arena.y).toBeCloseTo(12, 5);
    expect(right.arena.height).toBeCloseTo(366, 5);
    expect(right.view.scale).toBeCloseTo(366 / 700, 5);
    expect(right.hud?.x).toBe(12);
    expect(right.timer?.x).toBe(12);
    expect(right.arena.x).toBeGreaterThan((right.hud?.x ?? 0) + (right.hud?.width ?? 0));
    expect(right.pad?.x).toBeGreaterThan(right.arena.x + right.arena.width);
    expect((right.pad?.x ?? 0) + (right.pad?.width ?? 0)).toBeCloseTo(844 - 12, 5);
    expect(right.pad?.width).toBeGreaterThan(160);
  });

  it('mirrors the row when the pad side is left', () => {
    expect(left.pad?.x).toBe(12);
    expect(left.arena.x).toBeGreaterThan((left.pad?.x ?? 0) + (left.pad?.width ?? 0));
    expect(left.hud?.x).toBeGreaterThan(left.arena.x + left.arena.width);
    expect((left.hud?.x ?? 0) + (left.hud?.width ?? 0)).toBeCloseTo(844 - 12, 5);
    expect(left.arena.width).toBeCloseTo(right.arena.width, 5);
    expect(left.view.offsetX).toBeCloseTo(left.arena.x, 5);
  });

  it('puts the timer at the foot of the HUD column', () => {
    expect(right.timer?.width).toBe(right.hud?.width);
    expect((right.timer?.y ?? 0) + (right.timer?.height ?? 0)).toBeCloseTo(390 - 12, 5);
  });

  it('shrinks the arena on a narrow landscape phone to keep the steering pad 120px wide', () => {
    const narrow = layout({ width: 667, height: 375 }, true, 'right');
    expect(narrow.pad?.width).toBeCloseTo(120, 5);
    expect(narrow.arena.height).toBeLessThan(375 - 24);
    expect(narrow.arena.y + narrow.arena.height / 2).toBeCloseTo(375 / 2, 5);
  });

  it('keeps every region inside the stage without overlapping', () => {
    expectTiled(right, { width: 844, height: 390 });
    expectTiled(left, { width: 844, height: 390 });
    expectTiled(layout({ width: 750, height: 369 }, true, 'right'), { width: 750, height: 369 });
  });

  it('lets cards cover everything beside the HUD column', () => {
    const hudRight = (right.hud?.x ?? 0) + (right.hud?.width ?? 0);
    expect(right.sheet).toEqual({ x: hudRight, y: 0, width: 844 - hudRight, height: 390 });
    expect(left.sheet).toEqual({ x: 0, y: 0, width: left.hud?.x, height: 390 });
  });
});

function expectTiled(l: ReturnType<typeof layout>, stage: { width: number; height: number }): void {
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
      const apart = a.x + a.width <= b.x + 1e-9 || b.x + b.width <= a.x + 1e-9 || a.y + a.height <= b.y + 1e-9 || b.y + b.height <= a.y + 1e-9;
      expect(apart).toBe(true);
    }
  }
}

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

describe('ArenaView.bannerBox', () => {
  it('centres the banner along the top of the upright arena, where it always was', () => {
    const l = layout({ width: 1024, height: 724 }, false, 'right');
    expect(l.view.bannerBox()).toEqual({ x: 512, y: 40, maxWidth: 952, fontSize: 14, lineHeight: 18 });
  });

  it('centres the banner along the top of the rotated arena as the player sees it, not along its right side', () => {
    const l = layout({ width: 390, height: 763 }, true, 'right');
    const box = l.view.bannerBox();
    const s = 366 / 700;
    expect(box.x).toBeCloseTo(195, 5);
    expect(box.y).toBeCloseTo(54 + 28 * s, 5);
    expect(box.maxWidth).toBeCloseTo(366 - 48 * s, 5);
    expect(box.fontSize).toBeCloseTo(14 * s, 5);
  });
});

describe('ArenaView', () => {
  const upright = layout({ width: 1024, height: 724 }, false, 'right');
  const rotated = layout({ width: 390, height: 763 }, true, 'right');
  const views = [['upright', upright], ['rotated', rotated]] as const;
  const corners: Vec[] = [{ x: 0, y: 0 }, { x: WORLD_W, y: 0 }, { x: 0, y: WORLD_H }, { x: WORLD_W, y: WORLD_H }];

  const expectClose = (actual: Vec, expected: Vec): void => {
    expect(actual.x).toBeCloseTo(expected.x, 6);
    expect(actual.y).toBeCloseTo(expected.y, 6);
  };

  it.each(views)('maps arena to stage and back to where it started (%s)', (_, l) => {
    for (const p of [...corners, { x: 123, y: 456 }]) expectClose(l.view.toArena(l.view.toStage(p)), p);
  });

  it.each(views)('draws the arena corners on the corners of the arena rect (%s)', (_, l) => {
    const drawn = corners.map((p) => l.view.toStage(p));
    const xs = drawn.map((p) => p.x), ys = drawn.map((p) => p.y);
    expect(Math.min(...xs)).toBeCloseTo(l.arena.x, 6);
    expect(Math.min(...ys)).toBeCloseTo(l.arena.y, 6);
    expect(Math.max(...xs)).toBeCloseTo(l.arena.x + l.arena.width, 6);
    expect(Math.max(...ys)).toBeCloseTo(l.arena.y + l.arena.height, 6);
    expect(l.view.rect).toEqual(l.arena);
  });

  it('turns the arena a quarter clockwise on a portrait phone, so its top edge runs down the right side', () => {
    const v = rotated.view;
    const a = rotated.arena;
    expectClose(v.toStage({ x: 0, y: 0 }), { x: a.x + a.width, y: a.y });
    expectClose(v.toStage({ x: WORLD_W, y: 0 }), { x: a.x + a.width, y: a.y + a.height });
  });

  // This is what keeps steering and drawing in agreement: dragging toward where a point is drawn steers toward it.
  it.each(views)('maps a stage direction toward a drawn point to the arena direction toward that point (%s)', (_, l) => {
    const from = { x: 500, y: 350 };
    for (const to of [{ x: 700, y: 350 }, { x: 500, y: 100 }, { x: 300, y: 600 }]) {
      const a = l.view.toStage(from), b = l.view.toStage(to);
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      const dir = l.view.directionToArena({ x: (b.x - a.x) / len, y: (b.y - a.y) / len });
      const want = Math.hypot(to.x - from.x, to.y - from.y);
      expectClose(dir, { x: (to.x - from.x) / want, y: (to.y - from.y) / want });
    }
  });

  it.each(views)('keeps a still direction exactly zero, never -0 (%s)', (_, l) => {
    expect(l.view.directionToArena({ x: 0, y: 0 })).toEqual({ x: 0, y: 0 });
    expect(Object.is(l.view.directionToArena({ x: 0, y: 0 }).x, 0)).toBe(true);
    expect(Object.is(l.view.directionToArena({ x: 0, y: 0 }).y, 0)).toBe(true);
  });

  it.each(views)('turns text inside the arena so it reads upright on the stage (%s)', (_, l) => {
    const { a, b, c, d } = l.view.transform;
    const turn = l.view.uprightTurn;
    const baseline = { x: a * Math.cos(turn) + c * Math.sin(turn), y: b * Math.cos(turn) + d * Math.sin(turn) };
    expect(baseline.x).toBeGreaterThan(0);
    expect(baseline.y).toBeCloseTo(0, 9);
  });
});

describe('wrapText', () => {
  const measure = (t: string): number => t.length * 10;

  it('keeps text that fits on one line', () => {
    expect(wrapText('echo #3 joins', 200, measure)).toEqual(['echo #3 joins']);
  });

  it('breaks between words when the text is wider than the arena', () => {
    expect(wrapText('eraser up: grab it to delete your oldest echo', 250, measure))
      .toEqual(['eraser up: grab it to', 'delete your oldest echo']);
  });

  it('keeps a single word that is too wide on its own line', () => {
    expect(wrapText('unbreakable word', 50, measure)).toEqual(['unbreakable', 'word']);
  });
});
