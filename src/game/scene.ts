import type { Echo, Vec } from './model.ts';

/** Everything the renderer needs for one frame; built by the Session from live play, the replay, or the title demo. */
export interface Scene {
  echoes: readonly Echo[];
  route: ArrayLike<number>;
  routeLen: number;
  player: Vec | null;
  trail: readonly Vec[];
  orb: Vec | null;
  eraser: Vec | null;
  /** Fraction of the round timer left, 0..1. */
  timeLeft: number;
  killerN: number | null;
  numbered: boolean;
  banner: string | null;
  bannerAlpha: number;
}
