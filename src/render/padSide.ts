import type { KeyValueStore } from '../storage.ts';
import { parsePadSide, type PadSide } from './view.ts';

const KEY = 'echo-pad-side';

export function loadPadSide(store: KeyValueStore): PadSide {
  return parsePadSide(store.get(KEY));
}

export function savePadSide(store: KeyValueStore, side: PadSide): void {
  store.set(KEY, side);
}
