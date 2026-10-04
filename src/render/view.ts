import { WORLD_H, WORLD_W } from '../game/constants.ts';
import type { Vec } from '../game/model.ts';

export interface ArenaView {
  rotated: boolean;
  scale: number;
  offsetX: number;
  offsetY: number;
}

const PAD = 12;

export function fitArena(stageW: number, stageH: number): ArenaView {
  const availW = stageW - PAD * 2;
  const availH = stageH - PAD * 2;
  const upright = Math.min(availW / WORLD_W, availH / WORLD_H);
  const turned = Math.min(availW / WORLD_H, availH / WORLD_W);
  const rotated = turned > upright;
  const scale = Math.max(0.01, rotated ? turned : upright);
  const drawnW = (rotated ? WORLD_H : WORLD_W) * scale;
  const drawnH = (rotated ? WORLD_W : WORLD_H) * scale;
  return { rotated, scale, offsetX: (stageW - drawnW) / 2, offsetY: (stageH - drawnH) / 2 };
}

/** Maps a screen-space steering direction into arena space. */
export function toArenaDirection(screen: Vec, rotated: boolean): Vec {
  return rotated ? { x: screen.y, y: 0 - screen.x } : screen;
}
