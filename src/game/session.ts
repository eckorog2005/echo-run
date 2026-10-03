import {
  CARD_DELAY_TICKS,
  ERASER_BANNER_TICKS,
  GRACE_TICKS,
  REPLAY_SPEED,
  ROUND_TICKS,
  WORLD_H,
  WORLD_W,
} from './constants.ts';
import { dailySeed, loadDaily, recordDaily, type DailyRecord } from './daily.ts';
import type { DeathCause, Echo, GameState, StepEvent, Vec } from './model.ts';
import { Replay } from './replay.ts';
import type { Scene } from './scene.ts';
import { shareText } from './share.ts';
import { advanceEchoes, createGame, idle, step } from './sim.ts';
import type { KeyValueStore } from '../storage.ts';

export type Screen = 'title' | 'play' | 'dead' | 'replay';
export type Mode = 'daily' | 'endless';

/** What a finished run meant for the player's records. */
export type Outcome =
  | { kind: 'counted'; shareLine: string }
  | { kind: 'practice' }
  | { kind: 'newBest' }
  | { kind: 'plain' };

/** Everything the death card shows about a finished run. */
export interface RunResult {
  mode: Mode;
  outcome: Outcome;
  cause: DeathCause;
  score: number;
  erased: number;
  /** Endless best after this run. */
  best: number;
}

export type SessionEvent = StepEvent | { type: 'card'; result: RunResult };

export interface Hud {
  score: number;
  echoes: number;
  bestLabel: string;
  best: string;
  /** Mode chip text; empty on the title screen. */
  mode: string;
}

export interface TitleInfo {
  today: string;
  daily: DailyRecord | null;
  shareLine: string | null;
}

export interface SessionDeps {
  store: KeyValueStore;
  /** Today's local date key, YYYY-MM-DD. */
  today: () => string;
  /** A fresh 32-bit seed for an endless run. */
  randomSeed: () => number;
}

const BEST_KEY = 'echo-best-endless';
const TRAIL_LENGTH = 14;
const EMPTY: number[] = [];

/** A few looping figure-eight echoes behind the title menu. */
function demoEchoes(): Echo[] {
  const specs: [number, number, number, number, number][] = [
    [3, 2, 300, 210, 0], [2, 3, 360, 250, 1.3], [1, 2, 220, 280, 2.1], [4, 3, 400, 180, 0.6],
  ];
  return specs.map(([a, b, rx, ry, ph], k) => {
    const len = 420 + k * 60;
    const path = new Float32Array(len * 2);
    for (let i = 0; i < len; i++) {
      const t = (i / len) * Math.PI * 2;
      path[i * 2] = WORLD_W / 2 + Math.sin(a * t + ph) * rx;
      path[i * 2 + 1] = WORLD_H / 2 + Math.sin(b * t) * ry;
    }
    return { n: k + 1, path, x: 0, y: 0, live: true };
  });
}

/**
 * The run lifecycle: title, play, death card, and replay. Owns the daily
 * counted-attempt and endless-best rules and builds the Scene for every screen.
 * Free of DOM, audio, and wall-clock time: drive it with tick() at 60 Hz.
 */
export class Session {
  private _screen: Screen = 'title';
  private mode: Mode = 'endless';
  private today: string;
  private practice = false;
  private game: GameState | null = null;
  private replay: Replay | null = null;
  private result: RunResult | null = null;
  private trail: Vec[] = [];
  /** Ticks until the death card is due; null once it has been shown. */
  private cardIn: number | null = null;
  private endlessBest: number;
  private readonly demo = demoEchoes();
  private demoTick = 0;

  constructor(private readonly deps: SessionDeps) {
    this.today = deps.today();
    this.endlessBest = parseInt(deps.store.get(BEST_KEY) ?? '0', 10) || 0;
  }

  get screen(): Screen {
    return this._screen;
  }

  start(mode: Mode): void {
    this.mode = mode;
    this.today = this.deps.today();
    this.practice = mode === 'daily' && loadDaily(this.deps.store, this.today) !== null;
    this.game = createGame(mode === 'daily' ? dailySeed(this.today) : this.deps.randomSeed());
    this.replay = null;
    this.result = null;
    this.trail = [];
    this.cardIn = null;
    this._screen = 'play';
  }

  /** Plays the finished run back; only valid on the dead screen. */
  watchReplay(): void {
    if (this._screen !== 'dead' || !this.game) return;
    this.replay = new Replay(this.game);
    this.trail = [];
    this._screen = 'replay';
  }

  /** Leaves the replay; the death card comes back on the next tick. */
  skipReplay(): void {
    if (this._screen !== 'replay') return;
    this.replay = null;
    this._screen = 'dead';
    this.cardIn = 0;
  }

  menu(): void {
    this._screen = 'title';
    this.game = null;
    this.replay = null;
    this.today = this.deps.today();
  }

