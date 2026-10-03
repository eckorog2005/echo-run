# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Running a subset of tests

- `npx vitest run src/game/sim.test.ts` runs one test file.
- `npx vitest run -t "<test name>"` runs tests whose name matches.

## Architecture: how the pieces connect

**Loop and events.** `main.ts` uses a fixed-step accumulator (`TICK` = 1/60 s, frame delta capped at 0.1 s). Each tick it calls `step(game, input.direction())`, which mutates `GameState` in place and returns `StepEvent[]` (`collect`, `erase`, `die`). All side effects (particles, shake, audio, HUD, death card, storage writes) happen in `main.ts`'s `handle()` in response to those events; `src/game/` never triggers them itself. Rendering is decoupled through the `Scene` type: `main.ts` builds a `Scene` per screen (title demo, play/dead, replay) and `Renderer.draw` consumes only that.

**Echo mechanics.** During a round, player positions accumulate in `state.rec`. Collecting the orb freezes `rec` into an `Echo.path` (`Float32Array`, flat x/y pairs), pushes it onto both `echoes` (in play) and `history` (all-time), and resets `roundTick` to 0. Every echo is positioned at `path[roundTick % pathLength]`, so all echoes restart together at each round start. An echo can kill only when `live`: past `GRACE_TICKS` into the round and not within `EDGE_TICKS` of either end of its own path. Erasers remove the oldest echo (`echoes.shift()`) and stamp `erasedAt`.

**Replay does not re-simulate.** `Replay` rebuilds frames from `history[k].path` for each round plus the final partial `rec`, using `erasedAt` to hide erased echoes and `orbAt`/`eraserAt` on the seeded `Course` for pickups. Any new rule that changes what's on screen must be recoverable from that stored data (or added to `Echo`/`GameState`), or replays will drift from the real run.

**Seeds.** Daily seed = `hashString('echo-run/<YYYY-MM-DD>')` using the local date; endless mode draws its seed with `Math.random` in `main.ts`, which is the only place that is allowed. `buildCourse(seed)` precomputes every orb and eraser position, so a seed fully determines the course.

**Persistence.** Everything goes through the `KeyValueStore` interface in `storage.ts`. Keys: `echo-best-endless`, and `echo-daily:<date>` (first attempt only; later same-day runs are flagged `practice` and not recorded).

## Conventions not covered above

- Relative imports include the `.ts` extension (`'./sim.ts'`); match this.
- `vite.config.ts` sets `base: './'` so `dist/` runs from any static host (itch.io, GitHub Pages, Netlify); keep asset paths relative. See `README.md` for deploy steps.
