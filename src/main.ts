import './style.css';
import { Audio } from './audio/audio.ts';
import { TICK } from './game/constants.ts';
import { dateKey } from './game/daily.ts';
import { Session, type Hud, type Mode, type Press, type SessionEvent } from './game/session.ts';
import { Input } from './input/input.ts';
import { Steering } from './input/steering.ts';
import { Effects } from './render/particles.ts';
import { readPalette } from './render/palette.ts';
import { Renderer } from './render/renderer.ts';
import { ScreenLayout } from './render/screenLayout.ts';
import type { Layout, PadSide, Rect } from './render/view.ts';
import { browserStore } from './storage.ts';
import { Overlay } from './ui/overlay.ts';

const byId = <T extends HTMLElement>(id: string): T => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing #${id}`);
  return el as T;
};

const app = byId('app');
const stage = byId<HTMLDivElement>('stage');
const overlayEl = byId('overlay');
const hudEl = {
  header: byId('hud'),
  score: byId('score'),
  echoes: byId('echoes'),
  best: byId('best'),
  bestLabel: byId('best-label'),
  mode: byId('mode-chip'),
  mute: byId<HTMLButtonElement>('mute'),
  muteLabel: byId('mute-label'),
  timer: byId('timer'),
  timerLabel: byId('timer-label'),
  timerRound: byId('timer-round'),
  timerSecs: byId('timer-secs'),
  timerFill: byId('timer-fill'),
};

const store = browserStore;
const session = new Session({ store, today: () => dateKey(), randomSeed: () => (Math.random() * 2 ** 32) >>> 0 });
const steering = new Steering();
new Input(stage, steering);
const palette = readPalette();
const renderer = new Renderer(byId<HTMLCanvasElement>('cv'), palette);
const audio = new Audio(store);
const fx = new Effects({ palette, reduceMotion: matchMedia('(prefers-reduced-motion: reduce)').matches, random: Math.random });
const overlay = new Overlay(overlayEl);

// ---------- Layout ----------
// A null rect hands placement back to the stylesheet. Measures from the parent, not offsetParent,
// which is null while the element is hidden.
function place(el: HTMLElement, rect: Rect | null): void {
  const parent = el.parentElement?.getBoundingClientRect();
  if (!rect || !parent) {
    el.style.removeProperty('left');
    el.style.removeProperty('top');
    el.style.removeProperty('width');
    el.style.removeProperty('height');
    return;
  }
  const s = stage.getBoundingClientRect();
  el.style.left = `${s.left - parent.left + rect.x}px`;
  el.style.top = `${s.top - parent.top + rect.y}px`;
  el.style.width = `${rect.width}px`;
  el.style.height = `${rect.height}px`;
}

function applyLayout(next: Layout): void {
  app.classList.toggle('phone', next.kind !== 'stage');
  app.classList.toggle('landscape', next.kind === 'landscape');
  app.classList.toggle('pad-left', next.kind === 'landscape' && next.pad !== null && next.pad.x < next.arena.x);
  place(hudEl.header, next.hud);
  place(hudEl.timer, next.timer);
  place(overlayEl, next.sheet);
  steering.relayout(next);
}

const coarsePointer = matchMedia('(pointer: coarse)');
const screenLayout = new ScreenLayout({
  store,
  measure: () => {
    const r = stage.getBoundingClientRect();
    return {
      stage: { width: r.width, height: r.height },
      viewport: { width: innerWidth, height: innerHeight },
      coarsePointer: coarsePointer.matches,
    };
  },
  onChange: applyLayout,
});
new ResizeObserver(() => screenLayout.refresh()).observe(stage);
coarsePointer.addEventListener('change', () => screenLayout.refresh());

// ---------- HUD ----------
let shownHud = '';
function renderHud(): void {
  const h: Hud = session.hud();
  const key = JSON.stringify(h);
  if (key === shownHud) return;
  shownHud = key;
  hudEl.score.textContent = String(h.score);
  hudEl.echoes.textContent = String(h.echoes);
  hudEl.bestLabel.textContent = h.bestLabel;
  hudEl.best.textContent = h.best;
  hudEl.mode.textContent = h.mode;
  hudEl.timer.classList.toggle('idle', !h.roundLabel);
  hudEl.timerLabel.textContent = h.timerLabel;
  hudEl.timerRound.textContent = h.roundLabel;
  hudEl.timerSecs.textContent = h.secondsLeft;
  hudEl.timerFill.style.width = `${h.timeLeft * 100}%`;
  hudEl.timerFill.classList.toggle('low', h.lowTime);
}

function renderMute(): void {
  hudEl.muteLabel.textContent = audio.muted ? 'Sound off' : 'Sound on';
  hudEl.mute.setAttribute('aria-pressed', String(audio.muted));
}
hudEl.mute.addEventListener('click', () => {
  audio.toggle();
  renderMute();
});
renderMute();

// ---------- Screens ----------
function showTitle(): void {
  session.menu();
  const padSide = screenLayout.layout.kind === 'stage' ? null : { side: screenLayout.padSide, choose: (side: PadSide) => screenLayout.choosePadSide(side) };
  overlay.showTitle(session.titleInfo(), { daily: () => startRun('daily'), endless: () => startRun('endless') }, padSide);
}

function startRun(mode: Mode): void {
  audio.unlock();
  audio.start();
  (document.activeElement as HTMLElement | null)?.blur?.();
  session.start(mode);
  fx.reset();
  overlay.hide();
}

function startReplay(): void {
  session.watchReplay();
  fx.reset();
  overlay.hide();
}

// ---------- Input that isn't steering ----------
function press(kind: Press): boolean {
  const result = session.press(kind);
  if (result && result !== 'skipped') startRun(result.start);
  return result !== null;
}

const PRESS_KEYS: Record<string, Press> = { Space: 'confirm', Enter: 'confirm', Escape: 'skip' };
window.addEventListener('keydown', (e) => {
  const kind = PRESS_KEYS[e.code];
  if (!kind) return;
  // A focused button already handles its own Space and Enter.
  if (kind === 'confirm' && (e.target as HTMLElement | null)?.tagName === 'BUTTON') return;
  if (press(kind)) e.preventDefault();
});
stage.addEventListener('pointerdown', () => {
  audio.unlock();
  press('skip');
});

// ---------- Session events ----------
function handle(events: SessionEvent[]): void {
  fx.play(events);
  audio.play(events);
  for (const ev of events) {
    if (ev.type === 'card') overlay.showDeath(ev.result, { again: () => startRun(ev.result.mode), replay: startReplay, menu: showTitle });
  }
}

// ---------- Loop ----------
let last = performance.now();
let acc = 0;
function frame(now: number): void {
  acc += Math.min(0.1, (now - last) / 1000);
  last = now;
  while (acc >= TICK) {
    const playing = session.screen === 'play';
    handle(session.tick(steering.direction(playing)));
    fx.update(TICK);
    acc -= TICK;
  }
  renderHud();
  renderer.draw(screenLayout.layout, session.scene(), fx, steering.stick, now);
  requestAnimationFrame(frame);
}

showTitle();
requestAnimationFrame(frame);
