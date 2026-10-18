# 02: Steering module

**What to build:** One pure steering module answers "which way does the player steer this tick, in arena space". It takes pointer presses, moves, and releases in stage pixels, key down/up, blur, and relayout with a new screen layout, and offers `direction(playing)` plus a read-only stick (anchor, knob already clamped to the joystick radius, active) for drawing. When not playing it releases any held touch and returns zero, and presses that arrive while not playing are ignored; the main loop passes whether the Session's screen is play, so the `joystickEnabled` flag and the scattered joystick cancels in the main loop go away. Relayout releases a held touch, confines presses to the steering pad (anywhere when there is no pad), rests the stick at the pad's centre, and records whether the arena is rotated. Keys win over the joystick and diagonals are normalised, as today. Rotation into arena space becomes internal. The existing joystick model stays as an internal part with its tests unchanged. The DOM input class only converts events to stage coordinates and forwards them. The Renderer draws the steering pad from the stick value and no longer imports the joystick. Nothing changes for the player on any device. See the spec at `.scratch/deepen-ui/spec.md`.

**Blocked by:** 01 (Screen layout owner)

**Status:** resolved

- [x] Dragging steers in proportion to distance; on a phone layout presses outside the steering pad are ignored; on the stage layout presses anywhere steer
- [x] `direction(false)` returns zero and releases a held touch; a press while not playing is ignored
- [x] Relayout releases a held touch and rests the stick at the steering pad's centre
- [x] On a portrait phone, a screen-space drag maps to the correct arena direction
- [x] Keys win over a held touch, diagonals are normalised, and blur releases keys and touch
- [x] The stick's knob never leaves the joystick radius
- [x] All of the above are tested in Node through the steering module's interface; the old rotation-function tests are rewritten through it and deleted
- [x] Steering, idle stick position, and death/menu/replay behaviour are unchanged on desktop and on a phone-sized touch viewport in both orientations
- [x] `npm run lint`, `npm test`, and `npm run build` pass
