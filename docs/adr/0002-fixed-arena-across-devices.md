# The arena is one fixed size on every device

The arena is 1000×700 for every player, and the course is generated from the seed in those coordinates. Small portrait phones got a cramped arena, but the fix is to change only how the arena is drawn (scale, rotation) and never its size: the daily run is shared by every player that day, so a per-device arena would give each device a different course and break fairness, replays, and shared results.

## Consequences

- Layout and orientation work lives in `src/render/` and `src/input/`, never in `src/game/`.
- Changing the arena's size or aspect ratio changes every course and invalidates stored input logs, so it needs a version.
