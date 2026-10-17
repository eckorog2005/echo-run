# Coding standards

Judgement calls for review. Mechanical rules (banned APIs in `src/game/`, `.ts` import extensions, commit format) are enforced by `npm test` and the commit hook, so they are not repeated here.

## Gameplay and tests

- Anything that changes gameplay lives in `src/game/`, so daily runs stay reproducible. Visual-only randomness and effects live in `src/render/`.
- Every rule change or bug fix carries a regression test at the highest seam that shows the behaviour, in the file mirroring the module's path.
- Tests assert observable outcomes (HUD values, rectangles, steering vectors, events), never CSS classes, DOM structure, or private fields.
- Replays come from re-simulation. Reject state added only so a replay can be rebuilt (ADR 0001).

## Structure

- Flow rules (screens, records, delays) belong in `Session`; `main.ts` only adapts the DOM, audio, and particles to it.
- Layout decisions belong in the pure layout function in `src/render/view.ts`; the DOM applies its rectangles and CSS does not re-derive them.
- New persisted settings go through `KeyValueStore`, with the key listed in `CLAUDE.md`.

## Naming and style

- Use the terms in `CONTEXT.md` in code, tests, and issues (for example, steering pad, not thumb pad).
- Match the surrounding module's idiom, comment density, and naming. Comments explain why, not what.
