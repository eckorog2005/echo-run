# 01: Screen layout owner

**What to build:** One screen layout module works out the screen layout and owns the pad-side setting, then hands that one layout to the Renderer and to DOM placement (HUD, timer, card sheet). It takes the key-value store and a measure function (stage size, viewport size, coarse pointer) as dependencies, exposes the current layout, the current pad side, choosing a side, and a refresh call, and fires an on-change callback once at startup and afterwards only when the layout really changes. The main loop wires the resize observer and pointer media query to refresh in a few lines. The layout gains the stage size. The Renderer only draws: it receives the layout in `draw`, resizes its canvas from it, and drops its layout, rotation, and pad-side getters, its pad-side setter, its resize observation, and its on-layout callback (it keeps its colour palette). The separate pad-side module goes away. Steering keeps working as today, reading the rotation and pad from the new layout. Nothing changes for the player on any device. See the spec at `.scratch/deepen-ui/spec.md`.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] The screen layout module owns the `echo-pad-side` key: default right, a chosen side survives a new instance, an unknown stored value falls back to right
- [ ] Choosing a side on a landscape phone fires on-change with the mirrored layout; refresh with an unchanged size fires nothing; on-change fires once at startup
- [ ] Tests run in Node with a memory store and a stub measure function, and replace the old pad-side tests, which are deleted with their module
- [ ] The Renderer receives the layout in `draw` and no longer measures, decides the phone check, holds the pad side, or calls back into the main loop
- [ ] The existing layout-function tests still pass unchanged
- [ ] The title card's pad-side toggle, rotation, and resize behave exactly as before on desktop and on a phone-sized touch viewport in both orientations
- [ ] `npm run lint`, `npm test`, and `npm run build` pass
