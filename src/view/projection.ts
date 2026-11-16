import type { Vec2 } from '../data/room';
import { TUNING } from '../data/tuning';

/**
 * The only place world coordinates become screen coordinates.
 * Horizontal position is unchanged, depth is compressed vertically,
 * and height above ground shifts the point straight up the screen.
 */
export function project(x: number, y: number, z = 0): Vec2 {
  return { x, y: y * TUNING.depthRatio - z };
}

/** Converts a screen point back to the ground point drawn there. */
export function unprojectGround(screenX: number, screenY: number): Vec2 {
  return { x: screenX, y: screenY / TUNING.depthRatio };
}

/** Linear interpolation between a previous and a current value. */
export function lerp(prev: number, current: number, alpha: number): number {
  return prev + (current - prev) * alpha;
}
