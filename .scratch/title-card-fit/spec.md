# Spec: Fit the title card on desktop and landscape phones

Status: resolved

## Problem Statement

On desktop the title and death cards have no background of their own: they sit on a light tint over the arena, so the grid, echo trails, and orbs show through the text. The button row is left-aligned with the "or press Space" hint trailing after it, which looks lopsided.

On a landscape phone the title card is a bottom sheet that stacks to about 500px in about 330px of height. Its bottom runs off screen, the pinned buttons slide over the share line, and the pad-side toggle needs a scroll to reach. The sheet is centred across the pad and arena, so it also looks off centre.

## Solution

- **Desktop:** the title and death cards become a floating panel (solid `--panel` background, `--line` border, rounded corners, padding), still centred on the stage. In the button row the buttons stay left and the hint moves to the right edge.
- **Landscape phone, title card only:** a floating card centred on the whole stage, up to about 600px wide, bordered all round. Two columns: the headline, intro, and legend on the left; daily status, share line, pad-side toggle, and buttons on the right. No content is cut. On very short screens the card scrolls inside itself as a last resort, with the buttons pinned.
- Unchanged: the death card's corner placement in landscape, the portrait bottom sheet, and short desktop windows' scrolling overlay.

## User Stories

1. As a desktop player, I want the card's text on a solid panel, so that the arena behind it doesn't make it hard to read.
2. As a landscape phone player, I want the whole title card on screen without scrolling, so that I can read it and start a run straight away.
3. As a landscape phone player, I want the pad-side toggle visible on the title card, so that I can pick a side before I play.

## Out of scope

- Card wording and content.
- The portrait bottom sheet and the landscape death card.
