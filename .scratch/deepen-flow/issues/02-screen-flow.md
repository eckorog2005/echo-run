# 02: Screen flow rules in the Session

**What to build:** The Session answers what a confirm press (Space/Enter) and a skip press (Escape, a tap on the stage) do on each screen, including the title card's main button, and the Scene says what the steering pad shows. The Session writes the "tap to skip" wording once. Delete the main loop's `playing || card` effects filter. The pad-side toggle stays out of the Session. Nothing changes for the player. See the spec at `.scratch/deepen-flow/spec.md`.

**Blocked by:** 01 (Arena view)

**Status:** resolved

- [x] Confirm and skip tested through the Session on every screen
- [x] The title main action is Daily run before today's counted attempt and Endless after, tested through the Session
- [x] The Scene's pad content is tested per screen; the Renderer reads it
- [x] A replay emits no `collect`, `erase`, or `die`, tested; the main loop filter is gone
- [x] Keys, taps, the pad prompt, and the replay behave as before on desktop and a phone-sized touch viewport
- [x] `npm run lint`, `npm test`, and `npm run build` pass
