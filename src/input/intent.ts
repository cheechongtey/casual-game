import type { Vec2 } from '../data/room';
import { TUNING } from '../data/tuning';

export interface MoveKeys {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
}

/** Move direction from held keys. Length is 1 or 0; opposing keys cancel. */
export function moveDirection(keys: MoveKeys): Vec2 {
  const x = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  // Up-screen is negative y in world space.
  const y = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
  if (x !== 0 && y !== 0) {
    return { x: x * Math.SQRT1_2, y: y * Math.SQRT1_2 };
  }
  return { x, y };
}

/**
 * Aim angle in world space from the player's ground position to the ground
 * position under the cursor. Keeps the previous angle when the two coincide.
 */
export function aimAngle(player: Vec2, cursorGround: Vec2, previous: number): number {
  const dx = cursorGround.x - player.x;
  const dy = cursorGround.y - player.y;
  if (dx * dx + dy * dy <= TUNING.aimDeadzone * TUNING.aimDeadzone) return previous;
  return Math.atan2(dy, dx);
}
