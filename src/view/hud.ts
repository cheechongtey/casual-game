import { TUNING } from '../data/tuning';
import type { AttackPhase } from '../sim/types';

/** A new press is required; held buttons never become restart requests. */
export function acceptsRestart(secondsSinceDefeat: number | null, newPress: boolean): boolean {
  return secondsSinceDefeat !== null && secondsSinceDefeat >= TUNING.restartDelay && newPress;
}

export function enemyTelegraphOpacity(phase: AttackPhase, windupProgress: number): number {
  if (phase === 'recovery') return 0;
  if (phase === 'active') return 1;
  return 0.12 + 0.48 * Math.min(1, Math.max(0, windupProgress));
}

export function healthFillWidth(health: number, maximum: number, width: number): number {
  return maximum > 0 ? width * Math.min(1, Math.max(0, health / maximum)) : 0;
}