  /** Advances one fixed tick. `input` only steers during play. */
  tick(input: Vec): SessionEvent[] {
    const events: SessionEvent[] = [];
    if (this._screen === 'play' && this.game) {
      const g = this.game;
      events.push(...step(g, input));
      this.pushTrail(g.player);
      if (events.some((e) => e.type === 'collect')) this.trail = [];
      if (g.over) this.finish(g);
    } else if (this._screen === 'dead' && this.game) {
      idle(this.game);
    } else if (this._screen === 'replay' && this.replay) {
      const r = this.replay;
      for (let i = 0; i < REPLAY_SPEED; i++) {
        if (r.advance().some((e) => e.type === 'collect')) this.trail = [];
        if (!r.state.over) this.pushTrail(r.state.player);
      }
      if (r.done) this.skipReplay();
    } else if (this._screen === 'title') {
      this.demoTick++;
      advanceEchoes(this.demo, this.demoTick, null);
      for (const e of this.demo) e.live = true;
    }

    if (this._screen === 'dead' && this.cardIn !== null && this.result && this.cardIn-- <= 0) {
      this.cardIn = null;
      events.push({ type: 'card', result: this.result });
    }
    return events;
  }

  private pushTrail(p: Vec): void {
    this.trail.push({ ...p });
    if (this.trail.length > TRAIL_LENGTH) this.trail.shift();
  }

  /** Settles records for a run that just ended and schedules the death card. */
  private finish(g: GameState): void {
    const cause = g.cause ?? { kind: 'time' as const };
    let outcome: Outcome = { kind: 'plain' };
    if (this.mode === 'endless') {
      if (g.score > this.endlessBest) {
        this.endlessBest = g.score;
        this.deps.store.set(BEST_KEY, String(g.score));
        outcome = { kind: 'newBest' };
      }
    } else if (this.practice) {
      outcome = { kind: 'practice' };
    } else {
      const rec: DailyRecord = { score: g.score, erased: g.erased, cause };
      if (recordDaily(this.deps.store, this.today, rec)) outcome = { kind: 'counted', shareLine: shareText(this.today, rec) };
    }
    this.result = { mode: this.mode, outcome, cause, score: g.score, erased: g.erased, best: this.endlessBest };
    this._screen = 'dead';
    this.cardIn = CARD_DELAY_TICKS;
  }

  hud(): Hud {
    const g = this._screen === 'title' ? null : this.game;
    const daily = this.mode === 'daily';
    const saved = daily ? loadDaily(this.deps.store, this.today) : null;
    return {
      score: g ? g.score : 0,
      echoes: g ? g.echoes.length : 0,
      bestLabel: daily ? 'Today' : 'Best',
      best: daily ? (saved ? String(saved.score) : '–') : String(this.endlessBest),
      mode: this._screen === 'title' ? '' : daily ? `Daily · ${this.today}${this.practice ? ' · practice' : ''}` : 'Endless',
    };
  }

  titleInfo(): TitleInfo {
    const daily = loadDaily(this.deps.store, this.today);
    return { today: this.today, daily, shareLine: daily ? shareText(this.today, daily) : null };
  }

  scene(): Scene {
    if (this._screen === 'replay' && this.replay) {
      const r = this.replay.state;
      return {
        ...this.runScene(r, true),
        banner: `Replay · round ${this.replay.round + 1} of ${this.replay.rounds} · tap to skip`,
        bannerAlpha: 1,
      };
    }
    if (this.game && (this._screen === 'play' || this._screen === 'dead')) {
      const g = this.game;
      const playing = this._screen === 'play';
      const fadeTicks = g.eraser ? ERASER_BANNER_TICKS : GRACE_TICKS;
      return {
        ...this.runScene(g, playing),
        banner: g.eraser ? 'eraser up: grab it to delete your oldest echo' : `echo #${g.echoes.length} joins`,
        bannerAlpha: playing && g.echoes.length ? Math.max(0, 1 - g.roundTick / fadeTicks) : 0,
      };
    }
    return {
      echoes: this.demo, route: EMPTY, routeLen: 0, player: null, trail: [], orb: null, eraser: null,
      timeLeft: 0, killerN: null, numbered: false, banner: null, bannerAlpha: 0,
    };
  }

  /** The parts of a play or replay frame that come straight from a GameState. */
  private runScene(g: GameState, showPlayer: boolean): Omit<Scene, 'banner' | 'bannerAlpha'> {
    return {
      echoes: g.echoes,
      route: showPlayer ? g.rec : EMPTY,
      routeLen: showPlayer ? g.rec.length : 0,
      player: showPlayer ? g.player : null,
      trail: showPlayer ? this.trail : [],
      orb: g.orb,
      eraser: g.eraser,
      timeLeft: showPlayer ? Math.max(0, 1 - g.roundTick / ROUND_TICKS) : 0,
      killerN: g.cause?.kind === 'echo' ? g.cause.n : null,
      numbered: true,
    };
  }
}
