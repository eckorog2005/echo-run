import './style.css';
import { Audio } from './audio/audio.ts';
import { GRACE_TICKS, ROUND_TICKS, TICK, WORLD_H, WORLD_W } from './game/constants.ts';
import { dailySeed, dateKey, loadDaily, recordDaily } from './game/daily.ts';
import type { DailyRecord } from './game/daily.ts';
import type { Echo, GameState, StepEvent, Vec } from './game/model.ts';
import { Replay } from './game/replay.ts';
import { shareText } from './game/share.ts';
import { advanceEchoes, createGame, idle, step } from './game/sim.ts';
import { Input } from './input/input.ts';
import { Effects } from './render/particles.ts';
import { Renderer, type Scene } from './render/renderer.ts';
import { browserStore } from './storage.ts';
import { Overlay } from './ui/overlay.ts';

type Screen = 'title' | 'play' | 'dead' | 'replay';
type Mode = 'daily' | 'endless';

const byId = <T extends HTMLElement>(id: string): T => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing #${id}`);
  return el as T;
};

const stage = byId<HTMLDivElement>('stage');
const hud = {
  score: byId('score'),
  echoes: byId('echoes'),
  best: byId('best'),
  bestLabel: byId('best-label'),
  mode: byId('mode-chip'),
  mute: byId<HTMLButtonElement>('mute'),
};

const store = browserStore;
const renderer = new Renderer(byId<HTMLCanvasElement>('cv'), stage);
const input = new Input(stage);
const audio = new Audio(store);
const fx = new Effects();
const overlay = new Overlay(byId('overlay'));
const C = renderer.colors;

let screen: Screen = 'title';
let mode: Mode = 'endless';
let today = dateKey();
let practice = false;
let game: GameState | null = null;
let replay: Replay | null = null;
let trail: Vec[] = [];
let lastDeath: Parameters<Overlay['showDeath']>[0] | null = null;
let endlessBest = parseInt(store.get('echo-best-endless') ?? '0', 10) || 0;

// ---------- Title demo: a few looping echoes behind the menu ----------
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
    return { n: k + 1, path, x: 0, y: 0, live: true, erasedAt: null };
  });
}
const demo = demoEchoes();
let demoTick = 0;

// ---------- HUD ----------
function bestText(): { label: string; value: string } {
  if (mode === 'daily') {
    const rec = loadDaily(store, today);
    return { label: 'Today', value: rec ? String(rec.score) : '–' };
  }
  return { label: 'Best', value: String(endlessBest) };
}

function updateHUD(): void {
  hud.score.textContent = String(game && screen !== 'title' ? game.score : 0);
  hud.echoes.textContent = String(game && screen !== 'title' ? game.echoes.length : 0);
  const b = bestText();
  hud.bestLabel.textContent = b.label;
  hud.best.textContent = b.value;
  hud.mode.textContent = screen === 'title' ? '' : mode === 'daily' ? `Daily · ${today}${practice ? ' · practice' : ''}` : 'Endless';
}

function renderMute(): void {
  hud.mute.textContent = audio.muted ? 'Sound off' : 'Sound on';
  hud.mute.setAttribute('aria-pressed', String(audio.muted));
}
hud.mute.addEventListener('click', () => {
  audio.toggle();
  renderMute();
});
renderMute();

// ---------- Screens ----------
function showTitle(): void {
  screen = 'title';
  game = null;
  replay = null;
  input.joystickEnabled = false;
  today = dateKey();
  const rec = loadDaily(store, today);
  overlay.showTitle(
    { today, daily: rec, shareLine: rec ? shareText(today, rec) : null },
    { daily: () => startRun('daily'), endless: () => startRun('endless') },
  );
  updateHUD();
}

function startRun(next: Mode): void {
  audio.unlock();
  audio.start();
  (document.activeElement as HTMLElement | null)?.blur?.();
  mode = next;
  today = dateKey();
  practice = mode === 'daily' && loadDaily(store, today) !== null;
  const seed = mode === 'daily' ? dailySeed(today) : (Math.random() * 2 ** 32) >>> 0;
  game = createGame(seed);
  replay = null;
  trail = [];
  lastDeath = null;
  fx.reset();
  screen = 'play';
  input.joystickEnabled = true;
  overlay.hide();
  updateHUD();
}

function onDeath(g: GameState): void {
  screen = 'dead';
  input.joystickEnabled = false;
  input.joy.active = false;
  fx.burst(g.player.x, g.player.y, C.danger, 44, 340);
  fx.burst(g.player.x, g.player.y, C.self, 20, 200);
  fx.kick(18);
  audio.death();

  const cause = g.cause ?? { kind: 'time' as const };
  const reason = cause.kind === 'echo' ? `Caught by echo #${cause.n}` : 'Out of time';
  let isBest = false;
  let counted = false;
  let shareLine: string | null = null;
  if (mode === 'endless') {
    isBest = g.score > endlessBest;
    if (isBest) {
      endlessBest = g.score;
      store.set('echo-best-endless', String(endlessBest));
    }
  } else if (!practice) {
    const rec: DailyRecord = { score: g.score, erased: g.erased, cause };
    counted = recordDaily(store, today, rec);
    if (counted) shareLine = shareText(today, rec);
  }
  lastDeath = { mode, counted, practice, reason, score: g.score, erased: g.erased, best: endlessBest, isBest, shareLine };
  updateHUD();
  setTimeout(() => {
    if (screen === 'dead' && game === g) showDeathCard();
  }, 750);
}

