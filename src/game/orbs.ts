import {
  COURSE_LENGTH,
  ERASER_EVERY,
  ERASER_MAX_DIST,
  ERASER_MIN_DIST,
  ERASER_ORB_GAP,
  ORB_MAX_DIST,
  ORB_MIN_DIST,
  WALL_MARGIN,
  WORLD_H,
  WORLD_W,
} from './constants.ts';
import type { Vec } from './model.ts';
import { mulberry32 } from './rng.ts';

/**
 * Every round starts where the previous orb was collected, so the whole run's
 * orb and eraser positions can be generated up front from a seed.
 */
export interface Course {
  seed: number;
  orbs: Vec[];
  erasers: Vec[];
}

export const CENTER: Readonly<Vec> = { x: WORLD_W / 2, y: WORLD_H / 2 };

const dist = (a: Vec, b: Vec): number => Math.hypot(a.x - b.x, a.y - b.y);

function inBounds(p: Vec): boolean {
  return p.x >= WALL_MARGIN && p.x <= WORLD_W - WALL_MARGIN && p.y >= WALL_MARGIN && p.y <= WORLD_H - WALL_MARGIN;
}

function pickPoint(rng: () => number, ok: (p: Vec) => boolean, origin: Vec, minR: number, maxR: number): Vec {
  for (let i = 0; i < 200; i++) {
    const p = {
      x: WALL_MARGIN + rng() * (WORLD_W - WALL_MARGIN * 2),
      y: WALL_MARGIN + rng() * (WORLD_H - WALL_MARGIN * 2),
    };
    if (ok(p)) return p;
  }
  // Deterministic sweep in case random sampling is unlucky.
  for (let r = minR; r <= maxR; r += 20) {
    for (let deg = 0; deg < 360; deg += 7) {
      const a = (deg * Math.PI) / 180;
      const p = { x: origin.x + Math.cos(a) * r, y: origin.y + Math.sin(a) * r };
      if (inBounds(p) && ok(p)) return p;
    }
  }
  return { ...CENTER };
}

export function buildCourse(seed: number, length = COURSE_LENGTH): Course {
  const rng = mulberry32(seed);
  const orbs: Vec[] = [];
  const erasers: Vec[] = [];
  let start: Vec = { ...CENTER };
  for (let i = 0; i < length; i++) {
    const from = start;
    const orb = pickPoint(
      rng,
      (p) => {
        const d = dist(p, from);
        return d >= ORB_MIN_DIST && d <= ORB_MAX_DIST;
      },
      from,
      ORB_MIN_DIST,
      ORB_MAX_DIST,
    );
    // An eraser candidate is drawn every round so the orb sequence doesn't depend on the cadence.
    const eraser = pickPoint(
      rng,
      (p) => {
        const d = dist(p, from);
        return d >= ERASER_MIN_DIST && d <= ERASER_MAX_DIST && dist(p, orb) >= ERASER_ORB_GAP;
      },
      from,
      ERASER_MIN_DIST,
      ERASER_MAX_DIST,
    );
    orbs.push(orb);
    erasers.push(eraser);
    start = orb;
  }
  return { seed, orbs, erasers };
}

export function orbAt(course: Course, round: number): Vec {
  const orb = course.orbs[round % course.orbs.length];
  if (!orb) throw new Error('Course has no orbs');
  return orb;
}

export function hasEraser(round: number): boolean {
  return (round + 1) % ERASER_EVERY === 0;
}

export function eraserAt(course: Course, round: number): Vec | null {
  if (!hasEraser(round)) return null;
  return course.erasers[round % course.erasers.length] ?? null;
}

export function roundStart(course: Course, round: number): Vec {
  return round === 0 ? { ...CENTER } : orbAt(course, round - 1);
}
