# 02: Landscape title card in two columns

**What to build:** On the landscape phone layout, the title card is a floating card centred on the whole stage (up to about 600px wide, bordered all round) instead of a bottom sheet. It lays out in two columns: headline, intro, and legend on the left; daily status, share line, pad-side toggle, and buttons on the right. If it still doesn't fit, it scrolls inside itself with the buttons pinned. The landscape death card keeps its corner placement. See the spec at `.scratch/title-card-fit/spec.md`.

**Blocked by:** 01 (Desktop card panel)

**Status:** resolved

- [x] At 844×390 and 667×375 the whole title card, both before and after today's counted attempt, is on screen with no scroll
- [x] The pinned buttons never overlap the share line
- [x] The landscape death card and the portrait sheets look as before
- [x] `npm run lint`, `npm test`, and `npm run build` pass
