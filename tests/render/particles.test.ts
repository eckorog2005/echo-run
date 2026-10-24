import { describe, expect, it } from 'vitest';
import type { SessionEvent } from '../../src/game/session.ts';
import type { Palette } from '../../src/render/palette.ts';
import { Effects } from '../../src/render/particles.ts';

const palette: Palette = {
  ink: 'ink', panel: 'panel', line: 'line', text: 'text', muted: 'muted',
  self: 'self', echo: 'echo', orb: 'orb', danger: 'danger', erase: 'erase',
};
const at = { x: 100, y: 200 };
const collect: SessionEvent = { type: 'collect', at, n: 1 };
const erase: SessionEvent = { type: 'erase', at, n: 1 };
const die: SessionEvent = { type: 'die', at, cause: { kind: 'time' } };

const effects = (reduceMotion = false): Effects => new Effects({ palette, reduceMotion, random: () => 0.75 });
const colours = (fx: Effects): string[] => [...new Set(fx.particles.map((p) => p.color))];

describe('Effects', () => {
  it('bursts orb and echo colours and flashes on a collect', () => {
    const fx = effects();
    fx.play([collect]);
    expect(colours(fx)).toEqual(['orb', 'echo']);
    expect(fx.flash).toBe(1);
    expect(fx.offset()).toEqual({ x: 0, y: 0 });
  });

  it('bursts the eraser colour on an erase, without a flash or shake', () => {
    const fx = effects();
    fx.play([erase]);
    expect(colours(fx)).toEqual(['erase']);
    expect(fx.flash).toBe(0);
    expect(fx.offset()).toEqual({ x: 0, y: 0 });
  });

  it('bursts and shakes the screen on a death', () => {
    const fx = effects();
    fx.play([die]);
    expect(colours(fx)).toEqual(['danger', 'self']);
    expect(fx.offset().x).not.toBe(0);
  });

  it('never shakes for a player who prefers reduced motion', () => {
    const fx = effects(true);
    fx.play([die]);
    expect(fx.particles.length).toBeGreaterThan(0);
    expect(fx.offset()).toEqual({ x: 0, y: 0 });
  });

  it('ignores the death card', () => {
    const fx = effects();
    fx.play([{ type: 'card', result: { mode: 'endless', outcome: { kind: 'plain' }, cause: { kind: 'time' }, score: 0, erased: 0, best: 0 } }]);
    expect(fx.particles).toEqual([]);
  });

  it('fades particles, flash, and shake out over time', () => {
    const fx = effects();
    fx.play([collect, die]);
    for (let i = 0; i < 120; i++) fx.update(1 / 60);
    expect(fx.particles).toEqual([]);
    expect(fx.flash).toBeLessThan(0.02);
    expect(fx.offset()).toEqual({ x: 0, y: 0 });
  });

  it('clears everything on reset', () => {
    const fx = effects();
    fx.play([collect, die]);
    fx.reset();
    expect(fx.particles).toEqual([]);
    expect(fx.flash).toBe(0);
    expect(fx.offset()).toEqual({ x: 0, y: 0 });
  });
});
