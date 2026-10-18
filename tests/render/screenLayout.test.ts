import { describe, expect, it } from 'vitest';
import { ScreenLayout, type Measurement } from '../../src/render/screenLayout.ts';
import type { Layout } from '../../src/render/view.ts';
import { memoryStore, type KeyValueStore } from '../../src/storage.ts';

const landscapePhone: Measurement = {
  stage: { width: 844, height: 390 },
  viewport: { width: 844, height: 390 },
  coarsePointer: true,
};

function screen(store: KeyValueStore = memoryStore(), measured: Measurement = landscapePhone) {
  const changes: Layout[] = [];
  const m = { current: measured };
  const s = new ScreenLayout({ store, measure: () => m.current, onChange: (l) => changes.push(l) });
  return { s, changes, m };
}

describe('ScreenLayout pad side', () => {
  it('defaults to the right', () => {
    expect(screen().s.padSide).toBe('right');
  });

  it('keeps a chosen side across a new instance', () => {
    const store = memoryStore();
    screen(store).s.choosePadSide('left');
    expect(screen(store).s.padSide).toBe('left');
    expect(store.get('echo-pad-side')).toBe('left');
  });

  it('falls back to the right for an unknown stored value', () => {
    const store = memoryStore();
    store.set('echo-pad-side', 'middle');
    expect(screen(store).s.padSide).toBe('right');
  });
});

describe('ScreenLayout changes', () => {
  it('reports the layout once at startup, with the stage size', () => {
    const { s, changes } = screen();
    expect(changes).toEqual([s.layout]);
    expect(s.layout.kind).toBe('landscape');
    expect(s.layout.stage).toEqual({ width: 844, height: 390 });
  });

  it('reports the mirrored layout when a side is chosen on a landscape phone', () => {
    const { s, changes } = screen();
    const padRight = s.layout.pad?.x ?? 0;
    s.choosePadSide('left');
    expect(changes).toHaveLength(2);
    expect(changes[1]).toBe(s.layout);
    expect(s.layout.pad?.x).toBe(12);
    expect(s.layout.pad?.x).toBeLessThan(padRight);
    expect(s.layout.arena.x).toBeGreaterThan(s.layout.pad?.width ?? 0);
  });

  it('reports nothing when a refresh finds the same size', () => {
    const { s, changes } = screen();
    s.refresh();
    s.choosePadSide('right');
    expect(changes).toHaveLength(1);
  });

  it('reports a new layout when the screen turns', () => {
    const { s, changes, m } = screen();
    m.current = { stage: { width: 390, height: 763 }, viewport: { width: 390, height: 844 }, coarsePointer: true };
    s.refresh();
    expect(changes).toHaveLength(2);
    expect(s.layout.kind).toBe('portrait');
    expect(s.layout.view.rotated).toBe(true);
  });

  it('uses the stage layout without a coarse pointer', () => {
    const { s } = screen(memoryStore(), { ...landscapePhone, coarsePointer: false });
    expect(s.layout.kind).toBe('stage');
    expect(s.layout.pad).toBeNull();
  });
});
