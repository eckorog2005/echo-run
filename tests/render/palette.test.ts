import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PALETTE } from '../../src/render/palette.ts';

describe('PALETTE', () => {
  it('matches the colours on :root in style.css', () => {
    const root = /:root\s*\{([^}]*)\}/.exec(readFileSync('src/style.css', 'utf8'))?.[1] ?? '';
    for (const [name, colour] of Object.entries(PALETTE)) {
      expect(root, `--${name}`).toMatch(new RegExp(`--${name}:\\s*${colour};`, 'i'));
    }
  });
});
