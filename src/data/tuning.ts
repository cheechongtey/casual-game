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
  /** Player maximum health. */
  playerHealth: 100,

  /** Steps after an attack ends during which the next attack continues the combo. */
  comboWindow: 20,
  /** Steps an early attack or dash press stays remembered. */
  inputBuffer: 8,
  /** Fraction of the move speed available while attacking. */
  attackMoveFraction: 0.3,

  /** Dash distance in world units. */
  dashDistance: 170,
  /** Steps a dash lasts. */
  dashDuration: 10,
  /** Steps after a dash ends before another may start. */
  dashCooldown: 24,

  /** Knockback velocity is multiplied by this each step. */
  knockbackDecay: 0.85,
  /** Knockback stops below this speed, in world units per second. */
  knockbackStopSpeed: 5,

  /** Training dummy maximum health. */
  dummyHealth: 200,
  /** Training dummy collision radius in world units. */
  dummyRadius: 20,
  /** Steps after defeat before a training dummy reappears. */
  dummyRespawn: 120,

  /** Maximum enemies in windup or active together. */
  attackerLimit: 2,
  /** Display seconds after defeat before a new press restarts. */
  restartDelay: 0.5,

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
