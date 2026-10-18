import { WORLD_H, WORLD_W } from '../game/constants.ts';

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

/**
 * Where everything goes on the stage, in stage pixels. On a 'stage' layout (desktop, tablet) the HUD and
 * timer sit outside the stage in the page header, and cards are placed by the stylesheet.
 */
export interface Regions {
  kind: 'stage' | 'portrait' | 'landscape';
  hud: Rect | null;
  arena: Rect;
  timer: Rect | null;
  pad: Rect | null;
  /** The area cards may cover: everything but the HUD, so mute stays reachable. */
  sheet: Rect | null;
  view: ArenaView;
}

/** The screen layout: the regions plus the stage size they were worked out for. */
export interface Layout extends Regions {
  stage: Size;
}

export const DEFAULT_PAD_SIDE: PadSide = 'right';
const PHONE_MAX_SIDE = 500;
const MARGIN = 12;
const PHONE_GAP = 10;
const HUD_H = 44;
const TIMER_H = 24;
const MIN_PAD_SPAN = 120;
const HUD_COL_W = 104;

export function parsePadSide(value: string | null | undefined): PadSide {
  return value === 'left' || value === 'right' ? value : DEFAULT_PAD_SIDE;
}

export function isPhone(viewport: Size, coarsePointer: boolean): boolean {
  return coarsePointer && Math.min(viewport.width, viewport.height) <= PHONE_MAX_SIDE;
}

export function layout(stage: Size, phone: boolean, padSide: PadSide): Regions {
  if (phone && stage.height > stage.width) return portraitPhone(stage);
  if (phone) return landscapePhone(stage, padSide);
  return { kind: 'stage', hud: null, timer: null, ...fitArena(stage), pad: null, sheet: null };
}

function portraitPhone(stage: Size): Regions {
  const width = stage.width - MARGIN * 2;
  const hud = { x: MARGIN, y: 0, width, height: HUD_H };
  const top = HUD_H + PHONE_GAP;
  const maxArenaH = stage.height - top - PHONE_GAP - TIMER_H - PHONE_GAP - MIN_PAD_SPAN;
  const scale = Math.max(0.01, Math.min(width / WORLD_H, maxArenaH / WORLD_W));
  const arenaW = WORLD_H * scale;
  const arena = { x: (stage.width - arenaW) / 2, y: top, width: arenaW, height: WORLD_W * scale };
  const timer = { x: MARGIN, y: arena.y + arena.height + PHONE_GAP, width, height: TIMER_H };
  const padY = timer.y + TIMER_H + PHONE_GAP;
  const pad = { x: MARGIN, y: padY, width, height: Math.max(0, stage.height - padY) };
  const sheet = { x: 0, y: HUD_H, width: stage.width, height: stage.height - HUD_H };
  return { kind: 'portrait', hud, arena, timer, pad, sheet, view: { rotated: true, scale, offsetX: arena.x, offsetY: arena.y } };
}

function landscapePhone(stage: Size, padSide: PadSide): Regions {
  const height = stage.height - MARGIN * 2;
  const maxArenaW = stage.width - MARGIN * 2 - HUD_COL_W - MIN_PAD_SPAN - PHONE_GAP * 2;
  const scale = Math.max(0.01, Math.min(height / WORLD_H, maxArenaW / WORLD_W));
  const arenaW = WORLD_W * scale;
  const arenaH = WORLD_H * scale;
  const padW = Math.max(0, stage.width - MARGIN * 2 - HUD_COL_W - arenaW - PHONE_GAP * 2);
  const leadW = padSide === 'right' ? HUD_COL_W : padW;
  const arenaX = MARGIN + leadW + PHONE_GAP;
  const trailX = arenaX + arenaW + PHONE_GAP;
  const [hudX, padX] = padSide === 'right' ? [MARGIN, trailX] : [trailX, MARGIN];
  const arena = { x: arenaX, y: (stage.height - arenaH) / 2, width: arenaW, height: arenaH };
  const hud = { x: hudX, y: MARGIN, width: HUD_COL_W, height: height - TIMER_H - PHONE_GAP };
  const timer = { x: hudX, y: MARGIN + height - TIMER_H, width: HUD_COL_W, height: TIMER_H };
  const pad = { x: padX, y: MARGIN, width: padW, height };
  const hudEnd = hudX + HUD_COL_W;
  const sheet = padSide === 'right'
    ? { x: hudEnd, y: 0, width: stage.width - hudEnd, height: stage.height }
    : { x: 0, y: 0, width: hudX, height: stage.height };
  return { kind: 'landscape', hud, arena, timer, pad, sheet, view: { rotated: false, scale, offsetX: arena.x, offsetY: arena.y } };
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

const BANNER_TOP = 28;
const BANNER_INSET = 24;
const BANNER_FONT = 14;
const BANNER_LINE = 18;

/** Where the banner goes, in stage pixels, sized in arena units like everything else in the arena. */
export interface BannerBox {
  x: number;
  y: number;
  maxWidth: number;
  fontSize: number;
  lineHeight: number;
}

// The arena rect is already in screen orientation, so this is the top edge as the player sees it, rotated or not.
export function bannerBox(arena: Rect, scale: number): BannerBox {
  return {
    x: arena.x + arena.width / 2,
    y: arena.y + BANNER_TOP * scale,
    maxWidth: arena.width - BANNER_INSET * 2 * scale,
    fontSize: BANNER_FONT * scale,
    lineHeight: BANNER_LINE * scale,
  };
}

export function wrapText(text: string, maxWidth: number, measure: (line: string) => number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (line && measure(next) > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}
