# 04: Timer bar

**What to build:** The Session's HUD reports the current round number (1-based) and the fraction of round time left (0 to 1), from the live run during play and from the replay during a replay; on the title screen the round is absent and time left is zero. On phones, a timer bar between the arena and the steering pad shows the round number with the mode (for example "Round 8 · Daily · practice") and the seconds left, and the mode chip moves out of the header into this row. The ring around the orb keeps showing time left. See the spec at `.scratch/thumb-pad/spec.md`.

**Blocked by:** 03 (Portrait steering pad)

**Status:** ready-for-agent

- [ ] Session tests: round and time left during play; time left falls as ticks pass and resets when an orb is collected; values during a replay; round absent and time left zero on the title screen
- [ ] On phones the timer bar shows round, mode, and seconds left, and updates every frame
- [ ] The mode chip no longer appears in the phone header; desktop keeps its chip
- [ ] The orb ring still shows time left
- [ ] Replay-matches-live test still passes unchanged
- [ ] `npm test` and `npm run build` pass
