# 05: Bottom sheets and "Tap to skip"

**What to build:** On phones, the title and death cards appear as bottom sheets over the steering pad and the lower part of the arena, up to about 85% of the viewport height and scrolling inside themselves, with the arena still visible above (the title demo, or the echo that caught the player highlighted). Card contents and actions are unchanged, and buttons are at least 44px. During a replay the steering pad reads "Tap to skip", and tapping the steering pad or the arena skips the replay. Desktop and tablets keep today's centred card. Visual reference: "1 Thumb Pad · death card" on the design canvas. See the spec at `.scratch/thumb-pad/spec.md`.

**Blocked by:** 03 (Portrait steering pad)

**Status:** resolved

- [x] On phones the death card is a bottom sheet with "Run again" in thumb reach and the arena visible above it
- [x] On phones the title card is a bottom sheet that scrolls inside itself when its content is taller than the sheet
- [x] During a replay the steering pad shows "Tap to skip"; tapping it, or the arena, skips the replay
- [x] Desktop and tablet cards are unchanged
- [x] Respects safe areas
- [x] `npm test` and `npm run build` pass; checked by hand on a phone or device emulator

## Comments

These are styles and wiring only, with no unit tests, as the spec says for this ticket.

- On phones the overlay is a bottom-aligned layer from under the HUD to the bottom of the screen, so mute stays reachable. It sits above the timer row and is dimmed only lightly. The card is the sheet: up to 85% of that layer, scrolling inside itself, and running under the home indicator. Its button row is sticky at the bottom so the actions stay in thumb reach while a tall title sheet scrolls. Buttons are at least 44px.
- `Renderer.draw` takes a pad label. During a replay the pad shows "Tap to skip", centred, with no joystick. Taps anywhere on the stage (pad or arena) already skip, through the existing `pointerdown` handler.
- Not changed: the in-arena replay banner ("Replay · round N of M · tap to skip") is drawn in arena space, so on a rotated phone arena it reads sideways. That predates this ticket.

Checked in Chrome device emulation at 390×763, 320×548, and 1200×900. On the 320px phone the title sheet scrolls (496px of content in 427px) with the buttons pinned. The death-sheet buttons are 44px. Tapping the pad during a replay brings the death sheet back. Desktop cards are unchanged.

Review follow-ups:

- Done: `Renderer.draw` takes a `PadView` (`steer` with the joystick, `prompt` with a label, or nothing) instead of a joystick and a label. `main.ts` maps each screen to one with a single table.
- Done: the sheet's cap is `min(85dvh, 100%)`, measured against the viewport as the spec says. The pinned button row sits above the home indicator, and a panel-coloured shadow fills that strip. This is not yet checked on a notched device; Chrome emulation reports a zero inset.
- Open: the death sheet covers the pad, the timer row, and roughly the bottom 100px of the arena. A catch in that strip can be hidden under the sheet, so story 15 ("the echo that caught me highlighted") isn't guaranteed there. Options: a shorter death sheet, or shifting the arena view while the sheet is up.
