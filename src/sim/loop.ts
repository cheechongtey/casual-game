import { STEP_SECONDS, TUNING } from '../data/tuning';
import { step, type InputIntent, type SimEvent, type SimState } from './state';

/** Carries leftover time between display frames. */
export interface Clock {
  accumulator: number;
}

export interface FrameAdvance {
  /** Simulation steps to run this display frame. */
  steps: number;
  /** How far the frame falls between the last step and the next, 0 to 1. */
  alpha: number;
}

export interface FrameResult extends FrameAdvance {
  /** Events of every step run this frame, in order. */
  events: SimEvent[];
}

export function createClock(): Clock {
  return { accumulator: 0 };
}

// Absorbs float error so that, for example, 30 frames of 1/30 s make 60 steps.
const EPSILON = 1e-9;

/**
 * Adds elapsed time and reports how many fixed steps are due. At most
 * `maxStepsPerFrame` steps are returned; time beyond that is discarded.
 */
export function advanceClock(clock: Clock, elapsedSeconds: number): FrameAdvance {
  clock.accumulator += Math.max(0, elapsedSeconds);
  let steps = Math.floor(clock.accumulator / STEP_SECONDS + EPSILON);

  if (steps > TUNING.maxStepsPerFrame) {
    steps = TUNING.maxStepsPerFrame;
    clock.accumulator = 0;
  } else {
    clock.accumulator = Math.max(0, clock.accumulator - steps * STEP_SECONDS);
  }

  return { steps, alpha: Math.min(1, clock.accumulator / STEP_SECONDS) };
}

/**
 * Runs one display frame: every step due this frame receives the same intent.
 * Returns the interpolation alpha, the events of all steps run, and how many
 * steps ran (the input layer uses it to clear latched presses).
 */
export function advanceFrame(
  clock: Clock,
  state: SimState,
  intent: InputIntent,
  elapsedSeconds: number,
  stepFn: (state: SimState, intent: InputIntent) => SimEvent[] = step,
): FrameResult {
  const { steps, alpha } = advanceClock(clock, elapsedSeconds);
  const events: SimEvent[] = [];
  for (let i = 0; i < steps; i++) events.push(...stepFn(state, intent));
  return { steps, alpha, events };
}
