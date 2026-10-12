# 02: One layout function for the whole screen

**What to build:** Give the view module a single pure layout function that takes the viewport size, whether the device is a touch phone, and the pad side, and returns the rectangles for the HUD, the arena, and the steering pad (none for now), plus the arena view (rotation, scale, offsets). It replaces today's arena fitting as the one answer to "where does everything go", and the renderer and steering conversion read from it. For now it never returns a steering pad, so nothing visible changes. See the spec at `.scratch/thumb-pad/spec.md`.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] One pure layout function in the view module returns HUD, arena, and (optional) steering pad rectangles plus the arena view
- [x] Existing arena-fitting tests carry over and still pass against the new function
- [x] A test asserts that no viewport gets a steering pad yet
- [x] The arena is drawn exactly as before on desktop, portrait, and landscape
- [x] `npm test` and `npm run build` pass

## Comments

Implemented as `layout(stage, phone, padSide)` in `src/render/view.ts`; `fitArena` is now private. Decisions for ticket 03 to confirm or change:

- The function works in stage pixels and takes the stage size, not the window. On desktop and tablets CSS still places the header and stage, so it returns `hud: null` there (HUD outside the stage). Phones can make the stage fill the viewport and get real HUD and pad rectangles from the same function.
- The phone rule is `isPhone(viewport, coarsePointer)` in the same module, so input routing can share it. The CSS touch rule in `style.css` uses `(hover: none) and (pointer: coarse)` instead, so the two can disagree on hybrid devices.

Checked by rendering HEAD and this change under a frozen clock at 1200×900, 390×844 touch, and 844×390 touch: the canvas pixels are identical.
