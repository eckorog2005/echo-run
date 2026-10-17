# Spec: Thumb Pad mobile layout

Status: resolved

## Problem Statement

On a phone, Echo Run steers by dragging anywhere on the stage, so the player's thumb sits on top of the arena and hides the echoes they are trying to avoid. The arena is also smaller than it needs to be: on a 390×844 portrait phone it is drawn at about 334×477 inside a bordered stage, with roughly 100px of empty letterbox above and below it, while the HUD wraps onto two rows. The round timer only exists as a ring around the orb, so a player watching their own position has no glanceable sense of time left, and the death and title cards sit in the middle of the stage, away from the thumb.

## Solution

On touch phones the screen is split into three regions: a one-row HUD, the arena drawn as wide as the screen allows, and a **steering pad** in the leftover space. Steering happens only in the steering pad, so the arena stays fully visible. The joystick rests at the centre of the pad and jumps to wherever the thumb lands. A timer bar between the arena and the pad shows the round number, the mode, and seconds left. The title and death cards become bottom sheets with their buttons within thumb reach; during a replay the pad reads "Tap to skip". In landscape the HUD moves to a side column and the steering pad sits on the other side, on the right by default or on the left if the player chooses. Desktop and tablets keep today's layout and drag-anywhere steering.

## User Stories

1. As a phone player, I want to steer from a pad below the arena, so that my thumb never hides the echoes I need to dodge.
2. As a phone player, I want touches on the arena to never steer, so that resting or brushing a finger there can't move me by accident.
3. As a phone player, I want the joystick drawn at the centre of the steering pad while idle, so that I know where to put my thumb before the run starts.
4. As a phone player, I want the joystick to start from wherever my thumb lands in the pad, so that I don't have to find the exact centre to steer accurately.
5. As a phone player, I want the joystick anchor to follow my thumb when I drag past its edge, so that reversing direction stays instant, as it is today.
6. As a phone player, I want steering to stop the moment I lift my thumb, so that I can stand still on purpose.
7. As a phone player, I want the arena drawn as wide as my screen allows, so that echoes and the orb are as large as possible.
8. As a phone player on a small phone, I want the steering pad to stay at least 120px tall, so that it is still usable even if the arena has to shrink a little.
9. As a phone player, I want the HUD on one row with orbs, echoes, and my best or today's result, so that the arena gets the height.
10. As a phone player, I want an icon-only mute button that is at least 44px, so that I can mute quickly without a text label taking space.
11. As a phone player, I want a timer bar that shows the round number and seconds left, so that I can judge time without looking at the orb.
12. As a phone player, I want the timer bar to say whether this is a daily run, an endless run, or a practice run, so that I know whether this run counts.
13. As a phone player, I want the ring around the orb to keep showing time left, so that I still see the timer where my eyes are.
14. As a phone player, I want the death card to slide up from the bottom as a sheet, so that "Run again" is right under my thumb.
15. As a phone player, I want the arena to stay visible above the death sheet with the echo that caught me highlighted, so that I can see what went wrong.
16. As a phone player, I want the title card as a bottom sheet that scrolls inside itself, so that the demo arena stays visible and the full rules still fit.
17. As a phone player watching a replay, I want the steering pad to read "Tap to skip", so that I know how to get back to the death card.
18. As a phone player watching a replay, I want a tap on the steering pad or on the arena to skip the replay, so that skipping works wherever I touch.
19. As a phone player in landscape, I want the HUD in a column on one side and the steering pad on the other, so that the arena gets the full height.
20. As a left-handed phone player, I want to put the steering pad on the left in landscape, so that I can steer with my preferred thumb.
21. As a phone player, I want my pad-side choice remembered between visits, so that I don't have to set it again.
22. As a phone player, I want to change the pad side from the title sheet, so that the setting is easy to find before a run.
23. As a phone player, I want the layout to switch cleanly when I rotate my phone, so that a run in progress isn't broken by turning the screen.
24. As a phone player, I want any held steering released when the layout changes, so that rotating mid-run doesn't leave me stuck moving in one direction.
25. As a desktop player, I want today's layout and keyboard steering unchanged, so that nothing I'm used to moves.
26. As a tablet player, I want today's layout and drag-anywhere steering, so that my large screen isn't split up for a pad I don't need.
27. As a phone player with a hardware keyboard, I want arrow keys and WASD to keep working, so that I can steer either way.
28. As a daily-run player, I want my phone and my friend's desktop to play the exact same course, so that our shared results stay comparable.
29. As a player watching a replay on a different device, I want the replay to match the original run exactly, so that the layout never changes what happened.
30. As a phone player on a notched phone, I want the HUD, pad, and sheets to respect safe areas, so that nothing sits under the notch or the home indicator.

## Implementation Decisions

