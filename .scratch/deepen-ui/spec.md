# Spec: Deepen the screen layout, steering, and HUD modules

Status: resolved

## Problem Statement

The thumb-pad work left the rules players feel most wired by hand in the DOM adapter, with no tests. Whether steering is on, that only touches starting in the steering pad steer, that a held touch is released when the screen layout changes or the player dies, and that the screen direction is rotated into arena space are spread across five call sites in the main loop, a `joystickEnabled` flag flipped in three places, and a rotation flag borrowed from the Renderer. A regression in any of them would only show up by playing on a phone.

The Renderer has also become the owner of the screen layout: it measures the stage, decides whether the device is a touch phone, holds the pad side, diffs layouts, and calls back into the main loop. The main loop then asks a drawing module for the layout kind, the rotation, and the pad side. The pad-side setting lives in its own two-function module that adds nothing.

HUD text is half built by the Session and half by the main loop: the Session produces the labels, but the main loop turns the time-left fraction into seconds and decides the low-time colour, using a threshold that lives in the screen layout code and is checked again by the Renderer for the orb ring. That half is untested, and the Session reads the day's record from storage on every frame to build the HUD.

## Solution

Nothing changes for the player: layout, steering, and HUD look and behave exactly as they do today on every device. Behind that:

- A **screen layout** module owns working out the screen layout and the pad-side setting, and hands one layout to the Renderer, steering, and DOM placement.
- A **steering** module answers "which way does the player steer this tick, in arena space", owning the keyboard, the joystick, the steering pad confinement, the play-only rule, and the rotation. The DOM input code only forwards events to it.
- The Session's HUD returns every field ready to display, so the main loop only assigns text.

Each of these rules can then be tested in Node through one interface.

## User Stories

1. As a phone player, I want steering to behave exactly as it does today, so that the refactor costs me nothing.
2. As a phone player, I want only touches that start in the steering pad to steer, so that brushing the arena never moves me.
3. As a phone player, I want any held steering released when the screen layout changes (rotation, resize, pad side), so that I never keep drifting after the screen rearranges.
4. As a phone player, I want steering released the moment I'm caught or time runs out, so that a held thumb doesn't carry into the next run.
5. As a player, I want touches on the title screen, death card, and replay to never steer, so that only live play responds to the stick.
6. As a portrait phone player, I want dragging up the screen to steer the way the rotated arena shows, so that the arena's orientation never confuses my input.
7. As a keyboard player, I want arrow keys and WASD to win over a held touch, as today, so that mixing inputs is predictable.
8. As a keyboard player, I want diagonal keys normalised, as today, so that diagonals aren't faster.
9. As a player, I want keys and touches released when the window loses focus, so that I don't keep steering after switching apps.
10. As a phone player, I want the joystick drawn at the centre of the steering pad while idle and under my thumb while dragging, with the knob kept inside its ring, as today.
11. As a landscape phone player, I want my pad-side choice saved and restored across reloads, defaulting to the right.
12. As a landscape phone player, I want choosing a pad side to rearrange the screen at once.
13. As a desktop or tablet player, I want today's layout and drag-anywhere steering unchanged.
14. As a phone player, I want the timer bar to show the round, the mode, and seconds left exactly as today, and to turn the danger colour at the same moment the orb ring does.
15. As a player, I want the HUD's best/today value to stay correct after a counted attempt, after returning to the menu, and across a date change at the menu.
16. As a maintainer, I want every steering rule tested in Node through one interface, so that a regression fails a test instead of reaching a phone.
17. As a maintainer, I want the Renderer to only draw, so that changing the screen layout never means editing drawing code.
18. As a maintainer, I want the pad-side setting to have one owner, so that saving, loading, and relaying out can't disagree.
19. As a maintainer, I want the low-time threshold defined once and checked once, so that the timer bar and orb ring can't drift apart.
20. As a maintainer, I want the main loop to only route DOM events and assign text, so that flow and display rules have a tested home.
21. As a maintainer, I want tests to go through the same interfaces the main loop uses, so that internals can change without rewriting tests.

## Implementation Decisions

Three changes, done in order: screen layout owner, then steering (built against the new layout), then HUD formatting (independent).

**Screen layout module**
- New `ScreenLayout` module in the render area (ADR-0002: layout work stays in render/input, never in game rules).
- Interface: the current layout, the current pad side, choosing a pad side, a refresh call, and an on-change callback that also fires once at startup with the initial layout.
- Takes its dependencies like the Session does: the key-value store and a measure function returning the stage size, the viewport size, and whether the pointer is coarse. The main loop wires the `ResizeObserver` and `matchMedia` to `refresh()` in a few lines.
- Owns the `echo-pad-side` key; the separate pad-side module is deleted. Choosing a side saves it and, if the layout changes, fires on-change.
- Fires on-change only when the layout actually changes.
- The pure layout function, the phone check, and the pad-side parser stay where they are as its internals.
- The layout gains the stage size so consumers don't measure separately.

