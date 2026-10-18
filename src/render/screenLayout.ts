import type { KeyValueStore } from '../storage.ts';
import { isPhone, layout, parsePadSide, type Layout, type PadSide, type Size } from './view.ts';

const PAD_SIDE_KEY = 'echo-pad-side';

export interface Measurement {
  stage: Size;
  viewport: Size;
  coarsePointer: boolean;
}

export interface ScreenLayoutDeps {
  store: KeyValueStore;
  measure: () => Measurement;
  onChange: (layout: Layout) => void;
}

/** Works out the screen layout and owns the pad-side setting. */
export class ScreenLayout {
  private side: PadSide;
  private current: Layout;
  private key: string;

  constructor(private readonly deps: ScreenLayoutDeps) {
    this.side = parsePadSide(deps.store.get(PAD_SIDE_KEY));
    this.current = this.compute();
    this.key = JSON.stringify(this.current);
    deps.onChange(this.current);
  }

  get layout(): Layout {
    return this.current;
  }

  get padSide(): PadSide {
    return this.side;
  }

  choosePadSide(side: PadSide): void {
    this.side = side;
    this.deps.store.set(PAD_SIDE_KEY, side);
    this.refresh();
  }

  refresh(): void {
    const next = this.compute();
    const key = JSON.stringify(next);
    if (key === this.key) return;
    this.current = next;
    this.key = key;
    this.deps.onChange(next);
  }

  private compute(): Layout {
    const { stage, viewport, coarsePointer } = this.deps.measure();
    const size = { width: stage.width, height: stage.height };
    return { ...layout(size, isPhone(viewport, coarsePointer), this.side), stage: size };
  }
}
