import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return path.endsWith('.ts') ? [path] : [];
  });
}

const gameFiles = sourceFiles('src/game');
const allFiles = [...sourceFiles('src'), ...sourceFiles('tests')];

describe('conventions', () => {
  it('keeps src/game free of DOM, audio, storage, and Math.random', () => {
    const banned = /\b(Math\.random|document|window|navigator|AudioContext|localStorage)\b/;
    const offenders = gameFiles.filter((file) => banned.test(readFileSync(file, 'utf8')));
    expect(offenders).toEqual([]);
  });

  it('writes the .ts extension on relative imports', () => {
    const relativeImport = /from '(\.[^']*)'/g;
    const offenders = allFiles.filter((file) =>
      [...readFileSync(file, 'utf8').matchAll(relativeImport)].some(
        (match) => !match[1]?.endsWith('.ts'),
      ),
    );
    expect(offenders).toEqual([]);
  });
});
