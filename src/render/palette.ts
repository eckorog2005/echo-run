export type Palette = Record<'ink' | 'panel' | 'line' | 'text' | 'muted' | 'self' | 'echo' | 'orb' | 'danger' | 'erase', string>;

/** Reads the colours from the stylesheet's custom properties, so the canvas matches the page. */
export function readPalette(): Palette {
  const css = getComputedStyle(document.documentElement);
  const read = (k: string): string => css.getPropertyValue(`--${k}`).trim();
  return {
    ink: read('ink'), panel: read('panel'), line: read('line'), text: read('text'), muted: read('muted'),
    self: read('self'), echo: read('echo'), orb: read('orb'), danger: read('danger'), erase: read('erase'),
  };
}
