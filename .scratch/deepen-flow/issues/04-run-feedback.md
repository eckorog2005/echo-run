# 04: Run feedback

**What to build:** Effects and Audio each take `StepEvent[]` and decide their own response. A shared `src/render/palette.ts` reads the colours once and replaces `Renderer.colors`. Effects takes reduce-motion and a random source as dependencies. The main loop only forwards events. Nothing changes for the player. See the spec at `.scratch/deepen-flow/spec.md`.

**Blocked by:** 03 (Card content)

**Status:** resolved

- [x] The main loop no longer reads the palette or sets Effects' fields
- [x] Effects tested in Node: a death shakes, reduce-motion stops the shake, a collect flashes, particles fade
- [x] Bursts, flash, shake, and sounds look and sound as before
- [x] `npm run lint`, `npm test`, and `npm run build` pass
