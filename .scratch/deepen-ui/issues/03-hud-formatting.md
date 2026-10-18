# 03: HUD formatting

**What to build:** The Session's HUD returns every field ready to display: a round label in place of the numeric round, a seconds-left string with one decimal (for example `4.2 s`), and a low-time flag, alongside the time-left fraction for the bar width. The Scene gains the same low-time flag so the orb ring and the timer bar turn to the danger colour at the same moment; the threshold moves to the game constants and is checked only in the Session. The main loop's HUD rendering only assigns text, widths, and classes. The Session caches the day's daily record instead of reading storage every frame, refreshing it on start, on returning to the menu, and when a counted attempt is saved. Nothing changes for the player. See the spec at `.scratch/deepen-ui/spec.md`.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [x] The HUD gives the round label, seconds-left text, and low-time flag during play and replay, and empty/zero values on the title screen
- [x] The low-time flag on both HUD and Scene flips exactly at the threshold
- [x] The Renderer and main loop no longer compare against the threshold or compute seconds
- [x] The best/today value stays correct after a counted attempt, after returning to the menu, and across a date change at the menu, without reading storage every frame
- [x] Covered by extended Session tests
- [ ] The timer bar and orb ring look the same as before on a phone-sized touch viewport
- [x] `npm run lint`, `npm test`, and `npm run build` pass
