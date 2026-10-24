# 03: Card content

**What to build:** A DOM-free `src/ui/cards.ts` turns a `RunResult` or `TitleInfo` into card content (headline, badge, body, legend, buttons) with actions typed per card. The round length and eraser cadence come from the constants. The Overlay keeps only the HTML, button wiring, copy-to-clipboard, and the pad-side toggle. Which button Space presses stays with the Session (ticket 02). Nothing changes for the player. See the spec at `.scratch/deepen-flow/spec.md`.

**Blocked by:** 02 (Screen flow rules in the Session)

**Status:** resolved

- [x] Card actions are typed; a misspelled action fails `npm run build`
- [x] Tested in Node: each Outcome badge, each death cause headline, erased and best notes, buttons per card, numbers matching the constants
- [x] Title and death cards look and behave as before
- [x] `npm run lint`, `npm test`, and `npm run build` pass
