# 04: Timer bar

**What to build:** The Session's HUD reports the current round number (1-based) and the fraction of round time left (0 to 1), from the live run during play and from the replay during a replay; on the title screen the round is absent and time left is zero. On phones, a timer bar between the arena and the steering pad shows the round number with the mode (for example "Round 8 · Daily · practice") and the seconds left, and the mode chip moves out of the header into this row. The ring around the orb keeps showing time left. See the spec at `.scratch/thumb-pad/spec.md`.

**Blocked by:** 03 (Portrait steering pad)

**Status:** resolved

- [x] Session tests: round and time left during play; time left falls as ticks pass and resets when an orb is collected; values during a replay; round absent and time left zero on the title screen
- [x] On phones the timer bar shows round, mode, and seconds left, and updates every frame
- [x] The mode chip no longer appears in the phone header; desktop keeps its chip
- [x] The orb ring still shows time left
- [x] Replay-matches-live test still passes unchanged
- [x] `npm test` and `npm run build` pass

## Comments

`Hud` now has `round` (1-based) and `timeLeft` (0–1). Both come from the live run during play and from the replay's state during a replay. On the title screen `round` is null and `timeLeft` is 0. On the dead screen the final round stays and `timeLeft` is 0, which matches the orb ring. Play and replay share the time-left formula with the scene.

- On phones `#timer` sits at `layout.timer`. It shows `Hud.timerLabel`, seconds left, and a bar. The label is "Round 8 · Daily · practice": no date, as in this ticket's example, so a long daily label can't truncate away "practice". The desktop mode chip still includes the date. The timer is hidden with `visibility` on the title screen so it keeps its place.
- The mode chip is hidden in the phone header; desktop keeps it.
- `LOW_TIME_LEFT` (0.3) in `view.ts` is shared by the orb ring and the timer bar.

Checked in Chrome device emulation at 390×763, 320×548, and 1200×900 desktop.
