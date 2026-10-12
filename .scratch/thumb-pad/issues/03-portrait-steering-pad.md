# 03: Portrait steering pad

**What to build:** On a portrait touch phone (coarse pointer, shorter viewport side 500px or less), the screen splits into a one-row HUD (wordmark, orbs, echoes, best/today, icon-only mute button at least 44px with an accessible label), the arena drawn full width with no stage frame or padding, and a steering pad in the remaining height. The arena shrinks only when needed to keep the steering pad at least 120px tall. Steering happens only from touches that start in the steering pad; touches on the arena never steer. The joystick rests at the pad's centre while idle and starts from wherever the thumb lands. Any held steering is released when the layout changes. Desktop and tablets keep today's layout and drag-anywhere steering. Respects safe areas. Visual reference: "1 Thumb Pad · play" on the design canvas. See the spec at `.scratch/thumb-pad/spec.md`.

**Blocked by:** 01 (Extract the joystick model), 02 (One layout function for the whole screen)

**Status:** ready-for-agent

- [ ] Layout tests: a 390×844 phone gets a full-width arena and a steering pad of about 145px; a 375×667 phone keeps the pad at 120px and shrinks the arena; a non-phone viewport gets no pad and today's arena view; regions never overlap and stay inside the viewport
- [ ] Joystick test: idle anchor sits at the pad's centre
- [ ] On a phone, touches on the arena do not steer; touches in the steering pad do
- [ ] The HUD fits on one row on a 390px-wide phone
- [ ] Rotating or resizing mid-run releases the joystick
- [ ] Desktop and tablet layout and steering are unchanged
- [ ] `npm test` and `npm run build` pass; checked by hand on a phone or device emulator
