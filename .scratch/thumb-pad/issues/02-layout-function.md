# 02: One layout function for the whole screen

**What to build:** Give the view module a single pure layout function that takes the viewport size, whether the device is a touch phone, and the pad side, and returns the rectangles for the HUD, the arena, and the steering pad (none for now), plus the arena view (rotation, scale, offsets). It replaces today's arena fitting as the one answer to "where does everything go", and the renderer and steering conversion read from it. For now it never returns a steering pad, so nothing visible changes. See the spec at `.scratch/thumb-pad/spec.md`.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] One pure layout function in the view module returns HUD, arena, and (optional) steering pad rectangles plus the arena view
- [ ] Existing arena-fitting tests carry over and still pass against the new function
- [ ] A test asserts that no viewport gets a steering pad yet
- [ ] The arena is drawn exactly as before on desktop, portrait, and landscape
- [ ] `npm test` and `npm run build` pass
