import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Relative asset paths so dist/ works on GitHub Pages, itch.io, or any static host.
  base: './',
  test: {
    environment: 'node',
  },
});
