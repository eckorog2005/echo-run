# 06: Landscape pad and pad-side setting

**What to build:** On a landscape touch phone, the arena takes the full height upright, the HUD becomes a column on one side, and the steering pad fills the other side, with the same steering rules as portrait. A left/right pad-side setting, default right, is stored through the key-value store under `echo-pad-side` (mirroring how mute is stored) and changed by a toggle on the title card, shown in both orientations; it only affects landscape. Visual reference: "1 Thumb Pad · landscape" on the design canvas. See the spec at `.scratch/thumb-pad/spec.md`.

**Blocked by:** 03 (Portrait steering pad)

**Status:** ready-for-agent

- [ ] Layout tests: an 844×390 phone puts the steering pad on the right by default and on the left when asked, with the arena at full height and the HUD column opposite the pad; regions never overlap
- [ ] The pad-side toggle on the title card switches sides immediately and is remembered after a reload
- [ ] Rotating between portrait and landscape mid-run releases the joystick and keeps the run going
- [ ] Desktop and tablet layouts are unchanged
- [ ] `npm test` and `npm run build` pass; checked by hand on a phone or device emulator

## Comments

From the ticket 04 review: `.app.phone` turns on whenever the layout has a pad, and under it the CSS hides the header's mode chip and places `#timer` at `layout.timer`. A landscape layout with a pad but no timer rectangle would therefore show neither the mode nor the timer. Either give landscape a timer/mode area in the HUD column, or tie the chip-hiding rule to the presence of a timer row instead of `.app.phone`.
