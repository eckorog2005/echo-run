# 01: Extract the joystick model

**What to build:** Move the drag-joystick logic out of the DOM input adapter into a pure joystick model that runs in Node: press sets the anchor at the touch point, moves inside the joystick radius give a proportional steering vector, moving past the radius drags the anchor along so an immediate reversal flips direction, the existing dead zone gives zero, and release gives zero. The input adapter feeds pointer events into the model. Steering feels exactly as it does today on every device; the renderer still draws the joystick from the same state. See the spec at `.scratch/thumb-pad/spec.md`.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] A pure joystick model exists in the input layer with no DOM dependencies
- [x] Node tests cover: press then move inside the radius, moving past the radius dragging the anchor, reversal after a drag, the dead zone, and release
- [x] The model can be given a resting anchor (used later for the steering pad's centre); no caller uses it yet
- [x] Keyboard steering still takes priority over the joystick
- [x] Steering on desktop and touch is unchanged when played by hand
- [x] `npm test` and `npm run build` pass

## Comments

Implemented as `Joystick` in `src/input/joystick.ts` (tests in `tests/input/joystick.test.ts`); `Input` feeds it pointer events. Steering by hand on desktop and touch still needs checking.
