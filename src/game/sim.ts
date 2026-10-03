import {
  ECHO_R,
  EDGE_TICKS,
  ERASER_R,
  GRACE_TICKS,
  KILL_SLACK,
  ORB_R,
  PLAYER_R,
  ROUND_TICKS,
  SPEED,
  TICK,
  WORLD_H,
  WORLD_W,
} from './constants.ts';
import type { DeathCause, Echo, GameState, StepEvent, Vec } from './model.ts';
import { CENTER, buildCourse, eraserAt, orbAt } from './orbs.ts';

const dist = (a: Vec, b: Vec): number => Math.hypot(a.x - b.x, a.y - b.y);

export function createGame(seed: number): GameState {
  const course = buildCourse(seed);
  return {
    seed,
    course,
    tick: 0,
    round: 0,
    roundTick: 0,
    score: 0,
    erased: 0,
    player: { ...CENTER },
    rec: [],
    echoes: [],
    history: [],
    orb: orbAt(course, 0),
    eraser: eraserAt(course, 0),
    over: false,
    cause: null,
  };
}

/**
 * Moves every echo to its position for this round tick. Returns the first live
 * echo touching `player`, if a player is given.
 */
export function advanceEchoes(echoes: readonly Echo[], roundTick: number, player: Vec | null): Echo | null {
  let killer: Echo | null = null;
  for (const e of echoes) {
    const len = e.path.length / 2;
    if (len === 0) continue;
    const i = roundTick % len;
    e.x = e.path[i * 2] ?? e.x;
    e.y = e.path[i * 2 + 1] ?? e.y;
    e.live = roundTick > GRACE_TICKS && i >= EDGE_TICKS && i < len - EDGE_TICKS;
    if (!killer && player && e.live && dist(e, player) < PLAYER_R + ECHO_R - KILL_SLACK) killer = e;
  }
  return killer;
}

function die(s: GameState, cause: DeathCause): StepEvent {
  s.over = true;
  s.cause = cause;
  return { type: 'die', at: { ...s.player }, cause };
}

/** Advances the game one fixed tick. Deterministic: same seed and inputs give the same run. */
export function step(s: GameState, input: Vec): StepEvent[] {
  if (s.over) return [];
  const events: StepEvent[] = [];

  let { x: dx, y: dy } = input;
  const len = Math.hypot(dx, dy);
  if (len > 1) {
    dx /= len;
    dy /= len;
  }
  s.player.x = Math.max(PLAYER_R, Math.min(WORLD_W - PLAYER_R, s.player.x + dx * SPEED * TICK));
  s.player.y = Math.max(PLAYER_R, Math.min(WORLD_H - PLAYER_R, s.player.y + dy * SPEED * TICK));
  s.rec.push(s.player.x, s.player.y);
  s.roundTick++;
  s.tick++;

  const killer = advanceEchoes(s.echoes, s.roundTick, s.player);
  if (killer) {
    events.push(die(s, { kind: 'echo', n: killer.n }));
    return events;
  }

  if (s.eraser && dist(s.player, s.eraser) < PLAYER_R + ERASER_R) {
    const removed = s.echoes.shift() ?? null;
    if (removed) {
      removed.erasedAt = { round: s.round, roundTick: s.roundTick };
      s.erased++;
    }
    events.push({ type: 'erase', at: s.eraser, n: removed ? removed.n : null });
    s.eraser = null;
  }

  if (dist(s.player, s.orb) < PLAYER_R + ORB_R) {
    s.score++;
    const echo: Echo = {
      n: s.score,
      path: Float32Array.from(s.rec),
      x: s.rec[0] ?? s.player.x,
      y: s.rec[1] ?? s.player.y,
      live: false,
      erasedAt: null,
    };
    s.echoes.push(echo);
    s.history.push(echo);
    events.push({ type: 'collect', at: s.orb, n: s.score });
    s.rec = [];
    s.roundTick = 0;
    s.round++;
    s.orb = orbAt(s.course, s.round);
    s.eraser = eraserAt(s.course, s.round);
    return events;
  }

  if (s.roundTick >= ROUND_TICKS) events.push(die(s, { kind: 'time' }));
  return events;
}

/** Keeps echoes looping after the run ends, without a player to hit. */
export function idle(s: GameState): void {
  s.roundTick++;
  advanceEchoes(s.echoes, s.roundTick, null);
}
