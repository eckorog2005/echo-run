# 01: Desktop card panel

**What to build:** On the desktop (stage) layout, give the title and death cards a solid `--panel` background, a 1px `--line` border, a 14px radius, and padding, centred on the stage. In the button row, push the "or press Space" hint to the right edge. Phone layouts are unchanged. See the spec at `.scratch/title-card-fit/spec.md`.

**Blocked by:** none

**Status:** resolved

- [x] The arena no longer shows through the title or death card text on desktop
- [x] The hint sits at the right edge of the button row
- [x] Portrait and landscape phone cards look as before
- [x] `npm run lint`, `npm test`, and `npm run build` pass
