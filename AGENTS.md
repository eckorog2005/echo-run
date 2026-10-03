# Repository Guidelines

## Project Structure & Module Organization

This repository is a small TypeScript/Vite implementation of **Echo Run**, an arcade game where every route you take to an orb comes back as a looping echo you must avoid. `prototype/echo-run.html` is the original single-file prototype, kept for reference.

- `src/main.ts` boots the game, runs the fixed 60 Hz loop, and adapts DOM input, audio, particles, and the overlay to the Session.
- `src/game/` holds all game rules and must stay free of DOM, audio, and `Math.random`:
  - `constants.ts` tuning values (speed, radii, round length, grace ticks, eraser cadence).
  - `model.ts` state, echo, and event types.
  - `rng.ts` seeded PRNG and string hash; `orbs.ts` builds a seeded course of orb and eraser positions.
  - `sim.ts` `step(state, input)` advances one tick and returns events; it is deterministic for a given seed and input log.
  - `replay.ts` plays a finished run back by re-simulating it from its seed and input log.
  - `session.ts` the run lifecycle (title, play, dead, replay screens), daily and endless records, and the `Scene` for every screen (`scene.ts`).
  - `daily.ts` date keys, daily seeds, and the one-counted-attempt rule; `share.ts` builds the share line.
- `src/render/` draws a `Scene` to canvas (`renderer.ts`) and owns visual-only particles and shake (`particles.ts`).
- `src/input/`, `src/audio/`, `src/ui/` handle keyboard and drag joystick, WebAudio tones, and the overlay cards.
- `src/storage.ts` wraps localStorage in try/catch and provides an in-memory store for tests.

Consult `SPEC.md` for game rules and `STORIES.md` for player scenarios.

## Build, Test, and Development Commands

- `npm install` installs the locked development dependencies.
- `npm run dev` starts the Vite development server with hot reload.
- `npm test` runs the Vitest suite once; use this before submitting changes.
- `npm run test:watch` reruns affected tests during development.
- `npm run build` type-checks all TypeScript projects, then emits a production build to `dist/`.
- `npm run preview` serves `dist/` locally.

## Coding Style & Naming Conventions

Use strict TypeScript and keep `noUncheckedIndexedAccess`. Two-space indentation, single quotes, semicolons, trailing commas in multiline constructs, and explicit return types on exported or substantial functions. `camelCase` for variables and functions, `PascalCase` for classes and types, lowercase filenames. Anything that changes gameplay belongs in `src/game/` so daily runs stay reproducible; visual randomness belongs in `src/render/`.

## Testing Guidelines

Tests use Vitest in a Node environment and live in `tests/`, mirroring the `src/` path of the module they cover (`src/game/sim.ts` → `tests/game/sim.test.ts`). Every rule change or bug fix should include a regression test. Run both `npm test` and `npm run build`.

## Commit & Pull Request Guidelines

Use [Conventional Commits](https://www.conventionalcommits.org/): `type(scope): summary`, with an imperative, lowercase summary and no trailing period (for example, `feat(audio): add eraser pickup sound`). Types: `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `build`, `ci`, `chore`. The scope is optional and names the area touched, such as `sim`, `replay`, `session`, `render`, or `agents`. Mark breaking changes with `!` after the type or scope. Keep each commit focused. Pull requests should describe the behavior change, list verification commands, and include a screenshot or clip for visible changes.

## Agent skills

### Issue tracker

Issues and specs live as local markdown files under `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one root `CONTEXT.md` plus `docs/adr/`. See `docs/agents/domain.md`.
