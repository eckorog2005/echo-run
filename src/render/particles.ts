import type { SessionEvent } from '../game/session.ts';
import type { Palette } from './palette.ts';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  color: string;
  r: number;
}

export interface EffectsDeps {
  palette: Palette;
  reduceMotion: boolean;
  /** Visual-only randomness, 0..1; none of this affects the sim. */
  random: () => number;
}

/** The bursts, flash, and screen shake that follow what happens in a run. */
export class Effects {
  private list: Particle[] = [];
  private shake = 0;
  private flashLevel = 0;

  constructor(private readonly deps: EffectsDeps) {}

  get particles(): readonly Particle[] {
    return this.list;
  }

  /** How bright the collect flash still is, 0..1. */
  get flash(): number {
    return this.flashLevel;
  }

  play(events: readonly SessionEvent[]): void {
    const C = this.deps.palette;
    for (const ev of events) {
      if (ev.type === 'collect') {
        this.burst(ev.at.x, ev.at.y, C.orb, 26);
        this.burst(ev.at.x, ev.at.y, C.echo, 14, 160);
        this.flashLevel = 1;
      } else if (ev.type === 'erase') {
        this.burst(ev.at.x, ev.at.y, C.erase, 30, 220);
      } else if (ev.type === 'die') {
        this.burst(ev.at.x, ev.at.y, C.danger, 44, 340);
        this.burst(ev.at.x, ev.at.y, C.self, 20, 200);
        if (!this.deps.reduceMotion) this.shake = Math.max(this.shake, 18);
      }
    }
  }

  update(dt: number): void {
    for (const p of this.list) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.94;
      p.vy *= 0.94;
      p.life -= dt;
    }
    this.list = this.list.filter((p) => p.life > 0);
    this.shake *= 0.88;
    if (this.shake < 0.3) this.shake = 0;
    this.flashLevel *= 0.9;
  }

  offset(): { x: number; y: number } {
    const s = this.shake;
    return s ? { x: this.rand(-s, s), y: this.rand(-s, s) } : { x: 0, y: 0 };
  }

  reset(): void {
    this.list = [];
    this.shake = 0;
    this.flashLevel = 0;
  }

  private rand(a: number, b: number): number {
    return a + this.deps.random() * (b - a);
  }

  private burst(x: number, y: number, color: string, n: number, speed = 260): void {
    for (let i = 0; i < n; i++) {
      const a = this.deps.random() * Math.PI * 2;
      const s = this.rand(speed * 0.3, speed);
      const life = this.rand(0.4, 0.9);
      this.list.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life, max: 0.9, color, r: this.rand(1.5, 3.5) });
    }
  }
}
