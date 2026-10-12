import { describe, expect, it } from 'vitest';
import { loadPadSide, savePadSide } from '../../src/render/padSide.ts';
import { memoryStore } from '../../src/storage.ts';

describe('pad side setting', () => {
  it('defaults to the right', () => {
    expect(loadPadSide(memoryStore())).toBe('right');
  });

  it('remembers the chosen side across reloads', () => {
    const store = memoryStore();
    savePadSide(store, 'left');
    expect(loadPadSide(store)).toBe('left');
    expect(store.get('echo-pad-side')).toBe('left');
    savePadSide(store, 'right');
    expect(loadPadSide(store)).toBe('right');
  });

  it('falls back to the right for an unknown stored value', () => {
    const store = memoryStore();
    store.set('echo-pad-side', 'middle');
    expect(loadPadSide(store)).toBe('right');
  });
});
