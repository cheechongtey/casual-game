/** Tunable gameplay and view constants. World units are screen pixels at zoom 1. */
export const TUNING = {
  /** Simulation steps per second. */
  stepRate: 60,
  /** Most simulation steps run in a single display frame. */
  maxStepsPerFrame: 5,
  /** Player speed in world units per second. */
  moveSpeed: 260,
  /** Player collision radius in world units. */
  playerRadius: 16,
  /** Aim keeps its previous angle when the cursor is this close to the player. */
  aimDeadzone: 1,
  /** Vertical compression of depth in the oblique view. */
  depthRatio: 0.6,
  /** Drawn height of walls in screen units. */
  wallHeight: 48,
  /** Game resolution. */
  viewWidth: 1280,
  viewHeight: 720,
} as const;

/** Duration of one simulation step in seconds. */
export const STEP_SECONDS = 1 / TUNING.stepRate;
