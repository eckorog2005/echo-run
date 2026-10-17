# Repository Guidelines

## Project Structure & Module Organization

**Echo Run** is a small TypeScript/Vite arcade game: every route you take to an orb comes back as a looping echo you must avoid. `prototype/echo-run.html` is the original single-file prototype, kept for reference.

- `src/game/` holds all game rules and must stay free of DOM, audio, and `Math.random`; `tests/repo/conventions.test.ts` enforces this.
- `src/main.ts` is the DOM adapter and fixed 60 Hz loop. `src/render/`, `src/input/`, `src/audio/`, `src/ui/` draw and handle input; `src/storage.ts` wraps localStorage.
- `CLAUDE.md` explains how the pieces connect. `SPEC.md` has the game rules and `STORIES.md` the player scenarios.

## Build, Test, and Development Commands

Scripts are in `package.json`. Run `npm run lint`, `npm test`, and `npm run build` before submitting changes. `npm install` points git at `.githooks/`, whose `commit-msg` hook rejects non-Conventional-Commit messages.

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