**Renderer**
- Drops its layout, rotation, and pad-side getters, its pad-side setter, its resize observation, and its on-layout callback.
- `draw` receives the layout and resizes its canvas when the layout's stage size changes.
- Keeps exposing its colour palette (particle bursts in the main loop use it).
- Stops importing the joystick class and the low-time threshold.

**Steering module**
- New pure `Steering` module in the input area, free of the DOM.
- Interface: press, move, and release for pointers in stage pixels; key down, key up, and blur; relayout with a new screen layout; `direction(playing)` returning the steering vector in arena space; and a read-only stick (anchor, knob position already clamped to the joystick radius, active) for drawing.
- `direction(playing)`: when `playing` is false it releases any held touch and returns zero. Presses that arrive while not playing are ignored. The main loop passes whether the Session's screen is play, so there is one source of truth; the `joystickEnabled` flag and the scattered `cancel()` calls go away.
- Relayout releases any held touch, confines presses to the steering pad (anywhere on the stage when there is no pad), rests the stick at the pad's centre, and records whether the arena is rotated.
- Keyboard input moves inside: keys win over the joystick, diagonals are normalised.
- Rotation into arena space becomes internal; the exported conversion function goes away.
- The existing joystick model stays as an internal seam with its current interface.
- The DOM input class shrinks to an adapter that converts pointer and key events to stage coordinates and forwards them; keyboard keys that steer still prevent default.
- The Renderer's steering pad view takes the stick value instead of the joystick object; the joystick radius comes from the steering module alongside it.

**HUD formatting**
- `Session.hud()` returns every field ready to display: a round label replaces the numeric round, plus a seconds-left string (one decimal, e.g. `4.2 s`) and a low-time flag. The time-left fraction stays for the bar width. The main loop only assigns text, widths, and classes.
- The low-time threshold moves to the game constants.
- The Scene gains a low-time flag so the orb ring and the timer bar use the same check; the Renderer no longer compares against the threshold.
- The Session caches the day's daily record instead of reading storage on every frame, refreshing it on start, on returning to the menu, and when a counted attempt is saved.

## Testing Decisions

- Good tests exercise external behaviour through the module's interface, the same one the main loop uses, and never reach into internals. When behaviour moves behind a new interface, rewrite its tests through that interface and delete the old ones rather than layering both.
- **ScreenLayout**: tested with a memory store and a stub measure function. Covers: default pad side is right; a chosen side is saved and survives a new instance; an unknown stored value falls back to right; choosing a side on a landscape phone fires on-change with the mirrored layout; refresh with an unchanged size fires nothing; on-change fires once at startup. These replace the current pad-side tests.
- **Steering**: tested by feeding a layout and pointer/key events. Covers: drag steering in proportion to distance; presses outside the steering pad ignored on a phone layout; anywhere steers on the stage layout; `direction(false)` returns zero and releases a held touch; a press while not playing is ignored; relayout releases a held touch and rests the stick at the pad centre; portrait rotation maps a screen drag into the right arena direction; keys win over the joystick; diagonals normalised; blur releases everything; the stick's knob stays inside the radius. The current rotation-function tests are rewritten through `direction()` and deleted.
- **Joystick**: its existing tests stay unchanged as internal tests.
- **Layout function**: its existing rectangle tests stay; the rectangle maths is where most of the detail lives.
- **Session HUD and Scene**: extend the existing Session tests for the round label, seconds-left text, low-time flag on both HUD and Scene at the threshold, and the cached daily record staying correct after a counted attempt, a menu return, and a date change.
- Prior art: the Session tests (memory store and injected dependencies), the joystick tests (pure event-driven model), and the layout tests (rectangle assertions).

## Out of Scope

- Any visible change to layout, steering feel, HUD, or cards.
- Moving the remaining flow rules out of the main loop (Space/Enter/Escape meaning per screen, tap-to-skip on the stage) and removing the redundant "effects only follow live play" filter; this was candidate 4 in the architecture review and was not chosen.
- Overlay card content and its tests.
- Moving the colour palette out of the Renderer.
- Any change to game rules, the input grid, or replays (ADR-0001).

## Further Notes

- Comes from the 2026-10-17 architecture review (candidates 1–3), after the thumb-pad feature.
- "Screen layout" was added to `CONTEXT.md` to separate it from the Course; use it in code and tests.
- Verify with `npm run lint`, `npm test`, and `npm run build`, and check by hand on a phone-sized touch viewport in both orientations that steering, the pad-side toggle, and the timer bar behave as before.
