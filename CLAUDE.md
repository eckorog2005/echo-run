# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

Domain terms are defined in `CONTEXT.md`; use them in code, tests, and issues.

## Running a subset of tests

- `npx vitest run tests/game/sim.test.ts` runs one test file.
- `npx vitest run -t "<test name>"` runs tests whose name matches.

## Architecture: how the pieces connect

**Loop and events.** `main.ts` uses a fixed-step accumulator (`TICK` = 1/60 s, frame delta capped at 0.1 s). Each tick it calls `step(game, input.direction())`, which mutates `GameState` in place and returns `StepEvent[]` (`collect`, `erase`, `die`). All side effects (particles, shake, audio, HUD, death card, storage writes) happen in `main.ts`'s `handle()` in response to those events; `src/game/` never triggers them itself. Rendering is decoupled through the `Scene` type: `main.ts` builds a `Scene` per screen (title demo, play/dead, replay) and `Renderer.draw` consumes only that.

**Echo mechanics.** During a round, player positions accumulate in `state.rec`. Collecting the orb freezes `rec` into an `Echo.path` (`Float32Array`, flat x/y pairs), pushes it onto `echoes`, and resets `roundTick` to 0. Every echo is positioned at `path[roundTick % pathLength]`, so all echoes restart together at each round start. An echo can kill only when `live`: past `GRACE_TICKS` into the round and not within `EDGE_TICKS` of either end of its own path. Erasers remove the oldest echo (`echoes.shift()`).

**Replay re-simulates.** `step` snaps each input axis to a whole step of `1/INPUT_SCALE` and appends it to `state.inputs`. `Replay` creates a fresh game from the same seed and feeds it that input log, so `replay.state` is a real `GameState` produced by the same rules as live play; `tests/game/replay.test.ts` checks they match on every tick. Don't add state that exists only to rebuild replays (see `docs/adr/0001-replay-by-resimulation.md`).

**Seeds.** Daily seed = `hashString('echo-run/<YYYY-MM-DD>')` using the local date; endless mode draws its seed with `Math.random` in `main.ts`, which is the only place that is allowed. `buildCourse(seed)` precomputes every orb and eraser position, so a seed fully determines the course.

**Persistence.** Everything goes through the `KeyValueStore` interface in `storage.ts`. Keys: `echo-best-endless`, and `echo-daily:<date>` (first attempt only; later same-day runs are flagged `practice` and not recorded).

## Conventions not covered above

- Relative imports include the `.ts` extension (`'./sim.ts'`); match this.
- `vite.config.ts` sets `base: './'` so `dist/` runs from any static host (itch.io, GitHub Pages, Netlify); keep asset paths relative. See `README.md` for deploy steps.
