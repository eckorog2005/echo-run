# 03: Portrait steering pad

**What to build:** On a portrait touch phone (coarse pointer, shorter viewport side 500px or less), the screen splits into a one-row HUD (wordmark, orbs, echoes, best/today, icon-only mute button at least 44px with an accessible label), the arena drawn full width with no stage frame or padding, and a steering pad in the remaining height. The arena shrinks only when needed to keep the steering pad at least 120px tall. Steering happens only from touches that start in the steering pad; touches on the arena never steer. The joystick rests at the pad's centre while idle and starts from wherever the thumb lands. Any held steering is released when the layout changes. Desktop and tablets keep today's layout and drag-anywhere steering. Respects safe areas. Visual reference: "1 Thumb Pad · play" on the design canvas. See the spec at `.scratch/thumb-pad/spec.md`.

**Blocked by:** 01 (Extract the joystick model), 02 (One layout function for the whole screen)

**Status:** resolved

- [x] Layout tests: a 390×844 phone gets a full-width arena and a steering pad of about 145px; a 375×667 phone keeps the pad at 120px and shrinks the arena; a non-phone viewport gets no pad and today's arena view; regions never overlap and stay inside the viewport
- [x] Joystick test: idle anchor sits at the pad's centre
- [x] On a phone, touches on the arena do not steer; touches in the steering pad do
- [x] The HUD fits on one row on a 390px-wide phone
- [x] Rotating or resizing mid-run releases the joystick
- [x] Desktop and tablet layout and steering are unchanged
- [x] `npm test` and `npm run build` pass; checked by hand on a phone or device emulator

## Comments

`layout()` in `src/render/view.ts` now returns HUD, arena, timer-row, and pad rectangles for a portrait phone, using the mockup's spacing (12px gutter, 10px gaps, 44px HUD, 24px timer row). It works in stage pixels, and on phones the stage is the viewport inside its safe areas. A 390×844 iPhone gives a 390×763 stage and a pad of about 142px. Landscape phones still get no pad, so ticket 06 picks that up.

- The timer rectangle holds the mode chip for now so the mode stays visible on phones; ticket 04 can fill that row in.
- `Joystick.restAt` became `confine(zone)`: it rests the stick at the zone's centre and refuses presses that start outside it, so "arena touches never steer" is tested in Node.
- `Renderer` reports layout changes; `main.ts` toggles `.app.phone`, places the header, mode chip, and overlay top from the rectangles, then releases and re-confines the joystick.
- The renderer draws the pad and the idle joystick, and drops the "Drag here to steer" label when the pad is too short for it to clear the ring.

Checked in Chrome device emulation (390×763 and 320×568 touch, plus 1200×900 desktop) with real touch events. A drag that starts on the arena doesn't steer, a drag in the pad steers in the screen direction, and rotating mid-drag releases the stick. Desktop and landscape look as before. Not yet tried on a physical phone.

Review follow-ups, left open on purpose:

- The spec says the arena "reaches the width", but the code keeps the mockup's 12px side gutter (366px arena on a 390px stage). The spec's "about 145px" pad only comes out with that gutter. Change one of them to match the other.
- `.app.phone` is keyed on `pad !== null`, and its CSS assumes portrait. Ticket 06 will need a separate portrait/landscape hook.
- The overlay's top is set below the HUD on phones so the HUD stays visible. Ticket 05's bottom sheets may replace this.
- `src/input/joystick.ts` type-imports `Rect` from `src/render/view.ts`. Move the geometry types somewhere shared if that layering matters.
