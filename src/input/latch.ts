/**
 * A button whose press is latched until a simulation step has seen it, so a
 * click shorter than a step is never lost. All functions are pure.
 */
export interface ButtonLatch {
  /** The physical button is down. */
  down: boolean;
  /** A press has not yet been seen by any simulation step. */
  pending: boolean;
}

export const RELEASED: ButtonLatch = { down: false, pending: false };

export function pressButton(): ButtonLatch {
  return { down: true, pending: true };
}

export function releaseButton(b: ButtonLatch): ButtonLatch {
  return { down: false, pending: b.pending };
}

/** What the intent reports: held while down, or until a step consumes the press. */
export function isHeld(b: ButtonLatch): boolean {
  return b.down || b.pending;
}

/** Clears the latch once at least one step has consumed the intent. */
export function afterSteps(b: ButtonLatch, steps: number): ButtonLatch {
  return steps > 0 ? { down: b.down, pending: false } : b;
}
