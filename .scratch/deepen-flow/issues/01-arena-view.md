# 01: Arena view

**What to build:** Turn `ArenaView` into a module that owns the mapping between the arena and the stage both ways. The Renderer draws the arena through its transform matrix, keeps echo numbers upright with its upright turn, and places the banner with its banner box. Steering maps a stage direction into the arena through it instead of storing a rotation flag. Add "Arena view" to `CONTEXT.md`. Nothing changes for the player. See the spec at `.scratch/deepen-flow/spec.md`.

**Blocked by:** none

**Status:** resolved

- [x] One arena-to-stage transform; everything else is derived from it
- [x] The Renderer no longer branches on `rotated`, and Steering no longer stores it
- [x] Tested in Node: round trip, corners on the arena rect, drawn direction maps to arena direction (upright and rotated), zero stays `+0`, upright text turn, banner box
- [x] Steering tests unchanged and passing
- [x] Drawing, steering, echo numbers, and the banner look and behave as before on desktop and on a phone-sized touch viewport in both orientations
- [x] `npm run lint`, `npm test`, and `npm run build` pass