- **Phone rule.** The steering pad layout applies when the primary pointer is coarse and the viewport's shorter side is 500px or less. Everything else (desktop, tablets) keeps today's layout and drag-anywhere steering.
- **Layout is a pure decision in the render layer.** The view module gains one layout function that takes the viewport size, whether the device is a phone, and the pad side, and returns the rectangles for the HUD, the arena, and the steering pad (none on non-phones), plus the arena view (rotation, scale, offsets). It absorbs today's arena fitting so there is a single answer to "where does everything go". The DOM adapter applies those rectangles; CSS does not re-derive them.
- **Portrait split.** The HUD is one row of about 44px; the arena takes the full width inside a 12px side gutter (rotated, as today) unless that would leave the steering pad under 120px, in which case the arena scales down to keep the pad at 120px; the timer bar sits between the arena and the pad; the pad takes the rest. The bordered stage frame and the desktop arena padding go away on phones. A 12px gutter, as in the mockup, keeps the arena's edge off the screen edge and leaves a pad of about 145px on a 390×844 phone.
- **Landscape split.** The arena takes the full height upright; the HUD becomes a side column on one side and the steering pad fills the other side, with the pad on the right unless the pad-side setting says left. As in the mockup, the landscape timer sits at the foot of the HUD column and reads "Round N" with seconds left, and the mode shows as a chip in that column.
- **Joystick model.** A new pure joystick model in the input layer handles press, move, and release and returns a steering vector. While idle its anchor rests at the pad's centre; a press sets the anchor at the touch point; moves drag the anchor along once the thumb passes the joystick radius (today's behaviour); release stops steering. The existing dead zone and radius stay. The input adapter feeds it pointer events only when they start inside the steering pad on phones, and from anywhere on the stage otherwise. Keyboard steering is unchanged and still takes priority.
- **Steering conversion is unchanged.** Screen-space steering is still converted with the existing rotated-arena direction mapping before it reaches the Session, so `src/game` sees the same inputs whatever the layout.
- **HUD contract.** `Session.hud()` gains the current round number (1-based, as shown to the player) and the fraction of round time left (0–1), taken from the live run during play and from the replay during a replay; on the title screen the round is absent and time left is zero. The mode text is unchanged; on phones the DOM shows it in the timer row rather than as a chip in the header.
- **Bottom sheets.** On phones the overlay presents the title and death cards as a bottom sheet over the steering pad and the lower arena, up to about 85% of the viewport height, scrolling inside itself. Card contents and actions are unchanged; this is a presentation change in the overlay and styles. The death sheet uses a compact layout on phones (reason and score on one line, actions on one row) so the arena, and the echo that caught the player, stay visible above it; in landscape it sits over the idle steering pad's corner.
- **Replay affordance.** During a replay the steering pad shows "Tap to skip", and a tap on it skips the replay; a tap on the arena still skips too.
- **Pad-side setting.** A left/right setting, default right, stored through the existing key-value store under `echo-pad-side`, mirroring how mute is stored. A toggle on the title sheet changes it; it shows in both orientations and only affects landscape.
- **Rotation.** When the layout changes (rotation or resize), any active joystick is released, as the code already does when the arena's rotation flips.
- **Fixed arena.** The arena stays 1000×700 on every device (ADR 0002). No change in this spec alters courses, the input log, or replays.

## Testing Decisions

- Good tests here check observable outcomes at the highest seam: what the HUD reports, where the regions land for a given screen, and what steering vector a sequence of touches produces. They never assert on CSS classes, DOM structure, or private fields.
- **Session HUD** (existing seam): round number and time left during play, during a replay, and on the title screen; time left falls as ticks pass and resets when an orb is collected. Prior art: the existing `hud()` assertions on mode, best label, and best in the session tests.
- **Layout function** (existing view module): a 390×844 phone gets a full-width arena and a pad of about 145px; a 375×667 phone keeps the pad at 120px and shrinks the arena; an 844×390 phone puts the pad on the right by default and on the left when asked; a non-phone viewport gets no pad and the same arena view as today's fitting; regions never overlap and stay inside the viewport. Prior art: the existing arena-fitting tests, which assert exact rectangles and scales for given stage sizes.
- **Joystick model** (new seam in the input layer): idle anchor at the pad centre; a press then a move inside the radius gives a proportional vector; moving past the radius drags the anchor so an immediate reversal flips the direction; movement inside the dead zone gives zero; release gives zero. Runs in Node with no DOM.
- **Not unit-tested, checked by hand on a phone:** sheet styling and scrolling, the "Tap to skip" label, pointer routing to the pad, and the pad-side setting persisting across reloads (it reuses the key-value store pattern already covered by mute).
- Run `npm test` and `npm run build` before each commit; the replay-matches-live test must keep passing unchanged.

## Out of Scope

- Any change to the arena size or aspect ratio, courses, the input log, or replays.
- Tablet- or desktop-specific layouts beyond keeping today's.
- Haptics, on-screen buttons other than the steering pad, or a pause feature.
- Changing the content of the title or death cards (copy, share line, badges).
- The Marquee and Full Bleed design options from the mockup canvas.
- A settings screen; the pad-side toggle lives on the title sheet only.

## Further Notes

- The visual reference is the "1 Thumb Pad" row of the design canvas at https://claude.ai/artifact/QjWJQLAU636L8457Z2HBJs (portrait play, death sheet, landscape). It is private to the owner.
- **Steering pad** is defined in the domain glossary. "Joystick" means the stick drawn inside it.
- Suggested ticket split: portrait steering pad with the joystick model; timer bar and one-row HUD; bottom sheets and "Tap to skip"; landscape pad and the pad-side setting.
