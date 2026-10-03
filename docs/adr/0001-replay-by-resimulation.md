# Replays re-simulate the run from its seed and input log

Replays used to be rebuilt from each round's stored route plus side-data (when each echo was erased), which meant re-deriving sim's rules by hand: erase timing, an off-by-one tick offset, and when the eraser counted as taken. They drifted wherever those copies missed a case: the eraser stayed visible if it was taken with no echo in play, and the echo that caused the death was never highlighted. We now record every tick's steering input and replay by stepping a fresh game from the seed, so live play and replay share one implementation and a test checks they match tick for tick.

## Consequences

- Steering input is snapped to whole steps of 1/127 per axis inside `step`, for live play as well, so the log is exact, compact (Int8-sized), and safe to serialise for later features such as ghosts, shareable runs, or verifying a daily result.
- Changing `step`'s rules or the input grid changes what an old input log replays to. If logs are ever persisted or shared, they need a version.
- Don't add state that exists only so a replay can be rebuilt; anything a replay needs should come from re-simulation.
