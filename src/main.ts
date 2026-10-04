import './style.css';
import { Audio } from './audio/audio.ts';
import { TICK } from './game/constants.ts';
import { dateKey } from './game/daily.ts';
import { Session, type Hud, type Mode, type SessionEvent } from './game/session.ts';
import { Input } from './input/input.ts';
import { Effects } from './render/particles.ts';
import { Renderer } from './render/renderer.ts';
import { toArenaDirection } from './render/view.ts';
import { browserStore } from './storage.ts';
import { Overlay } from './ui/overlay.ts';

const byId = <T extends HTMLElement>(id: string): T => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing #${id}`);
  return el as T;
};

const stage = byId<HTMLDivElement>('stage');
const hudEl = {
  score: byId('score'),
  echoes: byId('echoes'),
  best: byId('best'),
  bestLabel: byId('best-label'),
  mode: byId('mode-chip'),
  mute: byId<HTMLButtonElement>('mute'),
};

const store = browserStore;
const session = new Session({ store, today: () => dateKey(), randomSeed: () => (Math.random() * 2 ** 32) >>> 0 });
const renderer = new Renderer(byId<HTMLCanvasElement>('cv'), stage);
const input = new Input(stage);
const audio = new Audio(store);
const fx = new Effects();
const overlay = new Overlay(byId('overlay'));
const C = renderer.colors;

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
}

function renderMute(): void {
  hudEl.mute.textContent = audio.muted ? 'Sound off' : 'Sound on';
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
  input.joystickEnabled = false;
  overlay.showTitle(session.titleInfo(), { daily: () => startRun('daily'), endless: () => startRun('endless') });
}

function startRun(mode: Mode): void {
  audio.unlock();
  audio.start();
  (document.activeElement as HTMLElement | null)?.blur?.();
  session.start(mode);
  fx.reset();
  input.joystickEnabled = true;
  overlay.hide();
}

function startReplay(): void {
  session.watchReplay();
  fx.reset();
  overlay.hide();
}

// ---------- Input that isn't steering ----------
window.addEventListener('keydown', (e) => {
  if (e.code !== 'Space' && e.code !== 'Enter' && e.code !== 'Escape') return;
  if ((e.target as HTMLElement | null)?.tagName === 'BUTTON' && e.code !== 'Escape') return;
  if (session.screen === 'replay') {
    e.preventDefault();
    session.skipReplay();
  } else if (overlay.visible && e.code !== 'Escape') {
    e.preventDefault();
    overlay.activatePrimary();
  }
});
stage.addEventListener('pointerdown', () => {
  audio.unlock();
  if (session.screen === 'replay') session.skipReplay();
});

// ---------- Session events ----------
function handle(events: SessionEvent[]): void {
  for (const ev of events) {
    if (ev.type === 'collect') {
      fx.burst(ev.at.x, ev.at.y, C.orb, 26);
      fx.burst(ev.at.x, ev.at.y, C.echo, 14, 160);
      fx.flash = 1;
      audio.pickup(ev.n);
    } else if (ev.type === 'erase') {
      fx.burst(ev.at.x, ev.at.y, C.erase, 30, 220);
      audio.erase();
    } else if (ev.type === 'die') {
      input.joystickEnabled = false;
      input.joy.active = false;
      fx.burst(ev.at.x, ev.at.y, C.danger, 44, 340);
      fx.burst(ev.at.x, ev.at.y, C.self, 20, 200);
      fx.kick(18);
      audio.death();
    } else {
      overlay.showDeath(ev.result, { again: () => startRun(ev.result.mode), replay: startReplay, menu: showTitle });
    }
  }
}

// ---------- Loop ----------
let last = performance.now();
let acc = 0;
let wasRotated = renderer.rotated;
function frame(now: number): void {
  acc += Math.min(0.1, (now - last) / 1000);
  last = now;
  if (renderer.rotated !== wasRotated) {
    wasRotated = renderer.rotated;
    input.joy.active = false;
  }
  while (acc >= TICK) {
    const playing = session.screen === 'play';
    const events = session.tick(toArenaDirection(input.direction(), renderer.rotated));
    // Effects only follow live play; the replay is silent, as before.
    if (playing || events.some((e) => e.type === 'card')) handle(events);
    fx.update(TICK);
    acc -= TICK;
  }
  renderHud();
  renderer.draw(session.scene(), fx, session.screen === 'play' ? input.joy : null, now);
  requestAnimationFrame(frame);
}

showTitle();
requestAnimationFrame(frame);