function showDeathCard(): void {
  if (!lastDeath) return;
  overlay.showDeath(lastDeath, {
    again: () => startRun(mode),
    replay: startReplay,
    menu: showTitle,
  });
}

function startReplay(): void {
  if (!game) return;
  replay = new Replay(game);
  screen = 'replay';
  fx.reset();
  overlay.hide();
}

function endReplay(): void {
  if (screen !== 'replay') return;
  screen = 'dead';
  replay = null;
  showDeathCard();
}

// ---------- Input that isn't steering ----------
window.addEventListener('keydown', (e) => {
  if (e.code !== 'Space' && e.code !== 'Enter' && e.code !== 'Escape') return;
  if ((e.target as HTMLElement | null)?.tagName === 'BUTTON' && e.code !== 'Escape') return;
  if (screen === 'replay') {
    e.preventDefault();
    endReplay();
  } else if (overlay.visible && e.code !== 'Escape') {
    e.preventDefault();
    overlay.activatePrimary();
  }
});
stage.addEventListener('pointerdown', () => {
  audio.unlock();
  if (screen === 'replay') endReplay();
});

// ---------- Simulation ----------
function handle(events: StepEvent[], g: GameState): void {
  for (const ev of events) {
    if (ev.type === 'collect') {
      fx.burst(ev.at.x, ev.at.y, C.orb, 26);
      fx.burst(g.player.x, g.player.y, C.echo, 14, 160);
      fx.flash = 1;
      audio.pickup(ev.n);
      trail = [];
    } else if (ev.type === 'erase') {
      fx.burst(ev.at.x, ev.at.y, C.erase, 30, 220);
      audio.erase();
    } else {
      onDeath(g);
    }
  }
  if (events.length) updateHUD();
}

function update(): void {
  if (screen === 'play' && game) {
    const events = step(game, input.direction());
    trail.push({ ...game.player });
    if (trail.length > 14) trail.shift();
    handle(events, game);
  } else if (screen === 'dead' && game) {
    idle(game);
  } else if (screen === 'replay' && replay) {
    for (let i = 0; i < 3; i++) replay.advance();
    if (replay.done) endReplay();
  } else if (screen === 'title') {
    demoTick++;
    advanceEchoes(demo, demoTick, null);
    for (const e of demo) e.live = true;
  }
  fx.update(TICK);
}

// ---------- Scenes ----------
const EMPTY: number[] = [];

function scene(): Scene {
  if (screen === 'replay' && replay) {
    const f = replay.frame();
    return {
      echoes: f.echoes,
      route: f.path,
      routeLen: f.pathLen,
      player: f.player,
      trail: f.trail,
      orb: f.orb,
      eraser: f.eraser,
      timeLeft: Math.max(0, 1 - f.roundTick / ROUND_TICKS),
      killerN: null,
      numbered: true,
      banner: `Replay · round ${f.round + 1} of ${f.rounds} · tap to skip`,
      bannerAlpha: 1,
    };
  }
  if (game && (screen === 'play' || screen === 'dead')) {
    const playing = screen === 'play';
    const killerN = game.cause?.kind === 'echo' ? game.cause.n : null;
    return {
      echoes: game.echoes,
      route: playing ? game.rec : EMPTY,
      routeLen: playing ? game.rec.length : 0,
      player: playing ? game.player : null,
      trail: playing ? trail : [],
      orb: game.orb,
      eraser: game.eraser,
      timeLeft: playing ? Math.max(0, 1 - game.roundTick / ROUND_TICKS) : 0,
      killerN,
      numbered: true,
      banner: game.eraser ? 'eraser up: grab it to delete your oldest echo' : `echo #${game.echoes.length} joins`,
      bannerAlpha: playing && game.echoes.length ? Math.max(0, 1 - game.roundTick / (game.eraser ? 120 : GRACE_TICKS)) : 0,
    };
  }
  return {
    echoes: demo, route: EMPTY, routeLen: 0, player: null, trail: [], orb: null, eraser: null,
    timeLeft: 0, killerN: null, numbered: false, banner: null, bannerAlpha: 0,
  };
}

// ---------- Loop ----------
let last = performance.now();
let acc = 0;
function frame(now: number): void {
  acc += Math.min(0.1, (now - last) / 1000);
  last = now;
  while (acc >= TICK) {
    update();
    acc -= TICK;
  }
  renderer.draw(scene(), fx, screen === 'play' ? input.joy : null, now);
  requestAnimationFrame(frame);
}

showTitle();
requestAnimationFrame(frame);
