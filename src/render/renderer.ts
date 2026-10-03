import { ECHO_R, ERASER_R, ORB_R, PLAYER_R, WORLD_H, WORLD_W } from '../game/constants.ts';
import type { Echo, Vec } from '../game/model.ts';
import { JOY_R, type Joystick } from '../input/input.ts';
import type { Effects } from './particles.ts';

/** Everything the renderer needs for one frame; built from live play, the replay, or the title demo. */
export interface Scene {
  echoes: readonly Echo[];
  route: ArrayLike<number>;
  routeLen: number;
  player: Vec | null;
  trail: readonly Vec[];
  orb: Vec | null;
  eraser: Vec | null;
  /** Fraction of the round timer left, 0..1. */
  timeLeft: number;
  killerN: number | null;
  numbered: boolean;
  banner: string | null;
  bannerAlpha: number;
}

type Palette = Record<'ink' | 'panel' | 'line' | 'text' | 'muted' | 'self' | 'echo' | 'orb' | 'danger' | 'erase', string>;

export class Renderer {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly C: Palette;
  private s = 1;
  private ox = 0;
  private oy = 0;
  private cw = 0;
  private ch = 0;
  private dpr = 1;

  constructor(private readonly canvas: HTMLCanvasElement, private readonly stage: HTMLElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D is not available');
    this.ctx = ctx;
    const css = getComputedStyle(document.documentElement);
    const read = (k: string): string => css.getPropertyValue(`--${k}`).trim();
    this.C = {
      ink: read('ink'), panel: read('panel'), line: read('line'), text: read('text'), muted: read('muted'),
      self: read('self'), echo: read('echo'), orb: read('orb'), danger: read('danger'), erase: read('erase'),
    };
    new ResizeObserver(() => this.resize()).observe(stage);
    this.resize();
  }

  get colors(): Palette {
    return this.C;
  }

  private resize(): void {
    const r = this.stage.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.cw = r.width;
    this.ch = r.height;
    this.canvas.width = Math.round(r.width * this.dpr);
    this.canvas.height = Math.round(r.height * this.dpr);
    const pad = 12;
    this.s = Math.max(0.01, Math.min((this.cw - pad * 2) / WORLD_W, (this.ch - pad * 2) / WORLD_H));
    this.ox = (this.cw - WORLD_W * this.s) / 2;
    this.oy = (this.ch - WORLD_H * this.s) / 2;
  }

  private circle(x: number, y: number, r: number): void {
    this.ctx.beginPath();
    this.ctx.arc(x, y, r, 0, Math.PI * 2);
  }

