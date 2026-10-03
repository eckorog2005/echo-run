import type { KeyValueStore } from '../storage.ts';

const SCALE = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];

/** Tiny WebAudio synth. Audio only starts after a user gesture, so call unlock() from input handlers. */
export class Audio {
  private ac: AudioContext | null = null;
  muted: boolean;

  constructor(private readonly store: KeyValueStore) {
    this.muted = store.get('echo-muted') === '1';
  }

  unlock(): void {
    if (!this.ac) {
      try {
        this.ac = new AudioContext();
      } catch {
        this.ac = null;
      }
    }
    if (this.ac?.state === 'suspended') void this.ac.resume();
  }

  toggle(): void {
    this.muted = !this.muted;
    this.store.set('echo-muted', this.muted ? '1' : '0');
    this.unlock();
  }

  private tone(f: number, delay: number, dur: number, type: OscillatorType = 'sine', vol = 0.07, f2?: number): void {
    const ac = this.ac;
    if (this.muted || !ac) return;
    const t0 = ac.currentTime + delay;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t0);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(ac.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  }

  pickup(n: number): void {
    const base = 330 * Math.pow(2, (SCALE[n % SCALE.length] ?? 0) / 12);
    this.tone(base, 0, 0.12, 'triangle', 0.08);
    this.tone(base * 1.5, 0.06, 0.18, 'triangle', 0.06);
    this.tone(base / 2, 0.1, 0.35, 'sine', 0.04, base / 4); // the echo being born
  }

  erase(): void {
    this.tone(880, 0, 0.25, 'sine', 0.06, 220);
    this.tone(1320, 0.03, 0.2, 'triangle', 0.03, 330);
  }

  death(): void {
    this.tone(220, 0, 0.6, 'sawtooth', 0.06, 40);
    this.tone(110, 0.02, 0.5, 'square', 0.03, 30);
  }

  start(): void {
    this.tone(440, 0, 0.08, 'triangle', 0.05);
    this.tone(660, 0.07, 0.12, 'triangle', 0.05);
  }
}
