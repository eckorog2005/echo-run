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

const rand = (a: number, b: number): number => a + Math.random() * (b - a);

/** Visual-only effects. Uses Math.random freely since none of this affects the sim. */
export class Effects {
  particles: Particle[] = [];
  shake = 0;
  flash = 0;
  private readonly reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  burst(x: number, y: number, color: string, n: number, speed = 260): void {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = rand(speed * 0.3, speed);
      const life = rand(0.4, 0.9);
      this.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life, max: 0.9, color, r: rand(1.5, 3.5) });
    }
  }

  kick(amount: number): void {
    if (!this.reduceMotion) this.shake = Math.max(this.shake, amount);
  }

  update(dt: number): void {
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.94;
      p.vy *= 0.94;
      p.life -= dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
    this.shake *= 0.88;
    if (this.shake < 0.3) this.shake = 0;
    this.flash *= 0.9;
  }

  offset(): { x: number; y: number } {
    return this.shake ? { x: rand(-this.shake, this.shake), y: rand(-this.shake, this.shake) } : { x: 0, y: 0 };
  }

  reset(): void {
    this.particles = [];
    this.shake = 0;
    this.flash = 0;
  }
}