  private polyline(pts: ArrayLike<number>, len: number): void {
    const ctx = this.ctx;
    ctx.beginPath();
    for (let i = 0; i + 1 < len; i += 4) {
      const x = pts[i] ?? 0, y = pts[i + 1] ?? 0;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  draw(scene: Scene, fx: Effects, joy: Joystick | null, now: number): void {
    const { ctx, C } = this;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.globalAlpha = 1;
    ctx.fillStyle = C.panel;
    ctx.fillRect(0, 0, this.cw, this.ch);

    const sh = fx.offset();
    ctx.save();
    ctx.translate(this.ox + sh.x, this.oy + sh.y);
    ctx.scale(this.s, this.s);

    // Arena
    ctx.fillStyle = C.ink;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    ctx.fillStyle = C.line;
    for (let x = 50; x < WORLD_W; x += 50) for (let y = 50; y < WORLD_H; y += 50) ctx.fillRect(x - 1, y - 1, 2, 2);
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, WORLD_W - 2, WORLD_H - 2);
    if (fx.flash > 0.02) {
      ctx.globalAlpha = fx.flash * 0.08;
      ctx.fillStyle = C.echo;
      ctx.fillRect(0, 0, WORLD_W, WORLD_H);
      ctx.globalAlpha = 1;
    }

    // Echo routes
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    for (const e of scene.echoes) {
      const hit = e.n === scene.killerN;
      ctx.strokeStyle = hit ? C.danger : C.echo;
      ctx.globalAlpha = hit ? 0.55 : 0.07;
      this.polyline(e.path, e.path.length);
    }
    // The route being recorded right now
    if (scene.routeLen > 4) {
      ctx.globalAlpha = 0.3;
      ctx.strokeStyle = C.self;
      ctx.setLineDash([4, 8]);
      this.polyline(scene.route, scene.routeLen);
      ctx.setLineDash([]);
    }
    ctx.globalAlpha = 1;

    // Eraser: a spinning teal square that deletes your oldest echo
    if (scene.eraser) {
      const { x, y } = scene.eraser;
      const spin = now / 400;
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = C.erase;
      this.circle(x, y, ERASER_R * 2.2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(spin);
      ctx.strokeStyle = C.erase;
      ctx.lineWidth = 3;
      ctx.strokeRect(-ERASER_R * 0.8, -ERASER_R * 0.8, ERASER_R * 1.6, ERASER_R * 1.6);
      ctx.restore();
    }

    // Orb with its countdown ring
    if (scene.orb) {
      const { x, y } = scene.orb;
      const pulse = 1 + Math.sin(now / 160) * 0.08;
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = C.orb;
      this.circle(x, y, ORB_R * 2.2 * pulse);
      ctx.fill();
      ctx.globalAlpha = 1;
      this.circle(x, y, ORB_R * pulse);
      ctx.fill();
      ctx.strokeStyle = scene.timeLeft < 0.3 ? C.danger : C.orb;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, ORB_R + 9, -Math.PI / 2, -Math.PI / 2 + scene.timeLeft * Math.PI * 2);
      ctx.stroke();
    }

    // Echoes
    ctx.font = '600 11px "IBM Plex Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const e of scene.echoes) {
      const hit = e.n === scene.killerN;
      if (e.live || hit) {
        ctx.fillStyle = hit ? C.danger : C.echo;
        ctx.globalAlpha = 0.25;
        this.circle(e.x, e.y, ECHO_R + 6);
        ctx.fill();
        ctx.globalAlpha = 0.95;
        this.circle(e.x, e.y, ECHO_R);
        ctx.fill();
        if (scene.numbered) {
          ctx.globalAlpha = 1;
          ctx.fillStyle = C.ink;
          ctx.fillText(String(e.n), e.x, e.y + 0.5);
        }
      } else {
        ctx.globalAlpha = 0.45;
        ctx.strokeStyle = C.echo;
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 4]);
        this.circle(e.x, e.y, ECHO_R);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
    ctx.globalAlpha = 1;

    // Player
    if (scene.player) {
      const n = scene.trail.length;
      scene.trail.forEach((t, i) => {
        ctx.globalAlpha = (i / n) * 0.35;
        ctx.fillStyle = C.self;
        this.circle(t.x, t.y, PLAYER_R * (0.4 + (0.6 * i) / n));
        ctx.fill();
      });
      const { x, y } = scene.player;
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = C.self;
      this.circle(x, y, PLAYER_R + 7);
      ctx.fill();
      ctx.globalAlpha = 1;
      this.circle(x, y, PLAYER_R);
      ctx.fill();
      ctx.fillStyle = C.text;
      this.circle(x, y, PLAYER_R * 0.38);
      ctx.fill();
    }

    for (const p of fx.particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color;
      this.circle(p.x, p.y, p.r);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (scene.banner && scene.bannerAlpha > 0) {
      ctx.globalAlpha = scene.bannerAlpha;
      ctx.fillStyle = C.muted;
      ctx.font = '600 14px "IBM Plex Mono", monospace';
      ctx.fillText(scene.banner, WORLD_W / 2, 28);
      ctx.globalAlpha = 1;
    }
    ctx.restore();

    if (joy?.active) {
      ctx.strokeStyle = C.muted;
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 1.5;
      this.circle(joy.ax, joy.ay, JOY_R);
      ctx.stroke();
      ctx.fillStyle = C.muted;
      ctx.globalAlpha = 0.6;
      this.circle(joy.x, joy.y, 12);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
}
