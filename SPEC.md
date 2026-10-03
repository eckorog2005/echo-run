# Echo Run Spec

## Arena
- Fixed world of 1000 × 700 units, letterboxed to fit the screen. The size is fixed so daily runs match on every device.
- Simulation runs at a fixed 60 ticks per second. The player moves at 380 units/s and is clamped to the arena.

## Rounds
- Round 1 starts in the center. Each later round starts where the previous orb was collected.
- Each round has one orb. The player has 7 seconds (420 ticks) to touch it, or the run ends with "Out of time".
- Orb positions are generated in advance from the run's seed: each orb is 240–620 units from its round's start and at least 50 units from every wall.

## Echoes
- Collecting the orb turns the route recorded that round into echo #n, where n is the orb count.
- All echoes restart their routes at the beginning of each round and loop for as long as the round lasts.
- An echo is harmless for the first 40 ticks of every round and for 8 ticks at each end of its loop, where it jumps back to its start. Harmless echoes are drawn as dashed outlines.
- Touching a live echo ends the run ("Caught by echo #n"). Collision uses the sum of the radii minus 5 units of forgiveness.

## Eraser
- Every 5th round (rounds 5, 10, 15, …) also has an eraser, placed 160–420 units from the round start and at least 150 units from the orb.
- Touching it removes the oldest echo still in play. It is optional and disappears once used or when the round ends.

## Modes
- **Endless:** random seed each run. Best score is saved locally.
- **Daily:** the seed comes from the local date (`YYYY-MM-DD`), so everyone gets the same course. Only the first daily run each day is saved and produces a share line such as `Echo Run 2026-10-02 · 14 orbs · 2 erased · caught by #9`. Later daily runs that day are practice.

## Replay
- After a run, "Watch replay" plays every round back at 3× speed from the stored routes, showing echoes joining and being erased in order. Tap, Space, or Escape skips it.
