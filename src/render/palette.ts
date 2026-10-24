export type Palette = Record<'ink' | 'panel' | 'line' | 'text' | 'muted' | 'self' | 'echo' | 'orb' | 'danger' | 'erase', string>;

/**
 * The canvas colours, matching the custom properties on `:root` in style.css. Not read from the stylesheet,
 * because on a cold load the game can start before it has loaded, and empty colours draw as black.
 */
export const PALETTE: Palette = {
  ink: '#0c1320',
  panel: '#121c2c',
  line: '#22314a',
  text: '#e8edf6',
  muted: '#8494ac',
  self: '#ff9b71',
  echo: '#a99bff',
  orb: '#ffd166',
  danger: '#ff5d73',
  erase: '#5ee6d0',
};
