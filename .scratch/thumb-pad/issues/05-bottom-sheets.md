# 05: Bottom sheets and "Tap to skip"

**What to build:** On phones, the title and death cards appear as bottom sheets over the steering pad and the lower part of the arena, up to about 85% of the viewport height and scrolling inside themselves, with the arena still visible above (the title demo, or the echo that caught the player highlighted). Card contents and actions are unchanged, and buttons are at least 44px. During a replay the steering pad reads "Tap to skip", and tapping the steering pad or the arena skips the replay. Desktop and tablets keep today's centred card. Visual reference: "1 Thumb Pad · death card" on the design canvas. See the spec at `.scratch/thumb-pad/spec.md`.

**Blocked by:** 03 (Portrait steering pad)

**Status:** ready-for-agent

- [ ] On phones the death card is a bottom sheet with "Run again" in thumb reach and the arena visible above it
- [ ] On phones the title card is a bottom sheet that scrolls inside itself when its content is taller than the sheet
- [ ] During a replay the steering pad shows "Tap to skip"; tapping it, or the arena, skips the replay
- [ ] Desktop and tablet cards are unchanged
- [ ] Respects safe areas
- [ ] `npm test` and `npm run build` pass; checked by hand on a phone or device emulator
