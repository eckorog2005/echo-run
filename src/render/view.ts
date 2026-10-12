import { WORLD_H, WORLD_W } from '../game/constants.ts';
import type { Vec } from '../game/model.ts';

export interface ArenaView {
  rotated: boolean;
  scale: number;
  offsetX: number;
  offsetY: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Rect extends Size {
  x: number;
  y: number;
}

export type PadSide = 'left' | 'right';

/** Where everything goes on the stage, in stage pixels. A null HUD or timer row sits outside the stage, in the page header. */
export interface Layout {
  hud: Rect | null;
  arena: Rect;
  timer: Rect | null;
  pad: Rect | null;
  view: ArenaView;
}

export const DEFAULT_PAD_SIDE: PadSide = 'right';
const PHONE_MAX_SIDE = 500;
const MARGIN = 12;
const PHONE_GAP = 10;
const HUD_H = 44;
const TIMER_H = 24;
const MIN_PAD_H = 120;

export function isPhone(viewport: Size, coarsePointer: boolean): boolean {
  return coarsePointer && Math.min(viewport.width, viewport.height) <= PHONE_MAX_SIDE;
}

export function layout(stage: Size, phone: boolean, _padSide: PadSide): Layout {
  if (phone && stage.height > stage.width) return portraitPhone(stage);
  return { hud: null, timer: null, ...fitArena(stage), pad: null };
}

function portraitPhone(stage: Size): Layout {
  const width = stage.width - MARGIN * 2;
  const hud = { x: MARGIN, y: 0, width, height: HUD_H };
  const top = HUD_H + PHONE_GAP;
  const maxArenaH = stage.height - top - PHONE_GAP - TIMER_H - PHONE_GAP - MIN_PAD_H;
  const scale = Math.max(0.01, Math.min(width / WORLD_H, maxArenaH / WORLD_W));
  const arenaW = WORLD_H * scale;
  const arena = { x: (stage.width - arenaW) / 2, y: top, width: arenaW, height: WORLD_W * scale };
  const timer = { x: MARGIN, y: arena.y + arena.height + PHONE_GAP, width, height: TIMER_H };
  const padY = timer.y + TIMER_H + PHONE_GAP;
  const pad = { x: MARGIN, y: padY, width, height: Math.max(0, stage.height - padY) };
  return { hud, arena, timer, pad, view: { rotated: true, scale, offsetX: arena.x, offsetY: arena.y } };
}

function fitArena(stage: Size): { arena: Rect; view: ArenaView } {
  const availW = stage.width - MARGIN * 2;
  const availH = stage.height - MARGIN * 2;
  const upright = Math.min(availW / WORLD_W, availH / WORLD_H);
  const turned = Math.min(availW / WORLD_H, availH / WORLD_W);
  const rotated = turned > upright;
  const scale = Math.max(0.01, rotated ? turned : upright);
  const width = (rotated ? WORLD_H : WORLD_W) * scale;
  const height = (rotated ? WORLD_W : WORLD_H) * scale;
  const x = (stage.width - width) / 2;
  const y = (stage.height - height) / 2;
  return { arena: { x, y, width, height }, view: { rotated, scale, offsetX: x, offsetY: y } };
}

/** Maps a screen-space steering direction into arena space. */
export function toArenaDirection(screen: Vec, rotated: boolean): Vec {
  return rotated ? { x: screen.y, y: 0 - screen.x } : screen;
}
