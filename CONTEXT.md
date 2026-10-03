# Echo Run

An arcade game where every route you take to an orb comes back as a looping echo you must avoid. This glossary names the game's concepts; `SPEC.md` holds the exact rules.

## Play

**Run**:
One attempt from the first round until the player is caught or runs out of time. A run is fully determined by its seed and its input log.
_Avoid_: Game (except for the `GameState` type), attempt

**Round**:
The stretch of a run spent reaching one orb. It ends when the orb is collected or the round timer runs out.
_Avoid_: Level, stage, wave

**Course**:
The sequence of orb and eraser positions generated in advance from a run's seed.
_Avoid_: Map, layout, level

**Orb**:
The target of a round. Collecting it scores a point and turns the round's route into an echo.
_Avoid_: Coin, pickup, target

**Route**:
The positions the player passes through during one round.
_Avoid_: Path (reserved for an echo's stored positions), trail (the short visual tail behind the player)

**Echo**:
A past route that loops from the start of every round and ends the run on contact. Echo #n comes from the nth orb.
_Avoid_: Ghost, shadow, clone

**Live echo**:
An echo that can currently end the run, as opposed to a **harmless** one: during the grace ticks at the start of a round, or near either end of its loop.
_Avoid_: Active, armed

**Eraser**:
An optional pickup on every fifth round that removes the oldest echo in play.
_Avoid_: Power-up, bomb

**Input log**:
The steering input of every tick of a run, snapped to a fixed grid. Together with the seed it reproduces the run exactly.
_Avoid_: Recording, ghost data, demo

**Replay**:
A finished run played back by re-simulating it from its seed and input log.
_Avoid_: Playback, rewind

## Modes and records

**Session**:
The player's visit from the title screen through any number of runs, death cards, and replays.
_Avoid_: Game, app state

**Death card**:
The summary shown shortly after a run ends: how it ended, the score, and its outcome.
_Avoid_: Game over screen, results screen

**Outcome**:
What a finished run meant for the player's records: a counted attempt (with its share line), a practice run, a new endless best, or none of these.
_Avoid_: Result type, status

**Endless**:
The mode where each run gets a fresh random seed and only the best score is kept.
_Avoid_: Free play, classic

**Daily run**:
A run on the course seeded by the local date, shared by every player that day.
_Avoid_: Daily challenge, seed of the day

**Counted attempt**:
The first daily run of the day: the only one whose result is saved and shared.
_Avoid_: Official run, ranked run

**Practice run**:
Any daily run after the counted attempt on the same day. Its result is never saved.
_Avoid_: Retry, unranked run
