import { describe, expect, it } from 'vitest';
import {
  ERASER_MAX_DIST,
  ERASER_MIN_DIST,
  ERASER_ORB_GAP,
  ORB_MAX_DIST,
  ORB_MIN_DIST,
  WALL_MARGIN,
  WORLD_H,
  WORLD_W,
} from './constants.ts';
import { CENTER, buildCourse, eraserAt, roundStart } from './orbs.ts';
import type { Vec } from './model.ts';

const dist = (a: Vec, b: Vec): number => Math.hypot(a.x - b.x, a.y - b.y);
const inside = (p: Vec): boolean =>
  p.x >= WALL_MARGIN - 1e-9 && p.x <= WORLD_W - WALL_MARGIN + 1e-9 && p.y >= WALL_MARGIN - 1e-9 && p.y <= WORLD_H - WALL_MARGIN + 1e-9;

describe('buildCourse', () => {
  it('keeps every orb in range of the previous one and away from the walls', () => {
    for (const seed of [1, 2, 3, 99, 123456]) {
      const course = buildCourse(seed, 200);
      course.orbs.forEach((orb, i) => {
        const d = dist(orb, roundStart(course, i));
        expect(d).toBeGreaterThanOrEqual(ORB_MIN_DIST);
        expect(d).toBeLessThanOrEqual(ORB_MAX_DIST);
        expect(inside(orb)).toBe(true);
      });
    }
  });

  it('places erasers in range of the round start and clear of the orb', () => {
    const course = buildCourse(5, 200);
    course.erasers.forEach((e, i) => {
      const d = dist(e, roundStart(course, i));
      expect(d).toBeGreaterThanOrEqual(ERASER_MIN_DIST);
      expect(d).toBeLessThanOrEqual(ERASER_MAX_DIST);
      expect(dist(e, course.orbs[i]!)).toBeGreaterThanOrEqual(ERASER_ORB_GAP);
      expect(inside(e)).toBe(true);
    });
  });

  it('is deterministic per seed', () => {
    expect(buildCourse(77, 50)).toEqual(buildCourse(77, 50));
    expect(buildCourse(77, 50).orbs).not.toEqual(buildCourse(78, 50).orbs);
  });

  it('starts the first round in the center', () => {
    expect(roundStart(buildCourse(1, 5), 0)).toEqual(CENTER);
  });

  it('shows an eraser only on every 5th round', () => {
    const course = buildCourse(1, 20);
    const rounds = [...Array(20).keys()].filter((r) => eraserAt(course, r));
    expect(rounds).toEqual([4, 9, 14, 19]);
  });
});
