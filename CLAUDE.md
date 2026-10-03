# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

Domain terms are defined in `CONTEXT.md`; use them in code, tests, and issues.

## Running a subset of tests

- `npx vitest run tests/game/sim.test.ts` runs one test file.
- `npx vitest run -t "<test name>"` runs tests whose name matches.

## Architecture: how the pieces connect

**Loop, Session, and events.** `main.ts` uses a fixed-step accumulator (`TICK` = 1/60 s, frame delta capped at 0.1 s) and calls `session.tick(input.direction())` each tick. `Session` (`src/game/session.ts`) owns the screens (title, play, dead, replay), the daily counted-attempt and endless-best rules, and the death-card delay (in ticks); it takes its `KeyValueStore`, `today()`, and `randomSeed()` as dependencies so it runs in Node tests. During play it calls `step(game, input)`, which mutates `GameState` and returns `StepEvent[]` (`collect`, `erase`, `die`); `tick` passes those through and adds `card` (with a typed `RunResult`/`Outcome`) when the death card is due. `main.ts` is a DOM adapter: it routes events to particles, audio, and the overlay, and passes `session.scene()` (the `Scene` type in `src/game/scene.ts`) to `Renderer.draw`. Flow rules go in `Session`, not `main.ts`.

**Echo mechanics.** During a round, player positions accumulate in `state.rec`. Collecting the orb freezes `rec` into an `Echo.path` (`Float32Array`, flat x/y pairs), pushes it onto `echoes`, and resets `roundTick` to 0. Every echo is positioned at `path[roundTick % pathLength]`, so all echoes restart together at each round start. An echo can kill only when `live`: past `GRACE_TICKS` into the round and not within `EDGE_TICKS` of either end of its own path. Erasers remove the oldest echo (`echoes.shift()`).

**Replay re-simulates.** `step` snaps each input axis to a whole step of `1/INPUT_SCALE` and appends it to `state.inputs`. `Replay` creates a fresh game from the same seed and feeds it that input log, so `replay.state` is a real `GameState` produced by the same rules as live play; `tests/game/replay.test.ts` checks they match on every tick. Don't add state that exists only to rebuild replays (see `docs/adr/0001-replay-by-resimulation.md`).

**Seeds.** Daily seed = `hashString('echo-run/<YYYY-MM-DD>')` using the local date; endless mode's seed comes from the `randomSeed` dependency, which `main.ts` implements with `Math.random`, the only place that is allowed. `buildCourse(seed)` precomputes every orb and eraser position, so a seed fully determines the course.

**Persistence.** Everything goes through the `KeyValueStore` interface in `storage.ts`. Keys: `echo-best-endless` (owned by `Session`), `echo-daily:<date>` (`daily.ts`; first attempt only, later same-day runs are practice and not recorded), and `echo-muted` (`audio.ts`).

## Conventions not covered above

- Relative imports include the `.ts` extension (`'./sim.ts'`); match this.
- `vite.config.ts` sets `base: './'` so `dist/` runs from any static host (itch.io, GitHub Pages, Netlify); keep asset paths relative. See `README.md` for deploy steps.
