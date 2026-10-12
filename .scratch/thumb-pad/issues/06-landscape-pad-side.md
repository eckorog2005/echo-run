# 06: Landscape pad and pad-side setting

**What to build:** On a landscape touch phone, the arena takes the full height upright, the HUD becomes a column on one side, and the steering pad fills the other side, with the same steering rules as portrait. A left/right pad-side setting, default right, is stored through the key-value store under `echo-pad-side` (mirroring how mute is stored) and changed by a toggle on the title card, shown in both orientations; it only affects landscape. Visual reference: "1 Thumb Pad · landscape" on the design canvas. See the spec at `.scratch/thumb-pad/spec.md`.

**Blocked by:** 03 (Portrait steering pad)

**Status:** resolved

- [x] Layout tests: an 844×390 phone puts the steering pad on the right by default and on the left when asked, with the arena at full height and the HUD column opposite the pad; regions never overlap
- [x] The pad-side toggle on the title card switches sides immediately and is remembered after a reload
- [x] Rotating between portrait and landscape mid-run releases the joystick and keeps the run going
- [x] Desktop and tablet layouts are unchanged
- [x] `npm test` and `npm run build` pass; checked by hand on a phone or device emulator

## Comments

From the ticket 04 review: `.app.phone` turns on whenever the layout has a pad, and under it the CSS hides the header's mode chip and places `#timer` at `layout.timer`. A landscape layout with a pad but no timer rectangle would therefore show neither the mode nor the timer. Either give landscape a timer/mode area in the HUD column, or tie the chip-hiding rule to the presence of a timer row instead of `.app.phone`.

From the ticket 05 review: the bottom-sheet CSS also hangs off `.app.phone`. `main.ts` sets the overlay's `top` to the HUD's bottom edge so mute stays reachable, which assumes the HUD is a row at the top. A side-column HUD would squash the overlay. Landscape needs its own hook, or the overlay top should be set only when the HUD is a top row.

Implemented:

- `layout()` handles landscape phones. A 104px HUD column (HUD above, timer at its foot), the upright arena at full height, and the steering pad sit in a row, with the arena shrinking only to keep the pad at least 120px wide. Pad side `left` mirrors the row. Spacing follows the "1 Thumb Pad · landscape" mockup.
- `Layout` gained `kind` (`stage` / `portrait` / `landscape`) and `sheet`, the area cards may cover: everything but the HUD. `main.ts` toggles `.app.phone` and `.app.phone.landscape` from `kind` and places the overlay at `sheet`. This replaces the earlier overlay `top` rule, which assumed a top HUD row, and resolves both comments above. The landscape HUD column shows the mode chip, and the timer reads "Round N" with seconds left.
- `place()` now measures from `parentElement`, because `offsetParent` is null while the overlay is hidden. Without that, rotating mid-run would have cleared the overlay's placement.
- `loadPadSide` / `savePadSide` in `src/render/padSide.ts` store `echo-pad-side` (default right; unknown values read as right). `Renderer.padSide` relays out at once. The title sheet shows a Left/Right toggle (44px, `aria-pressed`) on phones in both orientations, never on desktop.

Checked in Chrome device emulation:
- At 844×390 the pad is on the right by default. The toggle moves it to the left at once, stores `left`, and the choice survives a reload.
- A drag that starts on the arena doesn't steer; a pad drag steers.
- Rotating to portrait mid-drag releases the stick and the run continues.
- The landscape death sheet sits beside the HUD column.
- Desktop shows no toggle.
- The portrait sheet, replay, and steering checks from tickets 03–05 still pass.

Review follow-ups:

- Done: mute is icon-only in landscape too, per the spec. `parsePadSide` is shared by the store and the toggle. `Renderer.setPadSide()` replaces the setter, and the title reads the side from the renderer. `MIN_PAD` became `MIN_PAD_SPAN`, since it is a height in portrait and a width in landscape.
- Spec departure, following the mockup: in landscape the timer sits at the foot of the HUD column ("Round N", seconds left, and a bar), not between the arena and the pad, and the mode shows as the column's chip. Either update the spec or move the timer.
- Open: CLAUDE.md's Persistence section doesn't list `echo-pad-side` (`src/render/padSide.ts`) yet.
- Open, story 15: in landscape the death sheet covers most of the arena, so the echo that caught the player is usually hidden (see ticket 05's note for portrait).
- Unverified on a real device: safe-area insets in landscape (the stage is inset by `.app.phone` padding, and the layout adds a 12px margin), and the card's negative bottom margin that runs the sheet under the home indicator.
