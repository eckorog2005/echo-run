// World is a fixed size so daily runs are identical on every device; the renderer letterboxes it.
export const WORLD_W = 1000;
export const WORLD_H = 700;

export const TICK = 1 / 60;
export const SPEED = 380; // world units per second
export const PLAYER_R = 13;
export const ECHO_R = 13;
export const ORB_R = 15;
export const ERASER_R = 11;
export const KILL_SLACK = 5; // collision forgiveness, in world units

export const ROUND_TICKS = 7 * 60; // time to reach the orb
export const GRACE_TICKS = 40; // echoes are harmless at the start of each round
export const EDGE_TICKS = 8; // echoes are harmless at each end of their loop, where they teleport

export const ERASER_EVERY = 5; // an eraser appears on every 5th round

export const WALL_MARGIN = 50;
export const ORB_MIN_DIST = 240;
export const ORB_MAX_DIST = 620;
export const ERASER_MIN_DIST = 160;
export const ERASER_MAX_DIST = 420;
export const ERASER_ORB_GAP = 150;
export const COURSE_LENGTH = 400;
