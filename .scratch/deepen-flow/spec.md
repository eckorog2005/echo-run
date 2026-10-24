# Spec: Deepen the arena view, screen flow, cards, and run feedback

Status: ready-for-agent

## Problem Statement

The portrait arena is turned a quarter clockwise, and that turn is written four times: the Renderer's canvas transform, the counter-turn that keeps echo numbers upright, the banner placement, and the inverse turn in Steering that maps a screen drag into arena space. The arena view is a bag of numbers (`rotated`, `scale`, offsets), so each caller works out the maths again. Drawing and steering must agree, and nothing tests that they do; the upright-text fix in f972eb0 was a bug in exactly this area.

The main loop still holds flow rules: what Space, Enter, and a tap on the stage mean on each screen, what the steering pad shows, and an "effects only follow live play" filter that repeats a guarantee the Session already makes. None of it is tested, and "tap to skip" is written in both the Session and the main loop.

The death and title cards decide which button Space presses and how each Outcome is worded inside a DOM module with no tests. Their actions are matched by string between `data-action` attributes and objects the main loop builds, so a typo silently does nothing, and the card text repeats the round length and the eraser cadence instead of reading the constants.

What a collect, erase, or death looks and sounds like is spread across the main loop, Effects, and the Renderer: the main loop borrows the Renderer's palette, pokes Effects' public fields, and calls Audio. Effects reads `matchMedia` and `Math.random` directly, so it can't be built in Node.

## Solution

Nothing changes for the player. Behind that:

- The **arena view** becomes a module that owns the mapping between the arena and the stage both ways. The Renderer applies its transform, upright text anchor, and banner box; Steering asks it to turn a stage direction into an arena direction.
- The **Session** owns the screen-dependent input rules and returns what a confirm or skip press should do, including the title card's main button. The Scene says what the steering pad shows. The main loop's effects filter goes away.
- A DOM-free **cards** module turns a run result or title info into card content with typed actions. The Overlay only renders it.
- **Effects** and **Audio** each take the step events and decide their own response, using a shared palette. Effects takes its reduce-motion setting and randomness as dependencies.

## User Stories

1. As a player, I want every screen, card, sound, and effect to look and behave exactly as today, so that the refactor costs me nothing.
2. As a portrait phone player, I want dragging toward something on the screen to steer me toward it in the arena, so that the rotated arena never confuses my input.
3. As a portrait phone player, I want echo numbers and the banner to read upright, as today.
4. As a player, I want Space or Enter to skip the replay, and otherwise run the card's main button, as today.
5. As a player, I want the title card's main button to be Daily run until today's counted attempt is done, and Endless after, as today.
6. As a phone player, I want a tap on the stage to skip the replay and the pad to say so, as today.
7. As a player, I want the replay silent, with no bursts or sounds, as today.
8. As a player, I want the death card to say how the run ended, the score, what I erased, and the Outcome badge, as today.
9. As a player, I want the card text to state the real round length and eraser cadence, so that it can never drift from the rules.
10. As a player who prefers reduced motion, I want no screen shake, as today.
11. As a maintainer, I want the arena turn written once and its forward and inverse tested against each other, so that drawing and steering can't disagree.
12. As a maintainer, I want every screen flow rule testable through the Session, so that the main loop only routes DOM events.
13. As a maintainer, I want card actions checked by the compiler, so that a renamed action fails the build.
14. As a maintainer, I want each kind of feedback for an event in one module, testable in Node.

## Implementation Decisions

Four changes, one PR each, in order: arena view, screen flow, cards, run feedback. Screen flow comes before cards because both change how the main loop builds card actions.

**Arena view** (`src/render/view.ts`)
- `ArenaView` becomes a class built by the layout function and carried on `Layout.view` as today, so ScreenLayout, Steering, and the Renderer still get it from the layout.
- It owns one arena-to-stage transform and derives everything else from it: a canvas transform matrix for the Renderer, point mapping both ways, stage direction to arena direction (same length), the turn that keeps text upright inside the arena, and the banner box.
- The Renderer no longer branches on `rotated`; Steering no longer stores it.
- "Arena view" is added to `CONTEXT.md`.
- ADR-0002 holds: display only, stays in render/ and input/.

**Screen flow** (`src/game/session.ts`, `src/main.ts`)
- The Session answers what a confirm press (Space/Enter) and a skip press (Escape, a tap on the stage) do on the current screen: skip the replay, or name the card's main action for the main loop to run. The title card's main-button rule moves here from the Overlay.
- The Scene gains what the steering pad shows: the joystick, a prompt label, or nothing. The Session writes the "tap to skip" wording once for both the banner and the pad. The Renderer fills in the stick from Steering when the Scene says to steer.
- The main loop's `playing || card` filter is deleted.
- The pad-side toggle stays a screen layout matter in the main loop and ScreenLayout; the Session stays free of layout.

**Cards** (`src/ui/cards.ts`, `src/ui/overlay.ts`)
- A DOM-free module turns a `RunResult` or `TitleInfo` into card content: headline, badge, body, buttons, and the main action.
- Actions are typed per card: `daily | endless` for the title card, `again | replay | menu` for the death card. The main loop passes handlers keyed by those types.
- The round length and eraser cadence in the text come from `ROUND_TICKS`, `TICK`, and `ERASER_EVERY`.
- The Overlay keeps the HTML, button wiring, copy-to-clipboard, and the pad-side toggle.

**Run feedback** (`src/render/particles.ts`, `src/audio/audio.ts`, new `src/render/palette.ts`)
- No new feedback module and no Audio port: Effects and Audio each take `StepEvent[]` and decide their own response.
- The palette is read from the CSS once in `palette.ts` and shared by the Renderer and Effects; `Renderer.colors` goes away and the main loop stops touching Effects' fields.
- Effects takes reduce-motion and a random source as dependencies; the main loop passes `matchMedia` and `Math.random`.

## Testing Decisions

- Tests go through each module's interface, the one the main loop uses. When behaviour moves behind a new interface, rewrite its tests there and delete the old ones.
- **Arena view**: arena-to-stage and back is the identity; the corners land on the arena rect; the stage direction from a point's drawn position toward another point's drawn position maps to the arena direction between them, upright and rotated; zero stays `+0`; text drawn with the upright turn reads upright on the stage; the banner box tests move onto it. The Steering tests stay as they are, since they describe what the player feels. The layout rectangle tests stay.
- **Screen flow**: through the Session: confirm and skip on each screen; the title main action before and after the counted attempt; the Scene's pad content per screen; a replay emits no `collect`, `erase`, or `die`.
- **Cards**: each Outcome's badge, each death cause's headline, the erased and best notes, the main action per card, and the numbers matching the constants.
- **Effects**: built with a fixed random source and a reduce-motion flag: a death shakes, reduce-motion stops the shake, a collect flashes, and particles fade out. Audio stays untested; its only adapter is WebAudio.

## Out of Scope

- Any visible change to drawing, steering, cards, sounds, or effects.
- Game rules, the input grid, and replays (ADR-0001); the arena's size (ADR-0002).
- Hiding the joystick behind Steering (candidate 5 in the review; speculative).
- Moving the pad side onto `Layout` (the main loop still works it out from the pad and arena positions).

## Further Notes

- Comes from the 2026-10-23 architecture review, candidates 1 to 4.
- Verify with `npm run lint`, `npm test`, and `npm run build`, and check by hand on desktop and a phone-sized touch viewport in both orientations.
